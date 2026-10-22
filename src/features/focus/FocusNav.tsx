"use client";

import { useShowroom } from "@/store/useShowroomStore";
import { FOCUS_POINTS } from "@/features/car/config/car.config";
import { cx } from "@/components/ui/primitives";
import { useFocusActions } from "./useFocusActions";

/** Numbered index of every focus point – desktop left rail, mobile chip row. */
export function FocusNav() {
  const active = useShowroom((s) => s.activeFocus);
  const { focus } = useFocusActions();

  return (
    <nav aria-label="Discover details" className="pointer-events-auto">
      <ol className="no-scrollbar flex gap-1 overflow-x-auto md:flex-col md:gap-0.5">
        {FOCUS_POINTS.map((fp, i) => {
          const isActive = active === fp.id;
          return (
            <li key={fp.id} className="shrink-0">
              <button
                type="button"
                onClick={() => focus(fp.id)}
                aria-current={isActive}
                className={cx(
                  "group flex items-center gap-3 rounded-full px-3 py-2 text-left transition-all duration-500 ease-lux md:rounded-xl md:py-1.5",
                  "max-md:glass",
                  isActive ? "text-pearl" : "text-mist hover:text-pearl",
                )}
              >
                <span className="font-display text-[9px] tabular-nums text-white/35">{String(i + 1).padStart(2, "0")}</span>
                <span
                  className={cx(
                    "hidden h-px bg-pearl transition-all duration-700 ease-lux md:block",
                    isActive ? "w-6" : "w-2 opacity-40 group-hover:w-4 group-hover:opacity-80",
                  )}
                />
                <span className="text-[11px] font-medium tracking-[0.16em] whitespace-nowrap uppercase">{fp.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
