# Project: SyncJam (working title)

A free, web-based collaborative listening app — like Spotify Jam, but powered by YouTube. Users join a shared room; play/pause/seek/queue actions sync across all connected devices in real time.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind
- **Realtime:** Socket.io (WebSocket) on a Node server, run via `tsx watch`
- **Player:** YouTube IFrame Player API (embedded in each client)
- **Track metadata:** YouTube oEmbed (no API key). Data API v3 remains an option later for search.
- **Playlist expansion:** `@distube/ytpl` (maintained fork of ytpl) — scrapes public playlist pages, no API key. `ytpl` itself is unmaintained and breaks against current YouTube HTML; do not use it.
- **Spotify URL → YouTube search:** `spotify-url-info` parses public Spotify track/playlist pages (no API key, no OAuth) to pull title + artist; `youtube-sr` then searches YouTube for the best video match. Audio still plays through the YouTube IFrame — we never touch Spotify audio (licensing).
- **State store:** in-memory `Map` for MVP. Redis is the planned upgrade when we want persistence/TTL and multi-instance.
- **Auth (MVP):** Anonymous — join by room code. Proper auth deferred.
- **Monorepo:** npm workspaces (not pnpm — pnpm isn't installed in dev env).
- **Hosting target:** Vercel (web) + Railway/Fly.io (Socket server + Redis)

## Connection modes (landing page)

Three modes, selectable before creating/joining a room. Selection is persisted via `localStorage` under `syncjam:realtime-url`, and invite links carry the chosen realtime URL as `?s=...` so guests auto-configure.

- **From anywhere (cloud)** — default; uses `NEXT_PUBLIC_REALTIME_URL`, falling back to `http://localhost:4000`.
- **Same WiFi (LAN)** — user enters or detects a local realtime URL (e.g. `http://192.168.1.5:4000`). Realtime server exposes `GET /network-info` returning `{ port, addresses }` so the landing page can offer a **Detect local** button. Only the sync signaling is local — YouTube video still streams from Google to each device.
- **Bluetooth** — shown disabled with a short explanation. Web Bluetooth can't carry audio (no A2DP access from the browser), BLE bandwidth is too low, and classic BT isn't a group model. LAN is the offered local-network substitute.

## Architecture principles

- **Server is source of truth** for playback state (`videoId`, `positionMs`, `isPlaying`, `updatedAt`) and for the unified track list. Clients reconcile against it.
- **Drift tolerance:** ~500ms is acceptable. Heartbeat every 10s or any state event re-syncs.
- **Position capture on control:** The host client samples `player.getCurrentTime()` every second into a ref; play/pause/seek events include that position so the server never stores a stale `positionMs: 0`. This was the cause of an early "pause snaps back to 0" bug.
- **Pause-first, then seek:** `applyState` issues `pauseVideo()` *before* any drift-seek when transitioning to paused, then re-asserts pause after the seek. `seekTo(t, true)` on a playing video otherwise causes YouTube to resume-through-buffering and the pause looks like it didn't take.
- **Command suppression window:** `onStateChange` ignores its own reactions for ~1500ms after we issue `playVideo`/`pauseVideo`/`loadVideoById`, so the enforcer doesn't fight legitimate commands. Outside that window it still corrects embed-UI clicks or blocked autoplay.
- **Tap-to-play fallback:** Browsers (esp. mobile Safari, cross-origin iframes) may block autoplay even after the "Tap to join audio" gesture. If the player hasn't reached `state=1|3` within 1.5s of `onReady`, or drifts into `paused/cued/unstarted` while the server says playing, a "Tap to play ▶" overlay appears over the iframe for a real user-gesture play.
- **Host/guest model for MVP:** Room creator is host; only host controls playback, can skip, and can **jump to any track** in the list. Any participant can add to the queue and send chat. Host transfer is automatic if the host leaves. "Everyone can control" mode is a stretch goal.
- **No audio is proxied through our server** — each client plays YouTube directly. We only broadcast control events. Keeps us on the right side of YouTube's ToS and costs near zero.

## Room state shape

```ts
RoomState = {
  code: string;
  hostId: string;          // socket id of host
  playback: PlaybackState; // { videoId, positionMs, isPlaying, updatedAt }
  tracks: QueueItem[];     // full ordered list; nothing is removed on play/skip
  currentIndex: number;    // cursor into tracks; -1 when empty
  participants: Participant[];
}
```

Past tracks are not removed. The UI renders `tracks` as a YouTube-playlist-style box centered on `currentIndex`: past items dim with a ✓, the current is highlighted ▶, upcoming stay bright. Host rows show a ▶ button that emits `QUEUE_JUMP(index)`. `QUEUE_SKIP` just increments the cursor; `QUEUE_ADD` appends and starts playback if the list was empty.

## Realtime HTTP endpoints (on the Socket.io server)

- `POST /api/rooms` → `{ code }`
- `GET  /api/resolve?url=...` → `QueueItem` via YouTube oEmbed. Normalizes `music.youtube.com` and other variants by extracting the `v=` id and passing the canonical `https://www.youtube.com/watch?v=<id>` to oEmbed.
- `GET  /api/playlist?url=...` → `{ title, items: QueueItem[] }` via `@distube/ytpl`, capped at 100 items. Works for public `youtube.com/playlist?list=...` URLs.
- `GET  /network-info` → `{ port, addresses }` (LAN detection).
- `GET  /health` → `ok`.

CORS defaults to `*` so LAN hosts don't need to configure origin.

## Socket events (`packages/shared/src/events.ts`)

- C→S: `JOIN_ROOM`, `PLAYBACK_CONTROL(action, positionMs)`, `QUEUE_ADD(item)`, `QUEUE_SKIP()`, `QUEUE_JUMP(index)`, `CHAT_SEND(text)`, `HEARTBEAT(ack)`
- S→C: `ROOM_STATE`, `PLAYBACK_UPDATE`, `QUEUE_UPDATE(tracks, currentIndex)`, `CHAT_MESSAGE({id,name,text,at})`, `PARTICIPANT_JOINED/LEFT`, `ERROR`

Chat is ephemeral — not stored in `RoomState`, just broadcast (text trimmed, capped at 500 chars, sender name resolved from the room's participant list).

## Repo layout

- `apps/web` — Next.js client
  - `app/page.tsx` — landing, mode selector
  - `app/r/[code]/page.tsx` — room: player, add-track panel, `PlaylistBox`, chat sidebar (2-col grid on lg+, stacks below on mobile)
  - `components/YouTubePlayer.tsx` — IFrame wrapper: drift correction, pause-first reconciliation, command-suppression window, tap-to-play overlay
  - `lib/socket.ts` — Socket.io client, rebinds when realtime URL changes
  - `lib/realtime-url.ts` — resolves URL from `?s=` query → localStorage → env default. `buildInviteLink` rewrites a `localhost` origin to the stored LAN host so guests don't receive an unreachable `http://localhost:3000/...` link.
- `apps/realtime` — Socket.io + HTTP server (`src/server.ts`, `src/rooms.ts`)
- `packages/shared` — shared TS types, imported directly (no build step); Next is configured with `transpilePackages: ['@syncjam/shared']`
- `PRD.md` — product requirements

## Non-goals (for MVP)

- Native mobile apps (web-only; mobile browser is fine)
- Offline playback / local-file sources
- Recommendations / personalization
- Account system with saved playlists
- Spotify/Apple Music integration (licensing)
- True Bluetooth audio sharing (infeasible from browser)

## Conventions

- TypeScript strict mode everywhere
- Socket event names: `SCREAMING_SNAKE_CASE` (`PLAYBACK_UPDATE`, `QUEUE_ADD`)
- Shared types live in `packages/shared` and are imported by both client and server via workspace symlink (no build step)
- No comments that restate code; only comments explaining non-obvious *why*

## Legal / ToS notes

- YouTube IFrame Player API usage is permitted; ads must not be blocked.
- Do not use `ytmusicapi` or `yt-dlp` to extract audio — that violates ToS.
- `@distube/ytpl` scrapes the public playlist page; acceptable for a hobby/MVP but can break when YouTube changes markup. If it breaks, switch to YouTube Data API v3 `playlistItems.list` behind an optional `YOUTUBE_API_KEY`.
- Display "Powered by YouTube" where required by [YouTube branding guidelines](https://developers.google.com/youtube/terms/branding-guidelines).

## Local dev

```
npm install
npm run dev:realtime   # :4000 — Socket.io + HTTP
npm run dev:web        # :3000 — Next.js
# or both:
npm run dev
```

Env: `NEXT_PUBLIC_REALTIME_URL` (web), `PORT` / `CORS_ORIGIN` (realtime).

## Key references

- YouTube IFrame API: https://developers.google.com/youtube/iframe_api_reference
- YouTube oEmbed: https://www.youtube.com/oembed
- `@distube/ytpl`: https://github.com/distubejs/ytpl
- Socket.io docs: https://socket.io/docs/v4/

## Current status

Phase 3 complete: rooms, unified track list with host jump-to-any-track, playlist-box UI, chat sidebar, pause-first reconciliation, tap-to-play fallback for blocked autoplay, LAN-aware invite links. Reconnect-on-refresh and deploy configs are next. See [PRD.md](PRD.md) for full scope and milestones.
