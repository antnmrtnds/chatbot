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
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://viriatochatbot-5cq1ya7bu-antnmrtnds-projects.vercel.app https://viriatochatbot.vercel.app https://www.googletagmanager.com",
              "connect-src 'self' https://viriatochatbot-5cq1ya7bu-antnmrtnds-projects.vercel.app https://viriatochatbot.vercel.app https://*.google-analytics.com https://*.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://viriatochatbot.vercel.app",
              "img-src 'self' data: https: https://viriatochatbot.vercel.app https://images.unsplash.com https://civilria.com",
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "frame-src 'self' https://upinvestments.vshow.pt"
            ].join('; ')
          }
        ]
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