import type { MetadataRoute } from "next";
import { domain } from "./metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: domain.https,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
