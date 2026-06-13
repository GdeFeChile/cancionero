# navigation-shell Specification

**Status**: Draft
**Last Updated**: 2026-06-08

## Purpose

Bottom navigation bar with hash-route awareness and active route highlighting, primarily for mobile navigation across the Cancionero GdeFe.

## Affected Specs

- **app-shell**: The `<nav>` landmark element MAY host the bottom navigation bar; routing hooks may need to update nav state on transition

## Acceptance Criteria

- [ ] Bottom nav renders with labeled links to Canciones and Afinador
- [ ] Active route highlights the matching nav item
- [ ] Tapping a nav item updates the hash route without page reload

## Requirements

### Requirement: Bottom Nav Rendering

The system MUST render a fixed-position bottom navigation bar with icon-labeled links to `#/canciones` and `#/afinador`.

#### Scenario: Nav visible on load

- GIVEN the app loads at any route
- WHEN inspecting the bottom of the viewport
- THEN a horizontal nav bar with labeled links MUST be visible
- AND it MUST be positioned at the bottom of the screen

### Requirement: Active Route Highlight

The system MUST apply an active visual state to the nav item matching the current hash route.

#### Scenario: Active state updates on navigation

- GIVEN the user is at `#/canciones` (Canciones nav item is active)
- WHEN the user navigates to `#/afinador`
- THEN the "Afinador" nav item MUST receive the active highlight
- AND the "Canciones" item MUST lose it

### Requirement: Route Navigation

Tapping a nav link MUST update the hash route without triggering a full page reload.

#### Scenario: Tap navigates to route

- GIVEN the bottom nav is visible
- WHEN the user taps the "Canciones" link
- THEN the hash MUST change to `#/canciones`
- AND the content region MUST render the corresponding view
