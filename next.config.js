/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'example.com'], // add your domains as needed
  },
  output: 'export', // Static export for Cloudflare Pages
  trailingSlash: true, // Creates folder/index.html structure instead of file.html
};

module.exports = nextConfig;
