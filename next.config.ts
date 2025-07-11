import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'abs.twimg.com', 
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'video.twimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ton.twimg.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
