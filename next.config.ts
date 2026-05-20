import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remotion's bundler + renderer pull in native binaries (esbuild, the
  // Remotion compositor, headless Chrome) that Turbopack can't statically
  // bundle. Mark them external so the route handler require()s them at
  // runtime from node_modules instead.
  serverExternalPackages: [
    '@remotion/bundler',
    '@remotion/renderer',
    'esbuild',
    'webpack',
  ],
};

export default nextConfig;
