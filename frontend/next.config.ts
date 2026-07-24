import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.BACKEND_URL || (() => { throw new Error('BACKEND_URL environment variable is missing'); })()}/api/v1/:path*`
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
