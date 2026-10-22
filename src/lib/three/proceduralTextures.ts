import * as THREE from "three";

/**
 * GPU-free procedural texture factory. Every map is generated once on the client,
 * cached, and shared – so the procedural fallback car still gets real PBR detail
 * (weave normals, anisotropy direction maps, leather grain, tread grooves …).
 */

const cache = new Map<string, unknown>();
function memo<T>(key: string, factory: () => T): T {
  if (!cache.has(key)) cache.set(key, factory());
  return cache.get(key) as T;
}

function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function valueNoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * freq, y * freq);
    amp *= 0.5;
    freq *= 2;
  }
  return sum;
}

function finalize<T extends THREE.Texture>(tex: T, opts: { srgb?: boolean; repeat?: [number, number] } = {}) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = opts.srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 16; // clamped by the renderer to the GPU maximum
  if (opts.repeat) tex.repeat.set(...opts.repeat);
  tex.needsUpdate = true;
  return tex;
}

/** Converts a tileable height field into a tangent-space normal map (Sobel). */
export function heightToNormalTexture(height: Float32Array, size: number, strength: number) {
  const data = new Uint8Array(size * size * 4);
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx =
        at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
      const dy =
        at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));
      const nx = -dx * strength;
      const ny = -dy * strength;
      const len = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  return finalize(new THREE.DataTexture(data, size, size, THREE.RGBAFormat));
}

function canvas(size: number, h = size) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = h;
  const ctx = c.getContext("2d")!;
  return { c, ctx };
}

/* ------------------------------------------------------------------ */
/* Carbon fibre – 2×2 twill weave with per-tow anisotropy directions.  */
/* ------------------------------------------------------------------ */
export function carbonTextures() {
  return memo("carbon", () => {
    const size = 512;
    const cells = 16;
    const cell = size / cells;
    const height = new Float32Array(size * size);
    const color = new Uint8Array(size * size * 4);
    const aniso = new Uint8Array(size * size * 4);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cx = Math.floor(x / cell);
        const cy = Math.floor(y / cell);
        // 2×2 twill: the over/under pattern shifts by one cell every row.
        const warp = (cx + cy) % 4 < 2;
        const lx = (x % cell) / cell;
        const ly = (y % cell) / cell;
        const across = warp ? ly : lx; // position across the tow
        const along = warp ? lx : ly; // position along the tow
        const tow = Math.sin(across * Math.PI); // rounded tow cross-section
        const fibres = 0.9 + 0.1 * Math.sin((warp ? y : x) * 2.1 + hash2(cx, cy) * 6);
        const h = tow * (0.75 + 0.25 * Math.sin(along * Math.PI)) * fibres;
        const i = y * size + x;
        height[i] = h;

        const shade = 14 + h * 26 + hash2(x, y) * 4;
        color[i * 4] = shade;
        color[i * 4 + 1] = shade;
        color[i * 4 + 2] = shade + 3;
        color[i * 4 + 3] = 255;

        // Anisotropy map (RG = direction in [-1,1], B = strength).
        aniso[i * 4] = warp ? 255 : 128;
        aniso[i * 4 + 1] = warp ? 128 : 255;
        aniso[i * 4 + 2] = 200 + tow * 55;
        aniso[i * 4 + 3] = 255;
      }
    }

    const map = finalize(new THREE.DataTexture(color, size, size, THREE.RGBAFormat), { srgb: true });
    const anisotropyMap = finalize(new THREE.DataTexture(aniso, size, size, THREE.RGBAFormat));
    const normalMap = heightToNormalTexture(height, size, 2.2);
    return { map, normalMap, anisotropyMap };
  });
}

