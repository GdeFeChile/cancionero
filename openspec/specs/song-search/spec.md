# song-search Specification

## Purpose

Live title filtering in the sidebar — a search input with icon and clear button that filters the song list by title as the user types, with no server round-trips.

## Requirements

### Requirement: Search Input with Icon

The sidebar MUST contain a text input with a search icon (SVG) positioned at the left side inside the input.

#### Scenario: Input renders with icon

- GIVEN the sidebar is visible
- WHEN inspecting the search container
- THEN a `<input type="text">` MUST be present with an SVG search icon inside the input boundary (left-aligned)

#### Scenario: Placeholder text is descriptive

- GIVEN the search input is empty
- WHEN inspecting its placeholder attribute
- THEN it MUST read "Buscar canción..." or equivalent

### Requirement: Live Title Filtering

The system MUST filter the song list by title as the user types, matching case-insensitively against the song title. The filter MUST debounce at 150ms to avoid excessive re-renders.

#### Scenario: Filter shows matching songs

- GIVEN the user types "am" in the search input
- WHEN 150ms have passed since last keystroke
- THEN only songs whose title contains "am" (case-insensitive) MUST remain visible in the list
- AND songs that do NOT match MUST be hidden

#### Scenario: Empty input shows all songs

- GIVEN the search input is empty (or cleared)
- WHEN inspecting the song list
- THEN ALL songs MUST be visible

#### Scenario: No matches shows empty state

- GIVEN the user types "zzzznotasong"
- WHEN the filter returns zero matches
- THEN the song list area MUST show an empty state message (e.g., "No se encontraron canciones")

#### Scenario: Filter matches accented characters

- GIVEN the user types "cancion" (without accent)
- WHEN filtering
- THEN songs with accented characters like "canción" in their title MUST still match

### Requirement: Clear Button

When the input has text, a clear button (X icon or "×") MUST appear inside the input on the right side. Clicking it MUST clear the input and reset the filter.

#### Scenario: Clear button appears and functions

- GIVEN the search input has text
- THEN a clear button MUST be visible inside the input (right-aligned)
- WHEN the user clicks the clear button
- THEN the input MUST be emptied, the filter MUST reset showing all songs, and the input MUST regain focus

#### Scenario: Clear button hidden when empty

- GIVEN the search input is empty
- WHEN inspecting the search container
- THEN the clear button MUST NOT be visible
