'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import type { ChatMessage, QueueItem, RoomState } from '@syncjam/shared';
import { getSocket } from '../../../lib/socket';
import { buildInviteLink, getRealtimeUrl } from '../../../lib/realtime-url';
import YouTubePlayer from '../../../components/YouTubePlayer';

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code ?? '').toUpperCase();

  const [name, setName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [room, setRoom] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [addInput, setAddInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState<string | null>(null);
  const [playlistPreview, setPlaylistPreview] = useState<{
    title: string;
    items: QueueItem[];
  } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const myIdRef = useRef<string | null>(null);
  const positionRef = useRef(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('syncjam:name');
      if (stored && stored.trim()) setName(stored.trim());
    } catch {}
  }, []);

  function submitName(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nameInput.trim().slice(0, 32);
    if (!trimmed) return;
    try { localStorage.setItem('syncjam:name', trimmed); } catch {}
    setName(trimmed);
  }

  useEffect(() => {
    if (!name) return;
    const socket = getSocket();

    const onConnect = () => {
      myIdRef.current = socket.id ?? null;
      socket.emit('JOIN_ROOM', code, name, (state) => {
        if (!state) setError('Room not found. Ask the host for a new link.');
        else setRoom(state);
      });
    };

    if (socket.connected) onConnect();
    else socket.on('connect', onConnect);

    socket.on('ROOM_STATE', (state) => setRoom(state));
    socket.on('PLAYBACK_UPDATE', (playback) =>
      setRoom((r) => (r ? { ...r, playback } : r)),
    );
    socket.on('QUEUE_UPDATE', (tracks, currentIndex) =>
      setRoom((r) => (r ? { ...r, tracks, currentIndex } : r)),
    );
    socket.on('CHAT_MESSAGE', (msg) =>
      setMessages((prev) => [...prev.slice(-199), msg]),
    );

    const hb = setInterval(() => {
      socket.emit('HEARTBEAT', (_serverNow, playback) => {
        setRoom((r) => (r ? { ...r, playback } : r));
      });
    }, 10_000);

    return () => {
      clearInterval(hb);
      socket.off('connect', onConnect);
      socket.off('ROOM_STATE');
      socket.off('PLAYBACK_UPDATE');
      socket.off('QUEUE_UPDATE');
      socket.off('CHAT_MESSAGE');
    };
  }, [code, name]);

  const isHost = useMemo(() => room?.hostId === myIdRef.current, [room]);
  const canControl = isHost || !!room?.allowAllControl;

  const sendControl = useCallback(
    (action: 'play' | 'pause' | 'seek', positionMs?: number) => {
      const pos = positionMs ?? positionRef.current;
      getSocket().emit('PLAYBACK_CONTROL', action, pos);
    },
    [],
  );

  const onPositionSample = useCallback((positionMs: number) => {
    positionRef.current = positionMs;
  }, []);

  const onEnded = useCallback(() => {
    if (isHost) getSocket().emit('QUEUE_SKIP');
  }, [isHost]);

  function isPlaylistUrl(url: string): boolean {
    try {
      const u = new URL(url);
      if (u.hostname === 'open.spotify.com' || u.hostname.endsWith('.spotify.com')) {
        const parts = u.pathname.split('/').filter(Boolean);
        const i = parts[0]?.startsWith('intl-') ? 1 : 0;
        return parts[i] === 'playlist' || parts[i] === 'album';
      }
      const hasList = !!u.searchParams.get('list');
      const isPlaylistPath = u.pathname === '/playlist';
      const hasVideo = !!u.searchParams.get('v') || u.hostname === 'youtu.be';
      return isPlaylistPath || (hasList && !hasVideo);
    } catch {
      return false;
    }
  }

  async function addTrack() {
    if (!addInput.trim()) return;
    setAdding(true);
    setAddErr(null);
    try {
      const raw = addInput.trim();
      if (isPlaylistUrl(raw)) {
        const res = await fetch(
          `${getRealtimeUrl()}/api/playlist?url=${encodeURIComponent(raw)}`,
        );
        if (!res.ok) throw new Error('Could not load playlist');
        const ctype = res.headers.get('content-type') ?? '';
        if (ctype.includes('ndjson') && res.body) {
          setAddInput('');
          let title = 'Playlist';
          let items: QueueItem[] = [];
          setPlaylistPreview({ title, items: [] });
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buf = '';
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() ?? '';
            for (const line of lines) {
              if (!line.trim()) continue;
              const msg = JSON.parse(line) as
                | { type: 'meta'; title: string; total: number }
                | { type: 'items'; items: QueueItem[] }
                | { type: 'done' }
                | { type: 'error'; error: string };
              if (msg.type === 'meta') {
                title = msg.title;
                setPlaylistPreview({ title, items: [...items] });
              } else if (msg.type === 'items') {
                items = [...items, ...msg.items];
                setPlaylistPreview({ title, items });
              } else if (msg.type === 'error') {
                throw new Error(msg.error);
              }
            }
          }
        } else {
          const pl = (await res.json()) as { title: string; items: QueueItem[] };
          setPlaylistPreview(pl);
          setAddInput('');
        }
      } else {
        const res = await fetch(
          `${getRealtimeUrl()}/api/resolve?url=${encodeURIComponent(raw)}`,
        );
        if (!res.ok) throw new Error('Could not resolve that link');
        const item = (await res.json()) as QueueItem;
        getSocket().emit('QUEUE_ADD', { ...item, addedBy: name });
        setAddInput('');
      }
    } catch (e) {
      setAddErr((e as Error).message);
    } finally {
      setAdding(false);
    }
  }

  function addOneFromPreview(item: QueueItem) {
    getSocket().emit('QUEUE_ADD', { ...item, addedBy: name });
  }

  function addAllFromPreview() {
    if (!playlistPreview) return;
    for (const item of playlistPreview.items) {
      getSocket().emit('QUEUE_ADD', { ...item, addedBy: name });
    }
    setPlaylistPreview(null);
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(buildInviteLink(code));
  }

  function sendChat() {
    const text = chatInput.trim();
    if (!text) return;
    getSocket().emit('CHAT_SEND', text);
    setChatInput('');
  }

  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  if (!name) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Join room {code}</h1>
          <p className="mt-2 text-white/60">What should we call you?</p>
        </div>
        <form onSubmit={submitName} className="flex flex-col gap-3">
          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your name"
            maxLength={32}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-white/30"
          />
          <button
            type="submit"
            disabled={!nameInput.trim()}
            className="rounded-lg bg-fuchsia-600 px-5 py-3 font-semibold hover:bg-fuchsia-500 disabled:opacity-50"
          >
            Join
          </button>
        </form>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-bold">Oops</h1>
        <p className="mt-2 text-white/60">{error}</p>
        <a href="/" className="mt-4 inline-block text-fuchsia-400 underline">Back home</a>
      </main>
    );
  }

  if (!room) {
    return <main className="mx-auto max-w-xl p-6 text-white/60">Joining room {code}…</main>;
  }

  const hasVideo = !!room.playback.videoId;

  return (
    <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Room {room.code}</h1>
          <p className="text-sm text-white/50">
            {room.participants.length} listening ·{' '}
            {isHost
              ? 'You are host'
              : room.allowAllControl
              ? 'Everyone can control'
              : 'Host controls playback'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isHost && (
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5">
              <input
                type="checkbox"
                checked={room.allowAllControl}
                onChange={(e) =>
                  getSocket().emit('SET_CONTROL_MODE', e.target.checked)
                }
                className="accent-fuchsia-500"
              />
              Everyone can control
            </label>
          )}
          <button
            onClick={copyInvite}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          >
            Copy invite link
          </button>
        </div>
      </header>

      {!audioUnlocked ? (
        <button
          onClick={() => setAudioUnlocked(true)}
          className="mb-4 w-full rounded-xl bg-fuchsia-600 px-5 py-4 font-semibold hover:bg-fuchsia-500"
        >
          Tap to join audio
        </button>
      ) : hasVideo ? (
        <YouTubePlayer
          playback={room.playback}
          onEnded={onEnded}
          onPositionSample={onPositionSample}
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-white/10 text-white/50">
          Queue is empty — paste a YouTube link below to start
        </div>
      )}

      {canControl && audioUnlocked && hasVideo && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => sendControl(room.playback.isPlaying ? 'pause' : 'play')}
            className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20"
          >
            {room.playback.isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={() => getSocket().emit('QUEUE_SKIP')}
            className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20"
          >
            Skip
          </button>
          <button
            onClick={() => sendControl('seek', 0)}
            className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20"
          >
            Restart track
          </button>
        </div>
      )}

      <section className="mt-6">
        <h2 className="mb-2 text-sm uppercase tracking-wider text-white/50">Add a track or playlist</h2>
        <div className="flex gap-2">
          <input
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTrack()}
            placeholder="Paste YouTube, YouTube Music, or Spotify link (track or playlist)"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-white/30"
          />
          <button
            onClick={addTrack}
            disabled={adding}
            className="rounded-lg bg-fuchsia-600 px-4 py-3 font-semibold hover:bg-fuchsia-500 disabled:opacity-50"
          >
            {adding ? 'Loading…' : 'Add'}
          </button>
        </div>
        {addErr && <p className="mt-1 text-sm text-red-400">{addErr}</p>}
      </section>

      {playlistPreview && (
        <section className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-white/50">Playlist</p>
              <p className="truncate font-semibold">{playlistPreview.title}</p>
              <p className="text-xs text-white/50">{playlistPreview.items.length} tracks</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={addAllFromPreview}
                className="rounded-lg bg-fuchsia-600 px-3 py-2 text-sm font-semibold hover:bg-fuchsia-500"
              >
                Add all
              </button>
              <button
                onClick={() => setPlaylistPreview(null)}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
          <ul className="max-h-96 space-y-1 overflow-y-auto pr-1">
            {playlistPreview.items.map((it, i) => (
              <li
                key={`${it.videoId}-${i}`}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/5"
              >
                <img src={it.thumbnail} alt="" className="h-10 w-16 rounded object-cover" />
                <p className="min-w-0 flex-1 truncate text-sm">
                  <span className="mr-2 text-white/40">#{i + 1}</span>
                  {it.title}
                </p>
                <button
                  onClick={() => addOneFromPreview(it)}
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/10"
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <PlaylistBox
        tracks={room.tracks}
        currentIndex={room.currentIndex}
        canControl={canControl}
        onJump={(i) => getSocket().emit('QUEUE_JUMP', i)}
      />


      <section className="mt-6">
        <h2 className="mb-2 text-sm uppercase tracking-wider text-white/50">In the room</h2>
        <ul className="flex flex-wrap gap-2">
          {room.participants.map((p) => (
            <li
              key={p.id}
              className="rounded-full border border-white/10 px-3 py-1 text-sm"
              title={p.isHost ? 'Host' : 'Listener'}
            >
              {p.name}{p.isHost ? ' (host)' : ''}
            </li>
          ))}
        </ul>
      </section>
      </div>

      <aside className="flex h-[calc(100vh-3rem)] flex-col rounded-xl border border-white/10 bg-white/5 lg:sticky lg:top-6">
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70">Chat</h2>
        </div>
        <div ref={chatScrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
          {messages.length === 0 ? (
            <p className="text-sm text-white/40">No messages yet. Say hi 👋</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="font-semibold text-fuchsia-300">{m.name}</span>
                <span className="ml-2 text-white/90">{m.text}</span>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-white/10 p-3">
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder="Message…"
              maxLength={500}
              className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/30"
            />
            <button
              onClick={sendChat}
              className="rounded-lg bg-fuchsia-600 px-3 py-2 text-sm font-semibold hover:bg-fuchsia-500"
            >
              Send
            </button>
          </div>
        </div>
      </aside>
    </main>
  );
}

function PlaylistBox({
  tracks,
  currentIndex,
  canControl,
  onJump,
}: {
  tracks: QueueItem[];
  currentIndex: number;
  canControl: boolean;
  onJump: (index: number) => void;
}) {
  const currentRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [currentIndex]);

  if (tracks.length === 0) {
    return (
      <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="mb-2 text-sm uppercase tracking-wider text-white/50">Playlist</h2>
        <p className="text-sm text-white/40">No tracks yet.</p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70">Playlist</h2>
        <span className="text-xs text-white/50">
          {currentIndex >= 0 && currentIndex < tracks.length
            ? `${currentIndex + 1} / ${tracks.length}`
            : `${tracks.length} tracks`}
        </span>
      </div>
      <ul className="max-h-[360px] space-y-1 overflow-y-auto p-2">
        {tracks.map((t, i) => {
          const isNow = i === currentIndex;
          const isPast = i < currentIndex;
          return (
            <li
              key={`${t.videoId}-${i}`}
              ref={isNow ? currentRef : null}
              className={`flex items-center gap-3 rounded-lg border p-2 transition ${
                isNow
                  ? 'border-fuchsia-500/60 bg-fuchsia-500/15'
                  : isPast
                  ? 'border-white/5 bg-white/0 opacity-50'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="w-6 shrink-0 text-center text-xs text-white/40">
                {isNow ? '▶' : isPast ? '✓' : i + 1}
              </div>
              <img src={t.thumbnail} alt="" className="h-10 w-16 shrink-0 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {isNow && (
                    <span className="mr-2 rounded bg-fuchsia-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Now
                    </span>
                  )}
                  {t.title}
                </p>
                <p className="text-xs text-white/40">added by {t.addedBy}</p>
              </div>
              {canControl && !isNow && (
                <button
                  onClick={() => onJump(i)}
                  className="shrink-0 rounded-lg border border-white/10 px-2.5 py-1 text-xs font-semibold hover:bg-white/10"
                  title="Play this"
                >
                  ▶
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
