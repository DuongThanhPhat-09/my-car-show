import type { QualityTier } from "@/store/useShowroomStore";

/**
 * Initial tier from device hints – refined at runtime by PerformanceMonitor.
 * `?quality=high|medium|low` pins the tier (demos, screenshots, QA).
 */
export function detectInitialQuality(): { tier: QualityTier; locked: boolean } {
  if (typeof window === "undefined") return { tier: "high", locked: false };
  const forced = new URLSearchParams(window.location.search).get("quality");
  if (forced === "high" || forced === "medium" || forced === "low") return { tier: forced, locked: true };

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = window.innerWidth < 820;
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  if (coarse && (cores <= 4 || memory <= 3)) return { tier: "low", locked: false };
  if (coarse || small) return { tier: "medium", locked: false };
  return { tier: "high", locked: false };
}
