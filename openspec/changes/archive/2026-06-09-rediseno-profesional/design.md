# Design: Rediseño Profesional

## Technical Approach

CSS-first visual overhaul extending the existing custom properties architecture. New token families in `:root` (elevation, glassmorphism, noise, letter-spacing, scrollbar), component refinements in `components.css`, and minimal JS for search debounce (150ms), scroll progress tracking, and canvas tuner gauge. No build tools. No new JS modules — gauge renderer added to existing `tuner.js`.

**Specs covered**: design-system (tokens), visual-system (micro-interactions), song-search (debounce + clear), tuner-view (canvas gauge).

## Architecture Decisions

### Decision: Tuner Gauge — Canvas 2D API

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Canvas 2D** | Exact arc/gradient control, frame-by-frame animation | ✅ **Chosen** — spec mandates Canvas |
| Pure CSS arcs | Cannot draw curved paths reliably | ❌ Rejected |
| Inline SVG | Viable but heavier for per-frame redraw | ❌ Rejected |

### Decision: Gauge Renderer — In `tuner.js` (no new module)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Add to tuner.js** | ~50 lines added to 79-line audio module; respects "no new modules" | ✅ **Chosen** |
| New `tuner-renderer.js` | Cleaner separation but violates proposal constraint | ❌ Rejected |
| Inline in `app.js` | App.js is 596 lines; gauge has nothing to do with orchestration | ❌ Rejected |

### Decision: Search Debounce — Plain `setTimeout`

5-line pattern `clearTimeout → setTimeout(150ms)` in `app.js`. No library. Accent normalization via `String.prototype.normalize('NFD').replace(/[\u0300-\u036f]/g, '')`.

### Decision: Scroll Progress — JS drives CSS custom property

`requestAnimationFrame` in scroll listener sets `--scroll-progress` on `$songBody`. CSS uses the property for progress width, color gradient, and fade. Separates measurement (JS) from rendering (CSS).

### Decision: Micro-interactions — CSS Only

`:hover` glow (`box-shadow`), `:active` scale (0.97), elevation lift (`--shadow-elevation-1`) — all pure CSS with `transition`. Zero JS overhead. Touch devices gracefully ignore hover.

## Data Flow

```
Search filter:
  input event → clearTimeout → setTimeout(150ms)
    → normalize(query) → filter songs by title (case-insensitive, accent-tolerant)
    → renderSongList() → DOM updated

Scroll progress:
  $songBody.onscroll → rAF
    → percent = scrollTop / (scrollHeight - clientHeight)
    → $songBody.style.setProperty('--scroll-progress', percent)
    → CSS ::after progress bar binds width to var(--scroll-progress)

Tuner gauge:
  detectLoop() → noteFromPitch(freq) → onPitchDetected(pitch)
    → app.js callback: update DOM + call renderGauge(canvas, cents, status)
    → tuner.js renderGauge: clearRect → drawArc(gradient, deviation) → drawNeedle(cents)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `css/custom-properties.css` | Modify | Add `--shadow-elevation-*` (3 tiers), `--glass-*` (bg/border/blur), `--noise-*`, `--letter-spacing-*` (display/heading/body/caption), `--scrollbar-*` (width/thumb) |
| `css/components.css` | Modify | Add glow/press micro-interactions, loading skeleton shimmer, toast slide-in animation, modal animation update (scale 0.95→1), scroll progress bar, tuner canvas container |
| `css/layout.css` | Modify | Add noise texture via `body::before` (SVG data: URI), global thin scrollbar, search clear button positioning, progress bar track |
| `index.html` | Modify | Add `<canvas id="tunerCanvas">` in tuner-view, `<div class="scroll-progress">` in song-view, clear button in search-wrap |
| `js/app.js` | Modify | Add debounced search handler with accent normalization, scroll progress rAF listener, canvas element reference + render call in pitch callback |
| `js/tuner.js` | Modify | Add `export function renderGauge(canvasEl, cents, status)` for Canvas 2D radial gauge; add hint text state tracking |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Visual | All new tokens, glow, press, elevation | Manual: Chrome + Firefox + Safari on macOS |
| Visual | Glassmorphism backdrop-filter | Check render; verify fallback on unsupported browsers |
| Visual | Canvas gauge rendering | Verify arc, needle, color transitions on pitch input |
| Functional | Search debounce + accent match | Type rapidly → 150ms delay; "cancion" matches "canción" |
| Functional | Scroll progress bar | Start auto-scroll → bar fills 0–100%; stop → fades out after 1s |
| Functional | Clear button | Click/Enter → input cleared, focus returns, all songs shown |
| A11y | `prefers-reduced-motion` | Verify scale disabled, blur reduced |
| Regression | Theme toggle, transpose, CRUD | All existing functionality must pass |

## Migration / Rollout

No migration required. All changes are frontend-only CSS/JS. Existing localStorage song data is untouched. Old CSS variables remain as fallbacks — new tokens are additive.

## Open Questions

- [ ] Resolve during tasks: gauge arc sweep angle — semicircle (180°) vs full arc (270°). Spec says "semicircle or full arc". Recommending 270° arc for wider visual range while keeping flat/sharp metaphor clear.
