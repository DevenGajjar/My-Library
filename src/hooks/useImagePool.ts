import { useCallback, useEffect, useRef, useState } from "react";
import type { ArchiveImage } from "@/types/image";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function fetchImages(
  query: string,
  page: number,
  sources: string = "all",
): Promise<ArchiveImage[]> {
  const params = new URLSearchParams({
    q: query || "art",
    page: String(page),
    per_page: "16",
    sources,
  });
  const res = await fetch(`${BASE_URL}/api/images?${params}`);
  if (!res.ok) throw new Error("Failed to fetch images");
  const data = await res.json();
  const images = (data.images || []) as Array<{
    id: string;
    title: string;
    source_name: string;
    source_url: string;
    image_url: string;
    width?: number;
    height?: number;
    artist?: string;
    date?: string;
  }>;
  return images.map((image) => ({
    id: image.id,
    url: image.image_url,
    width: image.width ?? 0,
    height: image.height ?? 0,
    title: image.title,
    source: image.source_name,
    sourceUrl: image.source_url,
    artist: image.artist,
    date: image.date,
  }));
}

export async function trackImageClick(imageId: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/api/images/${imageId}/click`, { method: "POST" });
  } catch (error) {
    console.warn("trackImageClick failed", error);
  }
}

export function useImagePool(query: string) {
  const [pool, setPool] = useState<ArchiveImage[]>([]);
  const [loading, setLoading] = useState(false);
  const fetching = useRef(false);
  const queryRef = useRef(query);
  const pageRef = useRef(1);

  // Reset pool on query change
  useEffect(() => {
    queryRef.current = query;
    pageRef.current = 1;
    setPool([]);
  }, [query]);

  const loadMore = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    setLoading(true);
    try {
      const images = await fetchImages(queryRef.current, pageRef.current);
      setPool((prev) => [...prev, ...images]);
      pageRef.current += 1;
      // Warm the browser cache immediately so tiles paint instantly
      if (typeof window !== "undefined") {
        images.forEach((img) => {
          const i = new Image();
          i.decoding = "async";
          i.src = img.url;
        });
      }
    } catch (e) {
      console.error("fetchImages failed", e);
    } finally {
      setLoading(false);
      fetching.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return { pool, loading, loadMore };
}
