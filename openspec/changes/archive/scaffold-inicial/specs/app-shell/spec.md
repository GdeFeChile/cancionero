# app-shell Specification

**Status**: Draft
**Last Updated**: 2026-06-08

## Purpose

HTML SPA entry point, semantic document shell, hash-based routing, and ES module loading skeleton for Cancionero GdeFe.

## Requirements

### Requirement: HTML Entry Point

The system MUST serve a single `index.html` as sole entry point.

#### Scenario: Loads complete HTML5 document

- GIVEN a browser navigates to the app
- WHEN the server returns `index.html`
- THEN the response MUST be a valid HTML5 document with `<!DOCTYPE html>` and `<html lang="es">`
- AND CSS MUST load in `<head>`, JS modules after `</body>` content

### Requirement: Semantic HTML5 Structure

The system MUST use semantic landmark elements.

#### Scenario: Landmarks present in DOM

- GIVEN the page is loaded
- WHEN inspecting the DOM
- THEN `<header>`, `<main>`, `<nav>`, and `<footer>` MUST exist
- AND `<main>` MUST contain a content region with `role="region"` and `aria-label`

### Requirement: Meta Tags

The system MUST include charset, viewport, description, Open Graph, and theme-color tags.

#### Scenario: All required meta tags present

- GIVEN `index.html` is served
- WHEN inspecting `<head>`
- THEN it MUST include `<meta charset="utf-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, `<meta name="description">`, `<meta property="og:*">`, and `<meta name="theme-color">`

### Requirement: Manifest and Favicon

The system MUST link to manifest.json (placeholder) and favicon.ico.

#### Scenario: Resource links declared in head

- GIVEN `index.html` is served
- WHEN inspecting `<head>`
- THEN `<link rel="manifest" href="manifest.json">` and `<link rel="icon" href="favicon.ico">` MUST be present

### Requirement: CSS Loading Order

CSS MUST load sequentially in `<head>` — design system first, then component styles.

#### Scenario: Stylesheets ordered by dependency

- GIVEN `index.html` is served
- WHEN inspecting `<link rel="stylesheet">` order
- THEN the first stylesheet MUST be the design system
- AND component stylesheets MUST follow

### Requirement: ES Module Loading

JS MUST load as ES modules (`type="module"`) at end of `<body>`.

#### Scenario: Modules load without console errors

- GIVEN the browser loads `index.html`
- WHEN DOM content is parsed
- THEN `<script type="module" src="js/app.js">` MUST be the last child of `<body>`
- AND `app.js` MUST be the single entry point orchestrating all modules

### Requirement: Hash-Based Routing

The system MUST route via hash: `#/canciones`, `#/afinador`, `#/cancion/:id`, `#/editar/:id`.

#### Scenario: Route change updates content

- GIVEN a user is on any route
- WHEN hash changes to `#/canciones`
- THEN the content region MUST update to show the song list

#### Scenario: Unknown hash defaults

- GIVEN the hash is `#/unknown`
- WHEN the router processes it
- THEN it MUST redirect to `#/canciones`

#### Scenario: Route parameter extraction

- GIVEN hash is `#/cancion/42`
- WHEN the router parses it
- THEN it MUST extract ID `42` and render the corresponding view

### Requirement: Loading State During Transitions

The system SHOULD show a loading indicator during route transitions.

#### Scenario: Indicator appears and clears

- GIVEN a user triggers a route change
- WHEN the router begins loading
- THEN the content region SHOULD display a loading indicator
- AND the indicator MUST be removed when the view is rendered

### Requirement: ARIA Landmarks and Skip-to-Content

The system MUST include ARIA landmarks and a skip-to-content link.

#### Scenario: Skip link is first focusable element

- GIVEN the page loads
- WHEN a keyboard user presses Tab
- THEN the first focusable element MUST be a skip-to-content link targeting `<main>`
- AND `<nav>` MUST have `aria-label="Main navigation"`

### Requirement: Offline Fallback Message

The system SHOULD show an offline message when the browser is offline.

#### Scenario: Offline message renders

- GIVEN `navigator.onLine` is `false`
- WHEN a route transition is attempted
- THEN the system SHOULD display a non-intrusive offline notice
