"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useShowroom } from "@/store/useShowroomStore";
import { detectInitialQuality } from "@/lib/device/detectQuality";
import { LoadingScreen } from "@/features/loading/LoadingScreen";
import { useFocusActions } from "@/features/focus/useFocusActions";
import { Overlay } from "./Overlay";

// Lazy: three.js, R3F, drei and postprocessing ship in a separate chunk that
// starts downloading only after the server-rendered page is interactive.
const Scene = dynamic(() => import("./Scene"), { ssr: false });

function WebGLUnavailable() {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-8 text-center">
      <div>
        <div className="eyebrow mb-3">Showroom unavailable</div>
        <p className="max-w-sm text-sm text-mist">
          Your browser does not support WebGL 2. Please use a recent version of Chrome, Edge, Safari or Firefox.
        </p>
      </div>
    </div>
  );
}

/** Client root of the 3D experience. */
export function ShowroomExperience() {
  const [support, setSupport] = useState<"pending" | "ok" | "none">("pending");

  useEffect(() => {
    const ok = !!document.createElement("canvas").getContext("webgl2");
    const { tier, locked } = detectInitialQuality();
    useShowroom.getState().setQuality(tier, locked);
    setSupport(ok ? "ok" : "none");
  }, []);

  // Esc backs out of whatever is open, like a native app.
  const { clearFocus } = useFocusActions();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const s = useShowroom.getState();
      if (s.panelOpen) s.setPanelOpen(false);
      else if (s.activeFocus && !s.isFlying) clearFocus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearFocus]);

  if (support === "none") return <WebGLUnavailable />;

  return (
    <>
      {support === "ok" && <Scene />}
      <Overlay />
      <LoadingScreen />
    </>
  );
}
