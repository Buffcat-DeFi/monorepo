import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Twoside",
    short_name: "Twoside",
    description: `Twoside is a secure token locking utility where users lock their tokens
    and receive tradeable derivatives that can be redeemed 1:1.
    Maximize your DeFi strategy with flexible token management.`,
    start_url: "/",
    display: "standalone",
    background_color: "#fff",
    theme_color: "#fff",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
