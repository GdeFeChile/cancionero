# playlists Specification

## Purpose

Setlists (playlists) allow musicians to create ordered song lists associated with a rehearsal or presentation date. Managed entirely via a modal overlay with no separate routes.

## Requirements

### Requirement: Create Setlist

The system MUST provide a way to create a new setlist with a name and a date. Both fields MUST be required and the name MUST NOT exceed 100 characters.

#### Scenario: Create setlist with valid data

- GIVEN the user opens the setlist modal
- WHEN the user enters a name (e.g., "Ensayo 12 Junio") and selects a date
- AND clicks "Crear"
- THEN the setlist MUST appear in the setlist list with the given name and date

#### Scenario: Create setlist with empty name

- GIVEN the user opens the setlist modal
- WHEN the user leaves the name field empty and clicks "Crear"
- THEN the system MUST show a validation error and MUST NOT create the setlist

### Requirement: List Setlists

The system MUST display all setlists in a list ordered by date (most recent first). Each entry MUST show the setlist name, date, and song count.

#### Scenario: Setlists shown in date order

- GIVEN there are setlists with dates 2026-06-01, 2026-05-15, and 2026-06-10
- WHEN the user opens the setlist modal
- THEN the list MUST show 2026-06-10 first, then 2026-06-01, then 2026-05-15

#### Scenario: No setlists

- GIVEN no setlists have been created
- WHEN the user opens the setlist modal
- THEN the system MUST show an empty state message (e.g., "No hay listas aún")

### Requirement: Delete Setlist

The system MUST allow deleting a setlist. Deletion MUST require confirmation before proceeding.

#### Scenario: Delete setlist with confirmation

- GIVEN a setlist exists
- WHEN the user clicks the delete button and confirms the prompt
- THEN the setlist MUST be permanently removed

#### Scenario: Cancel delete

- GIVEN a setlist exists
- WHEN the user clicks the delete button and cancels the confirmation
- THEN the setlist MUST NOT be removed

### Requirement: Add Song to Setlist

The system MUST allow adding a song from the catalog to a selected setlist. The song MUST be appended at the end of the setlist.

#### Scenario: Add song to setlist

- GIVEN a setlist is selected and the catalog is visible
- WHEN the user clicks the add button on a song
- THEN the song MUST appear at the end of the setlist's song list

#### Scenario: Prevent duplicate song

- GIVEN a song is already in the setlist
- WHEN the user tries to add the same song again
- THEN the system SHOULD show a notice that the song is already in the setlist and MUST NOT add a duplicate

### Requirement: Remove Song from Setlist

The system MUST allow removing a song from a setlist.

#### Scenario: Remove song from setlist

- GIVEN a setlist with at least one song
- WHEN the user clicks the remove button next to a song
- THEN the song MUST be removed from that setlist

### Requirement: Reorder Songs

The system MUST provide up and down buttons for each song in a setlist to change its position.

#### Scenario: Move song up

- GIVEN a setlist with songs in positions [A, B, C]
- WHEN the user clicks the up button on song B
- THEN the order MUST become [B, A, C]

#### Scenario: Move song down

- GIVEN a setlist with songs in positions [A, B, C]
- WHEN the user clicks the down button on song B
- THEN the order MUST become [A, C, B]

#### Scenario: Up button disabled at first position

- GIVEN the first song in the setlist
- WHEN inspecting its controls
- THEN the up button MUST be disabled or hidden

#### Scenario: Down button disabled at last position

- GIVEN the last song in the setlist
- WHEN inspecting its controls
- THEN the down button MUST be disabled or hidden
