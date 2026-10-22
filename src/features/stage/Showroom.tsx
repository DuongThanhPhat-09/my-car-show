"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ContactShadows, MeshReflectorMaterial } from "@react-three/drei";
import { useShowroom } from "@/store/useShowroomStore";
import { floorRoughnessTexture } from "@/lib/three/proceduralTextures";

const TURNTABLE_RADIUS = 3.7;

/**
 * Physical showroom set: polished turntable with planar reflections (the
 * accurate alternative to SSR for the dominant reflective surface), a matte
 * concrete floor that dissolves into fog and architectural light blades.
 */
export function Showroom() {
  const quality = useShowroom((s) => s.quality);
  const phase = useShowroom((s) => s.phase);
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const roughness = useMemo(() => floorRoughnessTexture(), []);
  const bladeMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#000", emissive: "#cfdcff", emissiveIntensity: 0, toneMapped: false }),
    [],
  );

  // Lights come up in sequence during the intro: turntable ring, then the wall blades.
  useEffect(() => {
    if (!ring.current) return;
    if (phase === "loading") {
      ring.current.emissiveIntensity = 0;
      bladeMaterial.emissiveIntensity = 0;
      return;
    }
    if (phase !== "intro") return;
    const tl = gsap.timeline();
    tl.to(ring.current, { emissiveIntensity: 2.6, duration: 1.6, ease: "power2.inOut" }, 0.6);
    tl.to(bladeMaterial, { emissiveIntensity: 0.85, duration: 2.4, ease: "power2.inOut" }, 1.0);
  }, [phase, bladeMaterial]);

  const bladeAngles = useMemo(() => Array.from({ length: 11 }, (_, i) => Math.PI * 0.62 + (i / 10) * Math.PI * 0.76), []);

  return (
    <group>
      {/* Outer floor */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={-0.002}>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color="#0b0b0d" roughness={0.72} metalness={0.15} roughnessMap={roughness} />
      </mesh>

      {/* Turntable – planar reflector on high/medium tiers */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.004}>
        <circleGeometry args={[TURNTABLE_RADIUS, 128]} />
        {quality === "low" ? (
          <meshStandardMaterial color="#0c0c0f" roughness={0.25} metalness={0.6} />
        ) : (
          <MeshReflectorMaterial
            resolution={quality === "high" ? 1024 : 512}
            blur={[420, 90]}
            mixBlur={0.85}
            mixStrength={3.2}
            mixContrast={1.1}
            mirror={0.55}
            depthScale={1.1}
            minDepthThreshold={0.35}
            maxDepthThreshold={1.35}
            depthToBlurRatioBias={0.25}
            roughness={0.62}
            roughnessMap={roughness}
            metalness={0.55}
            color="#0d0e11"
          />
        )}
      </mesh>
      {/* Turntable LED ring */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.006}>
        <ringGeometry args={[TURNTABLE_RADIUS, TURNTABLE_RADIUS + 0.018, 192]} />
        <meshStandardMaterial ref={ring} color="#000" emissive="#dfe8ff" emissiveIntensity={0} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.003}>
        <ringGeometry args={[TURNTABLE_RADIUS + 0.018, TURNTABLE_RADIUS + 0.09, 192]} />
        <meshStandardMaterial color="#050506" roughness={0.4} metalness={0.8} />
      </mesh>

      <ContactShadows
        position={[0, 0.008, 0]}
        scale={[6.5, 8]}
        resolution={quality === "high" ? 1024 : 512}
        blur={2.6}
        opacity={0.92}
        far={1.4}
        color="#000000"
        frames={quality === "low" ? 1 : Infinity}
      />

      {/* Architectural light blades on a curved back wall */}
      <group>
        {bladeAngles.map((a) => (
          <mesh
            key={a}
            position={[Math.cos(a) * 13, 3, Math.sin(a) * 13]}
            rotation-y={-a + Math.PI / 2}
            material={bladeMaterial}
          >
            <boxGeometry args={[0.06, 6, 0.06]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
