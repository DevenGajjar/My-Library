import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Trash2, Download, ExternalLink, Sparkles } from "lucide-react";
import { useSaves } from "@/hooks/useSaves";
import { ImageModal } from "@/components/ImageModal";
import { downloadImage } from "@/lib/download";
import type { ArchiveImage } from "@/types/image";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Your Library — My Library" },
      { name: "description", content: "Your saved images from the public-domain archive." },
      { property: "og:title", content: "Your Library — My Library" },
      { property: "og:description", content: "Your bookmarked public-domain images." },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { items, loading, savedIds, toggle } = useSaves();
  const [selected, setSelected] = useState<ArchiveImage | null>(null);

  const sourceCount = useMemo(
    () => new Set(items.map((i) => i.source).filter(Boolean)).size,
    [items]
  );

  return (
    <div className="min-h-screen bg-background relative">
      {/* Ambient backdrop */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none opacity-60"
        style={{
          background:
            "radial-gradient(circle at 15% -10%, rgba(201,185,154,0.12), transparent 45%), radial-gradient(circle at 85% 110%, rgba(201,185,154,0.08), transparent 50%)",
        }}
      />

      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl border-b-hairline">
        <div className="flex items-center gap-4 px-4 md:px-8 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors bg-surface/40 border-hairline rounded-[40px] px-3.5 py-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} /> canvas
          </Link>
          <div className="flex-1" />
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-widest text-accent hover:text-foreground transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.6} /> discover more
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-4 md:px-12 pt-12 md:pt-20 pb-10 md:pb-14">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.35em] text-accent/80 mb-4">
            ✦ private collection
          </p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[0.95] tracking-tight">
            your <span className="italic text-accent">library</span>
          </h1>
          <p className="font-mono text-[0.78rem] text-muted-foreground mt-5 max-w-md leading-relaxed">
            a quiet shelf for images that stopped you in the scroll. yours alone, kept across visits.
          </p>

          {/* Stats */}
          <div className="mt-10 flex flex-wrap gap-8 md:gap-14">
            <Stat label="saved" value={items.length.toString().padStart(2, "0")} />
            <Stat label="sources" value={sourceCount.toString().padStart(2, "0")} />
            <Stat label="domain" value="public" />
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="px-4 md:px-12">
        <div className="max-w-6xl mx-auto border-t-hairline" />
      </div>

      <main className="px-4 md:px-12 py-10 md:py-14 relative">
        <div className="max-w-6xl mx-auto">
          {loading && items.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] bg-surface rounded-md animate-pulse"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center text-center py-20 md:py-32 gap-5">
              <div className="w-20 h-20 rounded-full border-hairline flex items-center justify-center bg-surface/50">
                <Sparkles className="w-7 h-7 text-accent/70" strokeWidth={1.2} />
              </div>
              <p className="font-serif text-3xl md:text-4xl italic text-foreground/70">
                an empty shelf
              </p>
              <p className="font-mono text-[0.75rem] text-muted-foreground max-w-sm leading-relaxed">
                tap the bookmark on any image in the canvas. it'll wait here for you.
              </p>
              <Link
                to="/"
                className="mt-4 inline-flex items-center gap-2 bg-accent text-accent-foreground font-mono text-[0.7rem] uppercase tracking-wider rounded-[40px] px-6 py-3 hover:bg-accent/90 transition-colors"
              >
                explore the canvas →
              </Link>
            </div>
          ) : (
            <div className="[column-count:2] md:[column-count:3] lg:[column-count:4] [column-gap:16px]">
              {items.map((img, idx) => (
                <article
                  key={img.id}
                  className="break-inside-avoid mb-4 group relative rounded-lg overflow-hidden bg-surface cursor-pointer border-hairline shadow-[0_10px_30px_-15px_rgba(0,0,0,0.7)] transition-all duration-500 hover:shadow-[0_20px_50px_-15px_rgba(201,185,154,0.25)] hover:-translate-y-0.5 animate-fade-in"
                  style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}
                  onClick={() => setSelected(img)}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={img.url}
                      alt={img.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full block transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Footer info */}
                  <div className="absolute inset-x-0 bottom-0 p-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="font-serif italic text-foreground text-base leading-tight line-clamp-2 mb-1">
                      {img.title}
                    </div>
                    <div className="font-mono text-[0.6rem] text-foreground/60 uppercase tracking-widest">
                      {img.source || "open archive"}
                    </div>
                  </div>

                  {/* Top action row */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <IconAction
                      title="Download"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(img.url, img.title);
                      }}
                    >
                      <Download className="w-3.5 h-3.5" strokeWidth={1.8} />
                    </IconAction>
                    {img.sourceUrl && (
                      <IconAction
                        as="a"
                        title="View source"
                        href={img.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.8} />
                      </IconAction>
                    )}
                    <IconAction
                      title="Remove"
                      danger
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(img);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                    </IconAction>
                  </div>

                  {/* Public domain tag */}
                  <span className="absolute top-2.5 left-2.5 font-mono text-[0.55rem] uppercase tracking-widest text-foreground/80 bg-black/55 backdrop-blur-md border border-white/10 rounded-full px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    PD
                  </span>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <ImageModal
        image={selected}
        onClose={() => setSelected(null)}
        saved={selected ? savedIds.has(selected.id) : false}
        onToggleSave={() => selected && toggle(selected)}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-serif text-3xl md:text-4xl text-foreground tabular-nums">
        {value}
      </div>
      <div className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground mt-1">
        {label}
      </div>
    </div>
  );
}

interface IconActionProps extends React.HTMLAttributes<HTMLElement> {
  as?: "button" | "a";
  href?: string;
  target?: string;
  rel?: string;
  danger?: boolean;
  children: React.ReactNode;
}

function IconAction({
  as = "button",
  danger,
  className = "",
  children,
  ...rest
}: IconActionProps) {
  const cls = `p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-foreground transition-all duration-200 ${
    danger ? "hover:bg-destructive/80 hover:border-destructive" : "hover:bg-accent hover:text-accent-foreground hover:border-accent"
  } ${className}`;
  if (as === "a") {
    return (
      <a className={cls} {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }
  return (
    <button className={cls} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
