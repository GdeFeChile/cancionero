# visual-system Specification

## Purpose

Micro-interaction layer: hover/active states, transitions, loading skeletons, toast notifications, modal animations, and scroll progress indicator for Cancionero GdeFe.

## Requirements

### Requirement: Glow on Interactive Hover

Interactive elements (buttons, song items, icon buttons) MUST show a glow effect on hover — colored box-shadow using the accent color at low opacity.

#### Scenario: Glow renders on hover

- GIVEN an interactive `.btn` or `.si` element
- WHEN the user hovers over it
- THEN the element MUST show an outer glow using `box-shadow` with `--color-accent` at ≤ 15% opacity

#### Scenario: Glow transition is smooth

- GIVEN hover is applied
- WHEN inspecting transition
- THEN the glow MUST fade in over ≤ 200ms with `ease-out` timing

### Requirement: Press Scale on Active

Buttons and clickable items MUST scale down slightly (`transform: scale(0.97)`) on `:active` to provide tactile feedback.

#### Scenario: Press scale applies on mousedown

- GIVEN a `.btn` or `.si` element
- WHEN the user presses down (mousedown)
- THEN the element MUST scale to `0.97` on its transform origin

#### Scenario: Press scale resets on release

- GIVEN the element is pressed
- WHEN the user releases
- THEN transform MUST return to `scale(1)` within ≤ 150ms

### Requirement: Elevation Lift on Active Elements

Active or selected items (current song in list, active alpha button) MUST show an elevation lift via `--shadow-elevation-1` token.

#### Scenario: Active song item shows elevation

- GIVEN a `.si.active` element
- WHEN inspecting computed shadow
- THEN it MUST use `--shadow-elevation-1` or deeper

### Requirement: Scroll Progress Bar

During auto-scroll in song view, a thin progress bar MUST appear at the top of the content area indicating scroll position within the lyrics.

#### Scenario: Progress bar tracks scroll position

- GIVEN the user triggers auto-scroll in song view
- WHEN the song body scrolls
- THEN a horizontal progress bar (2–3px tall, accent color) MUST fill proportionally from 0% to 100%

#### Scenario: Progress bar hides when idle

- GIVEN auto-scroll is stopped or completed
- WHEN 1 second passes with no scroll activity
- THEN the progress bar MUST fade out

### Requirement: Loading Skeleton

The system MUST show a CSS-only skeleton placeholder during route transitions and initial data load, replacing the generic loading indicator.

#### Scenario: Skeleton renders on route change

- GIVEN a user triggers a route change
- WHEN the router begins loading
- THEN the content region MUST display a shimmer-animated skeleton matching the target view's layout

#### Scenario: Skeleton is replaced by content

- GIVEN the skeleton is displayed
- WHEN the view is rendered
- THEN the skeleton MUST be removed and replaced with actual content

### Requirement: Toast Slide-In

Toast notifications MUST slide in from the right edge with a smooth cubic-bezier animation, and slide out after auto-dismiss.

#### Scenario: Toast enters with slide

- GIVEN a toast is triggered
- WHEN it appears
- THEN it MUST enter from the right with `translateX` animation over ≤ 300ms using `cubic-bezier(.34,1.56,.64,1)`

#### Scenario: Toast auto-dismisses

- GIVEN a toast is visible
- WHEN the dismiss timeout fires (≥ 2.5s)
- THEN the toast MUST fade out and be removed from the DOM

### Requirement: Modal Scale with Blur

Modals MUST open with a combined scale + fade animation, and the overlay MUST blur the background beneath it.

#### Scenario: Modal opens with scale and blur

- GIVEN `.overlay.active` is added
- WHEN inspecting the overlay
- THEN `backdrop-filter: blur()` MUST apply to the background
- AND the `.modal` child MUST animate from `scale(0.95) opacity(0)` to `scale(1) opacity(1)` over ≤ 250ms

#### Scenario: Overlay blur degrades gracefully

- GIVEN a device with `prefers-reduced-motion: reduce`
- WHEN the modal opens
- THEN the blur effect MAY be reduced, and the scale animation MUST be disabled
