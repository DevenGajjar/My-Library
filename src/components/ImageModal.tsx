import { useEffect } from "react";
import { X, ExternalLink, Bookmark, BookmarkCheck, Download } from "lucide-react";
import { downloadImage } from "@/lib/download";
import type { ArchiveImage } from "@/types/image";

interface ImageModalProps {
  image: ArchiveImage | null;
  onClose: () => void;
  saved: boolean;
  onToggleSave: () => void;
}

export function ImageModal({ image, onClose, saved, onToggleSave }: ImageModalProps) {
  useEffect(() => {
    if (!image) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [image, onClose]);

  if (!image) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-fade-in"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5" strokeWidth={1.5} />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-modal-in flex flex-col lg:flex-row gap-6 max-w-6xl w-full max-h-[90vh]"
      >
        <div className="flex-1 flex items-center justify-center min-h-0">
          <img
            src={image.url}
            alt={image.title}
            className="max-w-full max-h-[80vh] object-contain rounded-md"
          />
        </div>

        <aside className="lg:w-72 shrink-0 flex flex-col gap-5 bg-surface border-hairline rounded-md p-5 overflow-y-auto">
          <span className="self-start inline-block font-mono text-[0.6rem] uppercase tracking-widest text-accent border border-accent/40 rounded-[40px] px-2.5 py-1">
            Public Domain
          </span>
          <div>
            <h2 className="font-serif text-2xl leading-tight italic">{image.title}</h2>
            {image.artist && (
              <p className="font-mono text-[0.7rem] text-foreground/80 mt-2">
                {image.artist}
              </p>
            )}
            <p className="font-mono text-[0.7rem] text-muted-foreground mt-1">
              {image.source}
              {image.date ? ` · ${image.date}` : ""}
            </p>
          </div>
          <div className="flex flex-col gap-2 mt-auto">
            <button
              onClick={onToggleSave}
              className={`inline-flex items-center justify-center gap-2 font-mono text-[0.72rem] uppercase tracking-wider rounded-[40px] py-2.5 transition-colors border-hairline ${
                saved
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-transparent text-foreground hover:border-accent/40"
              }`}
            >
              {saved ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5" strokeWidth={2} /> saved
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" strokeWidth={1.8} /> save
                </>
              )}
            </button>
            <button
              onClick={() => downloadImage(image.url, image.title)}
              className="inline-flex items-center justify-center gap-2 font-mono text-[0.72rem] uppercase tracking-wider rounded-[40px] py-2.5 border-hairline hover:border-accent/40 transition-colors"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.8} /> download
            </button>
            {image.sourceUrl && (
              <a
                href={image.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 font-mono text-[0.72rem] uppercase tracking-wider rounded-[40px] py-2.5 border-hairline hover:border-accent/40 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.8} /> source
              </a>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
