/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'example.com'], // add your domains as needed
  },
  output: 'export', // Static export for Cloudflare Pages
  trailingSlash: false, // Do not force trailing slashes (avoid 308 redirects)
};

module.exports = nextConfig;
