import type { PartId, ViewMode } from "@/store/useShowroomStore";

export type Vec3 = [number, number, number];

export interface HingeConfig {
  /** Node names (searched anywhere in the model) that swing together. */
  nodes: string[];
  /** Hinge point in model space. */
  pivot: Vec3;
  axis: "x" | "y" | "z";
  /** Open angle in radians (sign selects direction). */
  angle: number;
  /** Optional vertical travel when opened (pop-up wing). */
  lift?: number;
  duration?: number;
}

/** Regex sources matched (case-insensitively) against `${mesh.name} ${material.name}`. */
export type Matcher = string[];

export interface MaterialSlots {
  /** Meshes whose material is replaced by the configurable car paint. */
  paint: Matcher;
  /** Meshes that switch to carbon fibre when the carbon pack is selected. */
  carbon: Matcher;
  caliper: Matcher;
  rim: Matcher;
  leather: Matcher;
  glass: Matcher;
  headlight: Matcher;
  taillight: Matcher;
  ambient: Matcher;
}

export interface CameraView {
  position: Vec3;
  target: Vec3;
  fov?: number;
  /** "orbit" inspects around the target, "look" rotates in place (interior). */
  control?: "orbit" | "look";
  minDistance?: number;
  maxDistance?: number;
}

export interface FocusPoint {
  id: string;
  label: string;
  title: string;
  kicker: string;
  description: string;
  specs: Array<{ label: string; value: string }>;
  /** Footnote shown under the specs (sources, estimates). */
  note?: string;
  /** Hotspot anchor in model space and the surface normal used for back-face hiding. */
  anchor: Vec3;
  normal: Vec3;
  view: CameraView;
  /** Where the camera ends up when this point is focused. */
  mode: ViewMode;
  /** Where the hotspot is displayed (defaults to `mode`). */
  hotspotMode?: ViewMode;
  /** Nodes whose meshes receive the highlight outline. */
  highlight: string[];
  /** Parts that open automatically when this point is focused. */
  opens?: PartId[];
}

export interface CarRigConfig {
  hinges: Record<PartId, HingeConfig>;
  /** Each entry: node names that spin together as one wheel. */
  wheels: string[][];
  slots: MaterialSlots;
  /** Node holding the cabin (hidden in exterior views beyond a distance on low tier). */
  interiorNode?: string;
  /** Optional spotlight origins for the headlight beams, in model space. */
  headlightBeams?: Vec3[];
}

export interface ModelSource {
  kind: "glb";
  url: string;
  /** LOD switch distances paired with additional model URLs. */
  lods?: Array<{ url: string; distance: number }>;
  scale?: number;
  position?: Vec3;
  rotation?: Vec3;
  /** Uniform scale applied to the paint flake noise (flakes per metre). */
  flakeScale?: number;
}
