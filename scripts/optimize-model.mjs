// Production asset pipeline for the car GLB.
//
//   npm run optimize:model -- path/to/source.glb
//
// Produces three LOD levels in public/models/:
//   car.glb      – LOD0, Draco geometry, KTX2 (UASTC normals / ETC1S color) or WebP textures ≤ 4K
//   car-lod1.glb – 50 % triangles, textures ≤ 2K
//   car-lod2.glb – 15 % triangles, textures ≤ 1K
//
// KTX2 needs KTX-Software (`toktx`) on PATH. Without it the script falls back to WebP.
import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const input = process.argv[2];
if (!input || !existsSync(input)) {
  console.error("Usage: npm run optimize:model -- <source.glb>");
  process.exit(1);
}

const out = resolve(import.meta.dirname, "../public/models");
mkdirSync(out, { recursive: true });

let hasToktx = true;
try {
  execSync("toktx --version", { stdio: "ignore" });
} catch {
  hasToktx = false;
  console.warn("[optimize] toktx not found → using WebP textures instead of KTX2.");
}
const textureCompress = hasToktx ? "ktx2" : "webp";

const levels = [
  { file: "car.glb", simplify: null, size: 4096 },
  { file: "car-lod1.glb", simplify: 0.5, size: 2048 },
  { file: "car-lod2.glb", simplify: 0.15, size: 1024 },
];

for (const { file, simplify, size } of levels) {
  const target = resolve(out, file);
  const flags = [
    "--compress draco",
    `--texture-compress ${textureCompress}`,
    `--texture-size ${size}`,
    // Keep node names: the rig and focus points address parts by name.
    "--join false",
    "--flatten false",
    "--instance true",
    simplify ? `--simplify true --simplify-ratio ${simplify} --simplify-error 0.001` : "--simplify false",
  ];
  const cmd = `npx gltf-transform optimize "${input}" "${target}" ${flags.join(" ")}`;
  console.log(`\n[optimize] ${file}\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

console.log("\n[optimize] done. Set MODEL.url in src/features/car/config/car.config.ts to /models/car.glb");
