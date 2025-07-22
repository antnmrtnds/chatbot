/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static file serving
  async headers() {
    return [
      {
        source: '/chatbot-snippet.js',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/chat',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
        ],
      },
    ];
  },
  // Disable ESLint during builds for faster deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript checking during builds
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig; 