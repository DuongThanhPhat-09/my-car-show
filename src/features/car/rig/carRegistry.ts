import type * as THREE from "three";
import type { PaintMaterial } from "../materials/paintMaterial";

/**
 * Live handles to everything the configurator, animations and focus system
 * control. One registry is shared by every LOD level of the car, so a single
 * tween updates the materials of all levels at once.
 */
export interface CarHandles {
  paint: Set<PaintMaterial>;
  caliper: Set<THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial>;
  rim: Set<THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial>;
  leather: Set<THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial>;
  headlight: Set<THREE.MeshStandardMaterial>;
  taillight: Set<THREE.MeshStandardMaterial>;
  ambient: Set<THREE.MeshStandardMaterial>;
  glass: Map<THREE.Mesh, THREE.Material | THREE.Material[]>;
  carbon: Map<THREE.Mesh, THREE.Material | THREE.Material[]>;
  /** Node name → objects (one per LOD level). */
  nodes: Map<string, Set<THREE.Object3D>>;
}

export const createHandles = (): CarHandles => ({
  paint: new Set(),
  caliper: new Set(),
  rim: new Set(),
  leather: new Set(),
  headlight: new Set(),
  taillight: new Set(),
  ambient: new Set(),
  glass: new Map(),
  carbon: new Map(),
  nodes: new Map(),
});

type Listener = () => void;

class CarRegistry {
  readonly all = createHandles();
  private listeners = new Set<Listener>();

  add(h: CarHandles) {
    for (const key of ["paint", "caliper", "rim", "leather", "headlight", "taillight", "ambient"] as const) {
      (h[key] as Set<unknown>).forEach((m) => (this.all[key] as Set<unknown>).add(m));
    }
    h.glass.forEach((v, k) => this.all.glass.set(k, v));
    h.carbon.forEach((v, k) => this.all.carbon.set(k, v));
    h.nodes.forEach((objs, name) => {
      const set = this.all.nodes.get(name) ?? new Set();
      objs.forEach((o) => set.add(o));
      this.all.nodes.set(name, set);
    });
    this.emit();
    return () => this.remove(h);
  }

  private remove(h: CarHandles) {
    for (const key of ["paint", "caliper", "rim", "leather", "headlight", "taillight", "ambient"] as const) {
      (h[key] as Set<unknown>).forEach((m) => (this.all[key] as Set<unknown>).delete(m));
    }
    h.glass.forEach((_, k) => this.all.glass.delete(k));
    h.carbon.forEach((_, k) => this.all.carbon.delete(k));
    h.nodes.forEach((objs, name) => objs.forEach((o) => this.all.nodes.get(name)?.delete(o)));
    this.emit();
  }

  /** All meshes below the given node names (across LOD levels). */
  meshesFor(names: string[]) {
    const out: THREE.Mesh[] = [];
    for (const name of names) {
      this.all.nodes.get(name)?.forEach((node) =>
        node.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) out.push(o as THREE.Mesh);
        }),
      );
    }
    return out;
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }
}

export const carRegistry = new CarRegistry();

/** Runtime motion values shared by all LOD levels (tweened by GSAP). */
export const carMotion = {
  wheelSpeed: 0,
};
