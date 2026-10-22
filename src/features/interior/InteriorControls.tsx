"use client";

import { useState } from "react";
import { useShowroom } from "@/store/useShowroomStore";
import { INTERIOR_VIEWS, type InteriorViewId } from "@/features/car/config/car.config";
import { Icon } from "@/components/ui/Icon";
import { Pill } from "@/components/ui/primitives";
import { useFocusActions } from "@/features/focus/useFocusActions";

/** Cabin navigation: look-around plus detail zooms (dashboard, wheel, display, rear). */
export function InteriorControls() {
  const { enterInterior, exitInterior } = useFocusActions();
  const flying = useShowroom((s) => s.isFlying);
  const activeFocus = useShowroom((s) => s.activeFocus);
  const [picked, setView] = useState<InteriorViewId>("overview");
  // Focus points can also drive the cabin camera (e.g. "Display" from the Discover menu).
  const view: InteriorViewId = activeFocus === "screen" ? "screen" : picked;

  const go = (id: InteriorViewId) => {
    setView(id);
    enterInterior(id);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="glass no-scrollbar flex max-w-[calc(100vw-1rem)] items-center gap-1.5 overflow-x-auto rounded-full p-1.5">
        {(Object.keys(INTERIOR_VIEWS) as InteriorViewId[]).map((id) => (
          <Pill key={id} active={view === id} disabled={flying} onClick={() => go(id)}>
            {INTERIOR_VIEWS[id].label}
          </Pill>
        ))}
        <span className="mx-1 h-6 w-px shrink-0 bg-white/10" />
        <button
          type="button"
          onClick={exitInterior}
          disabled={flying}
          className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[10px] font-semibold tracking-[0.24em] text-mist uppercase transition-colors hover:text-pearl"
        >
          <Icon name="exit" className="size-4" /> Exit
        </button>
      </div>
      <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase">
        {view === "overview" ? "Drag to look around · Scroll to zoom" : "Drag to orbit · Scroll to zoom"}
      </p>
    </div>
  );
}
