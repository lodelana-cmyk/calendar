import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Content Calendar",
    short_name: "Content",
    description: "Plan every campaign, channel and publish date in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f0ed",
    theme_color: "#f1f0ed",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/content-calendar-icon.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
