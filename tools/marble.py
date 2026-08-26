#!/usr/bin/env python3
"""
Drive the World Labs Marble API: one painting in, one explorable splat world out.

This is the experiment that decides the site's distance layer. Marble generates
a walkable Gaussian-splat world from a single image; Spark renders splats inside
three.js on phones. If a child's impasto survives the trip, this is the sky for
all eighteen doors. If it comes out muddy, we learn that for the price of one
generation instead of a build.

SPENDING RULE (same discipline as the Higgsfield budget): every invocation that
costs credits requires an explicit --yes, does exactly ONE generation, and
prints what it is about to do first. No batch mode exists on purpose -- an
18-world batch is a decision for Tim, not a loop.

Key: ~/sub-projects/.env.marble  ->  MARBLE_API_KEY=...
Docs: https://docs.worldlabs.ai/api

Usage:
  python3 tools/marble.py generate art-originals/Poppy-in-Green-Weather.png \
      --name "Poppy in Green Weather" \
      --text "an endless meadow of giant crimson poppies under green weather, \
              thick impasto oil paint, the world inside the painting" --yes
  python3 tools/marble.py status <operation_id>
  python3 tools/marble.py fetch <world_id>        # export + download assets
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

BASE = "https://api.worldlabs.ai/marble/v1"
ENV_PATH = Path.home() / "sub-projects" / ".env.marble"
# Downloads land OUTSIDE public/ until sizes are known -- a full-resolution .ply
# can be hundreds of MB and must never be committed or served by accident.
ASSET_DIR = Path(__file__).resolve().parent.parent / "marble-assets"


def api_key() -> str:
    if not ENV_PATH.exists():
        sys.exit(f"No key. Put MARBLE_API_KEY=... in {ENV_PATH}")
    for line in ENV_PATH.read_text().splitlines():
        if line.startswith("MARBLE_API_KEY="):
            return line.split("=", 1)[1].strip()
    sys.exit(f"MARBLE_API_KEY not found in {ENV_PATH}")


def request(method: str, path: str, body: dict | None = None, raw_url: str | None = None,
            data: bytes | None = None, extra_headers: dict | None = None) -> dict | bytes:
    url = raw_url or (BASE + path)
    headers = {"WLT-Api-Key": api_key()}
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode()
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            payload = resp.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code} on {method} {url}\n{e.read().decode(errors='replace')[:2000]}")
    try:
        return json.loads(payload)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return payload


def upload_image(path: Path) -> str:
    """Three-step local upload: prepare -> PUT to signed URL -> return asset id."""
    ext = path.suffix.lstrip(".").lower()
    prep = request("POST", "/media-assets:prepare_upload", {
        "file_name": path.name, "kind": "image", "extension": ext
    })
    # The live API nests the docs' flat example: media_asset{}, upload_info{}.
    # Measured 2026-08-26 against a real 200; use its required_headers verbatim
    # (the length-range differs from the docs too).
    asset = prep.get("media_asset", prep)
    info = prep.get("upload_info", prep)
    signed = info.get("upload_url") or prep.get("signed_upload_url")
    asset_id = asset.get("media_asset_id") or asset.get("id")
    if not signed or not asset_id:
        sys.exit(f"Unexpected prepare_upload response:\n{json.dumps(prep, indent=2)[:2000]}")
    request("PUT", "", raw_url=signed, data=path.read_bytes(),
            extra_headers=info.get("required_headers")
            or {"x-goog-content-length-range": "0,104857600"})
    print(f"uploaded {path.name} -> media asset {asset_id}")
    return asset_id


def cmd_generate(args: list[str]) -> None:
    if "--yes" not in args:
        sys.exit("This spends Marble credits. Re-run with --yes to confirm ONE generation.")
    image = Path(args[0])
    if not image.exists():
        sys.exit(f"No such image: {image}")
    name = _flag(args, "--name") or image.stem
    text = _flag(args, "--text")

    print(f"About to generate ONE world from: {image}  ({image.stat().st_size // 1024} KB)")
    asset_id = upload_image(image)

    prompt: dict = {"type": "image",
                    "image_prompt": {"source": "media_asset", "media_asset_id": asset_id}}
    if text:
        prompt["text_prompt"] = " ".join(text.split())
    op = request("POST", "/worlds:generate", {"display_name": name, "world_prompt": prompt})
    print(json.dumps(op, indent=2)[:1500])
    op_id = op.get("operation_id") or op.get("id") or op.get("name", "").split("/")[-1]
    print(f"\noperation: {op_id}\nGeneration takes ~5 minutes. Poll with:"
          f"\n  python3 tools/marble.py status {op_id}")


def cmd_status(args: list[str]) -> None:
    op = request("GET", f"/operations/{args[0]}")
    print(json.dumps(op, indent=2)[:3000])
    if op.get("done"):
        result = op.get("response") or op.get("result") or {}
        world_id = result.get("world_id") or result.get("id")
        if world_id:
            print(f"\nDONE. Fetch assets with:\n  python3 tools/marble.py fetch {world_id}")


def cmd_fetch(args: list[str]) -> None:
    world_id = args[0]
    world = request("GET", f"/worlds/{world_id}")
    ASSET_DIR.mkdir(exist_ok=True)
    (ASSET_DIR / f"{world_id}.json").write_text(json.dumps(world, indent=2))
    print(f"world details -> marble-assets/{world_id}.json")

    # Walk the response for downloadable URLs rather than guessing the schema.
    downloads: list[tuple[str, str]] = []

    def walk(node, trail=""):
        if isinstance(node, dict):
            for k, v in node.items():
                walk(v, f"{trail}.{k}" if trail else k)
        elif isinstance(node, list):
            for i, v in enumerate(node):
                walk(v, f"{trail}[{i}]")
        elif isinstance(node, str) and node.startswith("http") and any(
                node.split("?")[0].endswith(ext) for ext in
                (".ply", ".spz", ".sog", ".glb", ".ksplat", ".splat")):
            downloads.append((trail, node))

    walk(world)
    if not downloads:
        print("No direct asset URLs in world details; trying explicit export…")
        exported = request("POST", f"/worlds/{world_id}:export", {})
        (ASSET_DIR / f"{world_id}.export.json").write_text(json.dumps(exported, indent=2))
        walk(exported)

    for trail, url in downloads:
        fname = url.split("?")[0].rsplit("/", 1)[-1]
        dest = ASSET_DIR / f"{world_id}-{fname}"
        print(f"downloading {trail} -> {dest.name} …")
        data = request("GET", "", raw_url=url)
        dest.write_bytes(data if isinstance(data, bytes) else json.dumps(data).encode())
        print(f"  {dest.stat().st_size // 1024} KB")

    print("\nNext: pick the smallest .spz that still reads well, move it under "
          "public/marble/, and wire Spark.")


def _flag(args: list[str], name: str) -> str | None:
    return args[args.index(name) + 1] if name in args and args.index(name) + 1 < len(args) else None


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    cmd, rest = sys.argv[1], sys.argv[2:]
    {"generate": cmd_generate, "status": cmd_status, "fetch": cmd_fetch}.get(
        cmd, lambda _: sys.exit(f"Unknown command {cmd}\n{__doc__}"))(rest)
