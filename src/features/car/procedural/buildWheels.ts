import * as THREE from "three";
import type { MaterialLibrary } from "../materials/materialLibrary";
import { DIM, type AxleSpec } from "./profile";
import { group, mesh, spokeGeometry, type BuildContext } from "./helpers";

/**
 * Geometry for one axle. The Aventador runs staggered sizes (255/30 R20 front,
 * 355/25 R21 rear), so each axle gets its own buffers; left/right wheels share them.
 */
function axleGeometries(ctx: BuildContext, a: AxleSpec) {
  const high = ctx.detail === "high";
  const R = a.radius;
  const W = a.width / 2;
  const bead = a.rimRadius + 0.006;

  // Low-profile tyre cross-section → smooth profile → lathe around the axle.
  const profile = new THREE.SplineCurve([
    new THREE.Vector2(bead, W - 0.012),
    new THREE.Vector2(bead + 0.025, W),
    new THREE.Vector2(R - 0.022, W - 0.003),
    new THREE.Vector2(R - 0.005, W - 0.02),
    new THREE.Vector2(R, W - 0.045),
    new THREE.Vector2(R, -(W - 0.045)),
    new THREE.Vector2(R - 0.005, -(W - 0.02)),
    new THREE.Vector2(R - 0.022, -(W - 0.003)),
    new THREE.Vector2(bead + 0.025, -W),
    new THREE.Vector2(bead, -(W - 0.012)),
  ]);
  const tire = new THREE.LatheGeometry(profile.getSpacedPoints(high ? 64 : 20), high ? 128 : 40);
  tire.rotateZ(-Math.PI / 2);

  const barrel = new THREE.CylinderGeometry(a.rimRadius - 0.004, a.rimRadius - 0.004, a.width - 0.03, high ? 96 : 32, 1, true);
  barrel.rotateZ(Math.PI / 2);
  const lip = new THREE.TorusGeometry(a.rimRadius - 0.002, 0.008, 12, high ? 128 : 40);
  lip.rotateY(Math.PI / 2).translate(W - 0.022, 0, 0);

  // Five slender twin spokes with a sharp turbine twist.
  const spokes: THREE.BufferGeometry[] = [];
  const outer = a.rimRadius - 0.009;
  for (let i = 0; i < 5; i++) {
    const base = (i / 5) * Math.PI * 2;
    spokes.push(
      spokeGeometry(base - 0.07, 0.22, ctx.detail, outer).translate(W - 0.11, 0, 0),
      spokeGeometry(base + 0.07, 0.22, ctx.detail, outer).translate(W - 0.11, 0, 0),
    );
  }

  const hub = new THREE.CylinderGeometry(0.07, 0.085, 0.05, 6);
  hub.rotateZ(-Math.PI / 2).translate(W - 0.03, 0, 0);
  // Centre-lock style hexagonal cap carrying the shield.
  const cap = new THREE.CylinderGeometry(0.034, 0.034, 0.008, 48);
  cap.rotateZ(-Math.PI / 2).translate(W - 0.002, 0, 0);
  const lug = new THREE.CylinderGeometry(0.009, 0.009, 0.016, 6);
  lug.rotateZ(-Math.PI / 2);

  // Carbon-ceramic disc (grey with drilled pattern) and its alloy bell.
  const disc = new THREE.CylinderGeometry(a.disc, a.disc, 0.034, high ? 96 : 32);
  disc.rotateZ(-Math.PI / 2).translate(-0.01, 0, 0);
  const discHat = new THREE.CylinderGeometry(0.095, 0.1, 0.06, 48);
  discHat.rotateZ(-Math.PI / 2).translate(0.03, 0, 0);

  const caliper = new THREE.TorusGeometry(a.disc - 0.022, 0.036, 18, 40, 1.1);
  caliper.rotateY(Math.PI / 2).scale(1.45, 1, 1).translate(-0.01, 0, 0);
  const caliperBridge = new THREE.BoxGeometry(0.08, 0.03, 0.15);

  return { tire, barrel, lip, spokes, hub, cap, lug, disc, discHat, caliper, caliperBridge };
}

export function buildWheels(ctx: BuildContext, lib: MaterialLibrary) {
  const root = group("wheels");
  const front = axleGeometries(ctx, DIM.front);
  const rear = axleGeometries(ctx, DIM.rear);

  const corners = [
    { id: "fl", axle: DIM.front, g: front, sx: -1 },
    { id: "fr", axle: DIM.front, g: front, sx: 1 },
    { id: "rl", axle: DIM.rear, g: rear, sx: -1 },
    { id: "rr", axle: DIM.rear, g: rear, sx: 1 },
  ];

  for (const { id, axle, g, sx } of corners) {
    const W = axle.width / 2;
    const spin = group(`wheel_${id}`);
    spin.add(mesh(`tire_${id}`, g.tire, lib.tire));
    spin.add(mesh(`rim_barrel_${id}`, g.barrel, lib.darkChrome, { cast: false }));
    spin.add(mesh(`rim_lip_${id}`, g.lip, lib.rim));
    g.spokes.forEach((s, i) => spin.add(mesh(`rim_spoke_${id}_${i}`, s, lib.rim)));
    spin.add(mesh(`rim_hub_${id}`, g.hub, lib.rim));
    spin.add(mesh(`rim_cap_${id}`, g.cap, [lib.chrome, lib.emblem, lib.chrome]));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + Math.PI / 5;
      const l = mesh(`lug_${id}_${i}`, g.lug, lib.chrome, { cast: false });
      l.position.set(W - 0.003, Math.cos(a) * 0.05, Math.sin(a) * 0.05);
      spin.add(l);
    }
    spin.add(mesh(`disc_${id}`, g.disc, lib.disc));
    spin.add(mesh(`disc_hat_${id}`, g.discHat, lib.engineMetal, { cast: false }));

    // The caliper is fixed to the upright – it must NOT spin with the wheel.
    const caliper = group(`caliper_${id}`);
    const body = mesh(`caliper_body_${id}`, g.caliper, lib.caliper);
    const bridge = mesh(`caliper_bridge_${id}`, g.caliperBridge, lib.caliper);
    const br = axle.disc + 0.015;
    bridge.position.set(-0.01, br * Math.sin(0.55), -br * Math.cos(0.55));
    bridge.rotation.x = -Math.PI / 3;
    caliper.add(body, bridge);
    caliper.rotation.x = axle === DIM.front ? 0 : (Math.PI * 2) / 3;

    const corner = group(`corner_${id}`, spin, caliper);
    corner.position.set(sx * axle.track, axle.radius, axle.z);
    // Mirror left wheels so the dished face always points outward.
    if (sx < 0) corner.scale.x = -1;
    root.add(corner);
  }
  return root;
}
