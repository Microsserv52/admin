import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/admin",
  trailingSlash: true,
  images: { unoptimized: true },
  reactCompiler: true,
  turbopack: {
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
};
export default nextConfig;
