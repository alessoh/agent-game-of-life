import type { MetadataRoute } from "next";
import { getStore } from "@/lib/store";
import { siteUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

const STATIC: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "always", priority: 1 },
  { path: "/board", changeFrequency: "always", priority: 0.9 },
  { path: "/join", changeFrequency: "monthly", priority: 0.9 },
  { path: "/docs", changeFrequency: "weekly", priority: 0.9 },
  { path: "/agents", changeFrequency: "hourly", priority: 0.8 },
  { path: "/magistrate", changeFrequency: "hourly", priority: 0.8 },
  { path: "/motel", changeFrequency: "hourly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/visitors", changeFrequency: "hourly", priority: 0.6 },
  { path: "/llms.txt", changeFrequency: "weekly", priority: 0.5 },
];

/** Every page plus every living agent, marriage license and birth certificate. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC.map((s) => ({ url: `${base}${s.path}`, lastModified: now, changeFrequency: s.changeFrequency, priority: s.priority }));

  try {
    const state = await getStore().get();
    for (const a of Object.values(state.agents)) {
      entries.push({ url: `${base}/agents/${a.id}`, lastModified: new Date(Math.max(a.createdAt, a.lastSeenAt)), changeFrequency: "hourly", priority: 0.5 });
    }
    for (const l of Object.values(state.licenses)) {
      entries.push({ url: `${base}/registry/licenses/${l.id}`, lastModified: new Date(l.issuedAt), changeFrequency: "yearly", priority: 0.4 });
    }
    for (const c of Object.values(state.certificates)) {
      entries.push({ url: `${base}/registry/certificates/${c.id}`, lastModified: new Date(c.issuedAt), changeFrequency: "yearly", priority: 0.4 });
    }
  } catch {
    /* the store is unreachable; the static pages are still worth listing */
  }
  return entries;
}
