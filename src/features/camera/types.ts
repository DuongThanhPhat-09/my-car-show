import type { CameraView } from "@/features/car/types";

export interface FlyOptions {
  duration?: number;
  ease?: string;
}

export interface CameraApi {
  /** Cinematic flight to a view. Automatically routes through the window when crossing the cabin boundary. */
  flyTo: (view: CameraView, options?: FlyOptions) => Promise<void>;
  playIntro: () => Promise<void>;
  /** Resets user-zoom (camera.zoom) in interior look mode. */
  resetZoom: () => void;
}
