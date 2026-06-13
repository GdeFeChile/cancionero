# Delta for song-search

## ADDED Requirements

### Requirement: Key (Tonality) Filter Input

The system MUST provide a text input below the existing title search in the sidebar that filters songs by their `key` field (tonality, e.g., "G", "Em", "D#m"). The filter MUST work combined with the existing title search and section filter using AND logic: only songs matching ALL active filters are visible. Matching MUST be case-insensitive and MUST match the beginning of the key value (e.g., "G" matches "G", "G7", but not "Am").

#### Scenario: Filter by key shows matching songs

- GIVEN the user types "G" in the key filter input
- WHEN inspecting the song list
- THEN only songs whose `key` field starts with "G" (case-insensitive) MUST be visible

#### Scenario: Key filter combined with title filter

- GIVEN the title filter shows songs matching "amor" AND the key filter shows songs matching "G"
- WHEN both filters are active simultaneously
- THEN only songs whose title contains "amor" AND whose `key` starts with "G" MUST be visible

#### Scenario: No matches from combined filters

- GIVEN the title filter is set to "amor" AND the key filter is set to "Xyz"
- WHEN no song matches both criteria
- THEN the song list MUST show an empty state message (e.g., "No se encontraron canciones")

#### Scenario: Clearing key filter resets to title-only results

- GIVEN the title filter is "amor" AND the key filter is "G"
- WHEN the user clears the key filter input
- THEN the list MUST show all songs matching "amor" regardless of key

#### Scenario: Case-insensitive key matching

- GIVEN a song with `key: "em"`
- WHEN the user types "EM" in the key filter
- THEN the song MUST match and remain visible

#### Scenario: Partial key prefix matching

- GIVEN a song with `key: "G7"`
- WHEN the user types "G" in the key filter
- THEN the song MUST match (prefix match)
- WHEN the user types "G7" in the key filter
- THEN the song MUST also match
- WHEN the user types "Gm" in the key filter
- THEN the song MUST NOT match (different prefix)

#### Scenario: Key filter input has placeholder

- GIVEN the key filter input is empty
- WHEN inspecting its placeholder attribute
- THEN it MUST read "Tonalidad..." or equivalent
