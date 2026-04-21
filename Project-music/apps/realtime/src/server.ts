import { createServer, type ServerResponse } from 'node:http';
import { createRequire } from 'node:module';
import { networkInterfaces } from 'node:os';
import { Server } from 'socket.io';
import ytpl from '@distube/ytpl';
import YouTubeSr from 'youtube-sr';
import type { ClientToServerEvents, ServerToClientEvents, QueueItem } from '@syncjam/shared';

type SpotifyUrlInfoApi = {
  getData: (url: string) => Promise<unknown>;
  getTracks: (url: string) => Promise<unknown[]>;
};
const nodeRequire = createRequire(import.meta.url);
const spotifyUrlInfoFactory = nodeRequire('spotify-url-info') as (
  f: typeof fetch,
) => SpotifyUrlInfoApi;
const { getData: spotifyGetData, getTracks: spotifyGetTracks } = spotifyUrlInfoFactory(fetch);
const YouTube: typeof YouTubeSr =
  (YouTubeSr as unknown as { default?: typeof YouTubeSr }).default ?? YouTubeSr;
import {
  addParticipant,
  addToQueue,
  createRoom,
  getRoom,
  jumpToIndex,
  removeParticipant,
  skipTrack,
  updatePlayback,
} from './rooms.js';

const PORT = Number(process.env.PORT ?? 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? '*';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  } as const;
}

function lanAddresses(): string[] {
  const addrs: string[] = [];
  for (const iface of Object.values(networkInterfaces())) {
    for (const entry of iface ?? []) {
      if (entry.family === 'IPv4' && !entry.internal) addrs.push(entry.address);
    }
  }
  return addrs;
}

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null;
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const m = u.pathname.match(/\/(embed|shorts)\/([^/?]+)/);
    if (m) return m[2];
    return null;
  } catch {
    return /^[\w-]{11}$/.test(url) ? url : null;
  }
}

function extractPlaylistId(url: string): string | null {
  try {
    const u = new URL(url);
    return u.searchParams.get('list');
  } catch {
    return null;
  }
}

async function resolveYouTube(url: string): Promise<QueueItem> {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error('bad url');
  const canonical = `https://www.youtube.com/watch?v=${videoId}`;
  const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonical)}&format=json`;
  const res = await fetch(oembed);
  if (!res.ok) throw new Error(`oembed ${res.status}`);
  const data = (await res.json()) as { title: string; thumbnail_url: string };
  return { videoId, title: data.title, thumbnail: data.thumbnail_url, addedBy: '' };
}

function isSpotifyUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === 'open.spotify.com' || u.hostname.endsWith('.spotify.com');
  } catch {
    return false;
  }
}

function spotifyUrlKind(url: string): 'track' | 'playlist' | 'album' | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    const i = parts[0]?.startsWith('intl-') ? 1 : 0;
    const kind = parts[i];
    if (kind === 'track' || kind === 'playlist' || kind === 'album') return kind;
    return null;
  } catch {
    return null;
  }
}

type SpotifyTrackLike = {
  name?: string;
  title?: string;
  artist?: string;
  artists?: Array<string | { name?: string }>;
};

function trackQuery(t: SpotifyTrackLike): string {
  const title = t.name ?? t.title ?? '';
  let artist = '';
  if (typeof t.artist === 'string') artist = t.artist;
  else if (Array.isArray(t.artists) && t.artists.length) {
    const first = t.artists[0];
    artist = typeof first === 'string' ? first : first?.name ?? '';
  }
  return `${title} ${artist}`.trim();
}

async function youtubeSearchOne(query: string): Promise<QueueItem | null> {
  if (!query) return null;
  try {
    const v = await YouTube.searchOne(query, 'video');
    if (!v || !v.id) return null;
    const thumb =
      (typeof v.thumbnail === 'string' ? v.thumbnail : v.thumbnail?.url) ??
      `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
    return { videoId: v.id, title: v.title ?? query, thumbnail: thumb, addedBy: '' };
  } catch {
    return null;
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

async function resolveSpotifyTrack(url: string): Promise<QueueItem> {
  const data = (await spotifyGetData(url)) as SpotifyTrackLike & { title?: string };
  const q = trackQuery(data);
  const item = await youtubeSearchOne(q);
  if (!item) throw new Error('no YouTube match for this Spotify track');
  return item;
}

async function streamSpotifyPlaylistNDJSON(url: string, res: ServerResponse): Promise<void> {
  const [meta, tracks] = await Promise.all([
    spotifyGetData(url).catch(() => null) as Promise<{ title?: string; name?: string } | null>,
    spotifyGetTracks(url) as Promise<SpotifyTrackLike[]>,
  ]);
  const capped = (tracks ?? []).slice(0, 100);
  const title = meta?.title ?? meta?.name ?? 'Spotify playlist';

  res.writeHead(200, { 'Content-Type': 'application/x-ndjson', ...corsHeaders() });
  res.write(JSON.stringify({ type: 'meta', title, total: capped.length }) + '\n');

  const BATCH = 20;
  for (let start = 0; start < capped.length; start += BATCH) {
    const slice = capped.slice(start, start + BATCH);
    const results = await mapWithConcurrency(slice, 5, async (t) =>
      youtubeSearchOne(trackQuery(t)),
    );
    const items = results.filter((x): x is QueueItem => x !== null);
    res.write(JSON.stringify({ type: 'items', items }) + '\n');
  }
  res.write(JSON.stringify({ type: 'done' }) + '\n');
  res.end();
}

async function resolvePlaylist(urlOrId: string): Promise<{ title: string; items: QueueItem[] }> {
  const id = extractPlaylistId(urlOrId) ?? urlOrId;
  const pl = await ytpl(id, { limit: 100 });
  const items: QueueItem[] = pl.items.map((it) => ({
    videoId: it.id,
    title: it.title,
    thumbnail: it.thumbnail ?? `https://i.ytimg.com/vi/${it.id}/hqdefault.jpg`,
    addedBy: '',
  }));
  return { title: pl.title, items };
}

const http = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }
  if (req.method === 'POST' && req.url === '/api/rooms') {
    const room = createRoom('');
    res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders() });
    res.end(JSON.stringify({ code: room.code }));
    return;
  }
  if (req.method === 'GET' && req.url?.startsWith('/api/resolve')) {
    const url = new URL(req.url, 'http://x').searchParams.get('url');
    if (!url) {
      res.writeHead(400, corsHeaders());
      res.end('missing url');
      return;
    }
    try {
      const item = isSpotifyUrl(url) ? await resolveSpotifyTrack(url) : await resolveYouTube(url);
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders() });
      res.end(JSON.stringify(item));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders() });
      res.end(JSON.stringify({ error: (e as Error).message }));
    }
    return;
  }
  if (req.method === 'GET' && req.url?.startsWith('/api/playlist')) {
    const url = new URL(req.url, 'http://x').searchParams.get('url');
    if (!url) {
      res.writeHead(400, corsHeaders());
      res.end('missing url');
      return;
    }
    try {
      if (isSpotifyUrl(url)) {
        await streamSpotifyPlaylistNDJSON(url, res);
      } else {
        const pl = await resolvePlaylist(url);
        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders() });
        res.end(JSON.stringify(pl));
      }
    } catch (e) {
      if (!res.headersSent) {
        res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders() });
        res.end(JSON.stringify({ error: (e as Error).message }));
      } else {
        res.write(JSON.stringify({ type: 'error', error: (e as Error).message }) + '\n');
        res.end();
      }
    }
    return;
  }
  if (req.method === 'GET' && req.url === '/network-info') {
    res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders() });
    res.end(JSON.stringify({ port: PORT, addresses: lanAddresses() }));
    return;
  }
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain', ...corsHeaders() });
    res.end('ok');
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(http, {
  cors: { origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN },
});

