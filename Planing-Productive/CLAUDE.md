# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Lumen" — a single-page productivity app (Eisenhower matrix, calendar, pomodoro focus, history, settings). Pure static site: `index.html` + `styles.css` + JSX files loaded directly by the browser.

## Running

No build system, no package manager, no tests. `package-lock.json` is empty.

React 18, ReactDOM, and `@babel/standalone` are loaded from unpkg CDN in [index.html](index.html). JSX files are served raw and transpiled in-browser via `<script type="text/babel" data-presets="react">`.

To develop, serve the directory over HTTP (e.g. `python3 -m http.server` or any static server) and open `index.html`. Opening as `file://` will break CDN integrity/CORS.

Script load order in [index.html](index.html) matters — later files depend on globals defined by earlier ones (no modules, no imports).

## Architecture

- **No modules.** Every `.jsx` file runs in global scope. Cross-file sharing happens by assigning to `window` (see bottom of [src/store.jsx](src/store.jsx): `Object.assign(window, { store, useStore, QUADRANTS, DEFAULT_STATE })`). Icons, UI primitives, pages all follow this pattern.
- **Global store** in [src/store.jsx](src/store.jsx): a hand-rolled subscribe store (no Redux/Context). `useStore()` returns `[state, store.set]`. `store.set(patch | fn)` merges and auto-persists to `localStorage` under `lumen.v1:<email>` (key is per-user, derived from `lumen.session`). Transient fields (`quickAddOpen`, `tweaksOpen`) are stripped before persisting.
- **Auth** in [src/auth.jsx](src/auth.jsx) is localStorage-only (`lumen.session`). [src/app.jsx](src/app.jsx) gates `AppShell` behind `getSession()` and falls back to `AuthScreen`. There is no real backend.
- **Routing** is state-based: `state.route` ∈ `dashboard | matrix | calendar | focus | history | settings`. [src/app.jsx](src/app.jsx) renders the matching page component. No react-router.
- **Keyboard shortcuts** live in the `keydown` effect in [src/app.jsx](src/app.jsx): digits `1-5` switch routes, `,` → settings, `Cmd/Ctrl+K` quick-add, `Cmd/Ctrl+/` toggles Tweaks, space toggles focus timer.
- **Tweaks / Edit Mode** ([src/tweaks.jsx](src/tweaks.jsx)): theme/accent/font/density/pomodoro state lives on `window.__TWEAKS` inside an `/*EDITMODE-BEGIN*/ ... /*EDITMODE-END*/` block in [index.html](index.html). The panel `postMessage`s edits to `window.parent` using `__edit_mode_*` message types — this is an integration protocol with an external host (Claude-artifact-style edit mode). `applyTweaks()` writes `data-theme` / `data-accent` / etc. attributes on `<html>` that CSS variables in [styles.css](styles.css) key off.
- **Quadrants** (`do | plan | deleg | drop`) are the canonical Eisenhower keys, defined once in `QUADRANTS` in [src/store.jsx](src/store.jsx). Tasks carry a `quadrant` field; [src/pages/Matrix.jsx](src/pages/Matrix.jsx) groups them.
- **Seeded demo data**: `DEFAULT_STATE` in [src/store.jsx](src/store.jsx) ships with sample tasks/events/completions so the UI is populated on first load.

## Conventions

- When adding a new page: create `src/pages/<Name>.jsx`, add a `<script>` tag to [index.html](index.html) before `src/app.jsx`, add its route key to `crumbsFor` and the route switch in [src/app.jsx](src/app.jsx), and add a sidebar entry.
- When adding shared helpers/components: define as a top-level function (no `export`); if needed across files, attach to `window` at end of file.
- Do not introduce ES module `import`/`export`, bundlers, or TypeScript — they'd break the in-browser Babel transpile pipeline.
