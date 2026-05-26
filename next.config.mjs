/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            // Allow embedding from Staffbase domains and capacitor (mobile app)
            value: "frame-ancestors 'self' https://*.staffbase.com https://*.staffbase.de capacitor://* https://*.staffbase-cdn.com",
          },
          {
            key: "X-Frame-Options",
            // SAMEORIGIN is the fallback for older browsers, CSP takes precedence
            value: "ALLOWALL",
          },
        ],
      },
    ]
  },
}

export default nextConfig
