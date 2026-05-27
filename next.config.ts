import path from "path";
import type { NextConfig } from "next";

const SDK = (pkg: string) =>
  path.resolve(__dirname, `../openpay-sdk/packages/${pkg}/src/index.ts`);

const nextConfig: NextConfig = {
  output: "standalone",
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@openpay/core": SDK("core"),
      "@openpay/react": SDK("react"),
      "@openpay/provider-stripe": SDK("provider-stripe"),
      "@openpay/provider-mock": SDK("provider-mock"),
      "@openpay/webhooks": SDK("webhooks"),
    };
    return config;
  },
};

export default nextConfig;
