"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useShowroom } from "@/store/useShowroomStore";
import { LamborghiniMark } from "@/components/brand/LamborghiniMark";

const MIN_DURATION = 2.4; // seconds – the brand moment is part of the experience

/**
 * Premium loading sequence:
 *  1. wordmark letters rise in, hairline progress fills (real asset progress,
 *     smoothed so it never jumps backwards or stalls visibly)
 *  2. waits for asset download AND shader compilation (sceneReady)
 *  3. curtains part → phase "intro" hands over to the camera reveal flight
 */
export function LoadingScreen() {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  // Reported by ProgressReporter inside the canvas – keeps three.js out of this chunk.
  const progress = useShowroom((s) => s.assetProgress);
  const active = useShowroom((s) => s.assetsActive);
  const sceneReady = useShowroom((s) => s.sceneReady);
  const phase = useShowroom((s) => s.phase);
  const [gone, setGone] = useState(false);
  const shown = useRef({ value: 0 });
  const started = useRef(performance.now());

  useGSAP(
    () => {
      gsap.from(".ls-letter", { yPercent: 110, opacity: 0, duration: 1.2, ease: "expo.out", stagger: 0.06, delay: 0.15 });
      gsap.from(".ls-fade", { opacity: 0, y: 8, duration: 1.2, ease: "power3.out", delay: 0.7, stagger: 0.1 });
    },
    { scope: root },
  );

  // Progress = 90 % real asset loading + 10 % shader warm-up.
  useEffect(() => {
    const assets = active ? progress : 100;
    const target = Math.min(100, assets * 0.9 + (sceneReady ? 10 : 0));
    gsap.to(shown.current, {
      value: Math.max(shown.current.value, target),
      duration: 0.9,
      ease: "power2.out",
      overwrite: true,
      onUpdate: () => {
        const v = shown.current.value;
        if (bar.current) bar.current.style.transform = `scaleX(${v / 100})`;
        if (counter.current) counter.current.textContent = String(Math.round(v)).padStart(3, "0");
        useShowroom.getState().setLoadProgress(v);
      },
    });
  }, [progress, active, sceneReady]);

  // The exit timeline is started once and only killed on unmount – it changes
  // `phase` itself, so it must not depend on state it mutates.
  const exit = useRef<gsap.core.Timeline | null>(null);
  useEffect(() => () => void exit.current?.kill(), []);
  useEffect(() => {
    if (exit.current || !sceneReady || active) return;
    const wait = Math.max(0, MIN_DURATION - (performance.now() - started.current) / 1000);
    const paint = () => {
      if (bar.current) bar.current.style.transform = `scaleX(${shown.current.value / 100})`;
      if (counter.current) counter.current.textContent = String(Math.round(shown.current.value)).padStart(3, "0");
    };
    exit.current = gsap
      .timeline({ delay: wait + 0.35 })
      .to(shown.current, { value: 100, duration: 0.4, onUpdate: paint, overwrite: true })
      .to(".ls-content", { opacity: 0, y: -12, duration: 0.7, ease: "power2.in" }, "+=0.15")
      .add(() => useShowroom.getState().setPhase("intro"))
      .to(".ls-curtain-top", { yPercent: -100, duration: 1.5, ease: "expo.inOut" }, "<")
      .to(".ls-curtain-bottom", { yPercent: 100, duration: 1.5, ease: "expo.inOut" }, "<")
      .add(() => setGone(true));
  }, [sceneReady, active]);

  if (gone) return null;

  return (
    <div ref={root} className="fixed inset-0 z-50" aria-live="polite" aria-busy={phase === "loading"}>
      <div className="ls-curtain-top absolute inset-x-0 top-0 h-1/2 bg-ink" />
      <div className="ls-curtain-bottom absolute inset-x-0 bottom-0 h-1/2 bg-ink" />

      <div className="ls-content absolute inset-0 flex flex-col items-center justify-center px-6">
        <LamborghiniMark className="ls-fade mb-8 h-16 w-auto" />
        <h1 className="flex overflow-hidden font-display text-[clamp(1.6rem,5.5vw,4.2rem)] font-bold leading-none tracking-[0.14em] text-pearl">
          {"LAMBORGHINI".split("").map((c, i) => (
            <span key={i} className="ls-letter inline-block">
              {c}
            </span>
          ))}
        </h1>
        <div className="ls-fade mt-4 text-sm font-light tracking-[0.5em] text-mist">AVENTADOR S · LP 740-4</div>

        <div className="ls-fade mt-16 w-[min(340px,70vw)]">
          <div className="relative h-px w-full overflow-hidden bg-white/10">
            <div ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-pearl" />
            <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent [animation:sheen_2.2s_ease-in-out_infinite]" />
          </div>
          <div className="mt-4 flex items-center justify-between text-[10px] tracking-[0.3em] text-mist uppercase">
            <span>{sceneReady ? "Preparing reveal" : active ? "Loading assets" : "Compiling materials"}</span>
            <span ref={counter} className="tabular-nums text-pearl">
              000
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