const socketToRoom = new Map<string, string>();

io.on('connection', (socket) => {
  socket.on('JOIN_ROOM', (codeRaw, name, ack) => {
    const code = codeRaw.toUpperCase();
    const room = getRoom(code);
    if (!room) {
      ack(null);
      return;
    }
    const updated = addParticipant(code, {
      id: socket.id,
      name: name || 'Guest',
      isHost: false,
    });
    if (!updated) {
      ack(null);
      return;
    }
    socket.join(code);
    socketToRoom.set(socket.id, code);
    ack(updated);
    socket.to(code).emit('ROOM_STATE', updated);
  });

  socket.on('PLAYBACK_CONTROL', (action, positionMs) => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = getRoom(code);
    if (!room || room.hostId !== socket.id) return;
    const pos = Math.max(0, Math.round(positionMs));
    let next;
    if (action === 'play') next = updatePlayback(code, { isPlaying: true, positionMs: pos });
    else if (action === 'pause') next = updatePlayback(code, { isPlaying: false, positionMs: pos });
    else if (action === 'seek') next = updatePlayback(code, { positionMs: pos });
    if (next) io.to(code).emit('PLAYBACK_UPDATE', next);
  });

  socket.on('QUEUE_ADD', (item) => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const result = addToQueue(code, item);
    if (!result) return;
    io.to(code).emit('QUEUE_UPDATE', result.tracks, result.currentIndex);
    if (result.started) io.to(code).emit('PLAYBACK_UPDATE', result.playback);
  });

  socket.on('QUEUE_SKIP', () => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = getRoom(code);
    if (!room || room.hostId !== socket.id) return;
    const result = skipTrack(code);
    if (result) {
      io.to(code).emit('PLAYBACK_UPDATE', result.playback);
      io.to(code).emit('QUEUE_UPDATE', result.tracks, result.currentIndex);
    }
  });

  socket.on('HEARTBEAT', (ack) => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = getRoom(code);
    if (!room) return;
    ack(Date.now(), room.playback);
  });

  socket.on('QUEUE_JUMP', (index) => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = getRoom(code);
    if (!room || room.hostId !== socket.id) return;
    const result = jumpToIndex(code, index);
    if (result) {
      io.to(code).emit('PLAYBACK_UPDATE', result.playback);
      io.to(code).emit('QUEUE_UPDATE', result.tracks, result.currentIndex);
    }
  });

  socket.on('CHAT_SEND', (text) => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = getRoom(code);
    if (!room) return;
    const clean = String(text ?? '').trim().slice(0, 500);
    if (!clean) return;
    const sender = room.participants.find((p) => p.id === socket.id);
    io.to(code).emit('CHAT_MESSAGE', {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: sender?.name ?? 'Guest',
      text: clean,
      at: Date.now(),
    });
  });

  socket.on('disconnect', () => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    socketToRoom.delete(socket.id);
    const updated = removeParticipant(code, socket.id);
    if (updated) io.to(code).emit('ROOM_STATE', updated);
  });
});

http.listen(PORT, () => {
  console.log(`[realtime] listening on :${PORT}`);
});
