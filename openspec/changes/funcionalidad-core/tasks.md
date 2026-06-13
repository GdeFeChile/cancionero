# Tasks: funcionalidad-core

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~500–550 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 (icons+toast+modal+editor) → PR2 (filter+auto-scroll) → PR3 (nav+polish) |
| Delivery strategy | single-pr (size:exception) |
| Chain strategy | size:exception |

Decision needed before apply: Yes (resolved — maintainer approved size:exception)
Chained PRs recommended: Yes (resolved — single PR with size:exception)
Chain strategy: size:exception
400-line budget risk: High (resolved — size:exception approved)

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Icons + Toast + Modal + Editor validation | PR 1 | Foundation for all UI; no external deps beyond existing modules |
| 2 | Filter + Auto-scroll | PR 2 | Wires existing `getBySection()`, adds RAF loop; depends on icons |
| 3 | Bottom nav + CSS polish | PR 3 | Route-aware nav, transitions, hover states; depends on icons |

## Phase 1: UI Infrastructure & Editor (PR1)

- [x] **T-01** SVG icon factory functions — 8 icons (`iconPlus`, `iconPencil`, `iconTrash`, `iconPlay`, `iconPause`, `iconMusicNote`, `iconHome`, `iconArrowLeft`) as `aria-hidden` SVG template strings in `ui.js`
- [x] **T-02** Toast system — create `.toast-container` in `app.js init()`, rewrite `showToast()` to append to container, add `toast-out` exit animation in `components.css`, update export list
- [x] **T-03** Delete confirmation modal — add `confirmModalHtml()` factory in `ui.js`, wire with `showModal()` in `songDetail()` replacing native `confirm()`
- [x] **T-04** Song editor form validation — add `renderValidationError()` and inline error field spans in `ui.js`, client-side validation in `songForm()` with per-field messages, `.form-error` styles in `components.css`

## Phase 2: List & Detail (PR2)

- [x] **T-05** Song list filtering + empty state — add `activeSection` state in `songList()`, `filterBySection()` alias in `songs.js`, `renderFilterBar()` factory with active class in `ui.js`, `.filter-btn--active` in `components.css`, `renderEmptyFilterState()` for zero-results
- [x] **T-06** Auto-scroll — add `renderAutoScrollControl()` factory in `ui.js`, RAF loop with speed multiplier and play/pause toggle in `songDetail()`, `.auto-scroll-bar` styles in `components.css`

## Phase 3: Navigation & Visual Polish (PR3)

- [x] **T-07** Bottom navigation bar — add `renderBottomNav()` factory in `ui.js` with 3 links (Canciones, Nueva, Afinador) and active route highlight, wire in `app.js router()`, refine `.bottom-nav` in `layout.css` with safe-area padding and active state
- [x] **T-08** CSS polish — route fade transition (`.route-fade` animation ~200ms), card hover scale effect (`.card-hover-scale`), `:focus-visible` rings on filter buttons/nav items/form elements, `toast-out` keyframe

### Task Details

| ID | Files | Reqs | Deps | Acceptance |
|----|-------|------|------|------------|
| T-01 | `ui.js` | VIS-REQ-1 | — | 8 inline SVG functions exported, each returns valid `<svg>` |
| T-02 | `app.js`, `ui.js`, `components.css` | — | T-01 | Toasts stack in container, animate in/out, auto-dismiss at 3s |
| T-03 | `app.js`, `ui.js` | SE-REQ-5 | T-01, T-02 | Modal opens on delete, confirm removes, Escape/cancel dismisses |
| T-04 | `app.js`, `ui.js`, `components.css` | SE-REQ-2, SE-REQ-3 | T-01, T-02 | Empty submit shows per-field errors; valid saves and navigates |
| T-05 | `app.js`, `ui.js`, `songs.js`, `components.css` | SLV-REQ-2, SLV-REQ-3 | T-01 | Filter buttons show active state, grid narrows, empty state on 0 results |
| T-06 | `app.js`, `ui.js`, `components.css` | SDV-REQ-3 | T-01 | RAF scrolls lyrics at speed 1-5x, play/pause toggles, stops on route change |
| T-07 | `app.js`, `ui.js`, `layout.css` | NAV-REQ-1, NAV-REQ-2, NAV-REQ-3 | T-01 | Bottom nav renders on mobile, active route highlighted, taps navigate |
| T-08 | `components.css`, `layout.css` | VIS-REQ-2, VIS-REQ-3 | — | Fade transition on route change, hover/focus states on all interactives |

## Risks

- **Auto-scroll container**: `songDetail()` currently renders lyrics to default flow. May need a `.song-scroll-container` div to avoid scrolling toolbar/nav out of view. Refine in T-06 if needed.
- **Bottom nav + header overlap**: Bottom nav is `fixed`. Ensure `app-main` padding-bottom accounts for it on mobile (safe-area + 56px). Address in T-07.
- **Import chain**: `toggleActiveFilter`, `startScrolling`, `stopScrolling` will need `window.*` export for inline `onclick` attributes or refactor to `addEventListener` in wire-up. Consistently use wire-up pattern (already used in `songDetail()`).
