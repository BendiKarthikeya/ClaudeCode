# Graph Report - .  (2026-04-24)

## Corpus Check
- Corpus is ~18,672 words - fits in a single context window. You may not need a graph.

## Summary
- 175 nodes · 190 edges · 30 communities detected
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_SyncJam Room State & Networking|SyncJam Room State & Networking]]
- [[_COMMUNITY_Lumen Architecture Core|Lumen Architecture Core]]
- [[_COMMUNITY_SyncJam Client Room Page|SyncJam Client Room Page]]
- [[_COMMUNITY_SyncJam Server & Utilities|SyncJam Server & Utilities]]
- [[_COMMUNITY_Lumen App Shell & Store|Lumen App Shell & Store]]
- [[_COMMUNITY_SyncJam Room Management|SyncJam Room Management]]
- [[_COMMUNITY_SyncJam Brand Identity|SyncJam Brand Identity]]
- [[_COMMUNITY_Lumen Brand Identity|Lumen Brand Identity]]
- [[_COMMUNITY_Lumen Auth Flow|Lumen Auth Flow]]
- [[_COMMUNITY_Lumen UI Components|Lumen UI Components]]
- [[_COMMUNITY_Lumen Calendar View|Lumen Calendar View]]
- [[_COMMUNITY_Lumen History View|Lumen History View]]
- [[_COMMUNITY_Lumen Tweaks Panel|Lumen Tweaks Panel]]
- [[_COMMUNITY_Lumen Settings|Lumen Settings]]
- [[_COMMUNITY_SyncJam YouTube Player|SyncJam YouTube Player]]
- [[_COMMUNITY_Lumen Icons|Lumen Icons]]
- [[_COMMUNITY_Lumen Dashboard|Lumen Dashboard]]
- [[_COMMUNITY_Lumen Focus Mode|Lumen Focus Mode]]
- [[_COMMUNITY_Lumen Matrix View|Lumen Matrix View]]
- [[_COMMUNITY_SyncJam State Events|SyncJam State Events]]
- [[_COMMUNITY_SyncJam Root Layout|SyncJam Root Layout]]
- [[_COMMUNITY_SyncJam Room Page|SyncJam Room Page]]
- [[_COMMUNITY_SyncJam Service Worker|SyncJam Service Worker]]
- [[_COMMUNITY_SyncJam Index Entry|SyncJam Index Entry]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_Next.js Env Types|Next.js Env Types]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]
- [[_COMMUNITY_Service Worker Script|Service Worker Script]]
- [[_COMMUNITY_Lumen Project Reference|Lumen Project Reference]]

## God Nodes (most connected - your core abstractions)
1. `SyncJam Architecture` - 12 edges
2. `Lumen App` - 9 edges
3. `normalizeUrl()` - 8 edges
4. `SyncJam PRD` - 8 edges
5. `onCreate()` - 7 edges
6. `onJoin()` - 6 edges
7. `Lumen Architecture Guide` - 5 edges
8. `checkLanReachable()` - 4 edges
9. `getRealtimeUrl()` - 4 edges
10. `setRealtimeUrl()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Room (6-char code)` --semantically_similar_to--> `Lumen App`  [INFERRED] [semantically similar]
  Project-music/PRD.md → Planing-Productive/README.md
- `SyncJam Project` --references--> `SyncJam Architecture`  [EXTRACTED]
  README.md → Project-music/CLAUDE.md
- `SyncJam Project` --references--> `SyncJam PRD`  [EXTRACTED]
  README.md → Project-music/PRD.md
- `LocalStorage-only Auth` --semantically_similar_to--> `Supabase (auth+data)`  [INFERRED] [semantically similar]
  Planing-Productive/CLAUDE.md → Planing-Productive/README.md
- `AppShell()` --calls--> `useStore()`  [INFERRED]
  Planing-Productive/src/app.jsx → Planing-Productive/src/store.jsx

## Hyperedges (group relationships)
- **Lumen runtime stack (browser CDN-only)** — planingproductive_readme_react18, planingproductive_readme_babel_standalone, planingproductive_readme_supabase, planingproductive_indexhtml_entry [EXTRACTED 1.00]
- **Playback sync mechanism** — projectmusic_claudemd_pause_first, projectmusic_claudemd_cmd_suppression, projectmusic_claudemd_tap_to_play, projectmusic_prd_playback_sync [EXTRACTED 0.95]
- **Spotify URL to YouTube playback bridge** — projectmusic_claudemd_spotify_url_info, projectmusic_prd_yt_iframe, projectmusic_claudemd_no_audio_proxy [EXTRACTED 0.90]

## Communities

### Community 0 - "SyncJam Room State & Networking"
Cohesion: 0.09
Nodes (26): Bluetooth mode disabled (rationale), Command suppression window, @distube/ytpl, LAN connection mode (/network-info), Next.js 14 App Router, No audio proxied (ToS rationale), Pause-first reconciliation, RoomState shape (+18 more)

