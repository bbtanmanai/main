/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['i.ytimg.com', 'yt3.ggpht.com', 'img.youtube.com'], // YouTube thumbnail domains
  },
  // API 프록시 설정이 필요할 경우 여기서 추가 가능
};

module.exports = nextConfig;
