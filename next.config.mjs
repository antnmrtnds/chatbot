/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/embed/viriato-chatbot.js',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://viriatochatbot.vercel.app; style-src 'self' 'unsafe-inline' https://viriatochatbot.vercel.app; img-src 'self' data: https://viriatochatbot.vercel.app https://images.unsplash.com https://civilria.com; connect-src 'self' https://viriatochatbot.vercel.app; font-src 'self'; frame-src 'self'; object-src 'none';",
          },
        ],
      },
    ];
  },
  /* config options here */
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'civilria.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;