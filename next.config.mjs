/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  env: {
    BUILD_ID: new Date().toISOString(),
  },
};

export default nextConfig;