import * as THREE from "three";
import { parametricPatch, curveOnSurface } from "@/lib/three/parametricPatch";
import type { MaterialLibrary } from "../materials/materialLibrary";
import {
  DIM,
  beltAt,
  bodyCenter,
  bodySurface,
  greenhouseCenter,
  greenhouseSurface,
  roofHeight,
} from "./profile";
import { group, mesh, ribbon, segs, type BuildContext } from "./helpers";

const GAP = 0.0045; // ~4.5 mm panel gaps
const AGAP = 0.005; // the same gap expressed in radians around the section
const TB = DIM.beltAngle;
const TOP: [number, number] = [TB, Math.PI - TB];
/** Everything except the top region, as one increasing interval. */
const SIDES: [number, number] = [Math.PI - TB, 2 * Math.PI + TB];
const DOOR_BOTTOM = 0.62; // angle below the crease where the door meets the sill
const RIGHT_DOOR: [number, number] = [2 * Math.PI - DOOR_BOTTOM + AGAP, 2 * Math.PI + TB];
const LEFT_DOOR: [number, number] = [Math.PI - TB, Math.PI + DOOR_BOTTOM - AGAP];
const SILL: [number, number] = [Math.PI + DOOR_BOTTOM, 2 * Math.PI - DOOR_BOTTOM];

const PHI_SIDE = 0.6;
const DOOR_INSET = -0.035;

type Range = [number, number];

function bodyPatch(ctx: BuildContext, z: Range, a: Range, offset = 0) {
  const [su, sv] = segs(ctx, z, a);
  return parametricPatch(bodySurface, z, a, su, sv, { center: bodyCenter, offset, uvScale: [1, 0.9] });
}

function glassPatch(ctx: BuildContext, z: Range, a: Range, offset = 0) {
  const [su, sv] = segs(ctx, z, a);
  return parametricPatch(greenhouseSurface, z, a, su, sv, {
    center: greenhouseCenter,
    offset,
    uvScale: [1, 0.6],
  });
}

/** Closes the cavity between outer skin and inner trim along a door's edges. */
function doorShutFaces(z: Range, a: Range, steps: number) {
  const outer = (zz: number, aa: number) => bodySurface(zz, aa, new THREE.Vector3());
  const inner = (zz: number, aa: number) => {
    const p = bodySurface(zz, aa, new THREE.Vector3());
    const c = bodyCenter(zz, aa, new THREE.Vector3());
    return p.addScaledVector(p.clone().sub(c).normalize(), DOOR_INSET);
  };
  const edges: THREE.BufferGeometry[] = [];
  const line = (f: (t: number) => [number, number]) => {
    const A: THREE.Vector3[] = [];
    const B: THREE.Vector3[] = [];
    for (let i = 0; i <= steps; i++) {
      const [zz, aa] = f(i / steps);
      A.push(outer(zz, aa));
      B.push(inner(zz, aa));
    }
    edges.push(ribbon(A, B));
  };
  line((t) => [z[0], THREE.MathUtils.lerp(a[0], a[1], t)]);
  line((t) => [z[1], THREE.MathUtils.lerp(a[0], a[1], t)]);
  line((t) => [THREE.MathUtils.lerp(z[0], z[1], t), a[0]]);
  line((t) => [THREE.MathUtils.lerp(z[0], z[1], t), a[1]]);
  return edges;
}

