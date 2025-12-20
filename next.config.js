/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable for faster builds
  swcMinify: true,
  images: {
    domains: ['localhost', 'example.com'], // add your domains as needed
    unoptimized: true, // Required for static export
  },
  // output: 'export', // Commented out to fix API routes issue
  trailingSlash: false, // Do not force trailing slashes (avoid 308 redirects)
  // Disable webpack cache for Cloudflare Pages deployment
  webpack: (config, { dev, isServer }) => {
    // Completely disable cache in production
    if (!dev) {
      config.cache = false;
    }
    return config;
  },
  // Build optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Optimize chunks
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    esmExternals: 'loose', // Faster builds
  },
  // Reduce bundle size
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      };
      // Reduce parallel processing for memory efficiency
      config.optimization.minimize = true;
      config.optimization.minimizer = config.optimization.minimizer.filter(
        (m) => m.constructor.name !== 'CssMinimizerPlugin'
      );
    }
    return config;
  },
  // Skip type checking for faster builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip linting for faster builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Note: headers() doesn't work with static export
  // Security headers should be configured in Cloudflare Pages settings
  // or via _headers file in public/ directory
};

module.exports = nextConfig;
