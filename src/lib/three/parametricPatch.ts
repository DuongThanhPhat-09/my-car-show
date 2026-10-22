import * as THREE from "three";

export type SurfaceFn = (u: number, v: number, out: THREE.Vector3) => THREE.Vector3;

export interface PatchOptions {
  /** Interior reference point used to orient normals outward. */
  center?: (u: number, v: number, out: THREE.Vector3) => THREE.Vector3;
  /** Pushes the surface along its normal (metres). Negative = inward. */
  offset?: number;
  /** UV scale, defaults to raw parameter values (metres / radians). */
  uvScale?: [number, number];
  flipNormals?: boolean;
}

const tmpP = new THREE.Vector3();
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpC = new THREE.Vector3();
const tmpD = new THREE.Vector3();
const tmpN = new THREE.Vector3();
const tmpCenter = new THREE.Vector3();

/**
 * Samples a parametric surface over [u0,u1]×[v0,v1] into an indexed BufferGeometry.
 *
 * Normals are computed analytically from central differences of the surface
 * function itself (not from the triangulation). Adjacent patches cut from the same
 * surface therefore share identical normals along their seam – panels such as the
 * hood and the fenders shade as one continuous piece of sheet metal, exactly like a
 * real car, while remaining separately animatable meshes.
 */
export function parametricPatch(
  fn: SurfaceFn,
  [u0, u1]: [number, number],
  [v0, v1]: [number, number],
  segU: number,
  segV: number,
  opts: PatchOptions = {},
) {
  const verts = (segU + 1) * (segV + 1);
  const positions = new Float32Array(verts * 3);
  const normals = new Float32Array(verts * 3);
  const uvs = new Float32Array(verts * 2);
  const [su, sv] = opts.uvScale ?? [1, 1];
  const eu = Math.max(1e-4, Math.abs(u1 - u0) * 1e-3);
  const ev = Math.max(1e-4, Math.abs(v1 - v0) * 1e-3);

  let k = 0;
  for (let i = 0; i <= segU; i++) {
    const u = u0 + ((u1 - u0) * i) / segU;
    for (let j = 0; j <= segV; j++) {
      const v = v0 + ((v1 - v0) * j) / segV;
      fn(u, v, tmpP);
      fn(u + eu, v, tmpA).sub(fn(u - eu, v, tmpB));
      fn(u, v + ev, tmpC).sub(fn(u, v - ev, tmpD));
      tmpN.crossVectors(tmpA, tmpC);

      if (opts.center) {
        opts.center(u, v, tmpCenter);
        const outward = tmpCenter.subVectors(tmpP, tmpCenter);
        if (tmpN.lengthSq() < 1e-14) tmpN.copy(outward);
        if (tmpN.dot(outward) < 0) tmpN.negate();
      }
      if (opts.flipNormals) tmpN.negate();
      tmpN.normalize();

      if (opts.offset) tmpP.addScaledVector(tmpN, opts.offset);

      positions.set([tmpP.x, tmpP.y, tmpP.z], k * 3);
      normals.set([tmpN.x, tmpN.y, tmpN.z], k * 3);
      uvs.set([u * su, v * sv], k * 2);
      k++;
    }
  }

  const index: number[] = [];
  const row = segV + 1;
  for (let i = 0; i < segU; i++) {
    for (let j = 0; j < segV; j++) {
      const a = i * row + j;
      const b = (i + 1) * row + j;
      const c = (i + 1) * row + j + 1;
      const d = i * row + j + 1;
      index.push(a, b, d, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(index);

  // Make triangle winding agree with the analytic normals so FrontSide works.
  // Vote over a sample of triangles – single triangles can be degenerate at poles.
  const p = geo.attributes.position as THREE.BufferAttribute;
  const n = geo.attributes.normal as THREE.BufferAttribute;
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();
  const vn = new THREE.Vector3();
  const face = new THREE.Vector3();
  let vote = 0;
  const stride = Math.max(3, Math.floor(index.length / 3 / 64) * 3);
  for (let t = 0; t < index.length; t += stride) {
    va.fromBufferAttribute(p, index[t]);
    vb.fromBufferAttribute(p, index[t + 1]).sub(va);
    vc.fromBufferAttribute(p, index[t + 2]).sub(va);
    face.crossVectors(vb, vc);
    vn.fromBufferAttribute(n, index[t]);
    vote += face.dot(vn);
  }
  if (vote < 0) {
    const idx = geo.index!.array as Uint16Array | Uint32Array;
    for (let t = 0; t < idx.length; t += 3) {
      const tmp = idx[t + 1];
      idx[t + 1] = idx[t + 2];
      idx[t + 2] = tmp;
    }
  }

  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

/** Samples a curve that lies on a surface, offset outward along the surface normal. */
export function curveOnSurface(
  fn: SurfaceFn,
  center: NonNullable<PatchOptions["center"]>,
  samples: Array<[number, number]>,
  offset: number,
) {
  const pts = samples.map(([u, v]) => {
    const p = fn(u, v, new THREE.Vector3());
    const c = center(u, v, new THREE.Vector3());
    return p.addScaledVector(p.clone().sub(c).normalize(), offset);
  });
  return new THREE.CatmullRomCurve3(pts, false, "centripetal");
}