/** Scissor door: skin, inner trim, shut faces, frameless glass and ambient strip. */
function buildDoor(ctx: BuildContext, lib: MaterialLibrary, side: "r" | "l") {
  const name = `door_${side}`;
  const dz: Range = [DIM.door[0] + GAP, DIM.door[1] - GAP];
  const a = side === "r" ? RIGHT_DOOR : LEFT_DOOR;
  const door = group(name);

  door.add(mesh(`${name}_skin`, bodyPatch(ctx, dz, a), lib.paint));
  door.add(mesh(`${name}_trim`, bodyPatch(ctx, dz, a, DOOR_INSET), lib.leather, { cast: false }));
  for (const [i, geo] of doorShutFaces(dz, a, ctx.detail === "high" ? 40 : 10).entries()) {
    door.add(mesh(`${name}_shut_${i}`, geo, lib.paint, { cast: false }));
  }

  const glassA: Range = side === "r" ? [0.015, PHI_SIDE] : [Math.PI - PHI_SIDE, Math.PI - 0.015];
  door.add(mesh(`${name}_glass`, glassPatch(ctx, dz, glassA), lib.glass, { cast: false }));

  const stripAngle = side === "r" ? 2 * Math.PI + 0.2 : Math.PI - 0.2;
  const steps = 24;
  const curve = curveOnSurface(
    bodySurface,
    bodyCenter,
    Array.from({ length: steps + 1 }, (_, i) => [THREE.MathUtils.lerp(dz[0] + 0.08, dz[1] - 0.12, i / steps), stripAngle]),
    DOOR_INSET - 0.004,
  );
  door.add(
    mesh(`${name}_ambient`, new THREE.TubeGeometry(curve, 48, 0.0028, 6, false), lib.ambientLed, {
      cast: false,
      receive: false,
    }),
  );
  return door;
}

/** Glass engine cover with transverse louvres – the V12 stays on display. */
function buildEngineCover(ctx: BuildContext, lib: MaterialLibrary) {
  const cover = group("engine_cover");
  const zr: Range = [DIM.deckZ + GAP, DIM.roofRearZ - GAP];
  const topPhi: Range = [PHI_SIDE, Math.PI - PHI_SIDE];
  cover.add(mesh("engine_cover_glass", glassPatch(ctx, zr, topPhi), lib.glassDark, { cast: false }));
  const louvres = ctx.detail === "high" ? 7 : 4;
  for (let i = 1; i <= louvres; i++) {
    const z = THREE.MathUtils.lerp(zr[0] + 0.12, zr[1] - 0.1, i / (louvres + 1));
    const steps = 24;
    const curve = curveOnSurface(
      greenhouseSurface,
      greenhouseCenter,
      Array.from({ length: steps + 1 }, (_, j) => [z, THREE.MathUtils.lerp(PHI_SIDE + 0.03, Math.PI - PHI_SIDE - 0.03, j / steps)]),
      0.006,
    );
    cover.add(
      mesh("engine_cover_louvre", new THREE.TubeGeometry(curve, 32, 0.009, 6, false), lib.trimBlack, { carbon: true }),
    );
  }
  return cover;
}

