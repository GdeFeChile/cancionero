# design-system Specification

**Status**: Draft
**Last Updated**: 2026-06-08

## Purpose

CSS foundation: custom properties, reset, typography, responsive grid, dark mode, and utility classes for Cancionero GdeFe.

## Requirements

### Requirement: CSS Custom Properties in `:root`

The system MUST define custom properties for colors, typography, spacing, radii, shadows, breakpoints, transitions, and z-index via prefixed tokens.

#### Scenario: All categories are defined

- GIVEN the stylesheet is loaded
- WHEN inspecting `:root`
- THEN tokens MUST exist for `--color-*`, `--font-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--bp-*`, `--transition-*`, and `--z-*`

### Requirement: Color System — WCAG AA

The system MUST define color tokens (primary, secondary, surface, background, text, accents). All normal-text color pairs MUST meet WCAG AA 4.5:1 in both themes.

#### Scenario: Both themes pass contrast

- GIVEN the app is in light mode — THEN every text/background pair MUST be ≥ 4.5:1
- GIVEN the app is in dark mode — THEN every text/background pair MUST be ≥ 4.5:1

### Requirement: Typography Scale

The system MUST define font family (system stack), sizes, line heights, and weights.

#### Scenario: System font stack with no external fonts

- GIVEN the stylesheet is loaded
- WHEN inspecting `--font-family-base`
- THEN it MUST use a system font stack (e.g., `-apple-system, ...`) with zero external font loads

#### Scenario: Size scale covers body and headings

- GIVEN custom properties are defined
- WHEN inspecting `--font-size-*`
- THEN at least 6 distinct sizes MUST exist covering h1–h6 and body

### Requirement: Spacing Scale

The system MUST define a 4px-based spacing scale: `xs`, `sm`, `md`, `lg`, `xl`.

#### Scenario: Values follow 4px base

- GIVEN `--space-*` tokens
- WHEN inspecting values
- THEN they MUST follow 4px increments (4, 8, 16, 24, 32, 48)

### Requirement: CSS Reset

The system MUST apply global `box-sizing: border-box`, zero margins, `max-width: 100%` on images, and form element normalization.

#### Scenario: Reset applies globally

- GIVEN the stylesheet is loaded
- WHEN inspecting computed styles
- THEN `*, *::before, *::after` MUST have `box-sizing: border-box`
- AND `<img>` MUST have `max-width: 100%` and `height: auto`

### Requirement: Dark Mode via `prefers-color-scheme`

Dark mode MUST override custom properties inside `@media (prefers-color-scheme: dark)` — no separate file or class toggle.

#### Scenario: Activates on OS preference

- GIVEN the OS is in dark mode
- WHEN the page loads
- THEN `--color-*` MUST reflect dark palette without extra class or file

### Requirement: Responsive Grid for Song List

The system MUST provide CSS Grid adapting to mobile (< 640px), tablet (641–1024px), and desktop (> 1024px).

#### Scenario: Column count adapts

- GIVEN viewport 375px — grid MUST show 1 column
- GIVEN viewport 768px — grid MUST show 2 columns
- GIVEN viewport 1280px — grid MUST show 3 columns

### Requirement: Utility Classes

The system MUST provide `.container` (centered max-width wrapper) and `.sr-only` (screen-reader-only accessible hiding).

#### Scenario: Container centers content

- GIVEN element has `class="container"`
- WHEN inspecting computed styles
- THEN it MUST have `max-width` at desktop breakpoint, `margin: 0 auto`, and responsive padding

#### Scenario: sr-only is visually hidden yet accessible

- GIVEN element has `class="sr-only"`
- WHEN inspecting computed styles
- THEN it MUST be visually hidden yet available to screen readers (clip pattern)

### Requirement: Keyboard Focus Indicator

The system MUST show visible `:focus-visible` outline while suppressing it on mouse `:focus`.

#### Scenario: Outline on keyboard focus only

- GIVEN user navigates via Tab
- WHEN element receives focus
- THEN `:focus-visible` MUST render outline
- AND `:focus` (mouse) MUST NOT show outline

### Requirement: Smooth Scrolling

The system SHOULD apply `scroll-behavior: smooth` on `html`.

#### Scenario: Smooth scroll on anchor click

- GIVEN an in-page anchor link is clicked
- WHEN scroll occurs
- THEN it SHOULD be smooth

### Requirement: BEM-like Naming Convention

CSS classes SHOULD follow `block__element--modifier`.

#### Scenario: Names match pattern

- GIVEN any component CSS file
- WHEN inspecting class names
- THEN they SHOULD match `block__element--modifier` convention
