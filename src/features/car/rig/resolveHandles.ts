import * as THREE from "three";
import type { MaterialLibrary } from "../materials/materialLibrary";
import type { MaterialSlots } from "../types";
import { createHandles, type CarHandles } from "./carRegistry";

type AnyStd = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;

const compile = (sources: string[]) => sources.map((s) => new RegExp(s, "i"));

/**
 * Walks a car hierarchy once and classifies meshes into configurable slots.
 *  - paint   → replaced with the shared multi-layer paint shader
 *  - carbon  → original material remembered, swapped when the pack toggles
 *  - others  → original materials are controlled (tinted / emissive) in place,
 *              which keeps AAA textures such as leather stitching intact.
 */
export function resolveHandles(
  root: THREE.Object3D,
  slots: MaterialSlots,
  lib: MaterialLibrary,
  nodeNames: string[],
  /** Imported assets rarely flag shadows – enable them for every opaque mesh. */
  forceShadows = false,
): CarHandles {
  const h = createHandles();
  const rx = Object.fromEntries(Object.entries(slots).map(([k, v]) => [k, compile(v)])) as Record<
    keyof MaterialSlots,
    RegExp[]
  >;
  const test = (key: keyof MaterialSlots, label: string) => rx[key].some((r) => r.test(label));

  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const primary = mats[0] as AnyStd;
    const label = `${mesh.name} ${primary?.name ?? ""}`;

    if (test("paint", label)) {
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(() => lib.paint) : lib.paint;
    }
    if (mesh.userData.carbonCandidate || test("carbon", label)) h.carbon.set(mesh, mesh.material);
    if (test("glass", label)) h.glass.set(mesh, mesh.material);

    const current = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as AnyStd[];
    for (const m of current) {
      if (!m || !("color" in m)) continue;
      const mLabel = `${mesh.name} ${m.name}`;
      if (m === (lib.paint as unknown)) h.paint.add(lib.paint);
      if (test("caliper", mLabel)) h.caliper.add(m);
      if (test("rim", mLabel)) h.rim.add(m);
      if (test("leather", mLabel)) h.leather.add(m);
      if (test("headlight", mLabel)) h.headlight.add(m as THREE.MeshStandardMaterial);
      if (test("taillight", mLabel)) h.taillight.add(m as THREE.MeshStandardMaterial);
      if (test("ambient", mLabel)) h.ambient.add(m as THREE.MeshStandardMaterial);
    }

    // AAA assets: honour every texture at the GPU's best anisotropic filtering.
    for (const m of current) {
      if (!m) continue;
      for (const key of ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "clearcoatNormalMap"] as const) {
        const tex = (m as unknown as Record<string, THREE.Texture | null>)[key];
        if (tex) tex.anisotropy = 16;
      }
    }
    if (forceShadows) {
      mesh.castShadow = !h.glass.has(mesh);
      mesh.receiveShadow = true;
    }
  });

  // Emissive slots on imported assets may ship with a black emissive colour.
  h.headlight.forEach((m) => {
    if (m.emissive.getHex() === 0) m.emissive.set("#e8f2ff");
    m.toneMapped = false;
  });
  h.taillight.forEach((m) => {
    if (m.emissive.getHex() === 0) m.emissive.set("#ff0a14");
    m.toneMapped = false;
  });
  h.ambient.forEach((m) => {
    m.toneMapped = false;
  });

  for (const name of nodeNames) {
    const node = root.getObjectByName(name);
    if (node) h.nodes.set(name, new Set([node]));
  }
  return h;
}
