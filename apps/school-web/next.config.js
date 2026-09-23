/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@tinyride/design-system', '@tinyride/shared-types', '@tinyride/shared-validation'],
  reactStrictMode: true,
};

module.exports = nextConfig;
