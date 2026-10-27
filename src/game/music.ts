export const FIRST_VIDEO = "vf-XIsSWiGA";
export const DEFAULT_MUSIC = [FIRST_VIDEO, "BHlCNUyu5EU", "hxMNYkLN7tI"];

export function parseYouTubeLink(value: string): { videoId: string; playlistId?: string } | null {
  const input = value.trim();
  if (/^[\w-]{11}$/.test(input)) return { videoId: input };
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\.|^m\./, "");
    if (!["youtu.be", "youtube.com", "youtube-nocookie.com"].includes(host)) return null;
    const id = host === "youtu.be" ? url.pathname.split("/")[1] : url.searchParams.get("v") ?? url.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})/)?.[1];
    if (!id || !/^[\w-]{11}$/.test(id)) return null;
    const list = url.searchParams.get("list");
    return { videoId: id, ...(list && /^[\w-]+$/.test(list) ? { playlistId: list } : {}) };
  } catch { return null; }
}

export function nextTrack(index: number, length: number) { return length > 0 ? (index + 1) % length : 0; }