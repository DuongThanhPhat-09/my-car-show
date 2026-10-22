"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useShowroom } from "@/store/useShowroomStore";
import { Icon } from "@/components/ui/Icon";
import { Pill, Swatch, Toggle, cx } from "@/components/ui/primitives";
import type { PaintFinish } from "@/features/car/materials/paintMaterial";
import {
  AMBIENTS,
  CALIPERS,
  FINISH_LABELS,
  LEATHERS,
  PAINTS,
  MODEL_CODE,
  MODEL_NAME,
  RIMS,
  findOption,
} from "./options";
import { useFocusActions } from "@/features/focus/useFocusActions";

function Section({ title, value, children }: { title: string; value?: string; children: ReactNode }) {
  return (
    <section className="cfg-section border-t border-line py-6 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h3 className="eyebrow">{title}</h3>
        {value && <span className="truncate text-xs text-pearl/80">{value}</span>}
      </div>
      {children}
    </section>
  );
}

/**
 * Configurator drawer (desktop: right rail, mobile: bottom sheet). Every
 * change is written to the store; ConfiguratorSync tweens the materials.
 */
export function ConfiguratorPanel() {
  const open = useShowroom((s) => s.panelOpen);
  const setOpen = useShowroom((s) => s.setPanelOpen);
  const cfg = useShowroom((s) => s.configuration);
  const configure = useShowroom((s) => s.configure);
  const { enterInterior, exitInterior } = useFocusActions();
  const mode = useShowroom((s) => s.mode);
  const panel = useRef<HTMLDivElement>(null);

  // Off-canvas start position: right rail on desktop, below the fold on mobile.
  useGSAP(() => {
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    gsap.set(panel.current, { xPercent: mobile ? 0 : 110, yPercent: mobile ? 110 : 0 });
  });

  useGSAP(
    () => {
      if (!panel.current) return;
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      gsap.to(panel.current, {
        xPercent: mobile ? 0 : open ? 0 : 110,
        yPercent: mobile ? (open ? 0 : 110) : 0,
        autoAlpha: open ? 1 : 0,
        duration: 0.9,
        ease: "expo.out",
      });
      if (open) {
        gsap.fromTo(
          ".cfg-section",
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.06, delay: 0.1 },
        );
      }
    },
    { dependencies: [open], scope: panel },
  );

  const paint = findOption(PAINTS, cfg.paintId);

  return (
    <aside
      ref={panel}
      aria-label="Configure your Aventador"
      aria-hidden={!open}
      className={cx(
        "glass invisible fixed z-30 flex flex-col overflow-hidden opacity-0",
        "inset-x-2 bottom-2 max-h-[72vh] rounded-3xl",
        "md:inset-x-auto md:top-24 md:right-5 md:bottom-28 md:max-h-none md:w-[380px]",
      )}
    >
      <header className="flex items-center justify-between px-6 pt-6 pb-4">
        <div>
          <div className="eyebrow">Configurator</div>
          <h2 className="mt-1 text-lg font-light tracking-wide">Your {MODEL_NAME}</h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full p-2 text-mist transition-colors hover:bg-white/10 hover:text-pearl"
          aria-label="Close configurator"
        >
          <Icon name="close" />
        </button>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-6 pb-6">
        <Section title="Exterior Paint" value={paint.name}>
          <div className="mb-4 flex flex-wrap gap-2">
            {(Object.keys(FINISH_LABELS) as PaintFinish[]).map((f) => (
              <Pill key={f} active={cfg.finish === f} onClick={() => configure({ finish: f })}>
                {FINISH_LABELS[f].label}
              </Pill>
            ))}
          </div>
          <p className="mb-4 text-xs text-mist">{FINISH_LABELS[cfg.finish].description}</p>
          <div className="flex flex-wrap gap-2.5">
            {PAINTS.map((p) => (
              <Swatch
                key={p.id}
                color={p.color}
                label={p.name}
                finish={cfg.finish}
                active={cfg.paintId === p.id}
                onClick={() => configure({ paintId: p.id, finish: p.id === cfg.paintId ? cfg.finish : p.finish })}
              />
            ))}
          </div>
        </Section>

        <Section title="Carbon Exterior Pack" value={cfg.carbonPack ? "On" : "Off"}>
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs leading-relaxed text-mist">
              Twill-weave carbon roof, mirror caps, splitter, side blades, diffuser and cabin trims.
            </p>
            <Toggle label="Carbon pack" checked={cfg.carbonPack} onChange={() => configure({ carbonPack: !cfg.carbonPack })} />
          </div>
        </Section>

        <Section title="Wheels" value={findOption(RIMS, cfg.rimId).name}>
          <div className="flex flex-wrap gap-2.5">
            {RIMS.map((r) => (
              <Swatch key={r.id} color={r.color} label={r.name} finish="metallic" active={cfg.rimId === r.id} onClick={() => configure({ rimId: r.id })} />
            ))}
          </div>
        </Section>

        <Section title="Brake Calipers" value={findOption(CALIPERS, cfg.caliperId).name}>
          <div className="flex flex-wrap gap-2.5">
            {CALIPERS.map((c) => (
              <Swatch key={c.id} color={c.color} label={c.name} finish="gloss" active={cfg.caliperId === c.id} onClick={() => configure({ caliperId: c.id })} />
            ))}
          </div>
        </Section>

        <Section title="Interior" value={findOption(LEATHERS, cfg.leatherId).name}>
          <div className="flex flex-wrap gap-2.5">
            {LEATHERS.map((l) => (
              <Swatch key={l.id} color={l.color} label={l.name} finish="matte" active={cfg.leatherId === l.id} onClick={() => configure({ leatherId: l.id })} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => (mode === "interior" ? exitInterior() : enterInterior())}
            className="mt-4 text-[10px] font-semibold tracking-[0.24em] text-accent uppercase hover:text-pearl"
          >
            {mode === "interior" ? "← Back to exterior" : "View in cabin →"}
          </button>
        </Section>

        <Section title="Ambient Lighting" value={findOption(AMBIENTS, cfg.ambientId).name}>
          <div className="flex flex-wrap gap-2.5">
            {AMBIENTS.map((a) => (
              <Swatch key={a.id} color={a.color} label={a.name} finish="gloss" active={cfg.ambientId === a.id} onClick={() => configure({ ambientId: a.id })} />
            ))}
          </div>
        </Section>
      </div>

      <footer className="flex items-center justify-between gap-4 border-t border-line px-6 py-5">
        <div>
          <div className="eyebrow">{MODEL_CODE}</div>
          <div className="mt-1 text-xl font-light">Price on request</div>
          <p className="mt-1 max-w-[200px] text-[9px] leading-snug text-white/40">
            Production ended in 2022. Colour swatches are approximations.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-pearl px-5 py-3 text-[10px] font-bold tracking-[0.24em] text-ink uppercase transition-transform duration-500 ease-lux hover:scale-[1.03]"
        >
          Enquire
        </button>
      </footer>
    </aside>
  );
}
