# ClaudeCode

Workspace for experiments built with Claude Code.

## Projects

### [Project-music/](Project-music/) — SyncJam

A free, web-based collaborative listening app — like Spotify Jam, but powered by YouTube. Users join a shared room by code; play/pause/seek/queue actions sync across all connected devices in real time over WebSockets.

**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind on the web, Socket.io on a Node realtime server, YouTube IFrame Player for playback, in-memory room state for MVP. npm workspaces monorepo.

**Connection modes:** cloud (default), same-WiFi LAN (with `/network-info` auto-detect), Bluetooth (disabled — browsers can't carry audio over Web Bluetooth).

**Highlights:**
- Server is source of truth for playback (`videoId`, `positionMs`, `isPlaying`); clients reconcile with ~500ms drift tolerance.
- Pause-first reconciliation, command-suppression window, and tap-to-play fallback handle YouTube's autoplay/seek quirks.
- Unified track list (nothing removed on skip) rendered playlist-style; host can jump to any track.
- Spotify URL → YouTube search via `spotify-url-info` + `youtube-sr` (no audio is ever proxied through us).
- LAN-aware invite links rewrite `localhost` to the stored LAN host so guests get a reachable URL.

**Run locally:**

```
cd Project-music
npm install
npm run dev          # web :3000 + realtime :4000
```

See [Project-music/CLAUDE.md](Project-music/CLAUDE.md) for full architecture and [Project-music/PRD.md](Project-music/PRD.md) for product scope.
