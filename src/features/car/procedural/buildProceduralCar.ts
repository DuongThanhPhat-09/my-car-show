import * as THREE from "three";
import type { MaterialLibrary } from "../materials/materialLibrary";
import { buildBody } from "./buildBody";
import { buildDetails } from "./buildDetails";
import { buildInterior } from "./buildInterior";
import { buildWheels } from "./buildWheels";
import { createContext, type Detail } from "./helpers";

/**
 * Builds the procedural fallback car as a plain Object3D hierarchy whose node
 * names follow the same contract as a production GLB (see car.config.ts). The
 * runtime rig, configurator and focus system therefore treat both identically.
 */
export function buildProceduralCar(lib: MaterialLibrary, detail: Detail): THREE.Group {
  const ctx = createContext(detail);
  const root = new THREE.Group();
  root.name = "lamborghini_aventador";

  const body = buildBody(ctx, lib);
  const details = buildDetails(ctx, lib);
  root.add(body, buildWheels(ctx, lib), ...details.fixed);

  // Mirrors ride on the front doors.
  body.getObjectByName("door_r")!.add(details.mirrors.r);
  body.getObjectByName("door_l")!.add(details.mirrors.l);

  // The low LOD is only seen from afar – skip the cabin entirely.
  if (detail === "high") root.add(buildInterior(ctx, lib));

  root.updateMatrixWorld(true);
  return root;
}
