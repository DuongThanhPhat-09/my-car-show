import * as THREE from "three";
import { lerp, monotoneCubic, smoothstep } from "@/lib/math/monotoneCubic";

/**
 * Design surface of the procedural Lamborghini Aventador S (LP 740-4) stand-in.
 * Units are metres, the car faces +Z, Y is up, ground at y = 0.
 *
 * Package follows the published figures: 4,797 mm long, 2,030 mm wide,
 * 1,136 mm tall, 2,700 mm wheelbase; 255/30 R20 front and 355/25 R21 rear tyres.
 *
 * Unlike a saloon, the Aventador is drawn with straight planes meeting at sharp
 * creases. Each cross-section is therefore a *polygon* (floor → sill → side
 * crease → shoulder → top edge → spine) rather than a superellipse; the section
 * parameter θ is mapped piecewise-linearly onto that polygon. Panel cuts, arches
 * and end caps remain modifiers of one continuous surface, so seams still align.
 */
export interface AxleSpec {
  z: number;
  track: number; // wheel centre |x|
  radius: number; // tyre outer radius
  width: number;
  rimRadius: number;
  disc: number; // brake disc radius
}

const FRONT: AxleSpec = { z: 1.33, track: 0.855, radius: 0.331, width: 0.255, rimRadius: 0.254, disc: 0.2 };
const REAR: AxleSpec = { z: -1.37, track: 0.83, radius: 0.356, width: 0.355, rimRadius: 0.267, disc: 0.19 };

export const DIM = {
  length: 4.797,
  halfLength: 2.398,
  front: FRONT,
  rear: REAR,
  frontAxle: FRONT.z,
  rearAxle: REAR.z,
  /** Section angle of the sharp top edge (hood / deck meet the flanks). */
  beltAngle: 0.7,
  cowlZ: 0.95,
  windshieldTopZ: 0.02,
  roofRearZ: -0.45,
  deckZ: -1.86,
  /** Open-top region (cabin + engine bay) runs from the deck to the cowl. */
  cabinRearZ: -1.86,
  bulkheadZ: -0.58,
  door: [-0.42, 0.8] as [number, number],
  hood: [0.95, 2.18] as [number, number],
  noseRound: 0.16,
  tailRound: 0.07,
};

/** Height of the sharp top edge (fender / hood / deck line). */
const topLine = monotoneCubic([
  [-2.398, 0.79],
  [-2.2, 0.84],
  [-1.86, 0.88],
  [-1.37, 0.9],
  [-0.8, 0.86],
  [0, 0.82],
  [0.6, 0.8],
  [1.0, 0.79],
  [1.33, 0.78],
  [1.75, 0.66],
  [2.1, 0.55],
  [2.398, 0.43],
]);

const floorLine = monotoneCubic([
  [-2.398, 0.3],
  [-2.2, 0.17],
  [-1.85, 0.11],
  [1.85, 0.105],
  [2.2, 0.13],
  [2.398, 0.19],
]);

const halfWidth = monotoneCubic([
  [-2.398, 0.86],
  [-2.2, 0.96],
  [-1.37, 1.015],
  [-0.9, 0.99],
  [-0.2, 0.955],
  [0.6, 0.965],
  [1.33, 0.99],
  [1.85, 0.95],
  [2.2, 0.83],
  [2.398, 0.58],
]);

/** The side crease – the character line that runs from nose to tail. */
const creaseLine = monotoneCubic([
  [-2.398, 0.56],
  [-1.37, 0.6],
  [-0.5, 0.52],
  [0.5, 0.49],
  [1.33, 0.45],
  [2.398, 0.33],
]);

/** Spine height above the top edge: a slightly sunken frunk lid, a crowned rear deck. */
const crownLine = monotoneCubic([
  [-2.398, 0.02],
  [-1.86, 0.03],
  [0.95, 0.0],
  [1.6, -0.012],
  [2.398, 0.0],
]);

/** Glasshouse height above the top edge – extremely raked screen, low roof. */
const greenhouseHeight = monotoneCubic([
  [DIM.deckZ, 0.0],
  [-1.5, 0.08],
  [-1.0, 0.18],
  [-0.6, 0.27],
  [-0.25, 0.315],
  [0.05, 0.32],
  [0.35, 0.27],
  [0.7, 0.13],
  [DIM.cowlZ, 0.0],
]);

const NOSE_SQUISH = 0.85;
const TAIL_SQUISH = 1.0;

function endRounding(z: number) {
  const front = z - (DIM.halfLength - DIM.noseRound);
  const rear = -(DIM.halfLength - DIM.tailRound) - z;
  if (front > 0) return Math.sqrt(Math.max(0, 1 - (front / DIM.noseRound) ** 2));
  if (rear > 0) return Math.sqrt(Math.max(0, 1 - (rear / DIM.tailRound) ** 2));
  return 1;
}

/**
 * Trapezoidal (hexagon-inspired) wheel-arch ceiling for the axle under z,
 * plus the tyre's inner face so the liner shelf starts just inboard of it.
 */
function archAt(z: number) {
  for (const a of [FRONT, REAR]) {
    const d = Math.abs(z - a.z);
    const top = 2 * a.radius + 0.045;
    const halfTop = 0.21;
    const slope = 1.45;
    const floorY = a.radius * 0.88;
    const end = halfTop + (top - floorY) / slope;
    const ramp = 0.03;
    if (d > end + ramp) continue;
    const ceiling = d <= end ? top - Math.max(0, d - halfTop) * slope : lerp(floorY, -0.5, (d - end) / ramp);
    return { ceiling, inner: a.track - a.width / 2 };
  }
  return null;
}

