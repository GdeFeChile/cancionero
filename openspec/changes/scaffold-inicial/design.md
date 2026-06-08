# Design: Scaffold Inicial

**Status**: Draft
**Last Updated**: 2026-06-08

## Technical Approach

Single `index.html` entry point with CSS loaded as partials via `style.css` (`@import` chain) and JS loaded as ES modules from `js/app.js`. Hash-based router in `app.js` coordinates all modules. Zero build, zero dependencies — static files serve directly from GitHub Pages.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| CSS loading | Single `<link>` to `style.css`, `@import` for partials | Multiple `<link>` tags, inline `<style>` | Single HTML reference for clarity; `@import` accepted despite performance tradeoff (no build tool) |
| Dark mode | Inside `custom-properties.css` under `@media (prefers-color-scheme: dark)` | Separate `dark.css` file, class toggle | Spec requires no separate file or class — pure OS preference via custom property overrides |
| Module comms | Direct function calls through `app.js` orchestration | Custom DOM events, PubSub | Simplest approach for 5 modules; app.js is the single coordinator, no indirection needed |
| Route handling | Centralized pattern matching in `app.js` | Decentralized per-module matching | Keeps routing logic testable in one place; modules register handlers but don't parse hashes |
| State reactivity | Manual DOM updates after state changes | Proxy-based, MutationObserver | Overkill for this scale; song CRUD triggers explicit `render()` calls |
| CSS naming | BEM-like convention (`block__element--modifier`) | SMACSS, ITCSS, utility-first | Familiar, no tooling needed, scoped enough for a small team of one |

## Data Flow

```
User action ──→ hashchange ──→ app.js router ──→ module handler
                         │                        │
                         │                  ┌─────┴──────┐
                         │                  │  songs.js   │
                         │                  │  chords.js  │
                         │                  │  tuner.js   │
                         │                  └─────┬──────┘
                         │                        │
                         │                  ┌─────▼──────┐
                         │                  │   ui.js    │
                         │                  │  (DOM API) │
                         │                  └────────────┘
                         │
                    localStorage (songs.js only)
```

**Sequence (song list load):**
1. `hashchange` → `#/canciones`
2. `app.js` matches route → calls `songs.getAll()`
3. `songs.getAll()` reads from `localStorage`, returns `Song[]`
4. `app.js` passes data to `ui.renderSongList(songs)`
5. `ui.js` creates DOM elements, appends to `<main>`

## Route Table

| Hash | Module | Handler in app.js | Description |
|------|--------|-------------------|-------------|
| `#/` or `#/canciones` | songs + ui | `showSongList()` | Main list with filter |
| `#/cancion/:id` | songs + ui | `showSongDetail(id)` | Lyrics, chords, transpose, auto-scroll |
| `#/editar/:id` | songs + ui | `showEditor(id)` | Edit form (existing song) |
| `#/nueva` | songs + ui | `showEditor(null)` | Edit form (empty) |
| `#/afinador` | tuner + ui | `showTuner()` | Chromatic tuner |
| `*` (unknown) | app.js | `redirectTo('/')` | Fallback to song list |

## Module Interfaces

### songs.js — Data Layer

```
Song {
  id: string,          // crypto.randomUUID() or Date.now().toString(36)
  title: string,
  key: string,         // e.g. "C", "Dm", "G"
  author: string,
  section: string,     // e.g. "alabanza", "adoracion"
  genre: string,       // e.g. "himno", "contemporaneo"
  lyrics: string,      // plain text with chord annotations
  createdAt: string,   // ISO 8601
  updatedAt: string    // ISO 8601
}

songs.getAll()              → Song[]
songs.getById(id)           → Song | undefined
songs.create(song)          → Song     (assigns id, timestamps)
songs.update(id, changes)   → Song
songs.delete(id)            → void
songs.getSections()         → string[]  (distinct section values)
```

### app.js — Router / Coordinator

```
Router:
  .init()                           → void   (binds hashchange, processes initial hash)
  .register(pattern, handler)       → void   (e.g. register("cancion/:id", fn))
  .navigate(hash)                   → void   (sets window.location.hash)
  .getParam(name)                   → string (extracts route param from current hash)

Lifecycle per route:
  beforeRender() → loading indicator
  render(data)   → calls ui.js to build DOM
  afterRender()  → bind events, cleanup
```

