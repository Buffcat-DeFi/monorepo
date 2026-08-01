import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Buffcat",
    short_name: "Buffcat",
    description: `Buffcat is a protocol for earning secondary income from your tokens.
    Lock tokens with flexible or fixed durations and claim daily rewards accumulated in Buffcat's reward pool.`,
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
