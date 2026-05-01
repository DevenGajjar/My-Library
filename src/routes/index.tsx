import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { InfiniteCanvas } from "@/components/InfiniteCanvas";
import { ImageModal } from "@/components/ImageModal";
import { trackImageClick, useImagePool } from "@/hooks/useImagePool";
import { useSaves } from "@/hooks/useSaves";
import type { ArchiveImage } from "@/types/image";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Library — Infinite Public Domain Image Canvas" },
      {
        name: "description",
        content:
          "Drift through an endless 8-direction canvas of public-domain artworks from the MET and beyond. Drag, scroll, save.",
      },
      { property: "og:title", content: "My Library — Infinite Image Canvas" },
      {
        property: "og:description",
        content: "An infinite, pannable canvas of public-domain images. Save your favorites.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [searchInput, setSearchInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<ArchiveImage | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchInput.trim()), 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { pool, loading, loadMore } = useImagePool(debounced);
  const { savedIds, toggle, items } = useSaves();

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      <Header
        search={searchInput}
        onSearchChange={setSearchInput}
        savedCount={items.length}
      />
      <InfiniteCanvas
        pool={pool}
        onLoadMore={loadMore}
        loading={loading}
        savedIds={savedIds}
        onToggleSave={toggle}
        onOpen={(image) => {
          void trackImageClick(image.id);
          setSelected(image);
        }}
      />
      <ImageModal
        image={selected}
        onClose={() => setSelected(null)}
        saved={selected ? savedIds.has(selected.id) : false}
        onToggleSave={() => selected && toggle(selected)}
      />
    </div>
  );
}
