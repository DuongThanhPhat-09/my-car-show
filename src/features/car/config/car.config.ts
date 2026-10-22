import type { CameraView, CarRigConfig, FocusPoint, ModelSource, Vec3 } from "../types";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MODEL CONTRACT — Lamborghini Aventador S (LP 740-4)
 * ─────────────────────────────────────────────────────────────────────────────
 *  Drop a production GLB at /public/models/car.glb (run `npm run optimize:model`)
 *  and the showroom uses it automatically. If the file is missing, the built-in
 *  procedural Aventador stand-in is rendered instead – it follows the same
 *  node-name contract, so everything below works for both.
 *
 *  Pivots are in model space, car facing +Z, Y up, metres. The procedural body
 *  follows the published package (4,797 × 2,030 × 1,136 mm, 2,700 mm wheelbase).
 */
export const MODEL: ModelSource = {
  kind: "glb",
  url: "/models/car.glb",
  lods: [
    { url: "/models/car-lod1.glb", distance: 15 },
    { url: "/models/car-lod2.glb", distance: 28 },
  ],
  scale: 1,
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  flakeScale: 2200,
};

export const RIG: CarRigConfig = {
  hinges: {
    // Scissor doors: hinge at the front of the door, the tail swings up.
    doorR: { nodes: ["door_r"], pivot: [0.95, 0.48, 0.8], axis: "x", angle: 1.2, duration: 1.7 },
    doorL: { nodes: ["door_l"], pivot: [-0.95, 0.48, 0.8], axis: "x", angle: 1.2, duration: 1.7 },
    frunk: { nodes: ["hood"], pivot: [0, 0.79, 0.95], axis: "x", angle: -0.85, duration: 1.6 },
    engineCover: { nodes: ["engine_cover"], pivot: [0, 1.135, -0.45], axis: "x", angle: 0.75, duration: 1.8 },
    wing: { nodes: ["wing"], pivot: [0, 0.893, -2.0], axis: "x", angle: 0.2, lift: 0.13, duration: 1.2 },
  },
  wheels: [["wheel_fl"], ["wheel_fr"], ["wheel_rl"], ["wheel_rr"]],
  slots: {
    paint: ["paint", "carpaint", "body_paint"],
    carbon: ["carbon", "^roof\\b", "mirror_cap", "splitter", "skirt", "diffuser", "wing_blade", "engine_cover_louvre"],
    caliper: ["caliper"],
    rim: ["\\brim\\b", "wheel_rim", "lambo-rim"],
    leather: ["leather"],
    glass: ["(?<!mirror_)glass", "window", "windshield"],
    headlight: ["headlight_led", "headlight_drl", "drl", "lambo-headlight-led"],
    taillight: ["taillight_bar", "taillight_led", "lambo-taillight-led"],
    ambient: ["ambient"],
  },
  interiorNode: "interior",
  // Beam origins sit just ahead of the nose so the low splitter isn't lit up.
  headlightBeams: [
    [0.7, 0.45, 2.46],
    [-0.7, 0.45, 2.46],
  ],
};

/** Exterior hero framing used after the intro and by "Reset view" – low and dramatic. */
export const HERO_VIEW: CameraView & { position: Vec3; target: Vec3; fov: number } = {
  position: [5.4, 1.15, 5.0],
  target: [0, 0.48, 0],
  fov: 30,
};
export const INTRO_START: CameraView & { position: Vec3; target: Vec3; fov: number } = {
  position: [10, 0.4, -7.5],
  target: [0, 0.4, 0],
  fov: 24,
};
/** Driver eye point for interior mode. */
export const DRIVER_EYE: Vec3 = [0.3, 0.95, -0.2];

export type PresetViewId = "front" | "threeQuarter" | "side" | "rear" | "top";

export const PRESET_VIEWS: Record<PresetViewId, CameraView & { label: string }> = {
  front: { label: "Front", position: [0.0, 0.8, 6.4], target: [0, 0.45, 0], fov: 30 },
  threeQuarter: { label: "¾ Front", ...HERO_VIEW },
  side: { label: "Profile", position: [7.2, 0.75, 0.0], target: [0, 0.5, 0], fov: 30 },
  rear: { label: "Rear", position: [-3.4, 1.1, -5.6], target: [0, 0.5, 0], fov: 32 },
  top: { label: "Top", position: [0.01, 9, 0.0], target: [0, 0, 0], fov: 34 },
};

