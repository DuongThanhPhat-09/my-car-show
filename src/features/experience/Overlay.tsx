"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useShowroom } from "@/store/useShowroomStore";
import { ConfiguratorPanel } from "@/features/configurator/ConfiguratorPanel";
import { ActionDock } from "@/features/controls/ActionDock";
import { ViewPresets } from "@/features/controls/ViewPresets";
import { FocusCard } from "@/features/focus/FocusCard";
import { FocusNav } from "@/features/focus/FocusNav";
import { InteriorControls } from "@/features/interior/InteriorControls";
import { cx } from "@/components/ui/primitives";
import { TopBar } from "./TopBar";

/** DOM interface layered over the canvas. Revealed after the intro flight. */
export function Overlay() {
  const root = useRef<HTMLDivElement>(null);
  const phase = useShowroom((s) => s.phase);
  const mode = useShowroom((s) => s.mode);
  const activeFocus = useShowroom((s) => s.activeFocus);
  const panelOpen = useShowroom((s) => s.panelOpen);

  useGSAP(
    () => {
      if (phase !== "ready") return;
      gsap.fromTo(
        ".ov-reveal",
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 1.3, ease: "expo.out", stagger: 0.09 },
      );
    },
    { dependencies: [phase], scope: root },
  );

  // Swap bottom controls with a soft cross-fade when entering / leaving the cabin.
  useGSAP(
    () => {
      if (phase !== "ready") return;
      gsap.fromTo(".ov-bottom", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out" });
    },
    { dependencies: [mode], scope: root },
  );

  return (
    <div ref={root} className="pointer-events-none fixed inset-0 z-20 flex flex-col">
      <div className="ov-reveal invisible">
        <TopBar />
      </div>

      {/* Desktop left rail */}
      <div className="ov-reveal invisible absolute top-1/2 left-8 hidden -translate-y-1/2 md:block">
        <div className="eyebrow mb-4 pl-3">Discover</div>
        <FocusNav />
      </div>

      {/* Desktop right presets (hidden while the configurator is open) */}
      <div
        className={cx(
          "ov-reveal invisible absolute top-1/2 right-8 hidden -translate-y-1/2 transition-opacity duration-500 md:block",
          (panelOpen || mode === "interior" || activeFocus) && "!pointer-events-none !opacity-0",
        )}
      >
        <div className="pointer-events-auto">
          <ViewPresets />
        </div>
      </div>

      <div className="mt-auto flex flex-col items-center gap-3 px-2 pb-3 md:pb-7">
        <div className="pointer-events-auto w-full max-md:flex max-md:justify-center md:absolute md:top-1/2 md:right-8 md:w-auto md:-translate-y-1/2">
          <FocusCard />
        </div>

        {/* Mobile focus chips */}
        <div className={cx("ov-reveal invisible w-full md:hidden", (activeFocus || panelOpen) && "hidden")}>
          <FocusNav />
        </div>

        {/* On phones the configurator sheet takes over the bottom of the screen. */}
        <div className={cx("ov-reveal ov-bottom invisible pointer-events-auto", panelOpen && "max-md:hidden")}>
          {mode === "interior" ? <InteriorControls /> : <ActionDock />}
        </div>

        <p className="ov-reveal invisible hidden text-[10px] tracking-[0.32em] text-white/35 uppercase md:block">
          {/* Inner span: GSAP owns the wrapper's opacity, React owns this one. */}
          <span className={cx("transition-opacity duration-500", (mode === "interior" || activeFocus) && "opacity-0")}>
            Drag to rotate · Scroll to zoom into details · Right-drag to pan
          </span>
        </p>
      </div>

      <div className="pointer-events-auto">
        <ConfiguratorPanel />
      </div>
    </div>
  );
}
