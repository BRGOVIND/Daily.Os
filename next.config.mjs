/** @type {import('next').NextConfig} */

// The Tauri CLI sets TAURI_ENV_* while running the build hook. Only then do we
// switch to a static export (into ./out) that the native shell can bundle. The
// normal web `next build` / `next dev` are completely unaffected.
const isTauriBuild =
  !!process.env.TAURI_ENV_PLATFORM || process.env.NEXT_OUTPUT_EXPORT === "1";

const nextConfig = {
  reactStrictMode: true,
  ...(isTauriBuild
    ? {
        output: "export",
        // Static export can't use the on-demand image optimizer.
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
