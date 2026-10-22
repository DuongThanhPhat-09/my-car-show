import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { MaterialLibrary } from "../materials/materialLibrary";
import { group, mesh, type BuildContext } from "./helpers";

function rbox(ctx: BuildContext, w: number, h: number, d: number, r: number) {
  return new RoundedBoxGeometry(w, h, d, ctx.detail === "high" ? 4 : 1, Math.min(r, w / 2, h / 2, d / 2) * 0.999);
}

/** Sculpted sport seat: bolstered cushion + backrest with quilted leather inserts. */
function buildSeat(ctx: BuildContext, lib: MaterialLibrary, name: string) {
  const seat = group(name);
  const base = mesh(`${name}_base`, rbox(ctx, 0.36, 0.1, 0.42, 0.03), lib.plastic);
  base.position.set(0, 0.31, 0);

  const cushion = mesh(`${name}_cushion`, rbox(ctx, 0.5, 0.11, 0.5, 0.045), lib.leather);
  cushion.position.set(0, 0.41, 0.01);
  const cushionInsert = mesh(`${name}_cushion_insert`, rbox(ctx, 0.28, 0.03, 0.42, 0.012), lib.leatherQuilted);
  cushionInsert.position.set(0, 0.468, 0.02);

  const back = group(`${name}_back`);
  back.position.set(0, 0.45, -0.23);
  back.rotation.x = -0.24; // recline
  const shell = mesh(`${name}_backrest`, rbox(ctx, 0.52, 0.68, 0.12, 0.05), lib.leather);
  shell.position.y = 0.34;
  const backInsert = mesh(`${name}_back_insert`, rbox(ctx, 0.3, 0.46, 0.03, 0.012), lib.leatherQuilted);
  backInsert.position.set(0, 0.3, 0.062);
  const head = mesh(`${name}_headrest`, rbox(ctx, 0.3, 0.17, 0.11, 0.05), lib.leather);
  head.position.set(0, 0.72, 0.01);
  back.add(shell, backInsert, head);

  for (const sx of [1, -1]) {
    const bolster = mesh(`${name}_bolster`, rbox(ctx, 0.08, 0.1, 0.46, 0.04), lib.leather);
    bolster.position.set(sx * 0.215, 0.47, 0.0);
    bolster.rotation.z = sx * 0.25;
    const backBolster = mesh(`${name}_back_bolster`, rbox(ctx, 0.08, 0.5, 0.12, 0.04), lib.leather);
    backBolster.position.set(sx * 0.22, 0.3, 0.05);
    backBolster.rotation.y = -sx * 0.35;
    back.add(backBolster);
    seat.add(bolster);
  }
  seat.add(base, cushion, cushionInsert, back);
  return seat;
}

function buildSteeringWheel(ctx: BuildContext, lib: MaterialLibrary) {
  const high = ctx.detail === "high";
  const wheel = group("steering");
  const rim = mesh("steering_rim", new THREE.TorusGeometry(0.17, 0.018, high ? 20 : 8, high ? 96 : 32), lib.leather);
  const hub = mesh("steering_hub", new THREE.CylinderGeometry(0.058, 0.064, 0.05, 48).rotateX(Math.PI / 2), lib.trimBlack);
  hub.position.z = -0.015;
  const badge = mesh(
    "steering_badge",
    new THREE.CylinderGeometry(0.022, 0.022, 0.004, 40).rotateX(-Math.PI / 2),
    [lib.chrome, lib.emblem, lib.chrome],
  );
  badge.position.z = -0.042;
  wheel.add(rim, hub, badge);

  for (const a of [0, Math.PI, -Math.PI / 2]) {
    const spoke = mesh("steering_spoke", rbox(ctx, 0.12, 0.034, 0.016, 0.008), lib.darkChrome);
    spoke.position.set(Math.cos(a) * 0.105, Math.sin(a) * 0.105, -0.01);
    spoke.rotation.z = a;
    wheel.add(spoke);
  }
  // Shift paddles
  for (const sx of [1, -1]) {
    const paddle = mesh("paddle", rbox(ctx, 0.05, 0.09, 0.006, 0.003), lib.carbon);
    paddle.position.set(sx * 0.13, 0.05, 0.03);
    wheel.add(paddle);
  }
  const column = mesh("steering_column", new THREE.CylinderGeometry(0.035, 0.05, 0.28, 24).rotateX(Math.PI / 2), lib.plastic);
  column.position.z = 0.15;
  wheel.add(column);

  wheel.position.set(0.3, 0.82, 0.42);
  wheel.rotation.x = 0.36;
  return wheel;
}

/** Supercar seating: the whole cockpit package sits low, close to the floor pan. */
export const CABIN_LIFT = -0.13;
const SEAT_SCALE = 0.93;

