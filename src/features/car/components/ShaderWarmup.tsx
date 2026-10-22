"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { useShowroom } from "@/store/useShowroomStore";
import { getMaterialLibrary } from "../materials/materialLibrary";
import { FINISHES } from "../materials/paintMaterial";

/**
 * Compiles every shader program before the intro starts so the first paint
 * swap, door opening or LED toggle never stalls a frame.
 *
 * The pearl finish enables iridescence + sheen, which is a different program
 * variant. A hidden proxy mesh keeps that variant compiled and referenced, so
 * switching to pearl later is a cache hit instead of a 100 ms compile hitch.
 */
export function ShaderWarmup() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  const pearlProxy = useMemo(() => {
    const mat = getMaterialLibrary().paint.clone();
    mat.iridescence = FINISHES.pearl.iridescence;
    mat.sheen = FINISHES.pearl.sheen;
    return mat;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // Let mount effects (material assignment, registry) settle first.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      try {
        await gl.compileAsync(scene, camera);
      } catch {
        /* compileAsync is best-effort */
      }
      if (!cancelled) useShowroom.getState().setSceneReady(true);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera]);

  return (
    <mesh position={[0, -40, 0]} scale={0.0001} frustumCulled>
      <boxGeometry />
      <primitive object={pearlProxy} attach="material" />
    </mesh>
  );
}
