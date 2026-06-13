# visual-system Specification

**Status**: Draft
**Last Updated**: 2026-06-08

## Purpose

Inline SVG icons replacing raw text buttons, route transition animations, and hover/focus visual states for interactive elements across the Cancionero GdeFe.

## Affected Specs

- **design-system**: Extends hover and focus visual states to new interactive contexts; design-system transition tokens MAY be reused for route animations

## Acceptance Criteria

- [ ] All action buttons use inline SVG icons (no external icon libraries)
- [ ] Route transitions apply a fade animation on view change
- [ ] Song cards, filter buttons, nav items, and form buttons show hover and `:focus-visible` states

## Requirements

### Requirement: Inline SVG Icons

The system MUST use inline SVG strings defined as template literals in JavaScript for all action button icons. No external icon libraries or image files.

#### Scenario: Icons render in all buttons

- GIVEN any view with action buttons (filter, edit, delete, transpose, play/pause, nav)
- WHEN inspecting the button's inner HTML
- THEN each action button MUST contain an inline `<svg>` element
- AND no action button MUST use raw text as its sole content

### Requirement: Route Transition Animation

The system SHOULD apply a fade transition when switching between route views.

#### Scenario: Content fades on route change

- GIVEN the user triggers a route transition
- WHEN the new view content renders in `<main>`
- THEN the content region SHOULD fade in over approximately 200ms
- AND the previous content SHOULD fade out before the new content appears

### Requirement: Interactive Hover and Focus States

Interactive elements (song cards, filter buttons, nav items, form buttons, modal buttons) SHOULD show visible hover and `:focus-visible` visual states.

#### Scenario: Card hover effect

- GIVEN a song card is displayed
- WHEN the user hovers the cursor over it
- THEN a visual change MUST occur (e.g., background shift, shadow lift, scale)

#### Scenario: Focus visible on keyboard nav

- GIVEN the user navigates with Tab key
- WHEN a filter button receives focus
- THEN the button MUST show a visible `:focus-visible` outline or ring
