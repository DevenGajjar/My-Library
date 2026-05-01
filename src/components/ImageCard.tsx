import { useState } from "react";
import type { ArchiveImage } from "@/types/image";

interface ImageCardProps {
  image: ArchiveImage;
  onClick: () => void;
}

export function ImageCard({ image, onClick }: ImageCardProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      onClick={onClick}
      className="group relative block w-full mb-[10px] rounded-md overflow-hidden bg-surface text-left cursor-pointer"
    >
      <div className="overflow-hidden">
        <img
          src={image.url}
          alt={image.title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`w-full block transition-transform duration-[400ms] ease-out group-hover:scale-[1.04] ${
            loaded ? "animate-img-in" : "opacity-0"
          }`}
        />
      </div>
      {/* Hover overlay */}
      <div className="absolute inset-x-0 bottom-0 px-3 py-2.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="font-mono text-[0.65rem] text-foreground/90 truncate">
          {image.source}
        </div>
      </div>
    </button>
  );
}
