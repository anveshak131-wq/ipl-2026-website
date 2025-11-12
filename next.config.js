/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'example.com'], // add your domains as needed
  },
  output: 'export', // ← This is required for static export!
};

module.exports = nextConfig;
