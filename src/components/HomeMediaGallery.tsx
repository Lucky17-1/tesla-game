import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { homeMedia } from "@/data/home-media";

export function HomeMediaGallery() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [continuePlaying, setContinuePlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const selected = homeMedia[selectedIndex];

  if (!selected) return null;

  function selectVideo(index: number) {
    if (index === selectedIndex || !homeMedia[index]) return;
    videoRef.current?.pause();
    setContinuePlaying(playing);
    setPlaying(false);
    setFailed(false);
    setSelectedIndex(index);
  }

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) {
      video.pause();
      return;
    }
    try {
      if (failed) { setFailed(false); video.load(); }
      await video.play();
    } catch {
      // The native controls remain available if a browser blocks a play request.
      if (video.error) setFailed(true);
    }
  }

  return (
    <div aria-label="Tesla video gallery">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pb-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {String(selectedIndex + 1).padStart(2, "0")} / {String(homeMedia.length).padStart(2, "0")}
          </span>
          <h3 className="truncate font-display text-sm font-semibold sm:text-base">{selected.title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" disabled={selectedIndex === 0} aria-label="Previous video" title="Previous video" onClick={() => selectVideo(selectedIndex - 1)}>
            <ChevronLeft />
          </Button>
          <Button variant="secondary" size="icon" aria-label={playing ? "Pause video" : "Play video"} title={playing ? "Pause video" : "Play video"} onClick={togglePlayback}>
            {playing ? <Pause /> : <Play />}
          </Button>
          <Button variant="ghost" size="icon" disabled={selectedIndex === homeMedia.length - 1} aria-label="Next video" title="Next video" onClick={() => selectVideo(selectedIndex + 1)}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="relative aspect-video w-full bg-vehicle-screen">
        <video
          key={selected.id}
          ref={videoRef}
          src={selected.video}
          poster={selected.poster}
          aria-label={`${selected.title} video`}
          className="h-full w-full object-contain"
          controls
          playsInline
          preload="metadata"
          autoPlay={continuePlaying}
          onPlay={() => { setPlaying(true); setFailed(false); }}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={() => { setFailed(true); setPlaying(false); }}
        />
        {failed && (
          <div role="alert" className="absolute inset-x-0 top-0 flex items-center justify-center gap-3 bg-background/95 px-4 py-4 text-sm text-foreground">
            <span>This video could not load.</span>
            <Button variant="outline" size="sm" onClick={togglePlayback}>Retry</Button>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
        <div role="group" aria-label="Choose video" className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {homeMedia.map((item, index) => (
            <Button
              key={item.id}
              variant="ghost"
              aria-label={`Select ${item.title} video`}
              aria-pressed={selectedIndex === index}
              onClick={() => selectVideo(index)}
              className={`h-auto min-w-0 flex-col items-stretch gap-2 whitespace-normal p-1.5 text-left ${selectedIndex === index ? "bg-accent text-foreground ring-1 ring-primary" : "text-muted-foreground"}`}
            >
              <span className="relative block aspect-video w-full overflow-hidden rounded-sm bg-muted">
                <img src={item.poster} alt="" loading="lazy" className="h-full w-full object-cover" />
                <span className="absolute bottom-1 right-1 flex size-6 items-center justify-center rounded-sm bg-vehicle-screen/80 text-vehicle-light"><Play className="size-3" /></span>
              </span>
              <span className="block min-h-8 text-xs leading-4">{item.title}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}