/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'example.com'], // add your domains as needed
    unoptimized: true, // Required for static export
  },
  output: 'export', // Static export for Cloudflare Pages
  trailingSlash: false, // Do not force trailing slashes (avoid 308 redirects)
  // Build optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Optimize chunks
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
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
    }
    return config;
  },
  // Note: headers() doesn't work with static export
  // Security headers should be configured in Cloudflare Pages settings
  // or via _headers file in public/ directory
};

module.exports = nextConfig;
