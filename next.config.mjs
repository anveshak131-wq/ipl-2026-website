import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    domains: ['localhost', 'example.com'],
    unoptimized: true,
  },
  output: 'export',
  trailingSlash: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    esmExternals: 'loose',
  },
  webpack: (config, { dev, isServer }) => {
    config.cache = false;

    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      };

      config.optimization.minimize = true;
      config.optimization.minimizer = config.optimization.minimizer.filter(
        (minimizer) => minimizer.constructor.name !== 'CssMinimizerPlugin'
      );
    }

    config.resolve ??= {};
    config.resolve.alias ??= {};
    config.resolve.alias['@'] = path.resolve(process.cwd(), 'src');

    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Exclude admin routes from static export since they use dynamic features
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    const pathMap = {};
    Object.keys(defaultPathMap).forEach((path) => {
      // Skip admin routes from static export
      if (!path.startsWith('/ipl-admin-2026') && !path.startsWith('/wpl-admin-2026')) {
        pathMap[path] = defaultPathMap[path];
      }
    });
    return pathMap;
  },
};

export default nextConfig;
