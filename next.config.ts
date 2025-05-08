// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 其他配置也可以加在这里，比如：
  // reactStrictMode: true,
};

module.exports = nextConfig;
