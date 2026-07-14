import type { MetadataRoute } from "next";

/** Web app manifest — makes Daily OS installable with a themed splash. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daily OS — Your day, beautifully organized",
    short_name: "Daily OS",
    description:
      "A calm, offline-first Daily Operating System. Every day has its own workspace.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FCF4F7",
    theme_color: "#FCF4F7",
    categories: ["productivity", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
