import * as THREE from "three";
import type { PartId } from "@/store/useShowroomStore";
import type { CarRigConfig, HingeConfig } from "../types";

export interface HingeRig {
  pivot: THREE.Group;
  config: HingeConfig;
  /** Closed-position height, the base for `lift`. */
  restY: number;
}

export interface CarRig {
  hinges: Partial<Record<PartId, HingeRig>>;
  wheels: THREE.Group[];
}

/**
 * Re-parents animatable parts under pivot groups placed at their real hinge
 * points, preserving world transforms (`attach`). Works for any GLB as long as
 * node names and pivots in car.config.ts match the asset.
 */
export function buildRig(root: THREE.Object3D, config: CarRigConfig): CarRig {
  root.updateMatrixWorld(true);
  const rig: CarRig = { hinges: {}, wheels: [] };

  const find = (names: string[]) =>
    names.map((n) => root.getObjectByName(n)).filter((o): o is THREE.Object3D => !!o);

  for (const [part, cfg] of Object.entries(config.hinges) as Array<[PartId, HingeConfig]>) {
    const nodes = find(cfg.nodes);
    if (!nodes.length) {
      if (process.env.NODE_ENV !== "production") console.warn(`[rig] no nodes for ${part}:`, cfg.nodes);
      continue;
    }
    const pivot = new THREE.Group();
    pivot.name = `pivot_${part}`;
    pivot.position.fromArray(cfg.pivot);
    root.add(pivot);
    pivot.updateMatrixWorld(true);
    nodes.forEach((n) => pivot.attach(n));
    rig.hinges[part] = { pivot, config: cfg, restY: pivot.position.y };
  }

  const box = new THREE.Box3();
  const centerWorld = new THREE.Vector3();
  for (const names of config.wheels) {
    const nodes = find(names);
    if (!nodes.length) continue;
    box.makeEmpty();
    nodes.forEach((n) => box.expandByObject(n));
    box.getCenter(centerWorld);
    const pivot = new THREE.Group();
    pivot.name = `pivot_${names[0]}`;
    pivot.position.copy(root.worldToLocal(centerWorld.clone()));
    root.add(pivot);
    pivot.updateMatrixWorld(true);
    nodes.forEach((n) => pivot.attach(n));
    rig.wheels.push(pivot);
  }

  return rig;
}
