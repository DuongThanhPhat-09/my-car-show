"use client";

import { useEffect } from "react";
import { useProgress } from "@react-three/drei";
import { useShowroom } from "@/store/useShowroomStore";

/** Lives inside the lazy canvas chunk and forwards loader progress to the store. */
export function ProgressReporter() {
  const { progress, active } = useProgress();
  useEffect(() => {
    useShowroom.getState().setAssetProgress(progress, active);
  }, [progress, active]);
  return null;
}
