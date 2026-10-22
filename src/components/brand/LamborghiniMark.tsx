import type { SVGProps } from "react";

/** Stylised Lamborghini shield (same geometry as the 3D bonnet badge texture). */
export function LamborghiniMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 84 100" aria-hidden {...props}>
      <defs>
        <linearGradient id="lambo-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6e3a1" />
          <stop offset="0.45" stopColor="#b8892f" />
          <stop offset="0.6" stopColor="#e9cf7f" />
          <stop offset="1" stopColor="#9c7326" />
        </linearGradient>
      </defs>
      <path d="M0 0H84V55Q84 85 42 100Q0 85 0 55Z" fill="url(#lambo-gold)" />
      <path d="M5 5H79V55Q79 81 42 94.5Q5 81 5 55Z" fill="#08080a" />
      <path
        fill="url(#lambo-gold)"
        d="M27 58Q25 46 33 44Q42 41 51 42Q54 41 56 37L58 33L58 39Q61 41 61 45L57 46Q55 50 59 53L62 58L59 59L53 53Q48 55 46 62L43 62Q44 57 42 53Q35 54 31 56L32 65L29 65L26 57Q20 59 18 52Q21 56 27 58Z"
      />
    </svg>
  );
}
