import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DEFAULT_MUSIC, nextTrack, parseYouTubeLink } from "@/game/music";
import { useSimulator } from "@/game/simulator-store";
import { ExternalLink, ListMusic, Plus, SkipForward, Volume2, VolumeX, X } from "lucide-react";

interface YouTubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  loadVideoById(id: string): void;
  mute(): void;
  unMute(): void;
  destroy(): void;
}
type YouTubeApi = { Player: new (element: HTMLElement, options: Record<string, unknown>) => YouTubePlayer };
let apiPromise: Promise<YouTubeApi> | undefined;
function loadYouTube() {
  apiPromise ??= new Promise<YouTubeApi>((resolve, reject) => {
    const ytWindow = window as unknown as { YT?: YouTubeApi; onYouTubeIframeAPIReady?: () => void };
    if (ytWindow.YT?.Player) { resolve(ytWindow.YT); return; }
    const previous = ytWindow.onYouTubeIframeAPIReady;
    ytWindow.onYouTubeIframeAPIReady = () => { previous?.(); if (ytWindow.YT) resolve(ytWindow.YT); };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => { apiPromise = undefined; reject(new Error("YouTube could not connect.")); };
    document.head.appendChild(script);
  });
  return apiPromise;
}

export function SimulatorMusic({ enabled, muted }: { enabled: boolean; muted: boolean }) {
  const mount = useRef<HTMLDivElement>(null);
  const player = useRef<YouTubePlayer | null>(null);
  const queue = useRef<string[]>([...DEFAULT_MUSIC]);
  const index = useRef(0);
  const enabledRef = useRef(enabled);
  const mutedRef = useRef(muted);
  const [status, setStatus] = useState("YouTube");
  enabledRef.current = enabled;
  mutedRef.current = muted;
  useEffect(() => {
    let active = true;
    if (!enabled || !mount.current) return;
    const container = document.createElement("div");
    mount.current.appendChild(container);
    void loadYouTube().then((yt) => {
      if (!active) return;
      player.current = new yt.Player(container, {
        width: "100%", height: "100%", videoId: queue.current[index.current],
        playerVars: { autoplay: 1, playsinline: 1, controls: 1, rel: 0, origin: window.location.origin },
        events: {
          onReady: () => { if (mutedRef.current) player.current?.mute(); if (enabledRef.current && useSimulator.getState().state === "driving") player.current?.playVideo(); },
          onStateChange: (event: { data: number }) => {
            if (event.data === 0) { index.current = nextTrack(index.current, queue.current.length); const id = queue.current[index.current]; if (id) player.current?.loadVideoById(id); }
            if (event.data === 1) setStatus("Playing");
            if (event.data === 2) setStatus("Paused");
          },
          onError: () => setStatus("Video unavailable · skip or open YouTube"),
          onAutoplayBlocked: () => setStatus("Tap the video to play"),
        },
      });
    }).catch(() => setStatus("YouTube could not connect"));
    const unsubscribe = useSimulator.subscribe((s, previous) => {
      if (s.state === previous.state) return;
      if (s.state === "driving") player.current?.playVideo(); else player.current?.pauseVideo();
    });
    const command = (e: Event) => {
      const data = (e as CustomEvent<{ type: string; id?: string }>).detail;
      if (data.type === "next") { index.current = nextTrack(index.current, queue.current.length); const id = queue.current[index.current]; if (id) player.current?.loadVideoById(id); }
      if (data.type === "add" && data.id) { queue.current.push(data.id); index.current = queue.current.length - 1; player.current?.loadVideoById(data.id); }
    };
    window.addEventListener("sim-music", command);
    return () => { active = false; unsubscribe(); window.removeEventListener("sim-music", command); player.current?.destroy(); player.current = null; container.remove(); };
  }, [enabled]);
  useEffect(() => { if (muted) player.current?.mute(); else player.current?.unMute(); }, [muted]);
  return <div className="sim-screen" onPointerDown={(e) => e.stopPropagation()}>
    {enabled ? <div ref={mount} className="h-full w-full" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><ListMusic className="size-12" /></div>}
    <span className="sr-only" aria-live="polite">{status}</span>
  </div>;
}

export function MusicPanel({ onClose, muted, onMute }: { onClose: () => void; muted: boolean; onMute: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  return <div className="absolute right-3 top-28 z-30 w-[min(360px,calc(100%-24px))] rounded-lg border border-border bg-background p-4 text-foreground">
    <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Cabin YouTube</h2><Button variant="ghost" size="icon" aria-label="Close music" onClick={onClose}><X /></Button></div>
    <form onSubmit={(e) => { e.preventDefault(); const parsed = parseYouTubeLink(value); if (!parsed) { setError("Enter a valid YouTube video link."); return; } window.dispatchEvent(new CustomEvent("sim-music", { detail: { type: "add", id: parsed.videoId } })); setValue(""); setError(""); }}>
      <label htmlFor="youtube-link" className="mb-2 block text-xs text-muted-foreground">YouTube video link</label>
      <div className="flex gap-2"><input id="youtube-link" value={value} onChange={(e) => setValue(e.target.value)} className="min-w-0 flex-1 rounded-md border border-input bg-secondary px-3 text-sm" placeholder="https://youtu.be/…" /><Button size="icon" type="submit" aria-label="Play YouTube link"><Plus /></Button></div>
      {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
    </form>
    <div className="mt-4 flex items-center gap-2"><Button variant="secondary" size="icon" title="Next song" aria-label="Next song" onClick={() => window.dispatchEvent(new CustomEvent("sim-music", { detail: { type: "next" } }))}><SkipForward /></Button><Button variant="secondary" size="icon" title={muted ? "Unmute music" : "Mute music"} aria-label={muted ? "Unmute music" : "Mute music"} onClick={onMute}>{muted ? <VolumeX /> : <Volume2 />}</Button><Button asChild variant="ghost" size="sm"><a href={`https://www.youtube.com/watch?v=${DEFAULT_MUSIC[0]}`} target="_blank" rel="noreferrer"><ExternalLink /> YouTube</a></Button></div>
  </div>;
}