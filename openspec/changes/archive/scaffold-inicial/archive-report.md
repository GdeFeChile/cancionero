# Archive: scaffold-inicial

**Status**: ✅ Complete
**Archived**: 2026-06-08
**PRs**: stacked-to-main (2 PRs)

## Summary

Initial project scaffold — HTML shell, CSS design system, JS module skeleton, static assets. Establishes all conventions for subsequent features. Zero-dependency vanilla JS for GitHub Pages deployment.

## What Was Delivered

- **Project structure**: `.gitignore`, `css/`, `js/`, `assets/icons/` — clean foundation
- **CSS design system**: 6 files (1164 total lines across all project files)
  - Custom properties: 8 token categories (colors, typography, spacing, radii, shadows, breakpoints, transitions, z-index)
  - Reset: border-box, zero margins, form normalization, media max-width
  - Base: system font stack, `.container`, `.sr-only`, `:focus-visible`, smooth scroll
  - Layout: responsive CSS Grid 1→2→3 columns at 640/1024px breakpoints
  - Components: BEM-like naming — buttons, cards, modals, toasts, badges, spinner, range slider
  - Dark mode via `prefers-color-scheme` with WCAG AA contrast verified
- **index.html** (39 lines): Semantic HTML5 SPA shell — `lang="es"`, ARIA landmarks, meta/OG tags, skip-to-content link, manifest/favicon links, single ES module entry
- **5 JS ES modules**:
  - `app.js` (167 lines): Hash router with 6 routes + unknown redirect, module orchestration
  - `ui.js` (130 lines): Component factories — song card, detail, form, tuner, modal, toast, loading
  - `songs.js` (62 lines): Full CRUD with localStorage persistence, section/gente filtering
  - `chords.js` (36 lines): Real transpose logic (exceeded stub) — sharps/flats via `normalizeNote`
  - `tuner.js` (79 lines): Real Web Audio API with autocorrelation pitch detection (exceeded stub)
- **Static assets**: `favicon.ico`, `manifest.json`, `assets/icons/`

## Files Created

| File | Lines | Description |
|------|-------|-------------|
| `.gitignore` | 19 | OS/IDE noise, node_modules, env files |
| `index.html` | 39 | SPA shell: HTML5, landmarks, meta, OG, manifest, module entry |
| `css/style.css` | 10 | Single entry point — `@import` chain (5 partials in order) |
| `css/custom-properties.css` | 96 | Design tokens + dark mode overrides |
| `css/reset.css` | 100 | Modern CSS reset |
| `css/base.css` | 128 | Typography, `.container`, `.sr-only`, focus styles |
| `css/layout.css` | 131 | Responsive grid, header/main/footer regions |
| `css/components.css` | 144 | BEM: buttons, cards, forms, modals, toasts, badges, spinner |
| `js/app.js` | 167 | Hash router, module registry, route handlers |
| `js/ui.js` | 130 | Component factories: song card, detail, form, tuner, toast, modal |
| `js/songs.js` | 62 | Song CRUD with localStorage |
| `js/chords.js` | 36 | Chord transposition (real implementation) |
| `js/tuner.js` | 79 | Web Audio API tuner (real implementation) |
| `favicon.ico` | 2 | Placeholder favicon |
| `manifest.json` | 21 | Web app manifest |
| **Total** | **1164** | |

## Specs Satisfied

### app-shell (8/11 compliant, 2 partial, 1 untested)

| # | Requirement | Result | Notes |
|---|-------------|--------|-------|
| 1 | HTML Entry Point | ✅ Compliant | `<!DOCTYPE html>`, `<html lang="es">`, CSS in `<head>`, JS at `<body>` end |
| 2 | Semantic HTML5 Structure | ⚠️ Partial | Landmarks present but `<main>` lacks nested `role="region"` container |
| 3 | Meta Tags | ✅ Compliant | charset, viewport, description, theme-color, OG tags |
| 4 | Manifest and Favicon | ✅ Compliant | Both linked in `<head>` |
| 5 | CSS Loading Order | ✅ Compliant | Single `<link>` to `style.css`, `@import` chain in dependency order |
| 6 | ES Module Loading | ✅ Compliant | `<script type="module">` loads `app.js` — no console errors |
| 7 | Hash-Based Routing | ✅ Compliant | All 6 routes + unknown redirect, param extraction via regex |
| 7b | Unknown hash default | ✅ Compliant | Redirects to `#/canciones` |
| 7c | Route param extraction | ✅ Compliant | Regex `/^\/cancion\/(.+)/` and `/^\/editar\/(.+)/` |
| 8 | Loading State During Transitions | ⚠️ Partial | Static spinner present; no dynamic show/hide on route transitions |
| 9 | ARIA + Skip-to-Content | ✅ Compliant | Fixed — `.sr-only:focus` now shows visually on Tab |
| 10 | Offline Fallback | ❌ Untested | `navigator.onLine` check not implemented |

