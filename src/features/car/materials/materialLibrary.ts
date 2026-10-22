import * as THREE from "three";
import {
  brakeDiscTexture,
  carbonTextures,
  lamborghiniEmblemTextures,
  leatherTextures,
  screenTexture,
  tireTextures,
} from "@/lib/three/proceduralTextures";
import { createPaintMaterial, type PaintMaterial } from "./paintMaterial";
import { MODEL } from "../config/car.config";
import { DEFAULT_CONFIGURATION, findOption, PAINTS } from "@/features/configurator/options";

export interface MaterialLibrary {
  paint: PaintMaterial;
  carbon: THREE.MeshPhysicalMaterial;
  trimBlack: THREE.MeshPhysicalMaterial;
  trimSatin: THREE.MeshPhysicalMaterial;
  chrome: THREE.MeshPhysicalMaterial;
  darkChrome: THREE.MeshPhysicalMaterial;
  glass: THREE.MeshPhysicalMaterial;
  glassLowTier: THREE.MeshPhysicalMaterial;
  glassDark: THREE.MeshPhysicalMaterial;
  tire: THREE.MeshPhysicalMaterial;
  rim: THREE.MeshPhysicalMaterial;
  caliper: THREE.MeshPhysicalMaterial;
  disc: THREE.MeshPhysicalMaterial;
  leather: THREE.MeshPhysicalMaterial;
  leatherQuilted: THREE.MeshPhysicalMaterial;
  alcantara: THREE.MeshPhysicalMaterial;
  carpet: THREE.MeshStandardMaterial;
  plastic: THREE.MeshStandardMaterial;
  headlightLed: THREE.MeshStandardMaterial;
  headlightLens: THREE.MeshPhysicalMaterial;
  taillightLed: THREE.MeshStandardMaterial;
  taillightLens: THREE.MeshPhysicalMaterial;
  ambientLed: THREE.MeshStandardMaterial;
  screen: THREE.MeshStandardMaterial;
  emblem: THREE.MeshPhysicalMaterial;
  engineMetal: THREE.MeshPhysicalMaterial;
  underbody: THREE.MeshStandardMaterial;
}

/**
 * Every shared material is created exactly once. Meshes reference these
 * instances so the configurator only ever tweens a handful of materials
 * instead of traversing the scene graph.
 */
