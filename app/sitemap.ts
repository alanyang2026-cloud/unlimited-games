import type { MetadataRoute } from "next";
import { GAMES, getGameUrl } from "@/lib/games";

const SITE = "https://unlimitedgames.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE + "/",        lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: SITE + "/privacy", lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    ...GAMES.map(g => ({
      url: SITE + getGameUrl(g.id),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
