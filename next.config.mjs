/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },
  // Optimizar bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: "deterministic",
        runtimeChunk: "single",
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
            // Separar Material-UI en su propio chunk
            mui: {
              name: "mui",
              test: /[\\/]node_modules[\\/]@mui[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // Separar date-fns
            dateFns: {
              name: "date-fns",
              test: /[\\/]node_modules[\\/]date-fns[\\/]/,
              priority: 15,
              reuseExistingChunk: true,
            },
            // Otros vendor chunks
            vendor: {
              name: "vendor",
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
