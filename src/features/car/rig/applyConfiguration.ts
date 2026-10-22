import * as THREE from "three";
import gsap from "gsap";
import { FINISHES, finishTweenTarget } from "../materials/paintMaterial";
import { getMaterialLibrary } from "../materials/materialLibrary";
import type { CarHandles } from "./carRegistry";
import { AMBIENTS, CALIPERS, LEATHERS, PAINTS, RIMS, findOption } from "@/features/configurator/options";
import type { Configuration, QualityTier } from "@/store/useShowroomStore";

export interface LightState {
  lightsOn: boolean;
  ambientOn: boolean;
}

export const LIGHT_LEVELS = {
  headlight: { on: 7, off: 0.04 },
  taillight: { on: 4.5, off: 0.35 },
  ambient: { on: 3.2, off: 0 },
};

const COLOR_EASE = "power2.inOut";

function tweenColor(target: THREE.Color, hex: string, duration: number) {
  const c = new THREE.Color(hex);
  if (duration === 0) {
    target.copy(c);
    return;
  }
  gsap.to(target, { r: c.r, g: c.g, b: c.b, duration, ease: COLOR_EASE, overwrite: "auto" });
}

/** Applies a configuration to a set of handles – instantly (duration 0) or animated. */
export function applyConfiguration(h: CarHandles, cfg: Configuration, duration = 1.2) {
  const paint = findOption(PAINTS, cfg.paintId);
  const finish = FINISHES[cfg.finish];
  h.paint.forEach((mat) => {
    tweenColor(mat.color, paint.color, duration);
    const target = finishTweenTarget(mat);
    if (duration === 0) Object.assign(target, finish);
    else gsap.to(target, { ...finish, duration: duration * 1.2, ease: COLOR_EASE, overwrite: "auto" });
  });

  const caliper = findOption(CALIPERS, cfg.caliperId);
  h.caliper.forEach((m) => tweenColor(m.color, caliper.color, duration));

  const rim = findOption(RIMS, cfg.rimId);
  h.rim.forEach((m) => {
    tweenColor(m.color, rim.color, duration);
    const params = { metalness: rim.metalness, roughness: rim.roughness };
    if (duration === 0) Object.assign(m, params);
    else gsap.to(m, { ...params, duration, ease: COLOR_EASE, overwrite: "auto" });
  });

  const leather = findOption(LEATHERS, cfg.leatherId);
  h.leather.forEach((m) => tweenColor(m.color, leather.color, duration));

  const ambient = findOption(AMBIENTS, cfg.ambientId);
  h.ambient.forEach((m) => tweenColor(m.emissive, ambient.color, duration));

  applyCarbon(h, cfg.carbonPack);
}

export function applyCarbon(h: CarHandles, enabled: boolean) {
  const { carbon } = getMaterialLibrary();
  h.carbon.forEach((original, mesh) => {
    mesh.material = enabled ? (Array.isArray(original) ? original.map(() => carbon) : carbon) : original;
  });
}

export function applyLights(h: CarHandles, s: LightState, duration = 0.9) {
  const set = (mats: Set<THREE.MeshStandardMaterial>, value: number, d: number) =>
    mats.forEach((m) => {
      if (d === 0) m.emissiveIntensity = value;
      else gsap.to(m, { emissiveIntensity: value, duration: d, ease: "power2.out", overwrite: "auto" });
    });
  // LEDs fire in sequence: DRL first, tail bar a beat later – a small "welcome" choreography.
  set(h.headlight, s.lightsOn ? LIGHT_LEVELS.headlight.on : LIGHT_LEVELS.headlight.off, duration);
  set(h.taillight, s.lightsOn ? LIGHT_LEVELS.taillight.on : LIGHT_LEVELS.taillight.off, duration * 1.4);
  set(h.ambient, s.ambientOn ? LIGHT_LEVELS.ambient.on : LIGHT_LEVELS.ambient.off, duration * 1.6);
}

/** Real refraction on high tier, cheap transparent glass otherwise. */
export function applyGlassQuality(h: CarHandles, quality: QualityTier) {
  const lib = getMaterialLibrary();
  h.glass.forEach((original, mesh) => {
    if (quality === "high") {
      mesh.material = original;
      return;
    }
    mesh.material = Array.isArray(original) ? original.map(() => lib.glassLowTier) : lib.glassLowTier;
  });
}
