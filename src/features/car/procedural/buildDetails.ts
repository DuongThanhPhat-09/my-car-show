import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { parametricPatch, curveOnSurface } from "@/lib/three/parametricPatch";
import { badgeTexture, lamborghiniEmblemTextures } from "@/lib/three/proceduralTextures";
import type { MaterialLibrary } from "../materials/materialLibrary";
import { DIM, bodyCenter, bodySurface, beltAt, sectionAt } from "./profile";
import { group, mesh, placeOnSurface, segs, surfaceFrame, type BuildContext } from "./helpers";

const L = DIM.halfLength;
const TB = DIM.beltAngle;
type Range = [number, number];

/** Mirrors a right-hand section angle to the left flank. */
const mirrorAngle = (a: number) => Math.PI - a;
const sideRange = (side: "r" | "l", [a0, a1]: Range): Range => (side === "r" ? [a0, a1] : [mirrorAngle(a1), mirrorAngle(a0)]);

function surfacePatch(ctx: BuildContext, z: Range, a: Range, offset: number) {
  const [su, sv] = segs(ctx, z, a);
  return parametricPatch(bodySurface, z, a, su, sv, { center: bodyCenter, offset });
}

/** Light strokes drawn in (z, θ) surface coordinates, lifted just off the lens. */
function lightStroke(points: Array<[number, number]>, radius: number, mat: THREE.Material, name: string) {
  const curve = curveOnSurface(bodySurface, bodyCenter, points, 0.006);
  return mesh(name, new THREE.TubeGeometry(curve, 32, radius, 8, false), mat, { cast: false });
}

function lettering(lib: MaterialLibrary, text: string) {
  const mat = lib.chrome.clone();
  mat.color.set("#e2e4e8");
  mat.metalness = 0.75;
  mat.roughness = 0.28;
  mat.alphaMap = badgeTexture(text);
  mat.transparent = true;
  mat.alphaTest = 0.4;
  return mat;
}

/* ------------------------------------------------------------------ */
/* Headlights – slim lens on the fender corner, Y-shaped DRL signature.  */
/* ------------------------------------------------------------------ */
function buildHeadlight(ctx: BuildContext, lib: MaterialLibrary, side: "r" | "l") {
  const m = side === "r" ? (a: number) => a : mirrorAngle;
  const head = group(`headlight_${side}`);
  head.add(
    mesh(`headlight_lens_${side}`, surfacePatch(ctx, [1.98, 2.31], sideRange(side, [0.3, 0.66]), 0.0025), lib.headlightLens, {
      cast: false,
    }),
  );
  // Sideways "Y": a stem running forward that splits into two arms.
  const fork: [number, number] = [2.11, m(0.48)];
  head.add(lightStroke([[1.99, m(0.48)], [2.05, m(0.48)], fork], 0.0038, lib.headlightLed, `headlight_drl_${side}`));
  head.add(lightStroke([fork, [2.2, m(0.56)], [2.29, m(0.62)]], 0.0038, lib.headlightLed, `headlight_drl_upper_${side}`));
  head.add(lightStroke([fork, [2.2, m(0.4)], [2.29, m(0.34)]], 0.0038, lib.headlightLed, `headlight_drl_lower_${side}`));

  // Twin LED projectors between the arms.
  const pod = new RoundedBoxGeometry(0.03, 0.022, 0.012, 3, 0.006);
  for (const z of [2.17, 2.235]) {
    const f = surfaceFrame(bodySurface, bodyCenter, z, m(0.48));
    head.add(
      placeOnSurface(mesh(`headlight_led_${side}`, pod, lib.headlightLed, { cast: false }), f.p, f.n, new THREE.Vector3(0, 0, 1), 0.006),
    );
  }
  return head;
}

