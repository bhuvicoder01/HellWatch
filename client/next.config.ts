import type { NextConfig } from "next";
// require('dotenv').config();

const nextConfig: NextConfig = {
  /* config options here */
  // output:'standalone',
   // ✅ Force PostCSS (No LightningCSS)
   
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/:path*'
      }
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }, // Video thumbnails ,
      { protocol: 'http', hostname: '**' }  // Video thumbnails
    ],
    unoptimized: true, // Disable image optimization for external images
  }
};

export default nextConfig;