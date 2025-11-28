/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'example.com'], // add your domains as needed
  },
  output: 'export', // Static export for Cloudflare Pages
  trailingSlash: false, // Do not force trailing slashes (avoid 308 redirects)
  // Note: headers() doesn't work with static export
  // Security headers should be configured in Cloudflare Pages settings
  // or via _headers file in public/ directory
};

module.exports = nextConfig;
