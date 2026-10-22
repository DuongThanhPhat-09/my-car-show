"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { useShowroom } from "@/store/useShowroomStore";
import { AMBIENTS, findOption } from "@/features/configurator/options";
import { RIG } from "../config/car.config";

const BEAM_INTENSITY = 42;

/**
 * Real light emitted by the car: headlight beams that wash the showroom floor
 * and a cabin fill tinted by the ambient-light selection (sells the interior
 * "glow" far better than emissive strips alone).
 */
export function CarLights() {
  const quality = useShowroom((s) => s.quality);
  const beams = useRef<Array<THREE.SpotLight | null>>([]);
  const cabin = useRef<THREE.PointLight>(null);
  const dome = useRef<THREE.PointLight>(null);
  const targets = useMemo(
    () =>
      (RIG.headlightBeams ?? []).map(([x, , z]) => {
        const t = new THREE.Object3D();
        t.position.set(x * 1.4, 0, z + 6);
        return t;
      }),
    [],
  );

  useEffect(() => {
    const sync = (instant: boolean) => {
      const s = useShowroom.getState();
      const d = instant ? 0 : 1.1;
      beams.current.forEach((b) => b && gsap.to(b, { intensity: s.lightsOn ? BEAM_INTENSITY : 0, duration: d, overwrite: true }));
      if (cabin.current) {
        const color = new THREE.Color(findOption(AMBIENTS, s.configuration.ambientId).color);
        gsap.to(cabin.current.color, { r: color.r, g: color.g, b: color.b, duration: d, overwrite: true });
        gsap.to(cabin.current, {
          // Cabin-only: in exterior views it would leak through the open floor onto the turntable.
          intensity: s.ambientOn && s.mode === "interior" ? 0.45 : 0,
          duration: d,
          overwrite: true,
        });
      }
      if (dome.current) {
        gsap.to(dome.current, { intensity: s.mode === "interior" ? 1.6 : 0, duration: d * 1.5, overwrite: true });
      }
    };
    sync(true);
    return useShowroom.subscribe(
      (s) => [s.lightsOn, s.ambientOn, s.mode, s.configuration.ambientId] as const,
      () => sync(false),
      { equalityFn: (a, b) => a.every((v, i) => v === b[i]) },
    );
  }, []);

  return (
    <group>
      {quality !== "low" &&
        (RIG.headlightBeams ?? []).map((p, i) => (
          <group key={i}>
            <primitive object={targets[i]} />
            <spotLight
              ref={(el) => {
                beams.current[i] = el;
              }}
              position={p}
              target={targets[i]}
              angle={0.42}
              penumbra={0.85}
              distance={14}
              decay={1.6}
              color="#eef4ff"
            />
          </group>
        ))}
      {/* Low footwell position: washes the carpet and lower trim, no glints on seat backs. */}
      <pointLight ref={cabin} position={[0, 0.55, 0.1]} distance={1.6} decay={2} />
      <pointLight ref={dome} position={[0, 1.0, -0.2]} distance={2.2} decay={2} color="#fff3e2" />
    </group>
  );
}
