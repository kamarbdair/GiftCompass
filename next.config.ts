import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product photography is served from each retailer's own CDN.
    remotePatterns: [
      { protocol: "https", hostname: "www.jarir.com" },
      { protocol: "https", hostname: "en-kw.rituals.com" },
      { protocol: "https", hostname: "zgames.sa" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "www.faces.sa" },
      { protocol: "https", hostname: "en-sa.sssports.com" },
      { protocol: "https", hostname: "cdn.qavashop.com" },
    ],
  },
};

export default nextConfig;
