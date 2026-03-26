import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TRI Shipping",
    short_name: "TRI Shipping",
    description:
      "TRI Shipping dashboard for clients, staff, and admins to track and manage shipments.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    orientation: "portrait",
    scope: "/",
    lang: "en",
    icons: [
      {
        src: "/icon?v=2",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon?v=2",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}