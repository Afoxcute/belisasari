import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@noble/curves", "@noble/hashes"],
  webpack: (config, { isServer }) => {
    // Fix @noble/curves re-exports: ensure resolution uses correct utils (esm/utils.js not abstract/utils.js)
    config.resolve.alias = {
      ...config.resolve.alias,
      // Force single copy of noble packages (from workspace root when in frontend)
      "@noble/curves": path.resolve(__dirname, "../node_modules/@noble/curves"),
      "@noble/hashes": path.resolve(__dirname, "../node_modules/@noble/hashes"),
    };
    return config;
  },
  experimental: {
    esmExternals: "loose",
    serverComponentsExternalPackages: ["@privy-io/react-auth", "viem"],
  },
  output: 'standalone',
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/embed/:id*", // Handle /embed and /embed/[id]
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ipfs/:path*",
        destination: "https://ipfs.io/ipfs/:path*",
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "via.placeholder",
        port: "",
      },
      {
        protocol: "https",
        hostname: "p16-sign.tiktokcdn-us",
        port: "",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
      },
      {
        protocol: "https",
        hostname: "nftstorage.link",
        port: "",
      },
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud",
        port: "",
      },
      {
        protocol: "https",
        hostname: "token.jup.ag",
        port: "",
      },
      {
        protocol: "https",
        hostname: "static.jup.ag",
        port: "",
      },
      {
        protocol: "https",
        hostname: "api.jup.ag",
        port: "",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "ipfs.io",
        port: "",
      },
    ],
  },
};

export default nextConfig;