const SPEC_NOTE = "* Manufacturer figures for the Aventador S – check lamborghini.com for the exact specification.";

export const FOCUS_POINTS: FocusPoint[] = [
  {
    id: "headlight",
    label: "Y Headlights",
    kicker: "Lighting",
    title: "Y-Signature LED Headlights",
    description:
      "Slim full-LED headlights set into the top of the front fenders, with the Y-shaped daytime running light that has become a Lamborghini signature.",
    specs: [
      { label: "Signature", value: "Y" },
      { label: "Lighting", value: "Full LED" },
      { label: "Shape", value: "Hexagonal" },
    ],
    anchor: [0.8, 0.5, 2.18],
    normal: [0.53, 0.7, 0.48],
    view: { position: [1.75, 0.85, 3.25], target: [0.76, 0.46, 2.15], fov: 26, minDistance: 0.35, maxDistance: 2.4 },
    mode: "exterior",
    highlight: ["headlight_r"],
  },
  {
    id: "logo",
    label: "Shield",
    kicker: "Heritage",
    title: "The Raging Bull",
    description:
      "The gold-edged shield with the charging bull – Ferruccio Lamborghini's zodiac sign – sits at the tip of the sharply pointed nose.",
    specs: [
      { label: "Founded", value: "1963" },
      { label: "Home", value: "Sant'Agata" },
      { label: "Emblem", value: "Toro" },
    ],
    anchor: [0, 0.5, 2.27],
    normal: [0, 0.92, 0.39],
    view: { position: [0.0, 1.05, 3.0], target: [0, 0.48, 2.27], fov: 22, minDistance: 0.25, maxDistance: 1.6 },
    mode: "exterior",
    highlight: ["logo"],
  },
  {
    id: "wheel",
    label: "Wheels",
    kicker: "Chassis",
    title: "20″ / 21″ Staggered Wheels",
    description:
      "Staggered fitment with 255/30 R20 tyres up front and 355/25 R21 at the rear, behind which sit carbon-ceramic brakes with six-piston front calipers.",
    specs: [
      { label: "Front", value: "255/30 R20" },
      { label: "Rear", value: "355/25 R21" },
      { label: "Brakes", value: "CCB" },
    ],
    note: SPEC_NOTE,
    anchor: [1.0, 0.33, 1.33],
    normal: [1, 0, 0],
    view: { position: [2.4, 0.5, 2.0], target: [0.86, 0.33, 1.33], fov: 28, minDistance: 0.4, maxDistance: 3 },
    mode: "exterior",
    highlight: ["wheel_fr", "caliper_fr"],
  },
  {
    id: "mirror",
    label: "Mirrors",
    kicker: "Aerodynamics",
    title: "Stalk-Mounted Mirrors",
    description: "Slim mirror heads on a single stalk rising from the door, keeping air flowing cleanly into the side intakes behind.",
    specs: [
      { label: "Mount", value: "Door stalk" },
      { label: "Cap", value: "Carbon opt." },
      { label: "Fold", value: "Power" },
    ],
    anchor: [0.99, 0.93, 0.62],
    normal: [0.7, 0.4, 0.6],
    view: { position: [1.95, 1.2, 1.5], target: [0.97, 0.87, 0.6], fov: 26, minDistance: 0.3, maxDistance: 2 },
    mode: "exterior",
    highlight: ["mirror_r"],
  },
  {
    id: "engine",
    label: "V12",
    kicker: "Powertrain",
    title: "6.5-litre Naturally Aspirated V12",
    description:
      "Mid-mounted behind the cabin under a louvred glass cover, the L539 V12 revs to 8,500 rpm and drives all four wheels through a 7-speed ISR gearbox.",
    specs: [
      { label: "Power", value: "740 CV*" },
      { label: "Torque", value: "690 Nm*" },
      { label: "0–100 km/h", value: "2.9 s*" },
    ],
    note: SPEC_NOTE,
    anchor: [0, 1.0, -1.2],
    normal: [0, 1, -0.2],
    view: { position: [0.0, 2.35, -3.0], target: [0, 0.55, -1.2], fov: 32, minDistance: 0.5, maxDistance: 3.5 },
    mode: "exterior",
    highlight: ["engine"],
    opens: ["engineCover"],
  },
  {
    id: "wing",
    label: "Active Aero",
    kicker: "Aerodynamics",
    title: "Active Rear Wing",
    description:
      "The rear wing lies flush with the deck at low speed and rises automatically as speed builds, adding downforce and stability.",
    specs: [
      { label: "Type", value: "Active" },
      { label: "Positions", value: "Auto" },
      { label: "Top speed", value: "350 km/h*" },
    ],
    note: SPEC_NOTE,
    anchor: [0, 1.0, -2.12],
    normal: [0, 1, -0.4],
    view: { position: [0.0, 1.6, -4.4], target: [0, 0.8, -2.1], fov: 30, minDistance: 0.6, maxDistance: 4 },
    mode: "exterior",
    highlight: ["wing"],
    opens: ["wing"],
  },
  {
    id: "seats",
    label: "Seats",
    kicker: "Craftsmanship",
    title: "Q-Citura Sport Seats",
    description:
      "Low-slung sport seats trimmed in leather and Alcantara with Lamborghini's diamond-shaped Q-Citura stitching, reached through the scissor doors.",
    specs: [
      { label: "Stitching", value: "Q-Citura" },
      { label: "Trim", value: "Leather" },
      { label: "Seats", value: "2" },
    ],
    anchor: [0.3, 0.9, -0.15],
    normal: [1, 0.3, 0],
    view: { position: [1.75, 1.25, 0.0], target: [0.3, 0.5, 0.0], fov: 34, minDistance: 0.4, maxDistance: 3 },
    mode: "exterior",
    highlight: ["seat_fr"],
    opens: ["doorR"],
  },
  {
    id: "interior",
    label: "Cockpit",
    kicker: "Interior",
    title: "Fighter-Jet Cockpit",
    description:
      "A tight, driver-focused cabin: TFT instrument cluster, hexagonal vents, and the engine start button hidden beneath a red flip-up cover.",
    specs: [
      { label: "Cluster", value: "TFT" },
      { label: "Start", value: "Flip cover" },
      { label: "Layout", value: "2 seats" },
    ],
    anchor: [0, 1.2, -0.2],
    normal: [0, 1, 0],
    view: { position: DRIVER_EYE, target: [0.2, 0.82, 0.6], fov: 64, control: "look" },
    mode: "interior",
    hotspotMode: "exterior",
    highlight: [],
  },
  {
    id: "screen",
    label: "Start Button",
    kicker: "Interior",
    title: "Start Under the Red Cover",
    description:
      "Flip up the red cover on the centre console and press the button beneath to fire up the V12 – a detail borrowed from fighter-jet cockpits.",
    specs: [
      { label: "Cover", value: "Red flip" },
      { label: "Engine", value: "V12" },
      { label: "Location", value: "Console" },
    ],
    anchor: [0, 0.48, 0.5],
    normal: [0, 1, -0.4],
    view: { position: [0.12, 0.88, 0.12], target: [0, 0.42, 0.5], fov: 40, minDistance: 0.15, maxDistance: 0.7 },
    mode: "interior",
    highlight: ["console"],
  },
];

/** Interior detail views reachable from the cabin controls. */
export const INTERIOR_VIEWS: Record<
  "overview" | "dashboard" | "steering" | "screen" | "console",
  CameraView & { label: string }
> = {
  overview: { label: "Look Around", position: DRIVER_EYE, target: [0.2, 0.82, 0.6], fov: 64, control: "look" },
  dashboard: { label: "Dashboard", position: [0.0, 1.0, -0.1], target: [0.0, 0.65, 0.75], fov: 50, minDistance: 0.25, maxDistance: 1.0 },
  steering: { label: "Steering Wheel", position: [0.27, 0.9, 0.08], target: [0.3, 0.69, 0.42], fov: 42, minDistance: 0.15, maxDistance: 0.6 },
  screen: { label: "Start Button", position: [0.12, 0.88, 0.12], target: [0, 0.42, 0.5], fov: 40, minDistance: 0.15, maxDistance: 0.7 },
  console: { label: "Display", position: [0.05, 0.85, 0.25], target: [0, 0.47, 0.66], fov: 44, minDistance: 0.15, maxDistance: 0.6 },
};

export type InteriorViewId = keyof typeof INTERIOR_VIEWS;
