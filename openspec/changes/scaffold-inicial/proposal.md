# Proposal: Scaffold Inicial

## Intent

Foundational scaffold: HTML shell, CSS design system (custom properties, responsive grid, dark mode), JS module skeleton, and static assets. Establishes conventions for all subsequent features. Vanilla JS keeps zero-dependency, offline-first viability for GitHub Pages.

## Scope

### In Scope
- Directory structure: `js/`, `css/`, `assets/`
- `index.html` — SPA shell: semantic HTML, meta, Open Graph, manifest link
- CSS foundation: custom properties (colors, spacing, typography), reset, typography, responsive grid
- Dark mode via `prefers-color-scheme` + CSS custom properties
- JS modules: `app.js` (router), `ui.js` (components), `songs.js` (CRUD), `chords.js` (transpose), `tuner.js` (Web Audio API)
- Favicon placeholder, assets directory
- `openspec/specs/` initialized

### Out of Scope
- CRUD, tuner, transposition, auto-scroll, song editor — all future changes
- Any JS logic beyond module stubs

## Capabilities

### New Capabilities
- `app-shell`: HTML entry point, SPA router, JS module skeleton. Enables hash-based navigation and module orchestration.
- `design-system`: CSS custom properties, responsive grid layout, dark mode theming, BEM-like naming conventions.

### Modified Capabilities
None — first change, no existing specs.

## Approach

Single `index.html`. CSS via `<link>`, JS via `<script type="module">`. BEM-like naming with custom properties; dark mode via `prefers-color-scheme`. Event-driven JS: `app.js` routes and coordinates; each module exports a clean API. Relative paths throughout for GitHub Pages.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `index.html` | New | SPA shell: semantic HTML, meta, OG, manifest link |
| `css/main.css` | New | Variables, reset, typography, grid |
| `css/dark.css` | New | Dark mode overrides |
| `js/app.js` | New | Router shell, module orchestration |
| `js/ui.js` | New | UI components |
| `js/songs.js` | New | Songs CRUD stub |
| `js/chords.js` | New | Transpose stub |
| `js/tuner.js` | New | Web Audio stub |
| `assets/` | New | Static assets directory |
| `favicon.ico` | New | Placeholder favicon |
| `openspec/specs/` | New | Specs directory (empty) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Dark mode a11y contrast | Low | 4.5:1 minimum; test both themes |
| CSS specificity battles | Low | BEM-like naming + custom properties |
| ES module CORS on `file://` | Medium | Serve via HTTP; document requirement |

## Rollback Plan

`git reset --hard` on the initial commit. Purely additive — no destructive operations.

## Success Criteria

- [ ] `index.html` renders a proper layout shell
- [ ] CSS custom properties used consistently across all CSS files
- [ ] Dark mode activates via `prefers-color-scheme`
- [ ] All JS modules load without console errors
- [ ] GitHub Pages serves the page with relative paths
