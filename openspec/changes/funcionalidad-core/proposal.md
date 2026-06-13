# Proposal: funcionalidad-core

## Intent

Turn the static scaffold into a working MVP. Filter buttons are wired, song detail shows lyrics with transpose/auto-scroll, add/edit forms persist songs, delete uses the styled modal, toasts provide feedback, bottom nav enables mobile navigation, and icons replace raw text buttons. All user-facing flows must work end-to-end.

## Scope

### In Scope
1. Song list filtering by section (wire broken filter buttons, show active state)
2. Song detail view (lyrics, transpose +/- semitones, auto-scroll with speed + play/pause)
3. Song editor (add/edit with validation, key/author/section/genre fields)
4. Delete confirmation via styled modal (replace `confirm()`)
5. Toast notification system (stacked, auto-dismiss)
6. Bottom navigation bar (render + active route highlight)
7. Inline SVG icons for all action buttons
8. Filter empty state (0 results message)
9. Route transition fade, card hover states

### Out of Scope
- Dark mode toggle (OS-only stays as-is)
- Offline support (deferred)
- Tuner visual enhancements
- Keyboard shortcuts beyond Escape
- Error boundaries
- Song import/export
- Search by title (deferred)

## Capabilities

### New Capabilities
- `song-list-view`: Browse songs, filter by section, navigate to detail
- `song-detail-view`: Lyrics display, transpose controls, auto-scroll
- `song-editor`: Add and edit songs with form validation
- `navigation-shell`: Bottom nav with hash-route awareness
- `visual-system`: SVG icons, route transitions, hover/focus states

### Modified Capabilities
None — app-shell and design-system specs are stable.

## Approach

Stick to existing architecture: no new modules, no bundlers. All changes confined to `app.js`, `ui.js`, `songs.js`, `components.css`, and `layout.css`. Vanilla JS factories for new UI widgets (bottomNav, autoScrollControl, confirmModal). SVG icons defined as template literals in `ui.js`. Auto-scroll uses `requestAnimationFrame` with speed multiplier from a range input.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `js/app.js` | High | Filter wiring, auto-scroll, modal delete, toast init, bottom nav |
| `js/ui.js` | High | New factories: bottomNav, autoScrollControl, confirmModal, icons, empty state |
| `js/songs.js` | Low | Add `filterBySection()` helper |
| `css/components.css` | Medium | Auto-scroll bar, active filter, bottom-nav, route transitions |
| `css/layout.css` | Low | Bottom-nav refinement |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Change exceeds 400 lines | High | Split into chained PRs: (1) list+detail+editor, (2) auto-scroll+modal+toast, (3) icons+nav+transitions |
| Feature creep | Medium | Strict scope — auto-scroll is simple speed slider, not karaoke |

## Rollback Plan

`git revert <merge-commit>` per PR in reverse merge order (stacked-to-main). Since all files overlap, test each revert carefully.

## Success Criteria

- [ ] Filter buttons filter song list and show active/hover state
- [ ] Song detail shows lyrics with transpose working +/- 12 semitones
- [ ] Auto-scroll scrolls lyrics at adjustable speed with play/pause
- [ ] Add/edit form saves songs with validation errors shown inline
- [ ] Delete opens styled modal with confirm/cancel
- [ ] Toasts stack, auto-dismiss, and show correct message types
- [ ] Bottom nav renders on mobile with active route highlighted
- [ ] All buttons use inline SVG icons (no raw text)
- [ ] Filter with 0 results shows empty state message