### Community 1 - "Lumen Architecture Core"
Cohesion: 0.14
Nodes (18): Tweaks Edit Mode postMessage protocol, Global Subscribe Store (window-based), LocalStorage-only Auth, Lumen Architecture Guide, QUADRANTS constant, State-based Routing, Lumen index.html entry, __TWEAKS EDITMODE block (+10 more)

### Community 2 - "SyncJam Client Room Page"
Cohesion: 0.25
Nodes (11): checkLanReachable(), onCreate(), onJoin(), persistName(), buildInviteLink(), clearRealtimeUrl(), getRealtimeUrl(), isCloudDefault() (+3 more)

### Community 3 - "SyncJam Server & Utilities"
Cohesion: 0.2
Nodes (11): corsHeaders(), extractPlaylistId(), extractVideoId(), mapWithConcurrency(), pickOrigin(), resolvePlaylist(), resolveSpotifyTrack(), resolveYouTube() (+3 more)

### Community 4 - "Lumen App Shell & Store"
Cohesion: 0.22
Nodes (5): AppShell(), fetchRemoteState(), initStoreForUser(), pushRemoteState(), useStore()

### Community 5 - "SyncJam Room Management"
Cohesion: 0.2
Nodes (2): createRoom(), makeCode()

### Community 6 - "SyncJam Brand Identity"
Cohesion: 0.27
Nodes (10): App/favicon for SyncJam web app, Background color #0a0a0a (near-black), SyncJam brand identity, Foreground color #ef4444 (red), Double (beamed) musical note glyph, Beamed stems path (double eighth note), Left note head (circle cx=176 cy=352 r=48), Right note head (circle cx=352 cy=320 r=48) (+2 more)

### Community 7 - "Lumen Brand Identity"
Cohesion: 0.22
Nodes (9): #17120A Near-Black, #B8832E Dark Gold, #F2C270 Light Gold, Lumen Brand Mark, App Favicon / Browser Tab Icon, Radial Gradient Fill, Rounded Square Background (rx=7), Four-Point Sparkle/Star Path (+1 more)

### Community 8 - "Lumen Auth Flow"
Cohesion: 0.25
Nodes (0): 

### Community 9 - "Lumen UI Components"
Cohesion: 0.29
Nodes (0): 

### Community 10 - "Lumen Calendar View"
Cohesion: 0.47
Nodes (4): Calendar(), CalendarDraftModal(), fmtTime(), getWeekDates()

### Community 11 - "Lumen History View"
Cohesion: 0.67
Nodes (2): fmtDuration(), History()

### Community 12 - "Lumen Tweaks Panel"
Cohesion: 0.67
Nodes (0): 

### Community 13 - "Lumen Settings"
Cohesion: 0.67
Nodes (0): 

### Community 14 - "SyncJam YouTube Player"
Cohesion: 0.67
Nodes (0): 

### Community 15 - "Lumen Icons"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Lumen Dashboard"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Lumen Focus Mode"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Lumen Matrix View"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "SyncJam State Events"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "SyncJam Root Layout"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "SyncJam Room Page"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "SyncJam Service Worker"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "SyncJam Index Entry"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "PostCSS Config"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Next.js Config"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Next.js Env Types"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Tailwind Config"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Service Worker Script"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Lumen Project Reference"
Cohesion: 1.0
Nodes (1): Lumen Project (referenced)

## Knowledge Gaps
- **26 isolated node(s):** `ClaudeCode Workspace`, `Lumen Project (referenced)`, `Pomodoro Focus Timer`, `Calendar with Google Sync`, `Quick Add (Cmd+K)` (+21 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Lumen Icons`** (2 nodes): `mk()`, `icons.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Lumen Dashboard`** (2 nodes): `Dashboard()`, `Dashboard.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Lumen Focus Mode`** (2 nodes): `Focus()`, `Focus.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Lumen Matrix View`** (2 nodes): `Matrix()`, `Matrix.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SyncJam State Events`** (2 nodes): `events.ts`, `state.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SyncJam Root Layout`** (2 nodes): `RootLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SyncJam Room Page`** (2 nodes): `RoomPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SyncJam Service Worker`** (2 nodes): `ServiceWorkerRegister.tsx`, `ServiceWorkerRegister()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SyncJam Index Entry`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PostCSS Config`** (1 nodes): `postcss.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Config`** (1 nodes): `next.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Env Types`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind Config`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Service Worker Script`** (1 nodes): `sw.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Lumen Project Reference`** (1 nodes): `Lumen Project (referenced)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Lumen App` connect `Lumen Architecture Core` to `SyncJam Room State & Networking`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `Room (6-char code)` connect `SyncJam Room State & Networking` to `Lumen Architecture Core`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `normalizeUrl()` (e.g. with `checkLanReachable()` and `onCreate()`) actually correct?**
  _`normalizeUrl()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `onCreate()` (e.g. with `setRealtimeUrl()` and `clearRealtimeUrl()`) actually correct?**
  _`onCreate()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ClaudeCode Workspace`, `Lumen Project (referenced)`, `Pomodoro Focus Timer` to the rest of the system?**
  _26 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `SyncJam Room State & Networking` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Lumen Architecture Core` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._