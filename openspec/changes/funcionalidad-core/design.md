# Design: funcionalidad-core

## Technical Approach

Extend the existing 3-module architecture (app.js, ui.js, songs.js) with no new modules or build tools. All 8 features map to additions in the same 5 files: app.js (orchestration), ui.js (HTML/SVG factories), songs.js (data helpers), components.css (new UI), layout.css (nav refinement). Every feature follows the existing render-then-wire pattern: set `$main.innerHTML`, then query-select for event binding.

---

## Architecture Decisions

### Decision 1: Filter state as module-level variable

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Global state object | Overengineered for one var | — |
| `data-active` attribute | Requires DOM queries for reads | — |
| Closure variable in `songList()` | Simple, scoped, zero imports | ✅ Use `let activeSection = null` |

Clicking a filter button sets `activeSection`, re-fetches from `getBySection()` (already exists in songs.js), and re-renders `.song-grid` only (not the full page).

### Decision 2: Auto-scroll via `requestAnimationFrame` on `.song-detail`

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `scrollIntoView({ behavior: 'smooth' })` | No speed control, blocks UI | — |
| `setInterval` | Janky, doesn't align with paint | — |
| `requestAnimationFrame` | Syncs with vsync, delta-time speed | ✅ |

Speed range input (1x–5x) sets a multiplier. RAF loop computes `scrollTop += speed * deltaTime`. Play/pause toggles a `let scrolling = false` flag. Cleanup via `cancelAnimationFrame` on route change.

### Decision 3: Toast container created at init

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `document.body.appendChild` | Current (broken) — no stacking | — |
| Pre-existing HTML in index.html | Works but adds markup to shell | — |
| Create `.toast-container` in `init()` | Zero HTML changes, container ready on load | ✅ |

`showToast()` now appends children to `document.querySelector('.toast-container')`. Stacking is CSS-driven (`flex-direction: column`, `gap`). Remove triggers `@keyframes toast-out` before `.remove()`.

### Decision 4: Delete via `showModal()` + inline wiring

The existing `showModal(html)` creates an overlay. The delete flow calls `showModal()` with confirm/cancel buttons, then wires click handlers via `document.querySelector('.modal .btn-danger')`. No modal-specific module needed — 5 lines in `songDetail()`.

### Decision 5: SVG icons as template functions in ui.js

Each icon is an exported function returning an SVG string with `aria-hidden="true" focusable="false"`. All buttons use `iconName() + ' Button text'` or icon-only for icon buttons. 8 icons: plus, pencil, trash, play, pause, music-note, home, arrow-left.

### Decision 6: Bottom nav rendered after every route change

`renderBottomNav(activeRoute)` in ui.js produces a `<nav class="bottom-nav">` with 3 links: canciones, nueva, afinador. `app.js` calls it inside `router()` after `render()`. Active route gets `aria-current="page"` and `.bottom-nav__link--active` class. CSS already hides `.bottom-nav` above 640px.

---

## Data Flow

```
User click → router()
  ├─ songList(): getAll() → filterBySection() → renderSongCard() → render()
  ├─ songDetail(id): getById() → renderSongDetail() → wire transpose + auto-scroll + delete
  ├─ songForm(id?): renderSongForm() → on submit: getFormData() → create/update() → showToast() → navigate()
  └─ tunerView(): renderTuner()
         ↓
Bottom nav: router() → renderBottomNav() → insertAdjacentHTML('afterend', ...)
Toast:      init() → create .toast-container → showToast() → append → setTimeout → remove
```

No cross-module data流 beyond what exists. All features are horizontal additions within existing functions.

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `js/app.js` | Modify | Filter wiring, auto-scroll RAF loop, delete modal, bottom-nav render, toast init |
| `js/ui.js` | Modify | Add `renderFilterBar()`, `renderAutoScroll()`, `confirmModalHtml()`, `renderBottomNav()`, 8 SVG icon functions, `renderEmptyFilterState()` |
| `js/songs.js` | Modify | Export `getBySection()` is already public; add `filterBySection(section)` alias for clarity |
| `css/components.css` | Modify | Add `.filter-btn--active`, `.auto-scroll-bar`, `.form-error`, `.toast-out` animation, `.route-fade`, `.card-hover-scale` |
| `css/layout.css` | Modify | Refine `.bottom-nav` link styles, active state, safe-area padding for notched devices |

No new files. No new routes. No new modules.

---

## Interfaces / Contracts

### ui.js new signatures

```
renderAutoScroll({ speed: number, playing: boolean }) → string
confirmModalHtml({ title, message, confirmText, cancelText }) → string
renderBottomNav(activeRoute: string) → string
iconPlus(), iconPencil(), iconTrash(), iconPlay(), iconPause(), iconMusicNote(), iconHome(), iconArrowLeft() → string
renderEmptyFilterState() → string
```

### app.js new state variables (per function scope)

```
// songList scope
let activeSection = null;

// songDetail scope
let scrolling = false;
let rafId = null;
let scrollSpeed = 1;  // from range input
```

### songs.js additions

```
filterBySection(section) → song[]
  // alias/wrapper around getBySection() for clarity; returns [] if section is null/empty
```

---

## Testing Strategy

No automated test infrastructure (per config.yaml: testing.capabilities.test_runner.available: false). Verification is manual browser testing:

| Area | Manual Test |
|------|-------------|
| Filtering | Click each filter button → verify grid updates, active class shows, empty state when no matches |
| Auto-scroll | Play/pause toggles scroll, speed slider changes rate, RAF stops on route change |
| Editor validation | Submit empty form → inline errors show; submit valid → saves and navigates |
| Delete modal | Click delete → modal opens → confirm removes, cancel dismisses |
| Toasts | Trigger success/error/info → toast appears in container, stacks, auto-dismisses |
| Bottom nav | Navigate via bottom nav → active state updates; minimize viewport → nav appears/hides |
| Icons | All buttons render SVG (verify no broken `img` or text fallback visible) |

---

## Dependencies / Ordering

```
1. SVG icons (ui.js) — no deps, consumed by everything
2. Toast system (app.js init + ui.js) — dep: icons
3. Delete modal (app.js songDetail) — deps: icons, toast
4. Song editor validation (app.js songForm + ui.js) — deps: icons, toast
5. Song list filtering + empty state (app.js songList + songs.js) — dep: icons
6. Song detail auto-scroll (app.js songDetail + ui.js) — dep: icons
7. Bottom nav (app.js router + ui.js) — dep: icons
8. CSS polish: transitions, hover states, toast-out animation — no dep

Chaining (aligned with proposal risk):
  PR1: 1+2+3+4 (icons + toast + modal + editor)
  PR2: 5+6     (filter + auto-scroll)
  PR3: 7+8     (nav + polish)
```

---

## Open Questions

- [ ] Auto-scroll: should it scroll the window or a `.song-scroll-container` div? Proposal suggests a dedicated container to avoid scrolling the toolbar/nav out of view.
- [ ] Delete modal: should we keep `Escape` via existing `hideModal()` or handle it per-modal-instance? Proposal says yes (existing handler works).
- [ ] Bottom nav: should it replace the existing `header nav` on mobile or complement it? Recommendation: complement — header nav for desktop, bottom nav for mobile thumbs.
