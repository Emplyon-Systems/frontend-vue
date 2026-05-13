/**
 * Extrai o ID do vídeo a partir de URLs comuns do YouTube.
 */
export function youtubeVideoIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id || null;
    }
    if (host.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const m = u.pathname.match(/\/embed\/([^/?]+)/);
      if (m?.[1]) return m[1];
      const s = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (s?.[1]) return s[1];
    }
    return null;
  } catch {
    return null;
  }
}

export function youtubeEmbedUrl(url: string): string | null {
  const id = youtubeVideoIdFromUrl(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
