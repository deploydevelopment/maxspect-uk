import { useEffect, useRef } from "react";

interface AutoPlayVideoProps {
  src: string;
  title?: string;
  className?: string;
}

/**
 * Native video element that auto-plays (muted, looped) when scrolled into view
 * and pauses when it leaves the viewport. Must be muted to satisfy browser
 * autoplay policies. Controls are hidden by the parent via CSS.
 */
export function AutoPlayVideo({ src, title, className }: AutoPlayVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let rafId = 0;

    const tryPlay = () => {
      if (video.paused) {
        video.play().catch(() => {
          /* autoplay blocked — retry on next visibility change */
        });
      }
    };

    const handleLoadedData = () => {
      // The media is ready — attempt playback if currently visible.
      const rect = video.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView) tryPlay();
    };

    // IntersectionObserver: play when visible, pause when not.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            cancelAnimationFrame(rafId);
            tryPlay();
          } else if (!video.paused) {
            video.pause();
          }
        }
      },
      { threshold: [0, 0.05, 0.15, 0.3, 0.5, 0.75, 1] },
    );

    observer.observe(video);
    video.addEventListener("loadeddata", handleLoadedData);

    // Immediate fallback: if the video is already in view on mount and has
    // enough data, play right away (observer may not fire immediately).
    rafId = requestAnimationFrame(() => {
      const rect = video.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView && video.readyState >= 2) tryPlay();
    });

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      video.removeEventListener("loadeddata", handleLoadedData);
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      title={title}
      muted
      loop
      autoPlay
      playsInline
      preload="auto"
      className={className}
    />
  );
}
