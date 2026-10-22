// Self-host the Draco + Basis (KTX2) decoders so the showroom never depends on a third-party CDN.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const jobs = [
  { from: "node_modules/three/examples/jsm/libs/draco/gltf", to: "public/draco" },
  { from: "node_modules/three/examples/jsm/libs/basis", to: "public/basis" },
];

for (const { from, to } of jobs) {
  const src = resolve(root, from);
  const dest = resolve(root, to);
  if (!existsSync(src)) {
    console.warn(`[copy-decoders] skipped, not found: ${from}`);
    continue;
  }
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`[copy-decoders] ${from} -> ${to}`);
}
