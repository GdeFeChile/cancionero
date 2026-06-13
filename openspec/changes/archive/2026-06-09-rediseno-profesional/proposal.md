# Proposal: Rediseño Profesional

## Intent

The app is feature-complete but looks "very basic". This change transforms the visual experience to a modern, premium feel — Spotify-like dark aesthetics with depth, glassmorphism, micro-interactions, and polished typography. The green accent (`#c8f65a`) is preserved.

## Scope

### In Scope
1. Visual token system: dark deep backgrounds, card elevation (3 tiers), glassmorphism overlays, noise texture, refined typography
2. Sidebar redesign: song items with album-art gradient borders, separated alpha index, search with icon + clear
3. Song detail polish: gradient header background, inline chord rendering, icon-only controls bar with tooltips, scroll progress indicator
4. Global polish: loading/route transitions, scrollbar styling, coherent empty states, toast slide-in, modal backdrop blur + scale
5. Tuner redesign: radial gauge visualization, string/note indicator
6. Search: live title filtering in sidebar

### Out of Scope
- Functional/behavioral changes to existing features
- Framework migration, build tools, external dependencies
- Service worker or offline caching
- New song data or editing workflows

## Capabilities

### New Capabilities
- `song-search`: Live title filtering via input with icon + clear button
- `tuner-view`: Tuner UI with radial gauge and string visualization

### Modified Capabilities
- `design-system`: Visual tokens overhauled — dark deep palette (`#0d0d0f` + noise), elevation shadows (3 tiers), glassmorphism (`backdrop-blur`, semi-transparent surfaces), typography refinement (letter-spacing, hierarchy), scrollbar styling
- `visual-system`: Micro-interactions expanded — glow on hover, press scale, elevation lift, scroll progress bar, loading skeleton, toast slide-in, modal scale + blur

## Approach

CSS-first: most changes stay in the design-system custom properties and component styles. New `--shadow-elevation-*`, `--glass-*`, `--noise-*` token families in `custom-properties.css`. Component upgrades in `components.css`. JS changes minimal: song-search filter logic, scroll progress listener, tuner gauge canvas. No new modules — extend existing factories in `ui.js`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `css/custom-properties.css` | Modified | New elevation, glassmorphism, noise, typography tokens |
| `css/components.css` | Modified | Card elevation, glassmorphism modals, micro-interaction classes, tuner gauge |
| `css/layout.css` | Modified | Sidebar polish, search bar, scroll progress bar, scrollbar styling |
| `js/ui.js` | Modified | Song-search factory, new tuner renderer, loading/empty state factories |
| `js/songs.js` | Low | Add `searchByTitle()` helper |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scope creep on "polish" (subjective) | Medium | Define concrete success criteria per area before starting |
| 400-line budget likely exceeded | High | Split: (1) design-tokens + sidebar + global, (2) song-detail + tuner, (3) search |

## Rollback Plan

`git revert` per PR in reverse merge order. Design-token changes are reversable via custom-properties rollback. If glassmorphism causes performance issues on low-end devices, remove `backdrop-filter` properties (graceful degradation).

## Success Criteria

- [ ] `--shadow-elevation-*`, `--glass-*`, `--noise-*` tokens defined and consumed
- [ ] Song items show gradient accent border, hover glow, active press
- [ ] Sidebar search filters song list live by title
- [ ] Song detail has gradient header, inline chords, icon-only controls with tooltips
- [ ] Scroll progress bar visible during auto-scroll
- [ ] Tuner shows radial gauge that responds to pitch input
- [ ] Modals open with backdrop blur + scale transition
- [ ] Toasts slide in from edge with auto-dismiss animation
- [ ] All existing functionality unchanged (filters, transpose, CRUD, theme toggle)
