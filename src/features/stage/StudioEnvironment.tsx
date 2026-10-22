"use client";

import { useEffect } from "react";
import { Environment, Lightformer } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useShowroom } from "@/store/useShowroomStore";

const HDRI_URL = "/hdri/showroom.hdr";

/**
 * Studio HDRI built from emissive Lightformers rendered into a cube map once
 * (frames={1}) – the same technique automotive photographers use with
 * overhead softbox strips: long, crisp highlight lines that reveal every
 * curve of the bodywork. Optionally layered over a real HDR file.
 */
export function StudioEnvironment({ hdri }: { hdri: boolean }) {
  const scene = useThree((s) => s.scene);
  const phase = useShowroom((s) => s.phase);

  // Showroom "power-on": reflections fade up with the intro flight.
  useEffect(() => {
    if (phase === "loading") {
      scene.environmentIntensity = 0;
      return;
    }
    if (phase === "intro") {
      gsap.to(scene, { environmentIntensity: 1, duration: 3.2, ease: "power2.inOut", delay: 0.2 });
    }
  }, [phase, scene]);

  return (
    <Environment resolution={512} frames={1} files={hdri ? HDRI_URL : undefined} background={false}>
      {/* Overhead softbox array – the main reflection lines on hood and roof */}
      {[-3.2, -1.1, 1.1, 3.2].map((z) => (
        <Lightformer key={z} form="rect" intensity={3.2} position={[0, 6, z]} rotation-x={Math.PI / 2} scale={[11, 0.7, 1]} />
      ))}
      {/* Large diffused ceiling panel for soft top-light falloff */}
      <Lightformer form="rect" intensity={0.55} position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[16, 16, 1]} color="#dfe6ee" />
      {/* Side walls – long horizontal strips draw the shoulder line */}
      <Lightformer form="rect" intensity={1.6} position={[-8, 1.4, 0]} rotation-y={Math.PI / 2} scale={[18, 0.9, 1]} />
      <Lightformer form="rect" intensity={1.6} position={[8, 1.4, 0]} rotation-y={-Math.PI / 2} scale={[18, 0.9, 1]} />
      <Lightformer form="rect" intensity={0.4} position={[-8, 3.6, 0]} rotation-y={Math.PI / 2} scale={[18, 2.5, 1]} color="#c9d6e6" />
      <Lightformer form="rect" intensity={0.4} position={[8, 3.6, 0]} rotation-y={-Math.PI / 2} scale={[18, 2.5, 1]} color="#c9d6e6" />
      {/* Rear ring key and a cool front fill */}
      <Lightformer form="ring" intensity={2.2} position={[0, 2.8, -11]} scale={5} />
      <Lightformer form="rect" intensity={0.7} position={[0, 1.2, 11]} rotation-y={Math.PI} scale={[12, 1.6, 1]} color="#a9c9ff" />
      {/* Warm low kicker – separates rocker panels from the floor */}
      <Lightformer form="rect" intensity={0.5} position={[0, 0.25, 9]} rotation-y={Math.PI} scale={[14, 0.3, 1]} color="#ffd8a8" />
    </Environment>
  );
}
