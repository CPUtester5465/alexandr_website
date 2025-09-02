export interface Artwork {
  id: string;
  title: string;
  desc: string;
  filename: string;
  emoji: string;
  frameColor: string;
}

export const artworks: Artwork[] = [
  {
    id: 'sailing-divide',
    title: "Sailing the Divide",
    desc: "A blazing sunset cleaves the sky in two—serene azures on the left, storm-laden greys on the right—while two small sails cut through the molten reflection of the sun. Thick, palette-knife strokes and warm, saturated oranges create heat and movement; the boats read as quiet protagonists navigating between calm and chaos. Conceptually, it's a painting about choice and courage in transitional moments.",
    filename: "Sailing-the-Divide.png",
    emoji: "⛵",
    frameColor: "#FF6B35"
  },
  {
    id: 'weight-whisper',
    title: "Weight of a Whisper",
    desc: "A single metallic, textured feather floats on a violet field. The heavy impasto contradicts the feather's usual lightness, turning it into a relic or imprint—memory given mass. Minimal composition + luminous shimmer makes it feel meditative and talismanic.",
    filename: "Weight-of-a-Whisper.png",
    emoji: "🪶",
    frameColor: "#8B5CF6"
  },
  {
    id: 'headwind',
    title: "Headwind",
    desc: "A white-sailed cutter pushes into choppy, slate-blue water. Monochrome cools and knife-built textures emphasize wind pressure on the canvas as much as on the sail. It reads as a study in resilience—form pared down to vessel, sea, and weather.",
    filename: "Headwind.png",
    emoji: "🌬️",
    frameColor: "#475569"
  },
  {
    id: 'tide-wanderer',
    title: "Tide Wanderer",
    desc: "A sea turtle glides through transparent watercolor washes that ebb like currents around it. Mosaic shell panels and speckled flippers add character, while soft edges suggest motion and depth. The mood is gentle and ecological—an ode to slow, purposeful travel.",
    filename: "Tide-Wanderer.png",
    emoji: "🐢",
    frameColor: "#06B6D4"
  },
  {
    id: 'clockwork-fish',
    title: "Clockwork Fish",
    desc: "A whimsical hybrid of fish and machinery assembled like stained glass, ringed by gear forms and numerals. Bold outlines and enamel-like fills make it read as folk-surrealism—nature adapted (or constrained) by industry. It's playful on the surface, with a subtle commentary on mechanized life underneath.",
    filename: "Clockwork-Fish.png",
    emoji: "🐠",
    frameColor: "#F59E0B"
  },
  {
    id: 'desert-table',
    title: "Desert Table, Curved Voices",
    desc: "A stylized still life: two fluid, anthropomorphic pitchers, a potted cactus, citrus wedges, and a small glass set against patterned textiles. The piece plays contrasts—curves vs. grids, cool violets vs. warm yellows—to create lively domestic theater. It's about hospitality and eccentric design meeting in one frame.",
    filename: "Desert-Table-Curved-Voices.png",
    emoji: "🌵",
    frameColor: "#D946EF"
  },
  {
    id: 'cup-apple',
    title: "Cup & Apple, Quiet Light",
    desc: "Graphite study of simple forms under diffuse light. Careful ellipses, cross-hatching, and mid-tone control show attention to volume and surface. The restraint is the point: finding dignity and presence in everyday objects.",
    filename: "Cup-Apple-Quiet-Light.png",
    emoji: "🍎",
    frameColor: "#6B7280"
  },
  {
    id: 'vessel-shadow',
    title: "Vessel with Shadow",
    desc: "A larger graphite still life advances the previous study—broader value range, deeper shadows, and stronger atmospheric perspective. The tall ceramic form anchors the page; a single fruit balances mass with a low counter-weight. It reads as discipline and patience made visible.",
    filename: "Vessel-with-Shadow.png",
    emoji: "🏺",
    frameColor: "#374151"
  },
  {
    id: 'pagoda-red',
    title: "Pagoda in Red Weather",
    desc: "A pagoda silhouette stands against smoky greys while crimson foliage swirls overhead. High contrast (black vs. carmine) lends drama; loose wet-into-wet passages suggest drifting mist. The feeling is mythic and slightly eerie, like a story beginning at dusk.",
    filename: "Pagoda-in-Red-Weather.png",
    emoji: "🏯",
    frameColor: "#DC2626"
  },
  {
    id: 'three-sails',
    title: "Three Sails at Dusk",
    desc: "Three vertical sails—each capped by a red pennant—rise like candles over a reflective, patterned sea. Broad, confident strokes and limited palette keep the rhythm musical: three notes, repeating. A small poem about companionship, distance, and evening light.",
    filename: "Three-Sails-at-Dusk.png",
    emoji: "🕯️",
    frameColor: "#B91C1C"
  },
  {
    id: 'gravity-sleeps',
    title: "When Gravity Sleeps",
    desc: "A floating island drifts through a doodled cosmos of spiral galaxies, comet-creatures, and tiny moon spirits marching in a crescent. Ladders of smiling faces, anchor sprouts, and watchful owl-leaves create a dream logic where everything feels animate. Line hatching drives a diagonal star-wind across the page, turning the scene into a busy, surreal map of play, anxiety, and wonder.",
    filename: "When-Gravity-Sleeps.png",
    emoji: "🌌",
    frameColor: "#7C3AED"
  },
  {
    id: 'last-tram',
    title: "Last Run of Tram No. 5",
    desc: "A red streetcar, cropped front-on, pushes through a narrow, dark street. Thick, blocky strokes, fogged blues in the windows, and slick grey pavement evoke wet night air and the hush of late hours. It reads as a memory painting—nostalgia pressed into paint—about the small heroism of getting home.",
    filename: "Last-Run-of-Tram-No-5.png",
    emoji: "🚋",
    frameColor: "#EF4444"
  },
  {
    id: 'poppy-green',
    title: "Poppy in Green Weather",
    desc: "A single poppy swells from the center like a warm heartbeat. Heavy impasto petals—crimson, orange, and embered pink—rise off a field of speckled green, where drips and spatter suggest rain or pollen. The piece is tactile and celebratory: a close-up of life's noise and color at full volume.",
    filename: "Poppy-in-Green-Weather.png",
    emoji: "🌺",
    frameColor: "#F97316"
  }
];
