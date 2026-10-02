import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone build: bundles only what the server needs, so the deploy image
  // doesn't carry node_modules for every dev dependency.
  output: "standalone",
};

export default nextConfig;
