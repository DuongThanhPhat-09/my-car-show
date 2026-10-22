"use client";

import { Suspense } from "react";
import { MODEL } from "../config/car.config";
import { useAssetAvailability } from "../hooks/useAssetAvailability";
import { GlbCar } from "./GlbCar";
import { ProceduralCar } from "./ProceduralCar";
import { CarLights } from "./CarLights";
import { ShaderWarmup } from "./ShaderWarmup";

const LOD_URLS = (MODEL.lods ?? []).map((l) => l.url);

/** Chooses the production GLB when available, otherwise the procedural car. */
export function Car() {
  const available = useAssetAvailability([MODEL.url, ...LOD_URLS]);
  if (!available) return null;

  const car = available[MODEL.url] ? (
    <GlbCar lods={(MODEL.lods ?? []).filter((l) => available[l.url])} />
  ) : (
    <ProceduralCar />
  );

  return (
    <Suspense fallback={null}>
      {car}
      <CarLights />
      <ShaderWarmup />
    </Suspense>
  );
}
