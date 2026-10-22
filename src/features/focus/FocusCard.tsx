"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useShowroom } from "@/store/useShowroomStore";
import { FOCUS_POINTS } from "@/features/car/config/car.config";
import { Icon } from "@/components/ui/Icon";
import { stepFocus, useFocusActions } from "./useFocusActions";

/** Editorial info card shown while a detail is in focus. */
export function FocusCard() {
  const activeFocus = useShowroom((s) => s.activeFocus);
  const isFlying = useShowroom((s) => s.isFlying);
  const { focus, clearFocus } = useFocusActions();
  const card = useRef<HTMLDivElement>(null);
  const fp = FOCUS_POINTS.find((f) => f.id === activeFocus);
  // Keep rendering the last point while the card fades out.
  const shown = useRef(fp);
  if (fp) shown.current = fp;
  const content = shown.current;

  useGSAP(
    () => {
      if (!card.current) return;
      if (!fp) {
        gsap.to(card.current, { autoAlpha: 0, y: 24, duration: 0.5, ease: "power2.in" });
        return;
      }
      // Reveal once the camera is close to arrival – text lands with the shot.
      const tl = gsap.timeline({ delay: isFlying ? 0.55 : 0 });
      tl.fromTo(card.current, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out" });
      tl.fromTo(
        ".fc-line",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.07 },
        "<0.1",
      );
    },
    { dependencies: [fp?.id], scope: card },
  );

  return (
    <div
      ref={card}
      role="dialog"
      aria-label={content?.title}
      aria-hidden={!fp}
      className="glass invisible pointer-events-auto w-[min(420px,calc(100vw-1rem))] rounded-3xl p-6 opacity-0 md:p-7"
    >
      {content && (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="fc-line eyebrow text-accent">{content.kicker}</div>
              <h2 className="fc-line mt-2 text-2xl font-light leading-tight tracking-wide md:text-[28px]">{content.title}</h2>
            </div>
            <button
              type="button"
              onClick={clearFocus}
              className="-mt-1 -mr-2 rounded-full p-2 text-mist transition-colors hover:bg-white/10 hover:text-pearl"
              aria-label="Close detail"
            >
              <Icon name="close" />
            </button>
          </div>
          <p className="fc-line mt-4 text-[13px] leading-relaxed text-mist">{content.description}</p>
          <dl className="fc-line mt-6 grid grid-cols-3 gap-3 border-t border-line pt-5">
            {content.specs.map((s) => (
              <div key={s.label}>
                <dt className="text-[9px] tracking-[0.24em] text-mist uppercase">{s.label}</dt>
                <dd className="mt-1.5 text-base font-light tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
          {content.note && <p className="fc-line mt-3 text-[10px] leading-snug text-white/40">{content.note}</p>}
          <div className="fc-line mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => focus(stepFocus(content.id, -1))}
              className="flex items-center gap-1 text-[10px] font-semibold tracking-[0.24em] text-mist uppercase hover:text-pearl"
            >
              <Icon name="chevronLeft" className="size-4" /> Prev
            </button>
            <button
              type="button"
              onClick={() => focus(stepFocus(content.id, 1))}
              className="flex items-center gap-1 text-[10px] font-semibold tracking-[0.24em] text-mist uppercase hover:text-pearl"
            >
              Next <Icon name="chevronRight" className="size-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
