import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ArchiveImage } from "@/types/image";
import { useDeviceId } from "./useDeviceId";

export function useSaves() {
  const deviceId = useDeviceId();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<ArchiveImage[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    const { data } = await supabase
      .from("saved_images")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false });
    if (data) {
      setItems(
        data.map((r) => ({
          id: r.image_id,
          url: r.image_url,
          title: r.title || "Untitled",
          source: r.source || "",
          sourceUrl: r.source_url || undefined,
          width: r.width || 600,
          height: r.height || 600,
        }))
      );
      setSavedIds(new Set(data.map((r) => r.image_id)));
    }
    setLoading(false);
  }, [deviceId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (img: ArchiveImage) => {
      if (!deviceId) return;
      const isSaved = savedIds.has(img.id);
      // Optimistic
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.delete(img.id);
        else next.add(img.id);
        return next;
      });
      if (isSaved) {
        await supabase
          .from("saved_images")
          .delete()
          .eq("device_id", deviceId)
          .eq("image_id", img.id);
        setItems((prev) => prev.filter((i) => i.id !== img.id));
      } else {
        await supabase.from("saved_images").insert({
          device_id: deviceId,
          image_id: img.id,
          image_url: img.url,
          title: img.title,
          source: img.source,
          source_url: img.sourceUrl ?? null,
          width: img.width,
          height: img.height,
        });
        setItems((prev) => [img, ...prev]);
      }
    },
    [deviceId, savedIds]
  );

  return { savedIds, items, loading, toggle, refresh, deviceId };
}
