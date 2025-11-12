/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'example.com'], // add your domains as needed
  },
  // Removed output: 'export' to enable dynamic rendering on demand
  // Cloudflare Pages now handles rendering with Node.js compatibility enabled
  trailingSlash: true, // Creates folder/index.html structure instead of file.html
};

module.exports = nextConfig;