/* ------------------------------------------------------------------ */
/* Air intakes: nose corners, side scoops, rear-fender shoulder vents    */
/* ------------------------------------------------------------------ */
function buildIntakes(ctx: BuildContext, lib: MaterialLibrary) {
  const intakes = group("intakes");
  for (const side of ["r", "l"] as const) {
    const m = side === "r" ? (a: number) => a : mirrorAngle;
    // Big black corner intakes under the headlights.
    intakes.add(
      mesh(`intake_front_${side}`, surfacePatch(ctx, [2.0, L - 0.002], sideRange(side, [-0.95, 0.18]), 0.002), lib.trimSatin, {
        cast: false,
      }),
    );

    // Side scoop behind the door, ahead of the rear arch.
    const scoop: Range = [-0.83, -0.46];
    intakes.add(
      mesh(`intake_side_${side}`, surfacePatch(ctx, scoop, sideRange(side, [-0.42, 0.36]), 0.002), lib.trimSatin, { cast: false }),
    );
    for (let i = 1; i <= 4; i++) {
      const a = m(THREE.MathUtils.lerp(-0.3, 0.26, i / 5));
      intakes.add(lightStroke([[scoop[0] + 0.03, a], [scoop[1] - 0.03, a]], 0.004, lib.trimBlack, `intake_side_fin_${side}`));
    }

    // Shoulder vents feeding the V12, on top of the rear haunches.
    intakes.add(
      mesh(`intake_shoulder_${side}`, surfacePatch(ctx, [-1.3, -0.62], sideRange(side, [0.46, TB - 0.02]), 0.002), lib.trimSatin, {
        cast: false,
      }),
    );
  }
  return intakes;
}

/* ------------------------------------------------------------------ */
/* Rear: black fascia, Y taillights, hexagonal triple exhaust, diffuser  */
/* ------------------------------------------------------------------ */
function buildRear(ctx: BuildContext, lib: MaterialLibrary) {
  const rear = group("rear");
  rear.add(
    mesh("rear_fascia", surfacePatch(ctx, [-L, -L + 0.075], [Math.PI - TB, 2 * Math.PI + TB], 0.0015), lib.trimSatin, { cast: false }),
  );

  const lights = group("taillights");
  for (const side of ["r", "l"] as const) {
    const m = side === "r" ? (a: number) => a : mirrorAngle;
    lights.add(
      mesh(`taillight_lens_${side}`, surfacePatch(ctx, [-L + 0.028, -L + 0.072], sideRange(side, [0.08, 0.66]), 0.003), lib.taillightLens, {
        cast: false,
      }),
    );
    const fork: [number, number] = [-L + 0.047, m(0.38)];
    lights.add(lightStroke([[-L + 0.032, m(0.38)], fork], 0.005, lib.taillightLed, `taillight_bar_${side}`));
    lights.add(lightStroke([fork, [-L + 0.06, m(0.5)], [-L + 0.069, m(0.62)]], 0.005, lib.taillightLed, `taillight_led_upper_${side}`));
    lights.add(lightStroke([fork, [-L + 0.06, m(0.26)], [-L + 0.069, m(0.12)]], 0.005, lib.taillightLed, `taillight_led_lower_${side}`));
  }
  rear.add(lights);

  // Hexagonal centre exhaust with three outlets (Aventador S).
  const exhaust = group("exhaust");
  const frame = mesh(
    "exhaust_frame",
    new THREE.CylinderGeometry(0.13, 0.13, 0.05, 6, 1, true).rotateX(Math.PI / 2).rotateZ(Math.PI / 6),
    lib.darkChrome,
  );
  const back = mesh("exhaust_back", new THREE.CircleGeometry(0.128, 6).rotateZ(Math.PI / 6), lib.underbody, { cast: false });
  back.position.z = 0.02;
  back.rotation.y = Math.PI;
  exhaust.add(frame, back);
  const tip = new THREE.CylinderGeometry(0.036, 0.04, 0.08, 6, 1, true).rotateX(Math.PI / 2);
  for (const [x, y] of [
    [-0.055, -0.03],
    [0.055, -0.03],
    [0, 0.05],
  ] as const) {
    const t = mesh("exhaust_tip", tip, lib.darkChrome);
    t.position.set(x, y, -0.01);
    exhaust.add(t);
  }
  exhaust.position.set(0, 0.42, -L + 0.01);
  rear.add(exhaust);

  // Diffuser with tall strakes.
  const diffuser = group("diffuser");
  const plate = mesh("diffuser_plate", new RoundedBoxGeometry(1.4, 0.014, 0.42, 2, 0.006), lib.trimBlack, { carbon: true });
  plate.position.set(0, 0.2, -2.2);
  plate.rotation.x = -0.25;
  diffuser.add(plate);
  for (const x of [-0.6, -0.42, -0.24, 0.24, 0.42, 0.6]) {
    const fin = mesh("diffuser_fin", new RoundedBoxGeometry(0.008, 0.12, 0.38, 1, 0.003), lib.trimBlack, { carbon: true });
    fin.position.set(x, 0.17, -2.21);
    fin.rotation.x = -0.25;
    diffuser.add(fin);
  }
  rear.add(diffuser);

  const badge = mesh("badge_rear", new THREE.PlaneGeometry(0.5, 0.0625), lettering(lib, "LAMBORGHINI"), { cast: false });
  placeOnSurface(badge, new THREE.Vector3(0, 0.66, -L), new THREE.Vector3(0, 0.05, -1), new THREE.Vector3(-1, 0, 0), 0.005);
  rear.add(badge);
  return rear;
}

