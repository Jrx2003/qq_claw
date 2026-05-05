import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  outputFileTracingIncludes: {
    "/api/llm/**/*": ["./prompts/live_llm/**/*", "./fixtures/snapshots/**/*"],
  },
};

export default nextConfig;