export function sectionAt(z: number) {
  const k = endRounding(z);
  const w = halfWidth(z) * k;
  const top = topLine(z);
  const bottom = floorLine(z);
  return { w, top, bottom, k };
}

/** Right-half polygon keys: [section angle, x / w, y]. */
function sectionKeys(z: number, w: number, top: number, bottom: number, k: number) {
  const squish = lerp(z > 0 ? NOSE_SQUISH : TAIL_SQUISH, 1, k);
  const mid = (top + bottom) / 2;
  const sq = (y: number) => mid + (y - mid) * squish;
  const crease = Math.min(creaseLine(z), top - 0.06);
  const shoulder = lerp(crease, top, 0.62);
  return [
    [-Math.PI / 2, 0, sq(bottom)],
    [-1.1, 0.86, sq(bottom)],
    [-0.55, 0.93, sq(bottom + 0.1)],
    [0, 1, sq(crease)],
    [0.42, 0.95, sq(shoulder)],
    [DIM.beltAngle, 0.85, sq(top)],
    [Math.PI / 2, 0, sq(top + crownLine(z))],
  ] as const;
}

/** Body surface P(z, θ). θ = 0 → right flank (+X), π/2 → top, π → left flank. */
export function bodySurface(z: number, theta: number, out: THREE.Vector3) {
  const { w, top, bottom, k } = sectionAt(z);
  // Wrap to [-π/2, 3π/2) and fold the left half onto the right.
  const t = ((((theta + Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI / 2;
  const left = t > Math.PI / 2;
  const a = left ? Math.PI - t : t;

  const keys = sectionKeys(z, w, top, bottom, k);
  let i = 0;
  while (i < keys.length - 2 && a > keys[i + 1][0]) i++;
  const [a0, x0, y0] = keys[i];
  const [a1, x1, y1] = keys[i + 1];
  const f = (a - a0) / (a1 - a0);
  const x = lerp(x0, x1, f) * w * (left ? -1 : 1);
  let y = lerp(y0, y1, f);

  // Wheel-well: outboard of the tyre's inner face the surface is lifted onto the
  // arch ceiling, carving a crisp arch in profile and a liner shelf above the tyre.
  const arch = archAt(z);
  if (arch) {
    const g = smoothstep(arch.inner - 0.12, arch.inner - 0.03, Math.abs(x));
    y = lerp(y, Math.max(y, arch.ceiling), g);
  }

  return out.set(x, y, z);
}

/** Interior reference point; clamped in Z so normals at the nose/tail seams point outward. */
export function bodyCenter(z: number, _theta: number, out: THREE.Vector3) {
  const { top, bottom } = sectionAt(z);
  const zc = Math.min(DIM.halfLength - 0.3, Math.max(-(DIM.halfLength - 0.3), z));
  return out.set(0, (top + bottom) / 2, zc);
}

const beltTmp = new THREE.Vector3();
export function beltAt(z: number) {
  bodySurface(z, DIM.beltAngle, beltTmp);
  return { x: beltTmp.x, y: beltTmp.y };
}

const GH_M = 3.0;
const TUMBLEHOME = 0.26;

/** Glasshouse surface G(z, φ). φ = 0 → right belt, π/2 → roof centre, π → left belt. */
export function greenhouseSurface(z: number, phi: number, out: THREE.Vector3) {
  const belt = beltAt(z);
  const gh = greenhouseHeight(z);
  const c = Math.sign(Math.cos(phi)) * Math.pow(Math.abs(Math.cos(phi)), 2 / GH_M);
  const s = Math.pow(Math.max(0, Math.sin(phi)), 2 / GH_M);
  const x = belt.x * c * (1 - TUMBLEHOME * s);
  // Slight inset so the glass sits just inside the top edge.
  return out.set(x * 0.995, belt.y + gh * s - 0.002, z);
}

export function greenhouseCenter(z: number, _phi: number, out: THREE.Vector3) {
  const belt = beltAt(z);
  return out.set(0, belt.y - 0.05, z);
}

export function roofHeight(z: number) {
  return beltAt(z).y + greenhouseHeight(z);
}

const contourTmp = new THREE.Vector3();
/**
 * Finds, for each section angle θ, the Z where the body surface crosses height Y
 * between zNear and zFar. Returns [z, θ] samples – used to lay horizontal light
 * graphics across the rounded ends.
 */
export function contourAtHeight(Y: number, thetas: number[], zNear: number, zFar: number) {
  const out: Array<[number, number]> = [];
  for (const theta of thetas) {
    const yNear = bodySurface(zNear, theta, contourTmp).y;
    const yFar = bodySurface(zFar, theta, contourTmp).y;
    if ((yNear - Y) * (yFar - Y) > 0) continue;
    let a = zNear;
    let b = zFar;
    for (let i = 0; i < 40; i++) {
      const m = (a + b) / 2;
      const ym = bodySurface(m, theta, contourTmp).y;
      if ((ym - Y) * (yNear - Y) > 0) a = m;
      else b = m;
    }
    out.push([(a + b) / 2, theta]);
  }
  return out;
}
