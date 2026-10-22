"use client";

import { useCallback } from "react";
import { useShowroom, type PartId } from "@/store/useShowroomStore";
import {
  FOCUS_POINTS,
  HERO_VIEW,
  INTERIOR_VIEWS,
  PRESET_VIEWS,
  type InteriorViewId,
  type PresetViewId,
} from "@/features/car/config/car.config";

/**
 * Switches the active focus and closes whatever the previous focus point opened
 * (hood, door …) unless the next one needs it too. Parts the user opened by
 * hand from the dock are left alone.
 */
function setFocus(id: string | null) {
  const s = useShowroom.getState();
  const prev = FOCUS_POINTS.find((f) => f.id === s.activeFocus);
  const next = FOCUS_POINTS.find((f) => f.id === id);
  prev?.opens?.forEach((p) => {
    if (!next?.opens?.includes(p)) s.setPart(p, false);
  });
  s.setActiveFocus(id);
  next?.opens?.forEach((p: PartId) => s.setPart(p, true));
  return next;
}

/**
 * All camera-driven navigation in one reusable hook: focus points, preset
 * views, entering / leaving the cabin. UI components never talk to the
 * camera directly.
 */
export function useFocusActions() {
  const focus = useCallback(async (id: string) => {
    const s = useShowroom.getState();
    if (!s.camera) return;
    const fp = setFocus(id);
    if (!fp) return;
    if (fp.mode !== s.mode) s.setMode(fp.mode);
    // Slightly longer flight when a hood / door opens, so the part leads the camera.
    await s.camera.flyTo(fp.view, fp.opens?.length ? { duration: 2.4 } : undefined);
  }, []);

  const clearFocus = useCallback(async () => {
    const s = useShowroom.getState();
    setFocus(null);
    await s.camera?.flyTo(s.mode === "exterior" ? HERO_VIEW : INTERIOR_VIEWS.overview);
  }, []);

  const goToPreset = useCallback(async (id: PresetViewId) => {
    const s = useShowroom.getState();
    setFocus(null);
    if (s.mode !== "exterior") s.setMode("exterior");
    await s.camera?.flyTo(PRESET_VIEWS[id]);
  }, []);

  const enterInterior = useCallback(async (view: InteriorViewId = "overview") => {
    const s = useShowroom.getState();
    setFocus(view === "screen" ? "screen" : null);
    s.setMode("interior");
    await s.camera?.flyTo(INTERIOR_VIEWS[view]);
  }, []);

  const exitInterior = useCallback(async () => {
    const s = useShowroom.getState();
    setFocus(null);
    s.setMode("exterior");
    await s.camera?.flyTo(HERO_VIEW);
  }, []);

  return { focus, clearFocus, goToPreset, enterInterior, exitInterior };
}

/** Next / previous focus point id in catalogue order (mode switches are handled by `focus`). */
export function stepFocus(currentId: string | null, dir: 1 | -1) {
  const i = Math.max(0, FOCUS_POINTS.findIndex((f) => f.id === currentId));
  return FOCUS_POINTS[(i + dir + FOCUS_POINTS.length) % FOCUS_POINTS.length].id;
}
