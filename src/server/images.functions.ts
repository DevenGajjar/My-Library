import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ArchiveImage } from "@/types/image";

const MET_SEARCH = "https://collectionapi.metmuseum.org/public/collection/v1/search";
const MET_OBJECT = "https://collectionapi.metmuseum.org/public/collection/v1/objects";

// ----- Met helpers -----
async function fetchMetIds(query: string): Promise<number[]> {
  try {
    const url = `${MET_SEARCH}?hasImages=true&q=${encodeURIComponent(query || "art")}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return [];
    const data = (await res.json()) as { objectIDs?: number[] | null };
    return data.objectIDs ?? [];
  } catch {
    return [];
  }
}

async function fetchMetObject(id: number): Promise<ArchiveImage | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(`${MET_OBJECT}/${id}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const o = (await res.json()) as {
      objectID: number;
      primaryImageSmall?: string;
      primaryImage?: string;
      title?: string;
      artistDisplayName?: string;
      objectDate?: string;
      objectURL?: string;
      isPublicDomain?: boolean;
    };
    // Always prefer the small (web) variant — much faster to load
    const url = o.primaryImageSmall || o.primaryImage;
    if (!url || !o.isPublicDomain) return null;
    // Random aspect ratio buckets so the canvas feels varied
    const ratios = [0.7, 0.8, 1.0, 1.25, 1.4, 1.6];
    const r = ratios[Math.floor(Math.random() * ratios.length)];
    const w = 600;
    const h = Math.round(w / r);
    return {
      id: `met-${o.objectID}`,
      url,
      width: w,
      height: h,
      title: o.title || "Untitled",
      source: "The MET Museum",
      sourceUrl: o.objectURL,
      date: o.objectDate,
      artist: o.artistDisplayName,
    };
  } catch {
    return null;
  }
}

// ----- Picsum fallback -----
function picsumImage(seed: string, idx: number): ArchiveImage {
  const ratios = [0.7, 0.8, 1.0, 1.25, 1.4, 1.6];
  const r = ratios[idx % ratios.length];
  const w = 600;
  const h = Math.round(w / r);
  return {
    id: `picsum-${seed}-${idx}`,
    url: `https://picsum.photos/seed/${encodeURIComponent(seed)}-${idx}/${w}/${h}`,
    width: w,
    height: h,
    title: "Untitled Study",
    source: "Open Archive",
    date: undefined,
  };
}

export const fetchImages = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        query: z.string().max(100).optional().default(""),
        count: z.number().int().min(1).max(40).optional().default(20),
        sessionSeed: z.string().max(64).optional().default(""),
      })
      .parse(d)
  )
  .handler(async ({ data }): Promise<{ images: ArchiveImage[] }> => {
    const { query, count, sessionSeed } = data;
    const out: ArchiveImage[] = [];

    // Try Met first — but cap how many object lookups we do (each is a network call)
    const ids = await fetchMetIds(query || "painting");
    if (ids.length > 0) {
      // Take a small over-sample (count + 30% buffer) instead of count*2 to halve latency
      const sampleSize = Math.min(ids.length, Math.ceil(count * 1.3));
      const shuffled = [...ids].sort(() => Math.random() - 0.5).slice(0, sampleSize);
      const settled = await Promise.allSettled(shuffled.map((id) => fetchMetObject(id)));
      for (const r of settled) {
        if (r.status === "fulfilled" && r.value) out.push(r.value);
        if (out.length >= count) break;
      }
    }

    // Fill remainder with Picsum (instant — just URL strings)
    const baseSeed = `${sessionSeed || Math.random().toString(36).slice(2)}-${query || "x"}`;
    let i = 0;
    while (out.length < count) {
      out.push(picsumImage(baseSeed, Date.now() + i++));
    }
    return { images: out };
  });
