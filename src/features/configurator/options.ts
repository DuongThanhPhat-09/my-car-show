import type { PaintFinish } from "@/features/car/materials/paintMaterial";

/**
 * Lamborghini Aventador S catalogue.
 *
 * Colour names come from the Lamborghini palette; swatch hex values are visual
 * approximations and availability varied by model year. The Aventador went out
 * of production in 2022, so no prices are shown. Pearl / matte previews on
 * colours that were not offered in that finish, the carbon pack and caliper
 * colours are visualisation-only.
 */

export interface ColorOption {
  id: string;
  name: string;
  color: string;
}

export interface PaintOption extends ColorOption {
  /** Factory finish of the colour – users may still preview other finishes. */
  finish: PaintFinish;
}

export interface RimOption extends ColorOption {
  metalness: number;
  roughness: number;
}

export type AmbientOption = ColorOption;

export const MODEL_NAME = "Aventador S";
export const MODEL_CODE = "LP 740-4";

export const PAINTS: PaintOption[] = [
  { id: "verde-mantis", name: "Verde Mantis", color: "#5fb71e", finish: "pearl" },
  { id: "arancio-argos", name: "Arancio Argos", color: "#e35a12", finish: "pearl" },
  { id: "giallo-orion", name: "Giallo Orion", color: "#f2b705", finish: "metallic" },
  { id: "rosso-mars", name: "Rosso Mars", color: "#a3111b", finish: "metallic" },
  { id: "blu-nethuns", name: "Blu Nethuns", color: "#1b3a6b", finish: "metallic" },
  { id: "grigio-telesto", name: "Grigio Telesto", color: "#5d6166", finish: "metallic" },
  { id: "bianco-monocerus", name: "Bianco Monocerus", color: "#eef0ef", finish: "gloss" },
  { id: "nero-aldebaran", name: "Nero Aldebaran", color: "#0a0b0d", finish: "metallic" },
  { id: "nero-nemesis", name: "Nero Nemesis", color: "#17181b", finish: "matte" },
];

export const FINISH_LABELS: Record<PaintFinish, { label: string; description: string }> = {
  gloss: { label: "Solid", description: "Deep single-tone lacquer" },
  metallic: { label: "Metallic", description: "Aluminium flake base coat" },
  pearl: { label: "Pearl", description: "Mica interference pigment" },
  matte: { label: "Matt", description: "Diffuse satin clear coat" },
};

export const CALIPERS: ColorOption[] = [
  { id: "nero", name: "Black", color: "#141518" },
  { id: "rosso", name: "Red", color: "#b3121c" },
  { id: "giallo", name: "Yellow", color: "#e8b80c" },
  { id: "arancio", name: "Orange", color: "#e0601a" },
  { id: "verde", name: "Green", color: "#4f9c1c" },
];

export const RIMS: RimOption[] = [
  { id: "shiny-black", name: "Shiny Black", color: "#0e0f11", metalness: 0.6, roughness: 0.22 },
  { id: "titanium-matt", name: "Titanium Matt", color: "#4a4d52", metalness: 0.9, roughness: 0.5 },
  { id: "silver", name: "Silver", color: "#c9cbcf", metalness: 1, roughness: 0.22 },
  { id: "bronze", name: "Bronze", color: "#6b5134", metalness: 1, roughness: 0.32 },
];

export const LEATHERS: ColorOption[] = [
  { id: "nero-ade", name: "Nero Ade", color: "#111113" },
  { id: "rosso-alala", name: "Rosso Alala", color: "#7c1018" },
  { id: "arancio-dryope", name: "Arancio Dryope", color: "#b8501c" },
  { id: "giallo-taurus", name: "Giallo Taurus", color: "#c99a14" },
];

export const AMBIENTS: AmbientOption[] = [
  { id: "glacier", name: "Glacier Blue", color: "#5ab4ff" },
  { id: "amber", name: "Amber", color: "#ffb04a" },
  { id: "verde", name: "Verde", color: "#7cff4a" },
  { id: "pure", name: "Pure White", color: "#f4f7ff" },
];

export const DEFAULT_CONFIGURATION = {
  paintId: "verde-mantis",
  finish: "pearl" as PaintFinish,
  carbonPack: true,
  caliperId: "nero",
  rimId: "shiny-black",
  leatherId: "nero-ade",
  ambientId: "verde",
};

export function findOption<T extends { id: string }>(list: T[], id: string): T {
  return list.find((o) => o.id === id) ?? list[0];
}
