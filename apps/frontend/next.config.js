/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: "standalone",

  // Strict mode for better error handling
  reactStrictMode: true,

  // Image optimization settings
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Environment variables to expose to the client
  // Note: NEXT_PUBLIC_* variables are automatically available, but listing them explicitly
  // helps with debugging and documentation
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_TICTACTOE_API_URL: process.env.NEXT_PUBLIC_TICTACTOE_API_URL,
    NEXT_PUBLIC_MRWHITE_API_URL: process.env.NEXT_PUBLIC_MRWHITE_API_URL,
    NEXT_PUBLIC_MRWHITE_WS_URL: process.env.NEXT_PUBLIC_MRWHITE_WS_URL,
  },
};

module.exports = nextConfig;
