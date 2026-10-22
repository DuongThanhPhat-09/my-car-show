"use client";

import { useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { useShowroom } from "@/store/useShowroomStore";
import { INTRO_START } from "@/features/car/config/car.config";
import { Car } from "@/features/car/components/Car";
import { useAssetAvailability } from "@/features/car/hooks/useAssetAvailability";
import { CameraRig } from "@/features/camera/CameraRig";
import { ConfiguratorSync } from "@/features/configurator/ConfiguratorSync";
import { FocusHotspots } from "@/features/focus/FocusHotspots";
import { Effects } from "@/features/stage/Effects";
import { QualityManager } from "@/features/stage/QualityManager";
import { Showroom } from "@/features/stage/Showroom";
import { StudioEnvironment } from "@/features/stage/StudioEnvironment";
import { StudioLights } from "@/features/stage/StudioLights";
import { ProgressReporter } from "@/features/loading/ProgressReporter";

const BACKGROUND = "#050506";
const HDRI = ["/hdri/showroom.hdr"];

/** The WebGL canvas. Loaded with next/dynamic (ssr: false) so it never blocks first paint. */
export default function Scene() {
  const initialQuality = useState(() => useShowroom.getState().quality)[0];
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio, initialQuality === "high" ? 2 : 1.5));
  const hdri = useAssetAvailability(HDRI);

  return (
    <Canvas
      // PCF filtering (R3F's default "soft" maps to PCFSoftShadowMap, removed in three r18x);
      // the high tier upgrades it to PCSS via drei <SoftShadows>.
      shadows="percentage"
      dpr={dpr}
      camera={{ fov: INTRO_START.fov, near: 0.01, far: 120, position: INTRO_START.position }}
      gl={{
        // MSAA happens inside the HDR composer; native AA only when it is disabled.
        antialias: initialQuality === "low",
        alpha: false,
        stencil: false,
        powerPreference: "high-performance",
        toneMapping: THREE.NeutralToneMapping,
        toneMappingExposure: 1,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      className="!fixed inset-0"
    >
      <color attach="background" args={[BACKGROUND]} />
      <fog attach="fog" args={[BACKGROUND, 13, 34]} />

      <ProgressReporter />
      <QualityManager onDpr={(v) => setDpr(Math.min(v, window.devicePixelRatio, 2))} />
      <StudioLights />
      {hdri && <StudioEnvironment hdri={!!hdri[HDRI[0]]} />}
      <Showroom />
      <Car />
      <FocusHotspots />
      <CameraRig />
      <ConfiguratorSync />
      <Effects />
    </Canvas>
  );
}