/* ------------------------------------------------------------------ */
/* Leather – fine grain + optional diamond quilting with stitch rows.  */
/* ------------------------------------------------------------------ */
export function leatherTextures(quilted: boolean) {
  return memo(`leather-${quilted}`, () => {
    const size = 512;
    const height = new Float32Array(size * size);
    const rough = new Uint8Array(size * size * 4);
    const diamonds = 6;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const v = y / size;
        // Pebble grain (cellular-ish fbm, tileable enough at this frequency).
        let h = fbm(u * 96, v * 96, 3) * 0.35 + fbm(u * 24, v * 24, 2) * 0.15;

        if (quilted) {
          const a = (u + v) * diamonds;
          const b = (u - v) * diamonds;
          const da = Math.abs(a - Math.round(a));
          const db = Math.abs(b - Math.round(b));
          const seam = Math.min(da, db);
          // Pillowed cushion between seams.
          h += Math.min(1, seam * 6) * 0.9;
          // Stitch dashes running parallel to every seam.
          const stitchOffset = 0.055;
          const along = da < db ? b : a;
          const near = Math.abs(Math.min(da, db) - stitchOffset);
          if (near < 0.008 && (along * 40) % 1 < 0.6) h += 0.45;
        }

        const i = y * size + x;
        height[i] = h;
        const r = 150 + fbm(u * 64, v * 64, 2) * 60;
        rough[i * 4] = r;
        rough[i * 4 + 1] = r;
        rough[i * 4 + 2] = r;
        rough[i * 4 + 3] = 255;
      }
    }
    const normalMap = heightToNormalTexture(height, size, quilted ? 3.2 : 1.6);
    const roughnessMap = finalize(new THREE.DataTexture(rough, size, size, THREE.RGBAFormat));
    return { normalMap, roughnessMap };
  });
}

/* ------------------------------------------------------------------ */
/* Tyre – tread grooves, sipes and raised sidewall lettering.           */
/* UV layout follows LatheGeometry: u = around, v = along the profile.  */
/* ------------------------------------------------------------------ */
export function tireTextures() {
  return memo("tire", () => {
    const w = 2048;
    const h = 256;
    const { c, ctx } = canvas(w, h);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    // Tread band in the middle of the profile.
    const treadTop = h * 0.36;
    const treadBottom = h * 0.64;
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, treadTop, w, treadBottom - treadTop);
    ctx.fillStyle = "#000";
    for (const g of [0.41, 0.48, 0.52, 0.59]) ctx.fillRect(0, h * g - 2, w, 4); // circumferential grooves
    ctx.strokeStyle = "#202020";
    ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, treadTop);
      ctx.lineTo(x + 10, h * 0.41);
      ctx.moveTo(x + 6, h * 0.59);
      ctx.lineTo(x + 16, treadBottom);
      ctx.stroke();
    }

    // Raised sidewall lettering (both sidewalls, twice around).
    ctx.fillStyle = "#9a9a9a";
    ctx.font = "600 34px Arial, Helvetica, sans-serif";
    ctx.textBaseline = "middle";
    for (const [vy, flip] of [
      [h * 0.18, false],
      [h * 0.82, true],
    ] as const) {
      for (let k = 0; k < 2; k++) {
        ctx.save();
        ctx.translate(k * (w / 2) + 120, vy);
        if (flip) ctx.scale(1, -1);
        ctx.fillText("P ZERO CORSA   355/25 ZR21  (107Y)", 0, 0);
        ctx.restore();
      }
    }

    const img = ctx.getImageData(0, 0, w, h).data;
    // Height field must be square for the Sobel helper – resample.
    const size = 1024;
    const height = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      const sy = Math.floor((y / size) * h);
      for (let x = 0; x < size; x++) {
        const sx = Math.floor((x / size) * w);
        height[y * size + x] = img[(sy * w + sx) * 4] / 255 + hash2(x, y) * 0.02;
      }
    }
    c.width = 1; // release canvas memory
    return { normalMap: heightToNormalTexture(height, size, 2.5) };
  });
}

