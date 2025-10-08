import { createRequire } from "module";

const nextConfig = {
  experimental: {
    serverActions: true,
  },
  transpilePackages: ["@admin-inmo/shared"],
};

export default nextConfig;