export function buildBody(ctx: BuildContext, lib: MaterialLibrary) {
  const root = group("body_shell");
  const L = DIM.halfLength;

  /* ---------------- Front: fenders, nose, frunk lid ---------------------------- */
  root.add(mesh("body_front", bodyPatch(ctx, [DIM.cowlZ, L], SIDES), lib.paint));
  const hood = group("hood");
  hood.add(
    mesh(
      "hood_skin",
      bodyPatch(ctx, [DIM.hood[0] + GAP, DIM.hood[1] - GAP], [TB + AGAP, Math.PI - TB - AGAP]),
      lib.paint,
    ),
  );
  hood.add(
    mesh(
      "hood_liner",
      bodyPatch(ctx, [DIM.hood[0] + 0.03, DIM.hood[1] - 0.03], [TB + 0.05, Math.PI - TB - 0.05], -0.02),
      lib.underbody,
      { cast: false },
    ),
  );
  root.add(hood);
  root.add(mesh("body_nose", bodyPatch(ctx, [DIM.hood[1] + GAP, L], TOP), lib.paint));

  /* ---------------- Middle: sills, doors, rear quarters (open top) ------------- */
  const [d0, d1] = DIM.door;
  root.add(mesh("body_sill", bodyPatch(ctx, [DIM.cabinRearZ, DIM.cowlZ], SILL), lib.paint));
  for (const a of [RIGHT_DOOR, LEFT_DOOR]) {
    const full: Range = [a === RIGHT_DOOR ? a[0] - AGAP : a[0], a === LEFT_DOOR ? a[1] + AGAP : a[1]];
    root.add(mesh("body_quarter", bodyPatch(ctx, [DIM.cabinRearZ, d0], full), lib.paint));
    root.add(mesh("body_apillar_low", bodyPatch(ctx, [d1, DIM.cowlZ], full), lib.paint));
  }
  root.add(buildDoor(ctx, lib, "r"));
  root.add(buildDoor(ctx, lib, "l"));

  /* ---------------- Rear: haunches and the deck that carries the wing ----------- */
  root.add(mesh("body_rear", bodyPatch(ctx, [-L, DIM.deckZ], SIDES), lib.paint));
  root.add(mesh("body_tail", bodyPatch(ctx, [-L, DIM.deckZ], TOP), lib.paint));

  /* ---------------- Glasshouse ----------------------------------------------------- */
  const topPhi: Range = [PHI_SIDE, Math.PI - PHI_SIDE];
  root.add(mesh("glass_windshield", glassPatch(ctx, [DIM.windshieldTopZ, DIM.cowlZ], topPhi), lib.glass, { cast: false }));
  root.add(mesh("roof", glassPatch(ctx, [DIM.roofRearZ, DIM.windshieldTopZ], topPhi), lib.paint, { carbon: true }));
  root.add(
    mesh(
      "headliner",
      glassPatch(ctx, [DIM.bulkheadZ, DIM.windshieldTopZ + 0.05], [PHI_SIDE - 0.1, Math.PI - PHI_SIDE + 0.1], -0.02),
      lib.alcantara,
      { cast: false },
    ),
  );
  root.add(buildEngineCover(ctx, lib));
  for (const sideA of [
    [0.0, PHI_SIDE],
    [Math.PI - PHI_SIDE, Math.PI],
  ] as Range[]) {
    // Rear buttresses flow from the roof onto the haunches.
    root.add(mesh("pillar_c", glassPatch(ctx, [DIM.deckZ, d0], sideA), lib.paint));
    root.add(mesh("pillar_a", glassPatch(ctx, [d1, DIM.cowlZ], sideA), lib.trimBlack));
  }

  // Dark rails trace the glasshouse.
  for (const phi of [PHI_SIDE, Math.PI - PHI_SIDE]) {
    const steps = 60;
    const curve = curveOnSurface(
      greenhouseSurface,
      greenhouseCenter,
      Array.from({ length: steps + 1 }, (_, i) => [THREE.MathUtils.lerp(DIM.roofRearZ, DIM.cowlZ - 0.04, i / steps), phi]),
      0.002,
    );
    root.add(mesh("roof_rail", new THREE.TubeGeometry(curve, 120, 0.006, 8, false), lib.darkChrome, { cast: false }));
  }

  // Cabin rear wall: bulkhead with a slim vertical window into the engine bay.
  const belt = beltAt(DIM.bulkheadZ);
  const roof = roofHeight(DIM.bulkheadZ);
  const bulkhead = mesh("cabin_bulkhead", new THREE.BoxGeometry(belt.x * 1.9, belt.y - 0.12, 0.03), lib.alcantara, { cast: false });
  bulkhead.position.set(0, (belt.y + 0.12) / 2, DIM.bulkheadZ);
  const rearWindow = mesh(
    "glass_bulkhead",
    new THREE.PlaneGeometry(belt.x * 1.1, roof - belt.y - 0.04),
    lib.glassLowTier,
    { cast: false },
  );
  rearWindow.position.set(0, (roof + belt.y) / 2 - 0.02, DIM.bulkheadZ - 0.005);
  root.add(bulkhead, rearWindow);

  /* ---------------- Underbody & wheel-well liners --------------------------------- */
  root.add(mesh("underbody", new THREE.BoxGeometry(1.5, 0.06, 4.0).translate(0, 0.11, 0), lib.underbody));
  lib.underbody.side = THREE.DoubleSide;
  for (const axle of [DIM.front, DIM.rear]) {
    for (const sx of [1, -1]) {
      const r = axle.radius + 0.06;
      const liner = new THREE.CylinderGeometry(r, r, axle.width + 0.1, 6, 1, true, 0, Math.PI);
      liner.rotateZ(Math.PI / 2);
      const m = mesh("wheel_liner", liner, lib.underbody, { cast: false });
      m.position.set(sx * (axle.track - 0.02), axle.radius, axle.z);
      root.add(m);
    }
  }

  return root;
}
