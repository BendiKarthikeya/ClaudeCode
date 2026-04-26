# Lumen

**Focus · Matter · Finish.** A single-page productivity app built around the Eisenhower matrix, a weekly calendar, a pomodoro focus timer, and a completion history — all in one quiet, keyboard-driven workspace.

## Features

- **Dashboard** — greeting, today's schedule, focus ring, and quick stats.
- **Task Matrix** — Eisenhower 2×2 (Do / Plan / Delegate / Drop) with drag-and-drop between quadrants.
- **Calendar** — week view with click-drag event creation, Google Calendar sync, and task scheduling.
- **Focus** — pomodoro timer with session dots, ambient background, and space-bar start/stop.
- **History** — 26-week activity heatmap and a list of completed tasks.
- **Settings** — theme (dark/light), accent color, font, density, pomodoro lengths.
- **Quick add** (`⌘/Ctrl + K`) — classifies tasks by keyword and picks a quadrant.
- **Auth** — email/password and Google sign-in via Supabase; per-user `localStorage` keyed by session email.
- **Mobile responsive** — drawer sidebar, stacked layouts, touch-friendly tap targets.

## Keyboard shortcuts

| Key             | Action                  |
| --------------- | ----------------------- |
| `1` – `5`       | Jump between pages      |
| `,`             | Settings                |
| `⌘/Ctrl + K`    | Quick add               |
| `⌘/Ctrl + /`    | Toggle Tweaks panel     |
| `⌘/Ctrl + ⇧ F`  | Enter Focus mode        |
| `Space`         | Start/pause focus timer |
| `Esc`           | Close overlays          |

## Tech stack

No build step, no package manager, no bundler.

- **React 18** + **ReactDOM** — loaded from unpkg
- **@babel/standalone** — transpiles JSX in the browser
- **Supabase** — auth + data persistence
- **Google Identity Services** — Calendar OAuth token
- Pure CSS (design tokens + `oklch` color)

Every `.jsx` file runs in global scope; cross-file sharing happens via `window.*` assignments. There are no ES modules.

## Running locally

Serve the directory over HTTP — opening `index.html` as `file://` will break CDN integrity and CORS.

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static file server (e.g. `npx serve`, `caddy file-server`) works equally well.

## Configuration

Edit the inline `<script>` block in [index.html](index.html):

```js
window.__SUPABASE_URL = "https://<your-project>.supabase.co";
window.__SUPABASE_KEY = "<publishable-anon-key>";
window.__GCAL_CLIENT_ID = "<google-oauth-client-id>";
```

For Supabase email confirmation redirects, make sure the **Site URL** and **Redirect URLs** in *Authentication → URL Configuration* include your app origin.

## Project structure

```
index.html                — CDN imports + script load order
styles.css                — design tokens + layout + responsive rules
src/
  auth.jsx                — Supabase auth + local session
  store.jsx               — hand-rolled subscribe store, localStorage persistence
  icons.jsx               — inline SVG icon set
  ui.jsx                  — Sidebar, Topbar, TaskCard, QuickAdd
  tweaks.jsx              — theme/accent/font/density panel
  app.jsx                 — root + routing + keyboard shortcuts
  pages/
    Dashboard.jsx
    Matrix.jsx
    Calendar.jsx
    Focus.jsx
    History.jsx
    Settings.jsx
```

Script load order in [index.html](index.html) matters — later files depend on globals defined by earlier ones.

## Conventions

- **No ES modules.** Do not introduce `import`/`export` — it breaks the in-browser Babel pipeline.
- **Sharing across files**: attach to `window` at the bottom of the file.
- **Adding a page**: create `src/pages/<Name>.jsx`, add a `<script>` tag to [index.html](index.html) before `src/app.jsx`, add a route in `crumbsFor` and the switch in [src/app.jsx](src/app.jsx), and add a sidebar entry.
- **Quadrants** (`do | plan | deleg | drop`) are defined once in `QUADRANTS` in [src/store.jsx](src/store.jsx).
