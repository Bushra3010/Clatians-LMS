import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module and must be kept out of the server bundle.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
