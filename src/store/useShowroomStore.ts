import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { CameraApi } from "@/features/camera/types";
import type { PaintFinish } from "@/features/car/materials/paintMaterial";
import { DEFAULT_CONFIGURATION } from "@/features/configurator/options";

export type Phase = "loading" | "intro" | "ready";
export type ViewMode = "exterior" | "interior";
export type QualityTier = "high" | "medium" | "low";
export type PartId = "doorL" | "doorR" | "frunk" | "engineCover" | "wing";

export interface Configuration {
  paintId: string;
  finish: PaintFinish;
  carbonPack: boolean;
  caliperId: string;
  rimId: string;
  leatherId: string;
  ambientId: string;
}

export const ALL_PARTS: PartId[] = ["doorL", "doorR", "frunk", "engineCover", "wing"];

const closedParts = (): Record<PartId, boolean> =>
  Object.fromEntries(ALL_PARTS.map((p) => [p, false])) as Record<PartId, boolean>;

interface ShowroomState {
  phase: Phase;
  /** Asset download progress (0–100) reported from inside the lazy canvas chunk. */
  assetProgress: number;
  assetsActive: boolean;
  loadProgress: number;
  /** True once the car is mounted and its shaders are compiled. */
  sceneReady: boolean;
  modelSource: "glb" | "procedural" | null;
  mode: ViewMode;
  activeFocus: string | null;
  isFlying: boolean;
  quality: QualityTier;
  /** When true, the runtime performance monitor may not change the tier. */
  qualityLocked: boolean;
  configuration: Configuration;
  parts: Record<PartId, boolean>;
  wheelsSpinning: boolean;
  lightsOn: boolean;
  ambientOn: boolean;
  panelOpen: boolean;
  camera: CameraApi | null;

  setPhase: (phase: Phase) => void;
  setLoadProgress: (value: number) => void;
  setAssetProgress: (progress: number, active: boolean) => void;
  setSceneReady: (ready: boolean) => void;
  setModelSource: (source: "glb" | "procedural") => void;
  setMode: (mode: ViewMode) => void;
  setActiveFocus: (id: string | null) => void;
  setFlying: (flying: boolean) => void;
  setQuality: (quality: QualityTier, locked?: boolean) => void;
  configure: (patch: Partial<Configuration>) => void;
  togglePart: (part: PartId) => void;
  setPart: (part: PartId, open: boolean) => void;
  closeAllParts: () => void;
  toggleWheels: () => void;
  toggleLights: () => void;
  toggleAmbient: () => void;
  setPanelOpen: (open: boolean) => void;
  registerCamera: (api: CameraApi | null) => void;
}

export const useShowroom = create<ShowroomState>()(
  subscribeWithSelector((set) => ({
    phase: "loading",
    assetProgress: 0,
    assetsActive: false,
    loadProgress: 0,
    sceneReady: false,
    modelSource: null,
    mode: "exterior",
    activeFocus: null,
    isFlying: false,
    quality: "high",
    qualityLocked: false,
    configuration: DEFAULT_CONFIGURATION,
    parts: closedParts(),
    wheelsSpinning: false,
    lightsOn: true,
    ambientOn: true,
    panelOpen: false,
    camera: null,

    setPhase: (phase) => set({ phase }),
    setLoadProgress: (loadProgress) => set({ loadProgress }),
    setAssetProgress: (assetProgress, assetsActive) => set({ assetProgress, assetsActive }),
    setSceneReady: (sceneReady) => set({ sceneReady }),
    setModelSource: (modelSource) => set({ modelSource }),
    setMode: (mode) => set({ mode }),
    setActiveFocus: (activeFocus) => set({ activeFocus }),
    setFlying: (isFlying) => set({ isFlying }),
    setQuality: (quality, locked) => set((s) => ({ quality, qualityLocked: locked ?? s.qualityLocked })),
    configure: (patch) => set((s) => ({ configuration: { ...s.configuration, ...patch } })),
    togglePart: (part) => set((s) => ({ parts: { ...s.parts, [part]: !s.parts[part] } })),
    setPart: (part, open) => set((s) => ({ parts: { ...s.parts, [part]: open } })),
    closeAllParts: () => set({ parts: closedParts() }),
    toggleWheels: () => set((s) => ({ wheelsSpinning: !s.wheelsSpinning })),
    toggleLights: () => set((s) => ({ lightsOn: !s.lightsOn })),
    toggleAmbient: () => set((s) => ({ ambientOn: !s.ambientOn })),
    setPanelOpen: (panelOpen) => set({ panelOpen }),
    registerCamera: (camera) => set({ camera }),
  })),
);
