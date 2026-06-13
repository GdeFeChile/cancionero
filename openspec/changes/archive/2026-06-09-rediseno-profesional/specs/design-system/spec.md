# Delta for design-system

## ADDED Requirements

### Requirement: Noise Texture Background

The system MUST apply a subtle noise texture overlay on the `body` background using a CSS `::before` pseudo-element with an inline SVG `data:` URI or CSS gradient noise technique.

#### Scenario: Noise renders without external asset

- GIVEN the page is loaded
- WHEN inspecting the `body` element's computed style
- THEN a noise-texture pseudo-layer MUST be visible (non-blocking, low opacity)

#### Scenario: Noise degrades gracefully

- GIVEN a browser does not support `::before` overlays on `body`
- WHEN inspecting the page
- THEN the solid fallback background MUST be `#0d0d0f` — no content loss

### Requirement: Scrollbar Styling

The system MUST style `::-webkit-scrollbar` globally: thin track (`4–6px`), subtle thumb with round caps, and hover state. On Firefox, `scrollbar-width: thin` MUST apply.

#### Scenario: Global thin scrollbar

- GIVEN the page is loaded
- WHEN inspecting any scrollable container
- THEN scrollbar width MUST be `4–6px` on Chromium, `thin` on Firefox
- AND the thumb MUST have `border-radius: 999px`

#### Scenario: High-contrast mode does not hide scrollbar

- GIVEN `prefers-contrast: more`
- WHEN inspecting scrollbar
- THEN thumb MUST remain visible with increased contrast

## MODIFIED Requirements

### Requirement: CSS Custom Properties in `:root`

The system MUST define custom properties for colors, typography, spacing, radii, shadows, breakpoints, transitions, and z-index via prefixed tokens. New token families SHALL be added: `--shadow-elevation-*` (3 tiers), `--glass-*` (glassmorphism), `--noise-*` (noise texture), `--letter-spacing-*` (typography refinement), and `--scrollbar-*` (scrollbar styling).
(Previously: only basic tokens existed — elevation, glass, noise, letter-spacing, and scrollbar tokens are new)

#### Scenario: All categories are defined

- GIVEN the stylesheet is loaded
- WHEN inspecting `:root`
- THEN tokens MUST exist for `--color-*`, `--font-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--bp-*`, `--transition-*`, `--z-*`, `--shadow-elevation-*`, `--glass-*`, `--noise-*`, `--letter-spacing-*`, and `--scrollbar-*`

#### Scenario: Elevation tiers are visually distinct

- GIVEN `--shadow-elevation-1`, `--shadow-elevation-2`, `--shadow-elevation-3` are defined
- WHEN comparing their computed values
- THEN each tier MUST produce a visibly deeper shadow (greater y-offset, blur, and opacity)

#### Scenario: Glass tokens compose a valid backdrop

- GIVEN `--glass-bg`, `--glass-border`, `--glass-blur` are defined
- WHEN applied to an element
- THEN the element MUST show a semi-transparent surface with `backdrop-filter: blur(var(--glass-blur))`

### Requirement: Color System — WCAG AA

The system MUST define color tokens (primary, secondary, surface, background, text, accents). Dark mode base background MUST be `#0d0d0f`. All normal-text color pairs MUST meet WCAG AA 4.5:1 in both themes.
(Previously: dark background base was not explicitly `#0d0d0f`)

#### Scenario: Dark mode uses deep-black base

- GIVEN the OS is in dark mode
- WHEN inspecting `--color-bg` or equivalent body background token
- THEN the value MUST resolve to `#0d0d0f`

#### Scenario: Both themes pass contrast

- GIVEN the app is in light mode — THEN every text/background pair MUST be ≥ 4.5:1
- GIVEN the app is in dark mode — THEN every text/background pair MUST be ≥ 4.5:1

### Requirement: Typography Scale

The system MUST define font family (system stack), sizes, line heights, weights, and a new `--letter-spacing-*` scale for refined hierarchy.
(Previously: no letter-spacing tokens existed)

#### Scenario: System font stack with no external fonts

- GIVEN the stylesheet is loaded
- WHEN inspecting `--font-family-base`
- THEN it MUST use a system font stack with zero external font loads

#### Scenario: Letter-spacing scale covers display, heading, body, and caption

- GIVEN `--letter-spacing-*` tokens are defined
- WHEN inspecting values
- THEN they MUST include at least 4 tiers: `display` (looser negative), `heading` (tight negative), `body` (normal), `caption` (wider positive)

#### Scenario: Size scale covers body and headings

- GIVEN custom properties are defined
- WHEN inspecting `--font-size-*`
- THEN at least 6 distinct sizes MUST exist covering h1–h6 and body
