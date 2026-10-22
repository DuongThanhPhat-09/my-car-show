"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import type * as THREE from "three";
import { useShowroom, type PartId } from "@/store/useShowroomStore";
import { FOCUS_POINTS, RIG } from "../config/car.config";
import { getMaterialLibrary } from "../materials/materialLibrary";
import { buildRig, type CarRig } from "../rig/buildRig";
import { resolveHandles } from "../rig/resolveHandles";
import { carMotion, carRegistry, type CarHandles } from "../rig/carRegistry";
import { applyConfiguration, applyGlassQuality, applyLights } from "../rig/applyConfiguration";

const HIGHLIGHT_NODES = [...new Set(FOCUS_POINTS.flatMap((f) => f.highlight)), RIG.interiorNode ?? "interior"];

interface Prepared {
  rig: CarRig;
  handles: CarHandles;
}

/** Rigging mutates the hierarchy – cache per object so StrictMode re-runs are idempotent. */
function prepare(object: THREE.Object3D, forceShadows: boolean): Prepared {
  if (!object.userData.__prepared) {
    const rig = buildRig(object, RIG);
    const handles = resolveHandles(object, RIG.slots, getMaterialLibrary(), HIGHLIGHT_NODES, forceShadows);
    object.userData.__prepared = { rig, handles } satisfies Prepared;
  }
  return object.userData.__prepared as Prepared;
}

function useHingeAnimations(rig: CarRig) {
  useEffect(() => {
    const apply = (parts: Record<PartId, boolean>, instant: boolean) => {
      for (const [part, hinge] of Object.entries(rig.hinges)) {
        if (!hinge) continue;
        const open = parts[part as PartId];
        const value = open ? hinge.config.angle : 0;
        const y = hinge.restY + (open ? (hinge.config.lift ?? 0) : 0);
        if (instant) {
          hinge.pivot.rotation[hinge.config.axis] = value;
          hinge.pivot.position.y = y;
          continue;
        }
        if (hinge.config.lift) {
          gsap.to(hinge.pivot.position, { y, duration: hinge.config.duration ?? 1.45, ease: "power3.inOut", overwrite: true });
        }
        gsap.to(hinge.pivot.rotation, {
          [hinge.config.axis]: value,
          duration: hinge.config.duration ?? 1.45,
          // Opening eases out like a gas strut; closing accelerates into a soft latch.
          ease: open ? "power3.inOut" : "power2.in",
          overwrite: true,
        });
      }
    };
    apply(useShowroom.getState().parts, true);
    return useShowroom.subscribe((s) => s.parts, (parts) => apply(parts, false));
  }, [rig]);
}

/**
 * One level of the car (a GLB LOD or a procedural detail level): attaches the
 * rig, registers its material handles and drives hinge / wheel animation.
 */
export function CarAssembly({ object, forceShadows = false }: { object: THREE.Object3D; forceShadows?: boolean }) {
  const { rig, handles } = useMemo(() => prepare(object, forceShadows), [object, forceShadows]);

  useEffect(() => {
    const s = useShowroom.getState();
    applyConfiguration(handles, s.configuration, 0);
    applyLights(handles, s, 0);
    applyGlassQuality(handles, s.quality);
    return carRegistry.add(handles);
  }, [handles]);

  useHingeAnimations(rig);

  useFrame((_, delta) => {
    if (carMotion.wheelSpeed === 0) return;
    const step = carMotion.wheelSpeed * Math.min(delta, 0.05);
    for (const w of rig.wheels) w.rotation.x += step;
  });

  return <primitive object={object} />;
}
