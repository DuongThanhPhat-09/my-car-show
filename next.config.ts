import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // three/examples ships ESM that benefits from transpilation for older targets.
  transpilePackages: ["three"],
  experimental: {
    // Tree-shake barrel imports from heavy 3D libraries.
    optimizePackageImports: ["@react-three/drei", "@react-three/postprocessing", "gsap"],
  },
  async headers() {
    return [
      {
        // 3D assets are content-hashed by filename convention → cache aggressively.
        source: "/:dir(models|hdri|draco|basis)/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
