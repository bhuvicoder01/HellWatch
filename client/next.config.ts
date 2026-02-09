import type { NextConfig } from "next";
// require('dotenv').config();

const nextConfig: NextConfig = {
  /* config options here */
   // ✅ Force PostCSS (No LightningCSS)
   output: 'export', 
   basePath:'/HellWatch',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/:path*'
      }
    ];
  },
  trailingSlash: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }, // Video thumbnails ,
      { protocol: 'http', hostname: '**' }  // Video thumbnails
    ],
    path:'/HellWatch/public',
    unoptimized: true, // Disable image optimization for external images
  }
};

export default nextConfig;