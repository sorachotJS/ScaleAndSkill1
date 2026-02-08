import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qeylqydthifdfxfdroea.supabase.co', // 👈 ใส่โดเมนของคุณตรงนี้
      },
    ],
  },
};

export default nextConfig;
