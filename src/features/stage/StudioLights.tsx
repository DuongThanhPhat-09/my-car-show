"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { SoftShadows } from "@react-three/drei";
import { useShowroom } from "@/store/useShowroomStore";

const CATCHER_OPACITY = 0.6;

/**
 * Studio lighting philosophy: the car is lit *only* by the image-based softbox
 * array (StudioEnvironment). Punctual lights reflected in a 0.02-roughness clear
 * coat become sub-pixel glints thousands of times brighter than the paint, which
 * bloom into hot spots – real car studios use huge diffusers for exactly this
 * reason.
 *
 * Shadows therefore come from a *shadow-only* key light (intensity 0 → no
 * shading, no speculars) projected onto a ShadowMaterial catcher, whose darkness
 * depends solely on the shadow map. On the high tier drei's PCSS turns that into
 * physically-plausible soft shadows with contact hardening.
 */
export function StudioLights() {
  const quality = useShowroom((s) => s.quality);
  const phase = useShowroom((s) => s.phase);
  const catcher = useRef<THREE.ShadowMaterial>(null);

  useEffect(() => {
    if (!catcher.current) return;
    if (phase === "loading") catcher.current.opacity = 0;
    else if (phase === "intro")
      gsap.to(catcher.current, { opacity: CATCHER_OPACITY, duration: 2.6, ease: "power2.inOut", delay: 0.6 });
  }, [phase]);

  if (quality === "low") return null;
  const shadowSize = quality === "high" ? 2048 : 1024;

  return (
    <>
      {quality === "high" && <SoftShadows size={28} samples={16} focus={0.45} />}
      <directionalLight
        position={[1.8, 9, 2.6]}
        intensity={0}
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={3}
        shadow-camera-far={16}
      />
      <mesh rotation-x={-Math.PI / 2} position-y={0.007} receiveShadow renderOrder={1}>
        <circleGeometry args={[3.68, 96]} />
        <shadowMaterial ref={catcher} transparent opacity={0} color="#000000" depthWrite={false} />
      </mesh>
    </>
  );
}
