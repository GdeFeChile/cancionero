# song-list-view Specification

**Status**: Draft
**Last Updated**: 2026-06-08

## Purpose

Song browsing view with section filtering, active filter states, and navigation to song detail for the Cancionero GdeFe.

## Affected Specs

- **app-shell**: List view renders inside `<main>` content region via hash route `#/canciones`

## Acceptance Criteria

- [ ] Songs display in responsive grid when navigating to `#/canciones`
- [ ] Filter buttons show active state on click and filter the grid
- [ ] Clicking a song navigates to `#/cancion/:id`
- [ ] Zero-filter-results shows empty state message: "No hay canciones en esta categoría"

## Requirements

### Requirement: Song List Rendering

The system MUST render all songs from localStorage in a responsive grid when the hash route is `#/canciones`.

#### Scenario: List displays on route

- GIVEN songs exist in localStorage
- WHEN the user navigates to `#/canciones`
- THEN a grid of song cards MUST render showing title, author, and section

### Requirement: Section Filtering

The system MUST filter the song grid by section when a filter button is clicked. The active filter button MUST show a distinct visual state.

#### Scenario: Filter narrows results

- GIVEN the song list displays songs from multiple sections
- WHEN the user clicks a filter button for "Alabanza"
- THEN only songs with section "Alabanza" MUST remain visible
- AND the clicked filter button MUST show active (highlighted) state

#### Scenario: No results for filter

- GIVEN no songs match the selected filter section
- WHEN the filter is applied
- THEN an empty state message MUST display: "No hay canciones en esta categoría"

### Requirement: Navigation to Detail

The system MUST navigate to `#/cancion/:id` when a song card is clicked.

#### Scenario: Click opens detail view

- GIVEN a song card is visible with its ID
- WHEN the user clicks the card
- THEN the hash MUST update to `#/cancion/{songId}`
- AND the song detail view MUST render

#### Scenario: All filters cleared

- GIVEN a section filter is active
- WHEN the user clicks the active filter button again
- THEN all songs MUST display (filter cleared)
- AND the button MUST return to inactive state
