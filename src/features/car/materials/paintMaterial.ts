import * as THREE from "three";

export type PaintFinish = "gloss" | "metallic" | "pearl" | "matte";

export interface FinishParams {
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  /** Strength of the micro-flake normal perturbation in the base coat. */
  flake: number;
  iridescence: number;
  sheen: number;
  specularIntensity: number;
}

/**
 * Finish presets modelled on real automotive paint stacks:
 *   base coat (pigment + optional aluminium / mica flakes) → clear coat.
 * All values are numeric so finishes can be morphed continuously with GSAP.
 */
export const FINISHES: Record<PaintFinish, FinishParams> = {
  gloss: {
    metalness: 0.0,
    roughness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.015,
    flake: 0,
    iridescence: 0,
    sheen: 0,
    specularIntensity: 1,
  },
  metallic: {
    metalness: 0.72,
    roughness: 0.34,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    flake: 0.3,
    iridescence: 0,
    sheen: 0,
    specularIntensity: 1,
  },
  pearl: {
    metalness: 0.38,
    roughness: 0.26,
    clearcoat: 1,
    clearcoatRoughness: 0.025,
    flake: 0.2,
    iridescence: 1,
    sheen: 0.55,
    specularIntensity: 1,
  },
  matte: {
    metalness: 0.45,
    roughness: 0.58,
    // Satin clear coat: present (keeps the shader variant stable) but diffuse.
    clearcoat: 0.12,
    clearcoatRoughness: 0.65,
    flake: 0.06,
    iridescence: 0,
    sheen: 0,
    specularIntensity: 0.7,
  },
};

export interface PaintUniforms {
  uFlakeStrength: { value: number };
  uFlakeScale: { value: number };
}

export interface PaintMaterial extends THREE.MeshPhysicalMaterial {
  userData: { paint: PaintUniforms };
}

/**
 * MeshPhysicalMaterial extended with an object-space micro-flake layer.
 *
 * The flake perturbation is applied to `normal` *after* normal mapping but the
 * clear coat keeps using `geometryNormal`, which reproduces the signature look of
 * real metallic paint: glittering base coat beneath a mirror-smooth lacquer.
 * Flakes fade out with screen-space derivatives so they never alias or shimmer at
 * distance – they only reveal themselves when the camera zooms in.
 */
export function createPaintMaterial(color: THREE.ColorRepresentation, finish: PaintFinish, flakeScale = 2200) {
  const params = FINISHES[finish];
  const mat = new THREE.MeshPhysicalMaterial({
    name: "lambo-paint",
    color,
    metalness: params.metalness,
    roughness: params.roughness,
    clearcoat: params.clearcoat,
    clearcoatRoughness: params.clearcoatRoughness,
    iridescence: params.iridescence,
    iridescenceIOR: 1.32,
    iridescenceThicknessRange: [180, 620],
    sheen: params.sheen,
    sheenRoughness: 0.35,
    sheenColor: new THREE.Color("#ffffff"),
    specularIntensity: params.specularIntensity,
    envMapIntensity: 1,
    side: THREE.DoubleSide,
  }) as PaintMaterial;

  const uniforms: PaintUniforms = {
    uFlakeStrength: { value: params.flake },
    uFlakeScale: { value: flakeScale },
  };
  mat.userData.paint = uniforms;

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uFlakeStrength = uniforms.uFlakeStrength;
    shader.uniforms.uFlakeScale = uniforms.uFlakeScale;

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vFlakePos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvFlakePos = position;");

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        /* glsl */ `#include <common>
        varying vec3 vFlakePos;
        uniform float uFlakeStrength;
        uniform float uFlakeScale;
        vec3 flakeHash(vec3 p) {
          p = fract(p * vec3(0.1031, 0.1030, 0.0973));
          p += dot(p, p.yxz + 33.33);
          return fract((p.xxy + p.yxx) * p.zyx);
        }`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        /* glsl */ `#include <normal_fragment_maps>
        {
          vec3 fp = vFlakePos * uFlakeScale;
          vec3 cell = floor(fp);
          vec3 rnd = flakeHash(cell) * 2.0 - 1.0;
          // Footprint of one flake cell in pixels → fade before it aliases.
          float footprint = length(fwidth(fp));
          float fade = 1.0 - smoothstep(0.35, 1.1, footprint);
          float density = step(0.35, flakeHash(cell + 17.0).x);
          normal = normalize(normal + rnd * uFlakeStrength * fade * density);
        }`,
      );
  };
  mat.customProgramCacheKey = () => "lambo-paint-v1";
  return mat;
}

/** Writes finish parameters into a target object (used as a GSAP tween target). */
export function finishTweenTarget(mat: PaintMaterial) {
  return {
    get metalness() { return mat.metalness; },
    set metalness(v: number) { mat.metalness = v; },
    get roughness() { return mat.roughness; },
    set roughness(v: number) { mat.roughness = v; },
    get clearcoat() { return mat.clearcoat; },
    set clearcoat(v: number) { mat.clearcoat = v; },
    get clearcoatRoughness() { return mat.clearcoatRoughness; },
    set clearcoatRoughness(v: number) { mat.clearcoatRoughness = v; },
    get flake() { return mat.userData.paint.uFlakeStrength.value; },
    set flake(v: number) { mat.userData.paint.uFlakeStrength.value = v; },
    get iridescence() { return mat.iridescence; },
    set iridescence(v: number) { mat.iridescence = v; },
    get sheen() { return mat.sheen; },
    set sheen(v: number) { mat.sheen = v; },
    get specularIntensity() { return mat.specularIntensity; },
    set specularIntensity(v: number) { mat.specularIntensity = v; },
  };
}
