import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lumen",
    short_name: "Lumen",
    description: "5 minutes par jour pour une culture générale qui reste.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffbeb",
    theme_color: "#fbbf24",
    lang: "fr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
