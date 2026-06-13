# Tasks: Scaffold Inicial

## Workload Forecast

| Field | Value |
|-------|-------|
| Estimated lines | ~800-1000 |
| 400-line risk | High |
| Chained PRs | Yes |
| Split | PR 1: CSS+Assets (~380) → PR 2: HTML+JS (~500) |
| Strategy | ask-on-risk |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

| Unit | Goal | PR |
|------|------|----|
| 1 | Foundation + Design System + Assets | PR 1 |
| 2 | HTML Shell + JS Modules + Verify | PR 2 |

---

## Phase 1: Foundation + Design System

- [x] **1.1** Create `.gitignore` (OS/IDE noise) + `css/`, `js/`, `assets/icons/` dirs. Verify: `git status` shows clean scaffold.
- [x] **1.2** Create `css/style.css` — `@import` chain: custom-properties → reset → base → layout → components. Verify: CSS loads with no 404s.
- [x] **1.3** Create `css/custom-properties.css` — `:root` tokens (`--color-*`, `--font-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--bp-*`, `--transition-*`, `--z-*`) + dark mode in `@media (prefers-color-scheme: dark)`. Verify: tokens visible in DevTools Computed.
- [x] **1.4** Create `css/reset.css` — `box-sizing: border-box`, zero margins, `img/video max-width: 100%`, form normalization. Verify: `<body>` has no default margin.
- [x] **1.5** Create `css/base.css` — system font stack, `.container` (centered max-width), `.sr-only` (clip), `:focus-visible` ring, `scroll-behavior: smooth`. Verify: Tab shows focus ring, container centers.
- [x] **1.6** Create `css/layout.css` — 1/2/3-col CSS Grid (breakpoints 640/1024px), `<header>`/`<main>`/`<footer>` regions. Verify: grid reflows at 375/768/1280px.
- [x] **1.7** Create `css/components.css` — BEM: `.modal`, `.modal__header--warning`, `.toast--success/error`, buttons, inputs, `.card`. Verify: components render with correct spacing.
- [x] **1.8** Create `favicon.ico`, `manifest.json`, `assets/icons/.gitkeep`. Verify: favicon + manifest load without 404.

## Phase 2: HTML Shell + JavaScript Modules

- [ ] **2.1** Create `index.html` — HTML5: `lang="es"`, landmarks (`<header>`, `<main role="region">`, `<nav aria-label="Main">`, `<footer>`), meta/OG tags, CSS `<link>`, skip-to-content link, `<script type="module" src="js/app.js">`. Verify: W3C valid, landmarks present in DOM.
- [ ] **2.2** Create `js/songs.js` — `Song` CRUD via localStorage: `getAll/getById/create/update/delete/getSections`. Song: `{id, title, key, author, section, genre, lyrics, createdAt, updatedAt}`. Verify: create song via console, reload — data persists.
- [ ] **2.3** Create `js/chords.js` — Stub: `transpose` identity, `detect` → `[]`, `noteNames` → 12 notes. Verify: `chords.transpose("C", 2)` returns `"C"`.
- [ ] **2.4** Create `js/tuner.js` — Stub: `start` logs msg, `stop` no-op, `onNote` registers, `state='idle'`. Verify: no crash on `tuner.start()`.
- [ ] **2.5** Create `js/ui.js` — Factories returning `HTMLElement`: `showLoading/hideLoading`, `renderSongList`, `renderSongDetail`, `renderEditor`, `renderTuner`, `toast`, `modal`, `confirm`. Use BEM from components.css. Verify: each returns valid DOM node.
- [ ] **2.6** Create `js/app.js` — Hash router: `init/register/navigate/getParam`. Routes: `#/`, `#/canciones`, `#/cancion/:id`, `#/editar/:id`, `#/nueva`, `#/afinador`, `*` → redirect. Lifecycle: beforeRender→render→afterRender. Verify: each hash updates content, unknown redirects to `#/canciones`.

## Phase 3: Integration Verification

- [ ] **3.1** CSS: properties resolve, dark mode toggles via OS preference, grid adapts at 375/768/1280px. Verify: no CSS errors, seamless dark mode.
- [ ] **3.2** JS: all modules load error-free, all 5 routes render content, unknown hash redirects. Verify: 0 console errors.
- [ ] **3.3** A11y: Tab → skip link first, ARIA landmarks present, manifest + favicon resolve. Verify: keyboard navigation works, assets resolve.
