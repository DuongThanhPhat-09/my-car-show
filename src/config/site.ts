export const SITE = {
  name: "Lamborghini Aventador S — 3D Showroom",
  shortName: "Aventador S",
  description:
    "Explore the Lamborghini Aventador S in a real-time 3D showroom. Preview Verde Mantis, Arancio Argos and the full palette, raise the scissor doors and active wing, see the V12 and step into the cockpit.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en_US",
  keywords: [
    "3D car configurator",
    "luxury car showroom",
    "Lamborghini Aventador",
    "Aventador S",
    "V12 supercar",
    "WebGL car viewer",
    "scissor doors",
    "car paint configurator",
  ],
} as const;

/** Published package / headline figures for the Aventador S – verify on lamborghini.com. */
export const CAR_SPECS = [
  { label: "Length", value: "4,797 mm" },
  { label: "Width", value: "2,030 mm" },
  { label: "Height", value: "1,136 mm" },
  { label: "Wheelbase", value: "2,700 mm" },
  { label: "Power", value: "740 CV" },
  { label: "0–100 km/h", value: "2.9 s" },
] as const;
