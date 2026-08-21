import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // pdf-parse (via pdfjs-dist) sets up a worker at runtime — let Next.js
  // require it natively instead of bundling it, otherwise the worker chunk
  // can't be resolved on the server (used by /api/projects/parse-invoice).
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