### ui.js — UI Components

```
ui.showLoading(container)         → void
ui.hideLoading()                  → void
ui.renderSongList(songs)          → HTMLElement
ui.renderSongDetail(song)         → HTMLElement
ui.renderEditor(song?)            → HTMLElement
ui.renderTuner()                  → HTMLElement
ui.toast(message, type)           → void        (type: "success" | "error" | "info")
ui.modal(title, content, actions) → Promise     (resolves with action id)
ui.confirm(message)               → Promise<bool>
```

### chords.js — Transposition (stub in scaffold)

```
chords.transpose(chord, semitones)   → string
chords.detect(lyrics)                → string[]   (chords found in text)
chords.noteNames('en' | 'es')        → string[]   (12 notes in requested locale)
```

### tuner.js — Web Audio API (stub in scaffold)

```
tuner.start()              → Promise<void>   (requests mic, starts listening)
tuner.stop()               → void
tuner.onNote(callback)     → void            (callback receives { note, frequency, cents })
tuner.state                → 'idle' | 'listening' | 'detected'
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `index.html` | Create | SPA shell: semantic landmarks, meta/OG tags, manifest link, module entry |
| `css/style.css` | Create | Single entry point — `@import` all partials in dependency order |
| `css/custom-properties.css` | Create | Design tokens: colors, spacing, typography, shadows, radii, breakpoints, z-index + dark mode overrides |
| `css/reset.css` | Create | Modern CSS reset (border-box, zero margins, form normalization) |
| `css/base.css` | Create | Base typography, `.container`, `.sr-only`, focus styles, smooth scroll |
| `css/layout.css` | Create | Responsive grid for song list (1/2/3 columns), header/main/footer layout |
| `css/components.css` | Create | Modal, toast, buttons, form inputs, card (BEM classes) |
| `js/app.js` | Create | Router, module registry, lifecycle coordination |
| `js/ui.js` | Create | UI component factory functions (modal, toast, loading, DOM builders) |
| `js/songs.js` | Create | Song CRUD with localStorage persistence — **fully functional** |
| `js/chords.js` | Create | Transposition stub: `transpose()` identity placeholder, export interface |
| `js/tuner.js` | Create | Tuner stub: `start()/stop()` no-ops, export interface |
| `favicon.ico` | Create | Placeholder favicon |
| `manifest.json` | Create | Placeholder web app manifest |
| `assets/icons/` | Create | Empty directory for future icons |

## CSS Architecture

```
style.css  (@import order)
  ├── custom-properties.css    ← tokens + dark mode @media query
  ├── reset.css                ← box-sizing, margin, images
  ├── base.css                 ← typography, utilities, focus
  ├── layout.css               ← grid, containers, regions
  └── components.css           ← modal, toast, buttons, cards
```

- BEM-like naming: `.modal`, `.modal__header`, `.modal--warning`
- No class toggles for dark mode — purely `prefers-color-scheme`
- System font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Breakpoints as custom properties: `--bp-sm: 640px`, `--bp-md: 1024px`, `--bp-lg: 1280px`

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| HTML | Valid markup, landmarks, meta tags | W3C validator + manual DOM inspection |
| CSS | Custom properties resolve, dark mode activates, grid responsive | Manual browser testing at 375/768/1280px + OS theme toggle |
| JS modules | Load without console errors | Browser devtools console |
| Routes | All 5 routes render correct view, unknown redirects to `#/` | Manual hash manipulation |
| Songs CRUD | Create, read, update, delete round-trip through localStorage | Manual testing via browser devtools |
| Accessibility | Skip link, focus order, ARIA labels, color contrast | Tab navigation test + axe DevTools |

## Open Questions

- [ ] Should `style.css` use `@import` (sequential, render-blocking) or should `index.html` reference each CSS file with separate `<link>` tags? Resolved: `@import` for simplicity, revisit if performance becomes an issue.
- [ ] What should the favicon be? A simple cross/music-note SVG. For now a minimal placeholder.