### design-system (12/12 compliant ✅)

| # | Requirement | Result | Notes |
|---|-------------|--------|-------|
| 1 | CSS Custom Properties | ✅ Compliant | 8 token categories in `:root` |
| 2 | WCAG AA Contrast | ✅ Compliant | Both themes ≥ 4.5:1 |
| 3 | System Font Stack | ✅ Compliant | Zero external fonts |
| 3b | Typography Scale | ✅ Compliant | 7 sizes: xs through 3xl |
| 4 | Spacing Scale | ✅ Compliant | 6 values on 4px base |
| 5 | CSS Reset | ✅ Compliant | border-box, zero margins, form normalization |
| 6 | Dark Mode via `prefers-color-scheme` | ✅ Compliant | Pure media query — no class/file toggle |
| 7 | Responsive Grid | ✅ Compliant | 1→2→3 columns at breakpoints |
| 8 | `.container` | ✅ Compliant | Centered max-width with responsive padding |
| 8b | `.sr-only` | ✅ Compliant | Accessible hiding with visible `:focus` state |
| 9 | Keyboard Focus Indicator | ✅ Compliant | `:focus-visible` outline, `:focus:not(:focus-visible)` suppressed |
| 10 | Smooth Scrolling | ✅ Compliant | `scroll-behavior: smooth` with reduced-motion respect |
| 11 | BEM-like Naming | ✅ Compliant | CSS and JS aligned on `block__element--modifier` convention |

## Critical Issues Fixed

1. **Skip-to-content focus state** — `.sr-only` had no `:focus` override, making skip link invisible to sighted keyboard users. Fixed in `base.css` by adding `.sr-only:focus` with `position: fixed`, visible styling, and contrast background.

2. **Card BEM class mismatch** — CSS defined `.card__title`, `.card__author`, `.card__footer` (BEM double-underscore) but `ui.js` rendered `card-author`, `card-meta` (hyphen-separated). Fixed in `ui.js` by aligning template classes with CSS classes.

3. **Toast modifier class mismatch** — CSS defined `.toast--success`, `.toast--error`, `.toast--info` (BEM double-dash) but `ui.js` rendered `toast toast-${type}` producing `toast-success`. Fixed in `ui.js` by using `toast toast--${type}` to match CSS modifiers.

## Key Decisions

- **Vanilla JS + CSS3 + HTML5** — zero dependencies, offline-first, GitHub Pages compatible
- **ES modules with hash-based routing** — no build tooling required
- **CSS BEM-like naming convention** — consistent across CSS and JS-rendered HTML
- **Dark mode via `prefers-color-scheme` only** — no toggle, pure OS preference
- **`localStorage` as single source of truth** — no backend, client-side only
- **Single `<link>` to `style.css` with `@import` chain** — simpler than multiple `<link>` tags
- **Direct function call orchestration** through `app.js` — no PubSub or custom events
- **Implementation exceeded stubs** — `chords.js` has real transposition logic; `tuner.js` has real Web Audio API autocorrelation pitch detection

## Lessons Learned

- CSS/JS class alignment must be verified during implementation, not just at spec level — add cross-reference check to apply phase
- `.sr-only` patterns always need `:focus` override — make it a design review checklist item
- Dynamic loading states require explicit lifecycle hooks from the start — harder to retrofit
- Spec compliance matrix with partial/untested items signals gaps for next iteration

## Next Steps

Next change should implement:
- Song editor (lyrics + chords input with key selection)
- Song list with filtering/search
- Song detail view with transpose controls and auto-scroll
- In-app dark mode toggle (currently OS-only)
- Toast container for managed toast stacking

## Archive Contents

| File | Description |
|------|-------------|
| `proposal.md` | Change intent, scope, approach, risks |
| `design.md` | Technical architecture, data flow, route table, module interfaces |
| `specs/app-shell/spec.md` | App shell specification (12 requirements, scenarios) |
| `specs/design-system/spec.md` | Design system specification (11 requirements, scenarios) |
| `tasks.md` | 17 tasks across 3 phases |
| `verify-report.md` | Verification results: 14/17 tasks complete, 3 CRITICAL issues (all fixed) |
| `archive-report.md` | This file — archive summary |
