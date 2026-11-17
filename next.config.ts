import type { NextConfig } from 'next';

// Artwork and fonts rarely change: let browsers reuse them for a day (and serve stale for a week while refreshing),
// instead of re-checking with the server on every visit — a big win on slow connections.
const cache = [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      { source: '/fonts/:path*', headers: cache },
      { source: '/(logo|frame|doodles).png', headers: cache },
    ];
  },
};

export default nextConfig;
