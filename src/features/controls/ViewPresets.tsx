"use client";

import { PRESET_VIEWS, type PresetViewId } from "@/features/car/config/car.config";
import { useShowroom } from "@/store/useShowroomStore";
import { cx } from "@/components/ui/primitives";
import { useFocusActions } from "@/features/focus/useFocusActions";

/** Studio camera presets – front, ¾, profile, rear, top. */
export function ViewPresets() {
  const { goToPreset } = useFocusActions();
  const flying = useShowroom((s) => s.isFlying);

  return (
    <div className="flex flex-col items-end gap-1" role="group" aria-label="Camera angles">
      {(Object.keys(PRESET_VIEWS) as PresetViewId[]).map((id) => (
        <button
          key={id}
          type="button"
          disabled={flying}
          onClick={() => goToPreset(id)}
          className={cx(
            "group flex items-center gap-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-mist uppercase transition-colors duration-500",
            "hover:text-pearl disabled:opacity-40",
          )}
        >
          {PRESET_VIEWS[id].label}
          <span className="h-px w-3 bg-current opacity-50 transition-all duration-500 ease-lux group-hover:w-6 group-hover:opacity-100" />
        </button>
      ))}
    </div>
  );
}
