/**
 * Download an image by URL. Falls back to opening in a new tab if the
 * cross-origin fetch is blocked (e.g. some MET CDN responses without CORS).
 */
export async function downloadImage(url: string, filename: string) {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error("bad response");
    const blob = await res.blob();
    const ext =
      blob.type.split("/")[1]?.split("+")[0] ||
      url.split(".").pop()?.split("?")[0] ||
      "jpg";
    const safe = filename.replace(/[^\w\-]+/g, "_").slice(0, 60) || "image";
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = `${safe}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
  } catch {
    // CORS fallback — open in new tab so user can save manually
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