/* ------------------------------------------------------------------ */
/* Active rear wing – sits flush on the deck, rises on demand.          */
/* ------------------------------------------------------------------ */
export const WING_Z = -2.12;

function buildWing(ctx: BuildContext, lib: MaterialLibrary) {
  const wing = group("wing");
  const deck = bodySurface(WING_Z, Math.PI / 2 + 1e-4, new THREE.Vector3()).y;
  const blade = mesh("wing_blade", new RoundedBoxGeometry(1.22, 0.02, 0.24, ctx.detail === "high" ? 3 : 1, 0.008), lib.paint, {
    carbon: true,
  });
  blade.position.set(0, deck + 0.014, WING_Z);
  wing.add(blade);
  for (const sx of [1, -1]) {
    const strut = mesh("wing_strut", new THREE.BoxGeometry(0.02, 0.12, 0.08), lib.trimBlack);
    strut.position.set(sx * 0.32, deck - 0.05, WING_Z + 0.02);
    wing.add(strut);
  }
  return wing;
}

/* ------------------------------------------------------------------ */
/* Bonnet shield                                                        */
/* ------------------------------------------------------------------ */
function buildLogo() {
  const { shield: shieldTex } = lamborghiniEmblemTextures();
  const f = surfaceFrame(bodySurface, bodyCenter, 2.27, Math.PI / 2 + 1e-4);
  const logo = group("logo");
  // Shield outline: flat top tapering to a point.
  const W = 0.062;
  const H = 0.075;
  const s = new THREE.Shape();
  s.moveTo(-W / 2, H / 2);
  s.lineTo(W / 2, H / 2);
  s.lineTo(W / 2, -H * 0.05);
  s.quadraticCurveTo(W / 2, -H * 0.35, 0, -H / 2);
  s.quadraticCurveTo(-W / 2, -H * 0.35, -W / 2, -H * 0.05);
  s.closePath();
  const geo = new THREE.ShapeGeometry(s, 16);
  // Planar UVs over the shield's bounding box.
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / W + 0.5;
    uv[i * 2 + 1] = pos.getY(i) / H + 0.5;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  const mat = new THREE.MeshPhysicalMaterial({
    map: shieldTex,
    metalness: 0.6,
    roughness: 0.25,
    clearcoat: 1,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  logo.add(mesh("logo_shield", geo, mat, { cast: false }));
  // Lay it on the nose with the shield's top towards the windscreen (local +Y → -Z).
  placeOnSurface(logo, f.p, f.n, new THREE.Vector3(1, 0, 0), 0.003);
  return logo;
}

/* ------------------------------------------------------------------ */
/* Side mirrors (door-mounted, carbon-capable caps)                     */
/* ------------------------------------------------------------------ */
function buildMirror(ctx: BuildContext, lib: MaterialLibrary, side: "r" | "l") {
  const sx = side === "r" ? 1 : -1;
  const z = 0.62;
  const belt = beltAt(z);
  const mirror = group(`mirror_${side}`);

  const cap = new THREE.SphereGeometry(1, ctx.detail === "high" ? 32 : 12, ctx.detail === "high" ? 12 : 6);
  cap.scale(0.1, 0.045, 0.055);
  const housing = mesh(`mirror_cap_${side}`, cap, lib.paint, { carbon: true });
  housing.position.set(sx * (belt.x + 0.17), belt.y + 0.08, z);

  const glass = mesh(
    `mirror_glass_${side}`,
    new THREE.CircleGeometry(1, 6).scale(0.09, 0.038, 1),
    new THREE.MeshPhysicalMaterial({ color: "#d9e2ea", metalness: 1, roughness: 0.02, envMapIntensity: 1.2 }),
    { cast: false },
  );
  glass.position.copy(housing.position).add(new THREE.Vector3(0, 0, -0.024));
  glass.rotation.y = Math.PI;

  // Slim stalk rising from the door top.
  const arm = mesh(`mirror_arm_${side}`, new RoundedBoxGeometry(0.14, 0.018, 0.035, 2, 0.008), lib.trimBlack);
  arm.position.set(sx * (belt.x + 0.08), belt.y + 0.045, z + 0.02);
  arm.rotation.z = sx * 0.4;

  mirror.add(housing, glass, arm);
  return mirror;
}

/* ------------------------------------------------------------------ */
/* Aero: splitter and side blades (carbon pack)                         */
/* ------------------------------------------------------------------ */
function buildAero(ctx: BuildContext, lib: MaterialLibrary) {
  const aero = group("aero");
  const shape = new THREE.Shape();
  const steps = ctx.detail === "high" ? 40 : 12;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const z = THREE.MathUtils.lerp(1.75, L - 0.004, i / steps);
    pts.push(new THREE.Vector2(sectionAt(z).w * 0.96, z + 0.02 * (i / steps)));
  }
  shape.moveTo(pts[0].x, pts[0].y);
  for (const p of pts) shape.lineTo(p.x, p.y);
  for (let i = pts.length - 1; i >= 0; i--) shape.lineTo(-pts[i].x, pts[i].y);
  shape.closePath();
  const lip = new THREE.ExtrudeGeometry(shape, {
    depth: 0.014,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
    curveSegments: 4,
  });
  lip.rotateX(Math.PI / 2);
  const splitter = mesh("splitter", lip, lib.trimSatin, { carbon: true });
  splitter.position.y = 0.122;
  aero.add(splitter);

  for (const sx of [1, -1]) {
    const skirt = mesh(sx > 0 ? "skirt_r" : "skirt_l", new RoundedBoxGeometry(0.05, 0.06, 1.75, 3, 0.012), lib.trimBlack, {
      carbon: true,
    });
    skirt.position.set(sx * (sectionAt(0).w * 0.9), 0.15, 0.05);
    aero.add(skirt);
  }
  return aero;
}

/* ------------------------------------------------------------------ */
/* 6.5-litre V12, mid-mounted under the glass engine cover               */
/* ------------------------------------------------------------------ */
function buildEngine(ctx: BuildContext, lib: MaterialLibrary) {
  const engine = group("engine");
  const r = (w: number, h: number, d: number, rad: number) => new RoundedBoxGeometry(w, h, d, ctx.detail === "high" ? 3 : 1, rad);
  const zc = -1.2;

  const bay = mesh("engine_bay_floor", new THREE.PlaneGeometry(1.5, 1.3).rotateX(-Math.PI / 2), lib.underbody, { cast: false });
  bay.position.set(0, 0.2, zc);
  const block = mesh("engine_block", r(0.5, 0.26, 0.92, 0.04), lib.engineMetal);
  block.position.set(0, 0.38, zc);
  engine.add(bay, block);

  // Two cylinder banks in a 60° vee with colour-keyed cam covers.
  for (const sx of [1, -1]) {
    const head = mesh("engine_cam_cover", r(0.17, 0.08, 0.9, 0.03), lib.caliper);
    head.position.set(sx * 0.19, 0.56, zc);
    head.rotation.z = -sx * 0.52;
    engine.add(head);
    // Six intake runners per bank feeding the central plenum.
    for (let i = 0; i < 6; i++) {
      const runner = mesh("engine_runner", new THREE.CylinderGeometry(0.022, 0.026, 0.14, 12), lib.trimBlack);
      runner.position.set(sx * 0.1, 0.63, zc - 0.36 + i * 0.145);
      runner.rotation.z = sx * 0.6;
      engine.add(runner);
    }
  }
  const plenum = mesh("engine_plenum", r(0.2, 0.07, 0.9, 0.03), lib.carbon);
  plenum.position.set(0, 0.68, zc);
  const plate = mesh("engine_badge", new THREE.PlaneGeometry(0.3, 0.0375).rotateX(-Math.PI / 2), lettering(lib, "V12"), { cast: false });
  plate.position.set(0, 0.716, zc);
  engine.add(plenum, plate);

  // Exhaust pipes sweeping back to the centre outlet.
  for (const sx of [1, -1]) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx * 0.33, 0.42, zc + 0.3),
      new THREE.Vector3(sx * 0.38, 0.38, zc - 0.2),
      new THREE.Vector3(sx * 0.2, 0.4, -2.0),
      new THREE.Vector3(sx * 0.05, 0.42, -L + 0.06),
    ]);
    engine.add(mesh("engine_exhaust_pipe", new THREE.TubeGeometry(curve, 48, 0.035, 12, false), lib.darkChrome));
  }
  return engine;
}