/* ------------------------------------------------------------------ */
/* Cross-drilled brake disc (radial UV from CircleGeometry-like caps).  */
/* ------------------------------------------------------------------ */
export function brakeDiscTexture() {
  return memo("disc", () => {
    const size = 512;
    const { c, ctx } = canvas(size);
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "#3a3a3c");
    g.addColorStop(0.55, "#8b8b8f");
    g.addColorStop(1, "#6a6a6e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    // Brushed rings
    for (let r = size * 0.28; r < size * 0.5; r += 1.5) {
      ctx.strokeStyle = `rgba(255,255,255,${0.03 + hash2(r, 1) * 0.05})`;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Drilled holes in spiral rows
    ctx.fillStyle = "#0b0b0c";
    for (let i = 0; i < 72; i++) {
      const row = i % 3;
      const a = (i / 72) * Math.PI * 2 + row * 0.05;
      const r = size * (0.33 + row * 0.05);
      ctx.beginPath();
      ctx.arc(size / 2 + Math.cos(a) * r, size / 2 + Math.sin(a) * r, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    return finalize(new THREE.CanvasTexture(c), { srgb: true });
  });
}

/* ------------------------------------------------------------------ */
/* Infotainment UI – emissive map for the centre display.              */
/* ------------------------------------------------------------------ */
export function screenTexture(accent = "#7fc8ff") {
  return memo(`screen-${accent}`, () => {
    const w = 1024;
    const h = 600;
    const { c, ctx } = canvas(w, h);
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#05070a");
    bg.addColorStop(1, "#0b1118");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Navigation map
    ctx.strokeStyle = "rgba(127,200,255,0.18)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      ctx.beginPath();
      ctx.moveTo(380 + hash2(i, 1) * 640, hash2(i, 2) * h);
      ctx.bezierCurveTo(
        380 + hash2(i, 3) * 640, hash2(i, 4) * h,
        380 + hash2(i, 5) * 640, hash2(i, 6) * h,
        380 + hash2(i, 7) * 640, hash2(i, 8) * h,
      );
      ctx.stroke();
    }
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(520, 560);
    ctx.bezierCurveTo(600, 420, 760, 400, 820, 160);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(820, 160, 12, 0, Math.PI * 2);
    ctx.fill();

    // Left column: speed / range / climate
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(0, 0, 360, h);
    ctx.fillStyle = "#ffffff";
    ctx.font = "200 120px Helvetica, Arial, sans-serif";
    ctx.fillText("142", 40, 190);
    ctx.font = "400 26px Helvetica, Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText("km/h", 250, 190);
    ctx.fillText("STRADA · RPM", 40, 290);
    ctx.fillStyle = "#fff";
    ctx.font = "300 54px Helvetica, Arial, sans-serif";
    ctx.fillText("5,800", 40, 350);
    // Battery arc
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(180, 480, 70, Math.PI, 0);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.beginPath();
    ctx.arc(180, 480, 70, Math.PI, Math.PI * 1.82);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "400 24px Helvetica, Arial, sans-serif";
    ctx.fillText("82%", 156, 490);

    // Top bar
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "500 24px Helvetica, Arial, sans-serif";
    ctx.fillText("LAMBORGHINI", w - 230, 44);
    ctx.fillText("21:40", 400, 44);

    return finalize(new THREE.CanvasTexture(c), { srgb: true });
  });
}

/* ------------------------------------------------------------------ */
/* Lamborghini shield – gold-edged black shield, wordmark and bull.      */
/*   shield: the shield fills the canvas (bonnet badge, planar UVs)      */
/*   color:  shield centred on a dark round cap (wheels, steering hub)   */
/* ------------------------------------------------------------------ */
function shieldPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h * 0.55);
  ctx.quadraticCurveTo(x + w, y + h * 0.85, x + w / 2, y + h);
  ctx.quadraticCurveTo(x, y + h * 0.85, x, y + h * 0.55);
  ctx.closePath();
}

