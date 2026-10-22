"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Detailed, useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MODEL } from "../config/car.config";
import { CarAssembly } from "./CarAssembly";
import { useShowroom } from "@/store/useShowroomStore";

const DRACO_PATH = "/draco/";
let ktx2: KTX2Loader | null = null;

/** KTX2 / Basis Universal: GPU-compressed textures – 8K maps at a fraction of the VRAM. */
function getKtx2(gl: THREE.WebGLRenderer) {
  if (!ktx2) ktx2 = new KTX2Loader().setTranscoderPath("/basis/").detectSupport(gl);
  return ktx2;
}

function useCarGLTF(url: string) {
  const gl = useThree((s) => s.gl);
  // Draco geometry + Meshopt + KTX2 textures, all decoded off the main thread.
  // (drei hands us three-stdlib's GLTFLoader, API-compatible with three's KTX2Loader.)
  return useGLTF(url, DRACO_PATH, true, (loader) => {
    (loader as unknown as { setKTX2Loader: (l: KTX2Loader) => void }).setKTX2Loader(getKtx2(gl));
  });
}

function GlbLevel({ url }: { url: string }) {
  const gltf = useCarGLTF(url);
  const object = useMemo(() => {
    // Clone so rigging never mutates the cached scene (safe across remounts / LODs).
    const model = gltf.scene.clone(true);
    model.scale.setScalar(MODEL.scale ?? 1);
    if (MODEL.position) model.position.fromArray(MODEL.position);
    if (MODEL.rotation) model.rotation.set(...MODEL.rotation);
    const root = new THREE.Group();
    root.name = "car_root";
    root.add(model);
    return root;
  }, [gltf]);

  return <CarAssembly object={object} forceShadows />;
}

export function GlbCar({ lods }: { lods: Array<{ url: string; distance: number }> }) {
  useEffect(() => useShowroom.getState().setModelSource("glb"), []);
  const levels = [MODEL.url, ...lods.map((l) => l.url)].map((url) => <GlbLevel key={url} url={url} />);
  return (
    <Detailed distances={[0, ...lods.map((l) => l.distance)]} hysteresis={0.1}>
      {levels}
    </Detailed>
  );
}