/** Front luggage compartment (frunk) and the bulkhead behind it. */
function buildFrunk(ctx: BuildContext, lib: MaterialLibrary) {
  const frunk = group("frunk_bay");
  const floor = mesh("frunk_floor", new RoundedBoxGeometry(1.05, 0.04, 0.55, ctx.detail === "high" ? 2 : 1, 0.015), lib.carpet, {
    cast: false,
  });
  floor.position.set(0, 0.3, 1.86);
  const firewall = mesh("frunk_firewall", new THREE.BoxGeometry(1.4, 0.55, 0.03), lib.underbody, { cast: false });
  firewall.position.set(0, 0.5, 1.0);
  const cowl = mesh("frunk_cowl", new THREE.BoxGeometry(1.4, 0.02, 0.14), lib.plastic, { cast: false });
  cowl.position.set(0, 0.76, 1.03);
  frunk.add(floor, firewall, cowl);
  return frunk;
}

export function buildDetails(ctx: BuildContext, lib: MaterialLibrary) {
  return {
    fixed: [
      buildHeadlight(ctx, lib, "r"),
      buildHeadlight(ctx, lib, "l"),
      buildIntakes(ctx, lib),
      buildRear(ctx, lib),
      buildWing(ctx, lib),
      buildLogo(),
      buildAero(ctx, lib),
      buildEngine(ctx, lib),
      buildFrunk(ctx, lib),
    ],
    mirrors: { r: buildMirror(ctx, lib, "r"), l: buildMirror(ctx, lib, "l") },
  };
}
