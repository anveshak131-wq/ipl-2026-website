/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'example.com'], // add your domains as needed
  },
  // Note: Removed 'output: export' to allow dynamic rendering on Cloudflare Pages
  // Cloudflare Pages with .next output supports server-side rendering via Functions
};

module.exports = nextConfig;
