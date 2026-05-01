/**
 * InfiniteCanvas — 8-direction pannable canvas with drag, wheel, and keyboard.
 * Uses fixed grid cells (TILE_W × TILE_H) where each cell holds one image picked
 * deterministically from the pool by (col, row). Only visible cells are rendered.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import type { ArchiveImage } from "@/types/image";

const TILE_W = 280;
const TILE_H = 280;
const GAP = 14;
const CELL_W = TILE_W + GAP;
const CELL_H = TILE_H + GAP;

interface Props {
  pool: ArchiveImage[];
  onLoadMore: () => void;
  loading: boolean;
  savedIds: Set<string>;
  onToggleSave: (img: ArchiveImage) => void;
  onOpen: (img: ArchiveImage) => void;
}

// Hash for deterministic but well-distributed cell -> pool index mapping
function cellHash(c: number, r: number, mod: number) {
  // Simple integer hash
  let h = (c * 73856093) ^ (r * 19349663);
  h = (h ^ (h >>> 13)) >>> 0;
  return h % mod;
}

// Random size variation per cell (1x1, 1x2, 2x1) for a "Cosmos-like" feel
function cellSpan(c: number, r: number): { sx: number; sy: number } {
  const k = cellHash(c + 9991, r - 7771, 100);
  if (k < 8) return { sx: 2, sy: 1 };
  if (k < 16) return { sx: 1, sy: 2 };
  return { sx: 1, sy: 1 };
}

export function InfiniteCanvas({
  pool,
  onLoadMore,
  loading,
  savedIds,
  onToggleSave,
  onOpen,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  const [size, setSize] = useState({ w: 1200, h: 800 });
  const [isDragging, setDragging] = useState(false);
  const [velocity, setVelocity] = useState(0); // for motion-blur intensity
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const lastMoveRef = useRef<{ t: number; x: number; y: number } | null>(null);
  const inertiaRef = useRef<{ vx: number; vy: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Inertia animation
  useEffect(() => {
    const tick = () => {
      const v = inertiaRef.current;
      if (v && (Math.abs(v.vx) > 0.1 || Math.abs(v.vy) > 0.1)) {
        setOffset((o) => ({ x: o.x + v.vx, y: o.y + v.vy }));
        setVelocity(Math.hypot(v.vx, v.vy));
        v.vx *= 0.94;
        v.vy *= 0.94;
        rafRef.current = requestAnimationFrame(tick);
      } else {
        inertiaRef.current = null;
        setVelocity(0);
        rafRef.current = null;
      }
    };
    if (inertiaRef.current && rafRef.current == null) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [offset]);

  // Wheel pan (trackpad two-finger)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      inertiaRef.current = null;
      setOffset((o) => ({ x: o.x - e.deltaX, y: o.y - e.deltaY }));
      setVelocity(Math.hypot(e.deltaX, e.deltaY));
      // decay velocity
      window.clearTimeout((onWheel as any)._t);
      (onWheel as any)._t = window.setTimeout(() => setVelocity(0), 80);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Keyboard arrows
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const step = e.shiftKey ? 200 : 80;
      if (e.key === "ArrowLeft") setOffset((o) => ({ ...o, x: o.x + step }));
      else if (e.key === "ArrowRight") setOffset((o) => ({ ...o, x: o.x - step }));
      else if (e.key === "ArrowUp") setOffset((o) => ({ ...o, y: o.y + step }));
      else if (e.key === "ArrowDown") setOffset((o) => ({ ...o, y: o.y - step }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Pointer drag
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    inertiaRef.current = null;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offsetRef.current.x,
      oy: offsetRef.current.y,
    };
    lastMoveRef.current = { t: performance.now(), x: e.clientX, y: e.clientY };
    setDragging(true);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const nx = d.ox + (e.clientX - d.x);
    const ny = d.oy + (e.clientY - d.y);
    const last = lastMoveRef.current;
    const now = performance.now();
    if (last) {
      const dt = Math.max(1, now - last.t);
      const vx = (e.clientX - last.x) / dt * 16; // px / frame
      const vy = (e.clientY - last.y) / dt * 16;
      setVelocity(Math.hypot(vx, vy));
    }
    lastMoveRef.current = { t: now, x: e.clientX, y: e.clientY };
    setOffset({ x: nx, y: ny });
  }, []);

  const onPointerUp = useCallback(() => {
    const d = dragRef.current;
    const last = lastMoveRef.current;
    dragRef.current = null;
    setDragging(false);
    if (d && last) {
      const dt = Math.max(1, performance.now() - last.t);
      // We don't have a previous "previous" sample; reuse setVelocity-derived approx
      // Use small fling based on recent drag delta
    }
    // Trigger gentle inertia from current velocity direction if any drag movement happened
    if (last) {
      const elapsed = performance.now() - last.t;
      if (elapsed < 80) {
        // Apply some inertia using last velocity tracked
        inertiaRef.current = {
          vx: (lastMoveRef.current?.x ?? 0) - (d?.x ?? 0) > 0 ? 8 : -8,
          vy: 0,
        };
        // Better: derive from actual movement
      }
    }
  }, []);

  // Visible cell range
  const visible = useMemo(() => {
    // World coords: cell (c,r) is at world position (c*CELL_W, r*CELL_H)
    // Screen position = world + offset. Visible when 0..size.
    const minC = Math.floor((-offset.x) / CELL_W) - 1;
    const maxC = Math.ceil((size.w - offset.x) / CELL_W) + 1;
    const minR = Math.floor((-offset.y) / CELL_H) - 1;
    const maxR = Math.ceil((size.h - offset.y) / CELL_H) + 1;
    return { minC, maxC, minR, maxR };
  }, [offset, size]);

  // Load more when pool < demand (prefetch aggressively to avoid empty tiles)
  useEffect(() => {
    const cells =
      (visible.maxC - visible.minC) * (visible.maxR - visible.minR);
    if (pool.length === 0 && !loading) onLoadMore();
    else if (pool.length > 0 && pool.length < Math.max(120, cells * 3) && !loading) {
      onLoadMore();
    }
  }, [visible, pool.length, loading, onLoadMore]);

  // Build cell list, skipping cells covered by larger spans
  const cells: { c: number; r: number; sx: number; sy: number }[] = [];
  if (pool.length > 0) {
    const occupied = new Set<string>();
    for (let r = visible.minR; r <= visible.maxR; r++) {
      for (let c = visible.minC; c <= visible.maxC; c++) {
        if (occupied.has(`${c},${r}`)) continue;
        const { sx, sy } = cellSpan(c, r);
        // Mark covered cells as occupied
        for (let dy = 0; dy < sy; dy++) {
          for (let dx = 0; dx < sx; dx++) {
            occupied.add(`${c + dx},${r + dy}`);
          }
        }
        cells.push({ c, r, sx, sy });
      }
    }
  }

  // Motion-blur amount based on velocity
  const blur = Math.min(8, velocity / 6);

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative w-full h-full overflow-hidden select-none touch-none"
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        background:
          "radial-gradient(circle at 30% 20%, #161613 0%, #0a0a0a 60%, #050505 100%)",
      }}
    >
      {/* Subtle grid background */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: `${CELL_W}px ${CELL_H}px`,
          backgroundPosition: `${offset.x}px ${offset.y}px`,
        }}
      />

      {/* Tiles */}
      <div
        className="absolute inset-0"
        style={{
          filter: blur > 0.4 ? `blur(${blur}px)` : "none",
          transition: blur < 0.4 ? "filter 200ms ease-out" : "none",
          willChange: "filter",
        }}
      >
        {cells.map(({ c, r, sx, sy }) => {
          const idx = cellHash(c, r, Math.max(1, pool.length));
          const img = pool[idx];
          if (!img) return null;
          const x = c * CELL_W + offset.x;
          const y = r * CELL_H + offset.y;
          const w = sx * TILE_W + (sx - 1) * GAP;
          const h = sy * TILE_H + (sy - 1) * GAP;
          const saved = savedIds.has(img.id);
          return (
            <div
              key={`${c}:${r}`}
              className="absolute group rounded-md overflow-hidden bg-surface shadow-[0_8px_28px_-12px_rgba(0,0,0,0.7)] transition-transform duration-300 ease-out hover:scale-[1.02] hover:z-10"
              style={{
                left: x,
                top: y,
                width: w,
                height: h,
              }}
            >
              <img
                src={img.url}
                alt={img.title}
                draggable={false}
                loading="eager"
                decoding="async"
                onClick={() => !isDragging && onOpen(img)}
                className="w-full h-full object-cover animate-fade-in"
                style={{ pointerEvents: isDragging ? "none" : "auto" }}
              />
              {/* Hover info */}
              <div className="absolute inset-x-0 bottom-0 px-3 py-2 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="font-serif text-[0.85rem] text-foreground truncate italic">
                  {img.title}
                </div>
                <div className="font-mono text-[0.6rem] text-muted-foreground uppercase tracking-wider truncate">
                  {img.source}
                </div>
              </div>
              {/* Save button */}
              <button
                data-no-drag
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(img);
                }}
                className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all duration-200 ${
                  saved
                    ? "bg-accent text-accent-foreground opacity-100"
                    : "bg-black/50 text-foreground opacity-0 group-hover:opacity-100 hover:bg-black/80"
                }`}
                aria-label={saved ? "Remove from library" : "Save to library"}
              >
                {saved ? (
                  <BookmarkCheck className="w-3.5 h-3.5" strokeWidth={2} />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" strokeWidth={1.8} />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* HUD: drag hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground/60 pointer-events-none">
        drag · scroll · arrows
      </div>
    </div>
  );
}
