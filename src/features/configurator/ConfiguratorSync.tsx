"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { useShowroom } from "@/store/useShowroomStore";
import { carMotion, carRegistry } from "@/features/car/rig/carRegistry";
import { applyConfiguration, applyGlassQuality, applyLights } from "@/features/car/rig/applyConfiguration";

const WHEEL_SPEED = 9; // rad/s ≈ 12 km/h roll

/**
 * Bridges UI state → 3D materials. Lives inside the Canvas, renders nothing,
 * and never causes React re-renders: it subscribes to the store directly and
 * drives GSAP tweens on the registry's shared materials.
 */
export function ConfiguratorSync() {
  useEffect(() => {
    const unsubs = [
      useShowroom.subscribe(
        (s) => s.configuration,
        (cfg) => applyConfiguration(carRegistry.all, cfg),
      ),
      useShowroom.subscribe(
        (s) => [s.lightsOn, s.ambientOn] as const,
        ([lightsOn, ambientOn]) => applyLights(carRegistry.all, { lightsOn, ambientOn }),
        { equalityFn: (a, b) => a[0] === b[0] && a[1] === b[1] },
      ),
      useShowroom.subscribe(
        (s) => s.quality,
        (q) => applyGlassQuality(carRegistry.all, q),
      ),
      useShowroom.subscribe(
        (s) => s.wheelsSpinning,
        (spin) =>
          gsap.to(carMotion, {
            wheelSpeed: spin ? WHEEL_SPEED : 0,
            duration: spin ? 2.4 : 3.2,
            ease: spin ? "power2.in" : "power3.out",
            overwrite: true,
          }),
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  return null;
}
