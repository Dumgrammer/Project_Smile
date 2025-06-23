import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // typescript: {
  //   // ⚠️ Dangerously allow production builds to successfully complete even if
  //   // your project has type errors.
  //   ignoreBuildErrors: true,
  // },
  // eslint: {
  //   // Warning: This allows production builds to successfully complete even if
  //   // your project has ESLint errors.
  //   ignoreDuringBuilds: true,
  // },
  webpack: (config, { isServer }) => {
    // T-Fix: ReferenceError: Buffer is not defined
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "buffer": require.resolve('buffer'),
    };
    
    // Add support for crypto
    if (!isServer) {
      config.resolve.fallback.crypto = require.resolve('crypto-browserify');
    }

    return config;
  },
};

export default nextConfig;
