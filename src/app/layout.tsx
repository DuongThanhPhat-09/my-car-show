import type { Metadata, Viewport } from "next";
import { Manrope, Syncopate } from "next/font/google";
import { SITE } from "@/config/site";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const syncopate = Syncopate({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-syncopate", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.name, template: `%s · ${SITE.shortName}` },
  description: SITE.description,
  keywords: [...SITE.keywords],
  applicationName: SITE.shortName,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE.shortName,
    title: SITE.name,
    description: SITE.description,
    locale: SITE.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
  category: "automotive",
};

export const viewport: Viewport = {
  themeColor: "#050506",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${syncopate.variable}`}>
      <body>{children}</body>
    </html>
  );
}
