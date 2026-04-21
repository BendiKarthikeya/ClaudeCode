# PRD: SyncJam — Collaborative Listening, Free

**Author:** Karthikeya
**Date:** 2026-04-21
**Status:** Draft v0.1

---

## 1. Problem

Spotify Jam lets a group listen to the same music in sync across devices, but it requires Spotify Premium for every participant. There is no free, cross-platform equivalent. Friends who want to share a listening session — at a party, on a call, studying together — currently screen-share audio (lossy, laggy) or just send links.

## 2. Goal

Ship a free web app where anyone can create a "room," share a link, and have every connected device play the same music in sync. No installs, no paid accounts, no Premium.

## 3. Target users

- Friend groups on voice/video calls who want shared background music
- Hosts of small remote watch-parties / listening-parties
- Students and coworkers in shared study/work sessions
- Long-distance couples / families

## 4. Success metrics (first 90 days post-launch)

- 1,000 rooms created
- Median session ≥ 15 minutes
- ≥ 3 concurrent devices in p50 active rooms
- Sync drift ≤ 500ms for 95% of clients
- < 2% of sessions report "audio out of sync" via in-app feedback

## 5. Scope

### 5.1 MVP (v1.0)

**Must have:**
1. **Create room** — generates a shareable 6-char code + URL (`/r/AB12CD`)
2. **Join room** — open link, pick display name, connect. No account needed.
3. **Search & queue** — search YouTube, add to room queue
4. **Synced playback** — play / pause / seek / skip propagate to all devices in < 1s
5. **Now playing UI** — title, thumbnail, progress bar, participant list
6. **Host controls** — only room creator can play/pause/seek/skip (MVP simplification)
7. **Chat** — lightweight text chat in the room
8. **Leave / room expiry** — room auto-closes 10 min after last participant leaves

**Explicitly out of MVP:**
- Accounts, playlists, history
- Mobile native apps
- Spotify/Apple Music sources
- Voice chat
- Recommendations

### 5.2 v1.1 (fast follow)

- "Everyone can control" toggle (democratic mode)
- Reactions (emoji bursts)
- Upvote/downvote tracks in queue
- Persistent room codes for regulars

### 5.3 v2.0 (stretch)

- Optional account + saved playlists
- SoundCloud + Jamendo as alternative sources
- Mobile PWA with background playback
- Lyrics overlay (via Musixmatch API)

## 6. User stories

- *As a host,* I create a room and share the link in my group chat so friends can join in one tap.
- *As a guest,* I open the link, hear the music immediately, and see what's playing.
- *As a host,* I search for a song and queue it without interrupting the current track.
- *As anyone,* I can see who's in the room and chat with them.
- *As anyone,* if I refresh the page or briefly lose connection, I rejoin at the correct playback position.

## 7. Functional requirements

### 7.1 Rooms
- 6-char alphanumeric code, case-insensitive
- Max 50 participants per room (MVP cap)
- State: `{ hostId, currentTrack, queue[], positionMs, isPlaying, participants[] }`

### 7.2 Playback sync
- Server holds authoritative `{ videoId, positionMs, isPlaying, updatedAt }`
- On state change, server broadcasts `PLAYBACK_UPDATE` to all clients
- Clients compute target position as `positionMs + (now - updatedAt)` if playing
- Clients re-sync every 10s via heartbeat; correct if drift > 500ms

### 7.3 Queue
- FIFO by default; host can reorder/remove
- Auto-advance on track end (detected by YouTube IFrame `onStateChange` = 0)

### 7.4 Search
- YouTube Data API `search.list` with `type=video`, `videoEmbeddable=true`, `videoCategoryId=10` (Music)
- Cache results in Redis for 1 hour (quota protection)

### 7.5 Chat
- Ephemeral (not persisted beyond room lifetime)
- 200-char limit, basic profanity filter

## 8. Non-functional requirements

- **Latency:** Control event → all clients < 500ms p95
- **Availability:** 99.5% for MVP (single-region acceptable)
- **Cost ceiling:** < $20/month at 100 concurrent rooms (infra)
- **YouTube Data API quota:** stay under 10k units/day default; cache search aggressively

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| YouTube API quota exhaustion | Server-side search cache, debounced client requests |
| Geo-blocked videos cause desync | Detect `onError=150/101`, skip track, notify room |
| Ads play at different times per client | Accept drift during ads; resync after ad ends |
| YouTube ToS change bans embedding | Add SoundCloud/Jamendo as fallback source (v2.0) |
| Abuse (spam rooms, harassment) | Rate-limit room creation per IP; add report button in v1.1 |

## 10. Open questions

- Do we require a nickname or auto-generate one?
- Should the host role transfer automatically if the host leaves, or does the room end?
- Do we pre-roll a silent "warmup" video to align YouTube player state before the first real track?
- How do we handle mobile Safari autoplay restrictions (requires user gesture to start audio)?

## 11. Milestones

| # | Milestone | Target |
|---|---|---|
| M0 | Repo scaffold, CI, Socket.io echo server | Week 1 |
| M1 | Single-room playback sync (2 clients, hardcoded video) | Week 2 |
| M2 | Search + queue + host controls | Week 4 |
| M3 | Chat + participant list + polish | Week 5 |
| M4 | Closed beta with 10 users | Week 6 |
| M5 | Public launch (Show HN / Reddit) | Week 8 |

## 12. Appendix: tech decisions

- **Why YouTube IFrame over yt-dlp:** Legal, free, no server bandwidth cost. Ads are the tradeoff.
- **Why Socket.io over raw WS:** Built-in reconnection, rooms abstraction, broad client support.
- **Why Redis over Postgres for room state:** Ephemeral, sub-ms reads, natural TTL for room expiry.
- **Why no accounts in MVP:** Removes the single biggest onboarding drop-off. Add later if retention needs it.
