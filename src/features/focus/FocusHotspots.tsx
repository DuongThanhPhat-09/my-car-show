"use client";

import { useRef } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useShowroom } from "@/store/useShowroomStore";
import { FOCUS_POINTS } from "@/features/car/config/car.config";
import { useFocusActions } from "./useFocusActions";

const tmp = new THREE.Vector3();
const toCam = new THREE.Vector3();

/**
 * Hotspots anchored to the car. Visibility is computed per frame from the
 * surface normal vs. view direction (cheap back-face culling, no raycasts) and
 * written straight to the DOM – zero React re-renders while orbiting.
 */
export function FocusHotspots() {
  const { focus } = useFocusActions();
  const els = useRef<Record<string, HTMLButtonElement | null>>({});

  // Every hotspot stays mounted; mode filtering happens per frame. drei's <Html>
  // owns DOM nodes outside React, so mounting/unmounting them on every mode
  // switch is both wasteful and fragile.
  useFrame(({ camera }) => {
    const { phase, mode, activeFocus, isFlying } = useShowroom.getState();
    for (const fp of FOCUS_POINTS) {
      const el = els.current[fp.id];
      if (!el) continue;
      tmp.fromArray(fp.anchor);
      toCam.copy(camera.position).sub(tmp);
      const dist = toCam.length();
      const facing = toCam.normalize().dot(tmp.fromArray(fp.normal).normalize());
      const visible =
        phase === "ready" &&
        !isFlying &&
        (fp.hotspotMode ?? fp.mode) === mode &&
        activeFocus !== fp.id &&
        facing > 0.05 &&
        dist > 0.25 &&
        dist < 14;
      const opacity = visible ? Math.min(1, (facing - 0.05) * 4) : 0;
      el.style.opacity = opacity.toFixed(3);
      el.style.pointerEvents = opacity > 0.3 ? "auto" : "none";
      el.style.transform = `scale(${0.85 + opacity * 0.15})`;
    }
  });

  return (
    <>
      {FOCUS_POINTS.map((fp) => (
        <Html key={fp.id} position={fp.anchor} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
          <button
            ref={(el) => {
              els.current[fp.id] = el;
            }}
            type="button"
            onClick={() => focus(fp.id)}
            aria-label={`Explore ${fp.title}`}
            className="hotspot group"
            style={{ opacity: 0 }}
          >
            <span className="hotspot-ring" />
            <span className="hotspot-dot" />
            <span className="hotspot-label">{fp.label}</span>
          </button>
        </Html>
      ))}
    </>
  );
}
