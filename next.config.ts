/** @type {import('next').NextConfig} */
const nextConfig = {
  // This tells Next.js to process Mapbox files correctly
  transpilePackages: ['mapbox-gl', 'react-map-gl'],
};

export default nextConfig;