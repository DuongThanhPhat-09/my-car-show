"use client";

import { PerformanceMonitor, AdaptiveEvents } from "@react-three/drei";
import { useShowroom, type QualityTier } from "@/store/useShowroomStore";

const ORDER: QualityTier[] = ["low", "medium", "high"];

/**
 * Watches real frame times and steps quality down (or back up) to hold a
 * stable 60 fps: DPR first, then the effect tier. Flip-flopping is capped.
 */
export function QualityManager({ onDpr }: { onDpr: (dpr: number) => void }) {
  return (
    <>
      <PerformanceMonitor
        bounds={(refresh) => (refresh > 90 ? [58, refresh] : [50, 60])}
        flipflops={3}
        onChange={({ factor }) => onDpr(Math.round((0.75 + 1.25 * factor) * 10) / 10)}
        onDecline={() => {
          const s = useShowroom.getState();
          // Loading/intro frames include shader compiles – never judge the device on those.
          if (s.phase !== "ready" || s.qualityLocked) return;
          const i = ORDER.indexOf(s.quality);
          if (i > 0) s.setQuality(ORDER[i - 1]);
        }}
        onFallback={() => {
          if (!useShowroom.getState().qualityLocked) useShowroom.getState().setQuality("low");
        }}
      />
      <AdaptiveEvents />
    </>
  );
}
