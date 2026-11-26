/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true,
  // Allow dev assets/HMR when the app is opened via the loopback IP (required for Spotify OAuth).
  allowedDevOrigins: ["127.0.0.1"] };
export default nextConfig;
