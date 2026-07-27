import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow file uploads through Server Actions (default cap is 1 MB).
    serverActions: { bodySizeLimit: "55mb" },
  },
};

export default nextConfig;