export function createMaterialLibrary(): MaterialLibrary {
  const cfg = DEFAULT_CONFIGURATION;
  const paintColor = findOption(PAINTS, cfg.paintId).color;

  const carbonTex = carbonTextures();
  const carbon = new THREE.MeshPhysicalMaterial({
    name: "lambo-carbon",
    color: "#ffffff",
    map: carbonTex.map,
    normalMap: carbonTex.normalMap,
    normalScale: new THREE.Vector2(0.55, 0.55),
    metalness: 0.25,
    roughness: 0.38,
    // Anisotropic highlights flip direction between warp and weft tows –
    // the shimmer that makes real carbon read as carbon.
    anisotropy: 0.75,
    anisotropyMap: carbonTex.anisotropyMap,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    side: THREE.DoubleSide,
  });
  for (const t of [carbonTex.map, carbonTex.normalMap, carbonTex.anisotropyMap]) t.repeat.set(9, 9);

  const leatherTex = leatherTextures(false);
  const quiltTex = leatherTextures(true);
  const leatherBase = {
    color: "#3a2a20",
    roughness: 0.62,
    roughnessMap: leatherTex.roughnessMap,
    sheen: 0.45,
    sheenRoughness: 0.55,
    sheenColor: new THREE.Color("#8a7766"),
    clearcoat: 0.08,
    clearcoatRoughness: 0.5,
  };
  const leather = new THREE.MeshPhysicalMaterial({
    name: "lambo-leather",
    ...leatherBase,
    normalMap: leatherTex.normalMap,
    normalScale: new THREE.Vector2(0.4, 0.4),
  });
  leatherTex.normalMap.repeat.set(3, 3);
  const leatherQuilted = new THREE.MeshPhysicalMaterial({
    name: "lambo-leather-quilted",
    ...leatherBase,
    normalMap: quiltTex.normalMap,
    normalScale: new THREE.Vector2(0.75, 0.75),
  });

  const tire = new THREE.MeshPhysicalMaterial({
    name: "lambo-tire",
    color: "#121213",
    roughness: 0.86,
    metalness: 0,
    normalMap: tireTextures().normalMap,
    normalScale: new THREE.Vector2(1, 1),
    sheen: 0.15,
    sheenRoughness: 0.8,
  });

  const lens = {
    transmission: 1,
    thickness: 0.02,
    ior: 1.49,
    roughness: 0.02,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
  };

  return {
    paint: createPaintMaterial(paintColor, cfg.finish, MODEL.flakeScale),
    carbon,
    trimBlack: new THREE.MeshPhysicalMaterial({
      name: "lambo-trim-black",
      color: "#050506",
      roughness: 0.25,
      metalness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      side: THREE.DoubleSide,
    }),
    // Textured satin black for aero parts that face the floor and catch the fill light.
    trimSatin: new THREE.MeshPhysicalMaterial({
      name: "lambo-trim-satin",
      color: "#070708",
      roughness: 0.55,
      metalness: 0.2,
      side: THREE.DoubleSide,
      // Layered over the body shell (front intake) – win the depth test cleanly.
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
    chrome: new THREE.MeshPhysicalMaterial({
      name: "lambo-chrome",
      color: "#f2f2f4",
      metalness: 1,
      roughness: 0.04,
    }),
    darkChrome: new THREE.MeshPhysicalMaterial({
      name: "lambo-dark-chrome",
      color: "#2a2b2e",
      metalness: 1,
      roughness: 0.14,
      // A perfectly smooth lacquer on thin tubes produces sub-pixel glints that
      // bloom into hot spots – keep a touch of micro-roughness.
      clearcoat: 1,
      clearcoatRoughness: 0.06,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      name: "lambo-glass",
      color: "#9fb0bd",
      metalness: 0,
      // A hair of roughness spreads the key light's specular glint so bloom
      // doesn't turn it into a hot spot, while reflections stay crisp.
      roughness: 0.045,
      transmission: 1,
      thickness: 0.006,
      ior: 1.52,
      attenuationColor: new THREE.Color("#2e3a40"),
      attenuationDistance: 0.05,
      specularIntensity: 1,
      envMapIntensity: 1.4,
    }),
    // Smoked engine-cover glass: the V12 shows through, the louvres sit on top.
    glassDark: new THREE.MeshPhysicalMaterial({
      name: "lambo-glass-dark",
      color: "#8a96a0",
      metalness: 0,
      roughness: 0.05,
      transmission: 1,
      thickness: 0.006,
      ior: 1.52,
      attenuationColor: new THREE.Color("#1b2126"),
      attenuationDistance: 0.02,
      envMapIntensity: 1.4,
    }),
    glassLowTier: new THREE.MeshPhysicalMaterial({
      name: "lambo-glass-lite",
      color: "#0d1114",
      metalness: 0.2,
      roughness: 0.02,
      transparent: true,
      opacity: 0.55,
      envMapIntensity: 1.6,
      depthWrite: false,
    }),
    tire,
    rim: new THREE.MeshPhysicalMaterial({
      name: "lambo-rim",
      color: "#c9cbcf",
      metalness: 1,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
    }),
    caliper: new THREE.MeshPhysicalMaterial({
      name: "lambo-caliper",
      color: "#c1121f",
      metalness: 0.1,
      roughness: 0.32,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    }),
    disc: new THREE.MeshPhysicalMaterial({
      name: "lambo-disc",
      map: brakeDiscTexture(),
      metalness: 1,
      roughness: 0.38,
    }),
    leather,
    leatherQuilted,
    alcantara: new THREE.MeshPhysicalMaterial({
      name: "lambo-alcantara",
      color: "#16161a",
      roughness: 1,
      sheen: 1,
      sheenRoughness: 0.8,
      sheenColor: new THREE.Color("#4a4a52"),
    }),
    carpet: new THREE.MeshStandardMaterial({ name: "lambo-carpet", color: "#0e0e10", roughness: 1 }),
    plastic: new THREE.MeshStandardMaterial({ name: "lambo-plastic", color: "#0a0a0b", roughness: 0.55 }),
    headlightLed: new THREE.MeshStandardMaterial({
      name: "lambo-headlight-led",
      color: "#ffffff",
      emissive: new THREE.Color("#e8f2ff"),
      emissiveIntensity: 6,
      toneMapped: false,
    }),
    headlightLens: new THREE.MeshPhysicalMaterial({
      name: "lambo-headlight-lens",
      color: "#0c0d10",
      ...lens,
      transmission: 0,
      metalness: 0.9,
      roughness: 0.08,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
    taillightLed: new THREE.MeshStandardMaterial({
      name: "lambo-taillight-led",
      color: "#ff1a1a",
      emissive: new THREE.Color("#ff0a14"),
      emissiveIntensity: 4,
      toneMapped: false,
    }),
    taillightLens: new THREE.MeshPhysicalMaterial({
      name: "lambo-taillight-lens",
      color: "#3c0207",
      ...lens,
      transmission: 0,
      metalness: 0.2,
      roughness: 0.05,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
    ambientLed: new THREE.MeshStandardMaterial({
      name: "lambo-ambient-led",
      color: "#000000",
      emissive: new THREE.Color("#5ab4ff"),
      emissiveIntensity: 3,
      toneMapped: false,
    }),
    screen: new THREE.MeshStandardMaterial({
      name: "lambo-screen",
      color: "#000000",
      roughness: 0.15,
      metalness: 0.2,
      emissive: new THREE.Color("#ffffff"),
      emissiveMap: screenTexture(),
      emissiveIntensity: 1.25,
      toneMapped: false,
    }),
    emblem: new THREE.MeshPhysicalMaterial({
      name: "lambo-emblem",
      map: lamborghiniEmblemTextures().color,
      metalness: 0.85,
      roughness: 0.18,
      clearcoat: 1,
    }),
    engineMetal: new THREE.MeshPhysicalMaterial({
      name: "lambo-engine-metal",
      color: "#5b5d62",
      metalness: 1,
      roughness: 0.32,
    }),
    underbody: new THREE.MeshStandardMaterial({ name: "lambo-underbody", color: "#050505", roughness: 0.9 }),
  };
}

let shared: MaterialLibrary | null = null;

/** Lazily created, app-lifetime material library (client only). */
export function getMaterialLibrary() {
  shared ??= createMaterialLibrary();
  return shared;
}
