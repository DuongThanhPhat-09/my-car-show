import type { SVGProps } from "react";

const paths = {
  door: "M5 20V5.5A1.5 1.5 0 0 1 6.5 4H16l3 4v12M5 20h14M9 12h2",
  hood: "M3 14c2.5-4 6-6 9-6s6.5 2 9 6M5 14h14l-1 4H6z",
  trunk: "M21 14c-2.5-4-6-6-9-6M3 14h18l-1 4H4zM14 8l3-3",
  wheel: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM12 3v5.5M12 15.5V21M3 12h5.5M15.5 12H21",
  light: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z",
  ambient: "M4 15c3 0 3-6 8-6s5 6 8 6M4 19h16",
  seat: "M7 4h6l-1 9h5l1 4H7zM9 21v-4M16 21v-4",
  close: "M6 6l12 12M18 6 6 18",
  chevronLeft: "M15 6l-6 6 6 6",
  chevronRight: "M9 6l6 6-6 6",
  sliders: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4",
  expand: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  camera: "M3 8h4l2-3h6l2 3h4v11H3zM12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z",
  exit: "M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10",
  reset: "M4 12a8 8 0 1 0 2.3-5.6M4 4v5h5",
  steering: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-8 9h5l3 3 3-3h5M12 15v6",
  check: "M5 12l4 4 10-10",
  wing: "M3 9h18M6 9v6M18 9v6M4 17h16",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "size-5", ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}