function drawShield(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const gold = ctx.createLinearGradient(x, y, x + w, y + h);
  gold.addColorStop(0, "#f6e3a1");
  gold.addColorStop(0.45, "#b8892f");
  gold.addColorStop(0.6, "#e9cf7f");
  gold.addColorStop(1, "#9c7326");
  ctx.fillStyle = gold;
  shieldPath(ctx, x, y, w, h);
  ctx.fill();
  const b = w * 0.06;
  ctx.fillStyle = "#08080a";
  shieldPath(ctx, x + b, y + b, w - 2 * b, h - 2 * b);
  ctx.fill();

  // Wordmark across the top.
  ctx.fillStyle = gold;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${w * 0.1}px Georgia, 'Times New Roman', serif`;
  ctx.fillText("LAMBORGHINI", x + w / 2, y + h * 0.16);

  // Stylised charging bull.
  const cx = x + w * 0.5;
  const cy = y + h * 0.55;
  const u = w * 0.0042;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(u, u);
  ctx.beginPath();
  ctx.moveTo(-70, 10); // rump
  ctx.quadraticCurveTo(-75, -25, -40, -32); // back
  ctx.quadraticCurveTo(0, -42, 35, -38); // shoulder hump
  ctx.quadraticCurveTo(50, -40, 60, -55); // neck to horn
  ctx.lineTo(66, -70); // horn tip
  ctx.lineTo(68, -50);
  ctx.quadraticCurveTo(80, -42, 78, -25); // head / muzzle
  ctx.lineTo(62, -22);
  ctx.quadraticCurveTo(55, -5, 70, 5); // raised front leg
  ctx.lineTo(80, 25);
  ctx.lineTo(70, 28);
  ctx.lineTo(48, 5);
  ctx.quadraticCurveTo(30, 15, 20, 40); // second front leg
  ctx.lineTo(8, 42);
  ctx.quadraticCurveTo(10, 20, 0, 8); // belly
  ctx.quadraticCurveTo(-30, 12, -45, 20);
  ctx.lineTo(-40, 55); // hind leg
  ctx.lineTo(-52, 56);
  ctx.lineTo(-62, 22);
  ctx.quadraticCurveTo(-85, 30, -95, 0); // tail
  ctx.quadraticCurveTo(-82, 18, -70, 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function lamborghiniEmblemTextures() {
  return memo("lambo-emblem", () => {
    const sw = 420;
    const sh = 500;
    const shield = canvas(sw, sh);
    shield.ctx.fillStyle = "#08080a";
    shield.ctx.fillRect(0, 0, sw, sh);
    drawShield(shield.ctx, 0, 0, sw, sh);

    const size = 512;
    const color = canvas(size);
    const disc = color.ctx.createRadialGradient(size * 0.4, size * 0.35, 0, size / 2, size / 2, size / 2);
    disc.addColorStop(0, "#26282d");
    disc.addColorStop(1, "#08090b");
    color.ctx.fillStyle = disc;
    color.ctx.fillRect(0, 0, size, size);
    drawShield(color.ctx, size * 0.27, size * 0.22, size * 0.46, size * 0.56);

    return {
      shield: finalize(new THREE.CanvasTexture(shield.c), { srgb: true }),
      color: finalize(new THREE.CanvasTexture(color.c), { srgb: true }),
    };
  });
}

/** Wordmark rendered as an alpha mask for chrome lettering on the tailgate. */
export function badgeTexture(text: string) {
  return memo(`badge-${text}`, () => {
    const w = 1024;
    const h = 128;
    const { c, ctx } = canvas(w, h);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    ctx.font = "300 92px Helvetica, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.letterSpacing = "38px";
    ctx.fillText(text, w / 2 + 19, h / 2 + 4);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.NoColorSpace;
    tex.anisotropy = 16;
    return tex;
  });
}

/** Subtle roughness variation for the showroom floor (polished concrete). */
export function floorRoughnessTexture() {
  return memo("floor", () => {
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n = fbm((x / size) * 8, (y / size) * 8, 5);
        const v = 90 + n * 120;
        const i = (y * size + x) * 4;
        data[i] = data[i + 1] = data[i + 2] = v;
        data[i + 3] = 255;
      }
    }
    return finalize(new THREE.DataTexture(data, size, size, THREE.RGBAFormat), { repeat: [6, 6] });
  });
}
