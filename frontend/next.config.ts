import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.BACKEND_URL || 'http://backend:3000'}/api/v1/:path*`
      }
    ];
  }
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  org: "your-org",
  project: "your-project",
  sentryUrl: "https://sentry.io/",
  silent: true, // Suppresses all logs
});
