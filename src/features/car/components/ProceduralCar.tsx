"use client";

import { useEffect, useMemo } from "react";
import { Detailed } from "@react-three/drei";
import type * as THREE from "three";
import { getMaterialLibrary } from "../materials/materialLibrary";
import { buildProceduralCar } from "../procedural/buildProceduralCar";
import { CarAssembly } from "./CarAssembly";
import { useShowroom } from "@/store/useShowroomStore";

/** Built-in fallback car with two LOD levels (full cabin / exterior-only shell). */
export function ProceduralCar() {
  const high = useMemo(() => buildProceduralCar(getMaterialLibrary(), "high"), []);
  const low = useMemo(() => buildProceduralCar(getMaterialLibrary(), "low"), []);

  useEffect(() => {
    useShowroom.getState().setModelSource("procedural");
    return () => {
      for (const root of [high, low]) {
        root.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
      }
    };
  }, [high, low]);

  return (
    <Detailed distances={[0, 18]} hysteresis={0.1}>
      <CarAssembly object={high} />
      <CarAssembly object={low} />
    </Detailed>
  );
}
