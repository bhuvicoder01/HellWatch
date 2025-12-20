import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output:'standalone',
   // ✅ Force PostCSS (No LightningCSS)
  experimental: {
    useLightningcss:true
  },
  async rewrites() {
    return process.env.NODE_ENV === 'production'
      ? [
          {
            source: '/api/:path*',
            destination: 'http://load-balancer:8080/api/:path*' // Docker service name
          }
        ]
      : [
          {
            source: '/api/:path*',
            destination: 'http://localhost:8080/api/:path*'
          }
        ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' } // Video thumbnails
    ]
  }
};

export default nextConfig;
