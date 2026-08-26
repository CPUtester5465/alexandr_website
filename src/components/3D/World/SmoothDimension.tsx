import React, { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import SmoothChunkedWorld from './SmoothChunkedWorld';
import Grass from './Grass';
import Poppies from './Poppies';
import Pagodas from './Pagodas';
import PagodaFlora from './PagodaFlora';
import SkyDome from './SkyDome';
import PostFX from '../PostFX';
import { ReturnDoor } from './Dimension';
import { makeSmoothField, poppiesForArea } from '../../../world/smoothMesh';
import { setTerrain, clearTerrain } from '../../../world/terrain';
import { controlState } from '../../../state/controlState';
import { PLAYER_CONFIG } from '../../../utils/constants';
import { specBySlug } from '../../../world/dimensions/specs';
import { setWayHome } from '../../../state/hubState';
import { setActiveDimension } from '../../../state/dimensionState';

/**
 * THE SMOOTH PAINTERLY STUDY. One dimension, transformed.
 *
 * Same world, same seed, same structure sites, same arrival contract as
 * Dimension.tsx -- but rendered by the smooth path: a continuous terrain mesh
 * with palette-blended vertex colours, instanced wind-blown grass, modelled
 * poppies at the voxel flowers' exact sites, a graded sky dome and a post
 * stack. The register is Journey/Sable, not Minecraft.
 *
 * The character stands on the smooth field, not the voxel one, so his feet
 * meet the ground he can see: groundHeightAt still reads a pure function of
 * world position, only an unrounded one.
 */

const ARRIVAL_HEADING = Math.PI;
const DOOR_BEHIND = 11;

/** Fog capped to the 5x5 chunk window: the far edge must dissolve before the
 *  last loaded chunk does, and the dome takes over from there. Near comes from
 *  the spec, so pagoda's mist sits closer than poppy's drizzle. */
const FOG_FAR_CAP = 145;

const SmoothDimension: React.FC<{ slug: string }> = ({ slug }) => {
  const spec = useMemo(() => specBySlug(slug), [slug]);
  const field = useMemo(() => (spec ? makeSmoothField(spec) : null), [spec]);
  const { gl, camera, scene } = useThree();

  // Dev-only debug handle for the study's screenshot loop. Not shipped: vite
  // strips the block from production builds.
  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') return;
    (window as unknown as Record<string, unknown>).__studyDebug = {
      gl, camera, controlState, field,
      poppies: (minBx: number, minBz: number, maxBx: number, maxBz: number) =>
        spec ? poppiesForArea(spec, minBx, minBz, maxBx, maxBz, field!) : []
    };
    return () => {
      delete (window as unknown as Record<string, unknown>).__studyDebug;
    };
  }, [gl, camera, field]);

  const arrival = useMemo(() => {
    if (!field) return null;
    const spawn = new THREE.Vector3(0, field.heightAt(0, 0), 0);
    const back = new THREE.Vector3(
      -Math.sin(ARRIVAL_HEADING) * DOOR_BEHIND,
      0,
      -Math.cos(ARRIVAL_HEADING) * DOOR_BEHIND
    );
    back.y = field.heightAt(back.x, back.z);
    return { spawn, door: back };
  }, [field]);

  // Fog and hemisphere tints from the spec's ROLES, not fixed palette indices
  // -- fixed indices were poppy's private assumption and pagoda's palette is
  // ordered differently. sky is already the sampled sky colour; pale and deep
  // are whatever the recipe assigned them.
  const atmosphere = useMemo(() => {
    if (!spec) return null;
    const role = (id: number, fallback: string) =>
      (spec.colours[id] ?? new THREE.Color(fallback)).clone();
    return {
      fog: new THREE.Color(spec.sky).multiplyScalar(1.05),
      hemiSky: role(spec.blocks.pale, '#888888').multiplyScalar(1.1),
      hemiGround: role(spec.blocks.deep, '#444444')
    };
  }, [spec]);

  // The fog and background must be set on the SCENE. Declaring
  // <fog attach="fog"> inside a group attaches it to the group, where three
  // never reads it, and the App-level fog (sky blue, far 100) quietly rules
  // the whole world instead -- which is exactly what happened.
  useEffect(() => {
    if (!atmosphere) return;
    const oldFog = scene.fog;
    const oldBackground = scene.background;
    const noFog = import.meta.env.DEV && window.location.search.includes('nofog');
    scene.fog = noFog ? null : new THREE.Fog(
      atmosphere.fog, spec!.fog.near, Math.min(spec!.fog.far, FOG_FAR_CAP));
    scene.background = atmosphere.fog.clone();
    return () => {
      scene.fog = oldFog;
      scene.background = oldBackground;
    };
  }, [scene, atmosphere]);

  useEffect(() => {
    if (!spec || !field || !arrival) return;

    const far = 40000;
    setTerrain(field.heightAt, { minX: -far, maxX: far, minZ: -far, maxZ: far });

    controlState.playerPosition.set(
      arrival.spawn.x,
      arrival.spawn.y + PLAYER_CONFIG.HEIGHT,
      arrival.spawn.z
    );
    controlState.heading = ARRIVAL_HEADING;
    controlState.cameraYaw = ARRIVAL_HEADING + Math.PI;
    controlState.inputYaw = controlState.cameraYaw;
    controlState.speed = 0;
    controlState.manualCameraFor = 0;
    setWayHome(arrival.door);
    setActiveDimension(spec);

    return () => {
      clearTerrain();
      setWayHome(null);
      setActiveDimension(null);
    };
  }, [spec, field, arrival]);

  if (!spec || !field || !arrival || !atmosphere) return null;

  return (
    <group>
      <SmoothChunkedWorld spec={spec} field={field} />
      {/* The dressing follows the structure kind: meadows get grass and
          flowers, the mist valley gets towers and bare ground. */}
      {spec.structure.kind === 'flower' && <Grass spec={spec} field={field} />}
      {spec.structure.kind === 'flower' && <Poppies spec={spec} field={field} />}
      {spec.structure.kind === 'pillar' && (
        <>
          <Pagodas spec={spec} field={field} />
          <PagodaFlora spec={spec} field={field} />
        </>
      )}
      <SkyDome spec={spec} />
      <ReturnDoor at={arrival.door} slug={slug} />
      {/* The one extra light this study allows: a hemisphere between the pale
          green sky and the deep green ground. The directional is the scene's
          existing one. */}
      <hemisphereLight
        args={[atmosphere.hemiSky, atmosphere.hemiGround, 0.5]}
      />
      {!(import.meta.env.DEV && window.location.search.includes('nopost')) && (
        <PostFX palette={spec.palette} />
      )}
    </group>
  );
};

export default SmoothDimension;
