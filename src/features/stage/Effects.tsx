"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import * as THREE from "three";
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  N8AO,
  Noise,
  Outline,
  SMAA,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, KernelSize, ToneMappingMode } from "postprocessing";
import { useShowroom } from "@/store/useShowroomStore";
import { FOCUS_POINTS } from "@/features/car/config/car.config";
import { carRegistry } from "@/features/car/rig/carRegistry";

function useHighlightSelection() {
  const activeFocus = useShowroom((s) => s.activeFocus);
  const [selection, setSelection] = useState<THREE.Object3D[]>([]);
  useEffect(() => {
    const update = () => {
      const fp = FOCUS_POINTS.find((f) => f.id === activeFocus);
      setSelection(fp ? carRegistry.meshesFor(fp.highlight) : []);
    };
    update();
    return carRegistry.subscribe(update);
  }, [activeFocus]);
  return selection;
}

/**
 * Post-processing stack (HDR, half-float buffers):
 *   N8AO (ambient occlusion → contact darkening / GI feel)
 *   → Depth of field (detail focus only) → Bloom (LEDs above 1.0 luminance)
 *   → Outline highlight → Khronos PBR Neutral tone mapping (colour-accurate
 *   paint, designed for product visualisation) → SMAA → vignette → film grain.
 */
export function Effects() {
  const quality = useShowroom((s) => s.quality);
  const activeFocus = useShowroom((s) => s.activeFocus);
  const mode = useShowroom((s) => s.mode);
  const selection = useHighlightSelection();

  const focus = FOCUS_POINTS.find((f) => f.id === activeFocus);
  const dofTarget = useMemo(() => (focus ? new THREE.Vector3(...focus.view.target) : null), [focus]);

  if (quality === "low") return null;
  const high = quality === "high";

  const effects: ReactElement[] = [
    <N8AO
      key="ao"
      halfRes={!high}
      quality={high ? "high" : "medium"}
      aoRadius={0.55}
      distanceFalloff={0.7}
      intensity={mode === "interior" ? 1.6 : 2.6}
      color="black"
    />,
  ];
  if (high && dofTarget && mode === "exterior") {
    effects.push(<DepthOfField key="dof" target={dofTarget} worldFocusRange={0.9} bokehScale={2.6} height={720} />);
  }
  effects.push(
    <Bloom key="bloom" mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.25} intensity={0.9} radius={0.72} levels={7} />,
  );
  if (selection.length) {
    effects.push(
      <Outline
        key="outline"
        selection={selection}
        visibleEdgeColor={0xd8e6ff}
        hiddenEdgeColor={0x1b2430}
        edgeStrength={3.2}
        pulseSpeed={0.35}
        blur
        kernelSize={KernelSize.SMALL}
        xRay={false}
      />,
    );
  }
  effects.push(<ToneMapping key="tm" mode={ToneMappingMode.NEUTRAL} />);
  if (!high) effects.push(<SMAA key="smaa" />);
  effects.push(
    <Vignette key="vignette" offset={0.24} darkness={0.66} />,
    <Noise key="grain" opacity={0.035} premultiply blendFunction={BlendFunction.SOFT_LIGHT} />,
  );

  return (
    <EffectComposer multisampling={high ? 4 : 0} enableNormalPass={false} stencilBuffer={false} autoClear={false}>
      {effects}
    </EffectComposer>
  );
}
