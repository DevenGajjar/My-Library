import { Link } from "@tanstack/react-router";
import { Search, Bookmark } from "lucide-react";

interface HeaderProps {
  search: string;
  onSearchChange: (v: string) => void;
  savedCount: number;
}

export function Header({ search, onSearchChange, savedCount }: HeaderProps) {
  return (
    <header className="absolute top-0 inset-x-0 z-[100] pointer-events-none">
      <div className="flex items-center gap-3 md:gap-6 px-4 md:px-6 py-4">
        {/* Logo */}
        <Link
          to="/"
          className="pointer-events-auto font-serif text-2xl leading-none tracking-tight shrink-0 select-none bg-background/60 backdrop-blur-md border-hairline rounded-[40px] px-4 py-2"
        >
          my<span className="italic text-accent">library</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-auto w-full pointer-events-auto">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
              strokeWidth={1.5}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="search the archive…"
              className="w-full bg-background/70 backdrop-blur-md border-hairline rounded-[40px] pl-10 pr-5 py-2.5 text-[0.78rem] font-mono placeholder:text-muted-foreground/70 focus:outline-none focus:border-accent/40 transition-colors"
            />
          </div>
        </div>

        {/* Saved link */}
        <Link
          to="/saved"
          className="pointer-events-auto group inline-flex items-center gap-2 bg-background/60 backdrop-blur-md border-hairline rounded-[40px] px-4 py-2 hover:border-accent/40 transition-colors"
        >
          <Bookmark className="w-3.5 h-3.5 text-accent" strokeWidth={1.8} />
          <span className="font-mono text-[0.65rem] uppercase tracking-widest">
            saved
          </span>
          {savedCount > 0 && (
            <span className="font-mono text-[0.6rem] text-accent">
              {savedCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
