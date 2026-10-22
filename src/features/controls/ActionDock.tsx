"use client";

import { useShowroom, type PartId } from "@/store/useShowroomStore";
import { IconButton } from "@/components/ui/primitives";
import type { IconName } from "@/components/ui/Icon";

const PARTS: Array<{ id: PartId; label: string; icon: IconName; mirror?: boolean }> = [
  { id: "doorL", label: "Door L", icon: "door", mirror: true },
  { id: "doorR", label: "Door R", icon: "door" },
  { id: "frunk", label: "Frunk", icon: "hood" },
  { id: "engineCover", label: "Engine", icon: "trunk" },
  { id: "wing", label: "Wing", icon: "wing" },
];

/** Bottom dock: body animations + light controls. */
export function ActionDock() {
  const parts = useShowroom((s) => s.parts);
  const togglePart = useShowroom((s) => s.togglePart);
  const wheels = useShowroom((s) => s.wheelsSpinning);
  const lights = useShowroom((s) => s.lightsOn);
  const ambient = useShowroom((s) => s.ambientOn);
  const toggleWheels = useShowroom((s) => s.toggleWheels);
  const toggleLights = useShowroom((s) => s.toggleLights);
  const toggleAmbient = useShowroom((s) => s.toggleAmbient);

  return (
    <div className="glass no-scrollbar flex max-w-[calc(100vw-1rem)] items-center gap-0.5 overflow-x-auto rounded-3xl p-1.5">
      {PARTS.map((p) => (
        <IconButton
          key={p.id}
          icon={p.icon}
          label={p.label}
          showLabel
          active={parts[p.id]}
          onClick={() => togglePart(p.id)}
          className={p.mirror ? "[&_svg]:-scale-x-100" : undefined}
        />
      ))}
      <span className="mx-1.5 h-8 w-px shrink-0 bg-white/10" />
      <IconButton icon="wheel" label="Wheels" showLabel active={wheels} onClick={toggleWheels} />
      <IconButton icon="light" label="LED" showLabel active={lights} onClick={toggleLights} />
      <IconButton icon="ambient" label="Ambient" showLabel active={ambient} onClick={toggleAmbient} />
    </div>
  );
}