export function buildInterior(ctx: BuildContext, lib: MaterialLibrary) {
  const interior = group("interior");

  const floor = mesh("cabin_floor", rbox(ctx, 1.4, 0.08, 1.5, 0.03), lib.carpet, { cast: false });
  floor.position.set(0, 0.26, 0.18);
  interior.add(floor);

  /* Dashboard: wing-shaped leather upper, Alcantara lower, ambient blade. */
  const dashboard = group("dashboard");
  const dashTop = mesh("dash_top", rbox(ctx, 1.5, 0.15, 0.4, 0.06), lib.leather);
  dashTop.position.set(0, 0.76, 0.82);
  const dashLow = mesh("dash_low", rbox(ctx, 1.44, 0.24, 0.26, 0.05), lib.alcantara);
  dashLow.position.set(0, 0.56, 0.86);
  const dashTrim = mesh("carbon_dash_trim", rbox(ctx, 1.42, 0.035, 0.03, 0.012), lib.trimBlack, { carbon: true });
  dashTrim.position.set(0, 0.68, 0.625);
  const ambient = mesh("dash_ambient", rbox(ctx, 1.38, 0.006, 0.006, 0.002), lib.ambientLed, { cast: false, receive: false });
  ambient.position.set(0, 0.657, 0.628);
  dashboard.add(dashTop, dashLow, dashTrim, ambient);

  // Hexagonal air vents – the hexagon is Lamborghini's recurring motif.
  const ventGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 6).rotateX(Math.PI / 2);
  for (const x of [-0.6, -0.1, 0.1, 0.6]) {
    const vent = mesh("vent", ventGeo, lib.darkChrome, { cast: false });
    vent.position.set(x, 0.72, 0.63);
    dashboard.add(vent);
  }
  interior.add(dashboard);

  /* Centre display (set low in the centre stack) + TFT driver cluster */
  const screen = group("screen");
  const bezel = mesh("screen_bezel", rbox(ctx, 0.23, 0.13, 0.018, 0.012), lib.trimBlack);
  const panel = mesh("screen_panel", new THREE.PlaneGeometry(0.21, 0.115), lib.screen, { cast: false });
  panel.position.z = -0.0095;
  panel.rotation.y = Math.PI;
  screen.add(bezel, panel);
  screen.position.set(0, 0.6, 0.66);
  screen.rotation.x = 0.45;
  interior.add(screen);

  const cluster = group("cluster");
  const clusterBezel = mesh("cluster_bezel", rbox(ctx, 0.31, 0.13, 0.02, 0.012), lib.trimBlack);
  const clusterPanel = mesh("cluster_panel", new THREE.PlaneGeometry(0.29, 0.11), lib.screen, { cast: false });
  clusterPanel.position.z = -0.0105;
  clusterPanel.rotation.y = Math.PI;
  // Cowl hood over the TFT cluster.
  const binnacle = mesh("cluster_hood", rbox(ctx, 0.36, 0.03, 0.14, 0.012), lib.alcantara);
  binnacle.position.set(0, 0.075, 0.05);
  cluster.add(clusterBezel, clusterPanel, binnacle);
  cluster.position.set(0.3, 0.87, 0.66);
  cluster.rotation.x = 0.25;
  interior.add(cluster);

  interior.add(buildSteeringWheel(ctx, lib));

  /* Two sport seats with Q-Citura diamond quilting */
  for (const [name, x] of [
    ["seat_fl", -0.3],
    ["seat_fr", 0.3],
  ] as const) {
    const seat = buildSeat(ctx, lib, name);
    seat.position.set(x, 0, 0.08);
    seat.scale.setScalar(SEAT_SCALE);
    interior.add(seat);
  }

  /* Centre tunnel with the start button under its red flip cover */
  const console = group("console");
  const tunnel = mesh("console_tunnel", rbox(ctx, 0.25, 0.22, 1.1, 0.05), lib.leather);
  tunnel.position.set(0, 0.4, 0.1);
  const consoleTop = mesh("carbon_console", rbox(ctx, 0.21, 0.014, 0.9, 0.006), lib.trimBlack, { carbon: true });
  consoleTop.position.set(0, 0.515, 0.12);
  const startBase = mesh("start_button", new THREE.CylinderGeometry(0.018, 0.018, 0.012, 24), lib.chrome);
  startBase.position.set(0, 0.528, 0.5);
  const flip = mesh("start_flip_cover", rbox(ctx, 0.05, 0.008, 0.05, 0.003), new THREE.MeshPhysicalMaterial({
    color: "#c4121c",
    roughness: 0.3,
    clearcoat: 1,
  }));
  flip.position.set(0, 0.55, 0.52);
  flip.rotation.x = -0.9;
  const selector = mesh("selector", rbox(ctx, 0.04, 0.02, 0.06, 0.008), lib.chrome);
  selector.position.set(0, 0.53, 0.32);
  console.add(tunnel, consoleTop, startBase, flip, selector);
  interior.add(console);

  interior.position.y = CABIN_LIFT;
  return interior;
}
