"use client";

import { useShowroom } from "@/store/useShowroomStore";
import { Icon } from "@/components/ui/Icon";
import { LamborghiniMark } from "@/components/brand/LamborghiniMark";
import { cx } from "@/components/ui/primitives";
import { MODEL_CODE, MODEL_NAME } from "@/features/configurator/options";
import { useFocusActions } from "@/features/focus/useFocusActions";

export function TopBar() {
  const mode = useShowroom((s) => s.mode);
  const flying = useShowroom((s) => s.isFlying);
  const panelOpen = useShowroom((s) => s.panelOpen);
  const setPanelOpen = useShowroom((s) => s.setPanelOpen);
  const quality = useShowroom((s) => s.quality);
  const source = useShowroom((s) => s.modelSource);
  const { enterInterior, exitInterior } = useFocusActions();

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };

  return (
    <header className="pointer-events-auto flex items-center justify-between gap-4 px-4 pt-4 md:px-8 md:pt-7">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <LamborghiniMark className="h-8 w-auto shrink-0 sm:h-9" />
        <div>
          <div className="font-display text-[11px] font-bold tracking-[0.18em] sm:text-sm sm:tracking-[0.3em]">LAMBORGHINI</div>
          <div className="mt-0.5 text-[9px] tracking-[0.36em] whitespace-nowrap text-mist uppercase">
            {MODEL_NAME}<span className="hidden sm:inline"> · 3D Showroom</span>
          </div>
        </div>
      </div>

      <div className="glass hidden items-center gap-1 rounded-full p-1 md:flex" role="tablist" aria-label="View mode">
        {(["exterior", "interior"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            disabled={flying}
            onClick={() => (m === "interior" ? enterInterior() : exitInterior())}
            className={cx(
              "rounded-full px-5 py-2 text-[10px] font-semibold tracking-[0.28em] uppercase transition-all duration-500 ease-lux",
              mode === m ? "bg-pearl text-ink" : "text-mist hover:text-pearl",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden text-right lg:block">
          <div className="eyebrow">Model</div>
          <div className="text-sm font-light">{MODEL_CODE}</div>
        </div>
        <span
          className="hidden rounded-full border border-white/10 px-2.5 py-1 text-[9px] tracking-[0.24em] text-white/40 uppercase xl:inline"
          title={source === "procedural" ? "Built-in procedural model – drop /public/models/car.glb to use your asset" : "Production GLB"}
        >
          {quality} · {source === "procedural" ? "preview model" : "glb"}
        </span>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="glass hidden rounded-full p-2.5 text-mist transition-colors hover:text-pearl md:block"
          aria-label="Toggle fullscreen"
        >
          <Icon name="expand" className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setPanelOpen(!panelOpen)}
          aria-expanded={panelOpen}
          className={cx(
            "flex items-center gap-2 rounded-full px-4 py-2.5 text-[10px] font-bold tracking-[0.24em] uppercase transition-all duration-500 ease-lux md:px-5",
            panelOpen ? "bg-white/10 text-pearl" : "bg-pearl text-ink hover:scale-[1.03]",
          )}
        >
          <Icon name="sliders" className="size-4" />
          Configure
        </button>
      </div>
    </header>
  );
}
