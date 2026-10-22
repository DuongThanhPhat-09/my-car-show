"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
export { cx };

export function IconButton({
  icon,
  label,
  active,
  className,
  showLabel,
  ...rest
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  showLabel?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cx(
        "group relative flex shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-mist transition-all duration-500 ease-lux",
        "hover:bg-white/[0.06] hover:text-pearl focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/40",
        active && "bg-white/[0.09] text-pearl",
        className,
      )}
      {...rest}
    >
      <Icon name={icon} className="size-5" />
      {showLabel && <span className="text-[9px] font-semibold tracking-[0.22em] uppercase">{label}</span>}
      <span
        className={cx(
          "absolute bottom-1 h-px w-4 rounded-full bg-accent transition-all duration-500 ease-lux",
          active ? "opacity-100" : "opacity-0",
        )}
      />
    </button>
  );
}

export function Pill({
  children,
  active,
  className,
  ...rest
}: { children: ReactNode; active?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cx(
        "shrink-0 rounded-full border px-4 py-2 text-[10px] font-semibold tracking-[0.24em] uppercase transition-all duration-500 ease-lux",
        active
          ? "border-white/70 bg-pearl text-ink"
          : "border-white/10 text-mist hover:border-white/30 hover:text-pearl",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Swatch({
  color,
  label,
  active,
  finish,
  onClick,
}: {
  color: string;
  label: string;
  active?: boolean;
  finish?: "gloss" | "metallic" | "pearl" | "matte";
  onClick: () => void;
}) {
  // Swatch preview approximates each finish's look with CSS gradients.
  const overlay =
    finish === "matte"
      ? "radial-gradient(circle at 35% 30%, rgb(255 255 255 / 0.12), transparent 60%)"
      : finish === "pearl"
        ? "conic-gradient(from 200deg, rgb(255 220 240 / 0.28), rgb(200 240 255 / 0.28), rgb(255 255 220 / 0.25), rgb(255 220 240 / 0.28))"
        : "radial-gradient(circle at 32% 28%, rgb(255 255 255 / 0.55), transparent 42%)";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cx(
        "relative size-11 shrink-0 rounded-full p-[3px] transition-all duration-500 ease-lux",
        active ? "ring-1 ring-white/80 ring-offset-2 ring-offset-transparent" : "ring-1 ring-white/10 hover:ring-white/40",
      )}
    >
      <span
        className="block size-full rounded-full shadow-[inset_0_-6px_12px_rgb(0_0_0/0.45)]"
        style={{ background: `${overlay}, ${color}` }}
      />
    </button>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cx(
        "relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-500 ease-lux",
        checked ? "border-white/60 bg-pearl" : "border-white/15 bg-white/5",
      )}
    >
      <span
        className={cx(
          "absolute top-1/2 size-4 -translate-y-1/2 rounded-full transition-all duration-500 ease-lux",
          checked ? "left-[22px] bg-ink" : "left-1 bg-white/60",
        )}
      />
    </button>
  );
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
