# Tasks: Rediseño Profesional

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 300-500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Design tokens + global → Song detail + tuner → Search |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Design tokens + global polish (noise, scrollbar, micro-interactions, gradient borders, clear button) | PR 1 | Independent base — all CSS + HTML |
| 2 | Song detail polish + tuner redesign (scroll progress, canvas gauge, gradient header) | PR 2 | Depends on PR 1 tokens; CSS + JS |
| 3 | Search debounce + accent normalization + empty state | PR 3 | Depends on PR 1 clear button; minimal JS |

## Phase 1: Foundation — Design Tokens & Global Polish

- [x] 1.1 Add `--shadow-elevation-*` (3 tiers), `--glass-*`, `--noise-*`, `--letter-spacing-*`, `--scrollbar-*` token families to `css/custom-properties.css :root`
- [x] 1.2 Add noise texture `body::before` (SVG data:URI) + global thin scrollbar styling (`::-webkit-scrollbar`, `scrollbar-width:thin`) to `css/layout.css`
- [x] 1.3 Add gradient accent border + hover glow (`box-shadow` with `--color-accent`) to `.si` song items in `css/components.css`
- [x] 1.4 Add glow/press micro-interactions (`.btn`:active scale 0.97, transition ≤200ms), loading skeleton shimmer, toast slide-in animation to `css/components.css`
- [x] 1.5 Update modal animation — overlay `backdrop-filter: blur()` + `.modal` scale(0.95→1) — in `css/components.css`
- [x] 1.6 Add clear button (`×`) to `.search-wrap` in `index.html` (hidden by default, visible on input)

## Phase 2: Song Detail Polish

- [x] 2.1 Add gradient background to `.song-hdr` + icon-only control buttons with tooltip `title` attributes in `css/components.css`
- [x] 2.2 Add scroll progress bar styles (2-3px accent bar, fade out after 1s idle) to `css/components.css` + progress bar track to `css/layout.css`
- [x] 2.3 Add `<div class="scroll-progress">` markup inside song-view in `index.html`
- [x] 2.4 Add `requestAnimationFrame` scroll progress listener in `js/app.js` — sets `--scroll-progress` on `$songBody`, fades bar on idle

## Phase 3: Tuner Redesign

- [x] 3.1 Add canvas gauge container styles + radial gauge positioning to `css/components.css`
- [x] 3.2 Add `<canvas id="tunerCanvas">` inside tuner-view container in `index.html`
- [x] 3.3 Add `export function renderGauge(canvasEl, cents, status)` to `js/tuner.js` — Canvas 2D radial arc with gradient fill, needle indicator, color transitions per tuning state
- [x] 3.4 Wire canvas element ref + `renderGauge()` call in pitch callback in `js/app.js`

## Phase 4: Search Enhancement

- [x] 4.1 Replace instant search with 150ms debounced handler (`clearTimeout`/`setTimeout`) + accent normalization (`String.prototype.normalize('NFD')`) in `js/app.js` search filter
- [x] 4.2 Add search-specific empty state message ("No se encontraron canciones") when search active with no matches in `js/app.js` `renderSongList()`
- [x] 4.3 Add SVG search icon refinement + clear button show/hide toggle logic in `index.html` and `js/app.js`
