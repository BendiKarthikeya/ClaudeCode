'use client';

import { useEffect, useRef, useState } from 'react';
import type { PlaybackState } from '@syncjam/shared';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const DRIFT_TOLERANCE_MS = 500;

let apiLoading: Promise<void> | null = null;
function loadYouTubeAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiLoading) return apiLoading;
  apiLoading = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  });
  return apiLoading;
}

interface Props {
  playback: PlaybackState;
  onEnded: () => void;
  onPositionSample?: (positionMs: number) => void;
}

export default function YouTubePlayer({ playback, onEnded, onPositionSample }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const readyRef = useRef(false);
  const lastVideoIdRef = useRef<string | null>(null);
  const playbackRef = useRef<PlaybackState>(playback);
  const lastCmdRef = useRef(0);
  playbackRef.current = playback;

  const [needsTapToPlay, setNeedsTapToPlay] = useState(false);

  function applyState() {
    const player = playerRef.current;
    if (!player || !readyRef.current) return;
    const p = playbackRef.current;
    const target = p.isPlaying ? p.positionMs + (Date.now() - p.updatedAt) : p.positionMs;

    if (p.videoId && p.videoId !== lastVideoIdRef.current) {
      lastVideoIdRef.current = p.videoId;
      lastCmdRef.current = Date.now();
      if (p.isPlaying) player.loadVideoById({ videoId: p.videoId, startSeconds: target / 1000 });
      else player.cueVideoById({ videoId: p.videoId, startSeconds: target / 1000 });
      return;
    }
    if (!p.videoId) return;

    if (!p.isPlaying) {
      lastCmdRef.current = Date.now();
      player.pauseVideo();
      const currentMs = (player.getCurrentTime?.() ?? 0) * 1000;
      if (Math.abs(currentMs - target) > DRIFT_TOLERANCE_MS) {
        player.seekTo(target / 1000, true);
        player.pauseVideo();
      }
      return;
    }

    const currentMs = (player.getCurrentTime?.() ?? 0) * 1000;
    if (Math.abs(currentMs - target) > DRIFT_TOLERANCE_MS) {
      player.seekTo(target / 1000, true);
    }
    lastCmdRef.current = Date.now();
    player.playVideo();
  }

  useEffect(() => {
    let cancelled = false;
    loadYouTubeAPI().then(() => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        width: '100%',
        height: '100%',
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            readyRef.current = true;
            applyState();
            setTimeout(() => {
              const p = playbackRef.current;
              const state = playerRef.current?.getPlayerState?.();
              if (p.isPlaying && state !== 1 && state !== 3) {
                setNeedsTapToPlay(true);
              }
            }, 1500);
          },
          onStateChange: (e: any) => {
            const p = playbackRef.current;
            if (e.data === 0) {
              onEnded();
              return;
            }
            const recent = Date.now() - lastCmdRef.current < 1500;
            if (recent) return;
            if (e.data === 1 && !p.isPlaying) {
              playerRef.current?.pauseVideo();
              return;
            }
            if (e.data === 2 && p.isPlaying) {
              setNeedsTapToPlay(true);
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
      readyRef.current = false;
    };
  }, [onEnded]);

  useEffect(() => {
    setNeedsTapToPlay(false);
    applyState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playback]);

  useEffect(() => {
    if (!onPositionSample) return;
    const id = setInterval(() => {
      const t = playerRef.current?.getCurrentTime?.();
      if (typeof t === 'number') onPositionSample(Math.round(t * 1000));
      const p = playbackRef.current;
      const state = playerRef.current?.getPlayerState?.();
      if (p.isPlaying && (state === 2 || state === 5 || state === -1)) {
        setNeedsTapToPlay(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [onPositionSample]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <div ref={containerRef} className="h-full w-full" />
      {needsTapToPlay && (
        <button
          onClick={() => {
            setNeedsTapToPlay(false);
            lastCmdRef.current = Date.now();
            playerRef.current?.playVideo?.();
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/60 text-white"
        >
          <span className="rounded-full bg-fuchsia-600 px-5 py-3 font-semibold">
            Tap to play ▶
          </span>
        </button>
      )}
    </div>
  );
}
