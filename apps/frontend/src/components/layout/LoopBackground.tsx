"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type LoopBackgroundProps = {
  sources?: string[];
  opacity?: number; // 0..1
};

export default function LoopBackground({
  sources,
  opacity = 0.18,
}: LoopBackgroundProps) {
  const defaultSources = useMemo(
    () => [
      "/assets/arcade-1.mp4",
      "/assets/arcade-2.mp4",
      "/assets/arcade-3.mp4",
    ],
    []
  );

  const playlist = sources && sources.length > 0 ? sources : defaultSources;
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [visible, setVisible] = useState(true);

  const handleEnded = useCallback(() => {
    setVisible(false);
    const next = (index + 1) % playlist.length;
    setTimeout(() => {
      setIndex(next);
      setVisible(true);
      const el = videoRef.current;
      if (el) {
        el.load();
        const playPromise = el.play();
        if (playPromise && typeof playPromise.then === "function") {
          playPromise.catch(() => {});
        }
      }
    }, 180); // short crossfade
  }, [index, playlist.length]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onCanPlay = () => {
      const p = el.play();
      if (p && typeof p.then === "function") p.catch(() => {});
    };
    el.addEventListener("canplay", onCanPlay);
    return () => el.removeEventListener("canplay", onCanPlay);
  }, [index]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <video
        key={index}
        ref={videoRef}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
        muted
        playsInline
        autoPlay
        preload="auto"
        disablePictureInPicture
        controls={false}
        onEnded={handleEnded}
        onError={() => {
          const el = videoRef.current;
          if (el) {
            try { el.play().catch(() => {}); } catch {}
          }
        }}
      >
        <source src={playlist[index]} type="video/mp4" />
      </video>
      <div
        className="absolute inset-0"
        style={{
          opacity,
          background:
            "radial-gradient(1200px 600px at 50% -10%, rgba(255,255,255,0.5), transparent 50%), linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,0.6))",
          mixBlendMode: "lighten",
        }}
      />
      <div className="absolute inset-0 bg-white/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/70" />
    </div>
  );
}


