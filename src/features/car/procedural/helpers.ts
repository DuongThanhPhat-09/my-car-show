import * as THREE from "three";
import type { SurfaceFn } from "@/lib/three/parametricPatch";

export type Detail = "high" | "low";

export interface BuildContext {
  detail: Detail;
  /** Samples per metre along Z and per radian around the section. */
  zDensity: number;
  aDensity: number;
}

export function createContext(detail: Detail): BuildContext {
  return detail === "high"
    ? { detail, zDensity: 72, aDensity: 44 }
    : { detail, zDensity: 26, aDensity: 12 };
}

export function segs(ctx: BuildContext, [u0, u1]: [number, number], [v0, v1]: [number, number]) {
  return [
    Math.max(2, Math.ceil(Math.abs(u1 - u0) * ctx.zDensity)),
    Math.max(2, Math.ceil(Math.abs(v1 - v0) * ctx.aDensity)),
  ] as const;
}

export function mesh(
  name: string,
  geometry: THREE.BufferGeometry,
  material: THREE.Material | THREE.Material[],
  opts: { cast?: boolean; receive?: boolean; carbon?: boolean } = {},
) {
  const m = new THREE.Mesh(geometry, material);
  m.name = name;
  m.castShadow = opts.cast ?? true;
  m.receiveShadow = opts.receive ?? true;
  if (opts.carbon) m.userData.carbonCandidate = true;
  return m;
}

export function group(name: string, ...children: THREE.Object3D[]) {
  const g = new THREE.Group();
  g.name = name;
  if (children.length) g.add(...children);
  return g;
}

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _d = new THREE.Vector3();

/** Position + outward normal + tangent (∂/∂u) of a surface at (u, v). */
export function surfaceFrame(
  fn: SurfaceFn,
  center: (u: number, v: number, out: THREE.Vector3) => THREE.Vector3,
  u: number,
  v: number,
) {
  const e = 1e-4;
  const p = fn(u, v, new THREE.Vector3());
  const du = fn(u + e, v, _a).sub(fn(u - e, v, _b)).normalize();
  const dv = fn(u, v + e, _c).sub(fn(u, v - e, _d)).normalize();
  const n = new THREE.Vector3().crossVectors(du, dv).normalize();
  const out = p.clone().sub(center(u, v, new THREE.Vector3()));
  if (n.dot(out) < 0) n.negate();
  return { p, n, tangent: du.clone() };
}

/** Orients an object so its local +Z follows `normal` and local +X follows `along`. */
export function placeOnSurface(
  obj: THREE.Object3D,
  p: THREE.Vector3,
  normal: THREE.Vector3,
  along: THREE.Vector3,
  lift = 0,
) {
  const z = normal.clone().normalize();
  const x = along.clone().addScaledVector(z, -along.dot(z)).normalize();
  const y = new THREE.Vector3().crossVectors(z, x);
  obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  obj.position.copy(p).addScaledVector(z, lift);
  return obj;
}

/** Triangle strip between two equally sampled polylines (door shut faces etc.). */
export function ribbon(a: THREE.Vector3[], b: THREE.Vector3[]) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  for (let i = 0; i < a.length; i++) {
    positions.push(a[i].x, a[i].y, a[i].z, b[i].x, b[i].y, b[i].z);
    const t = i / (a.length - 1);
    uvs.push(t, 0, t, 1);
    if (i < a.length - 1) {
      const k = i * 2;
      index.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

/** Tapered, dished and twisted wheel spoke built from a remapped box. */
export function spokeGeometry(angle: number, twist: number, detail: Detail, outerRadius = 0.246) {
  const geo = new THREE.BoxGeometry(1, 1, 1, 1, detail === "high" ? 10 : 3, 1);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const bx = pos.getX(i);
    const by = pos.getY(i);
    const bz = pos.getZ(i);
    const t = by + 0.5;
    const r = THREE.MathUtils.lerp(0.072, outerRadius, t);
    const width = THREE.MathUtils.lerp(0.036, 0.02, t);
    const depth = THREE.MathUtils.lerp(0.04, 0.022, t);
    const dish = THREE.MathUtils.lerp(0.098, 0.072, Math.pow(t, 0.8));
    const a = angle + twist * t;
    const tang = bz * width;
    pos.setXYZ(
      i,
      dish + bx * depth,
      r * Math.cos(a) - tang * Math.sin(a),
      r * Math.sin(a) + tang * Math.cos(a),
    );
  }
  geo.computeVertexNormals();
  return geo;
}
