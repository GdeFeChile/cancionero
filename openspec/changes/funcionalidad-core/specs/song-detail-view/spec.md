# song-detail-view Specification

**Status**: Draft
**Last Updated**: 2026-06-08

## Purpose

Lyrics display with transpose controls and adjustable auto-scroll for the Cancionero GdeFe.

## Affected Specs

None — standalone view rendered via `#/cancion/:id`.

## Acceptance Criteria

- [ ] Song title, author, musical key, and lyrics display on `#/cancion/:id`
- [ ] Transpose +/- buttons shift chord indicators by ±12 semitones maximum
- [ ] Auto-scroll scrolls lyrics at adjustable speed with play/pause controls

## Requirements

### Requirement: Song Detail Display

The system MUST display song title, author, musical key, lyrics text, and any chord notation when navigating to `#/cancion/:id`.

#### Scenario: Detail renders from route

- GIVEN a song exists with ID 42
- WHEN the user navigates to `#/cancion/42`
- THEN title, author, key, and lyrics MUST render in the content region

#### Scenario: Unknown song ID

- GIVEN no song exists with ID 99
- WHEN the user navigates to `#/cancion/99`
- THEN a "Canción no encontrada" message MUST display
- AND a link to return to `#/canciones` MUST be present

### Requirement: Transpose Control

The system MUST provide plus and minus buttons that shift chord indicators by up to 12 semitones in either direction.

#### Scenario: Transpose up and down

- GIVEN a song with key "C" is displayed
- WHEN the user clicks the + button once
- THEN chords MUST shift one semitone up ("C" → "C#")
- AND the displayed key MUST update

#### Scenario: Transpose clamped at limits

- GIVEN transposition is at +12
- WHEN the user clicks + again
- THEN the transposition MUST NOT exceed +12
- AND the + button SHOULD appear disabled

### Requirement: Auto-Scroll

The system MUST provide an auto-scroll control with play/pause toggle and a speed range input.

#### Scenario: Auto-scroll plays and pauses

- GIVEN the song detail view is displayed
- WHEN the user clicks play
- THEN lyrics MUST scroll using `requestAnimationFrame` at the configured speed
- AND clicking pause MUST stop scrolling

#### Scenario: Speed adjustment

- GIVEN auto-scroll is playing
- WHEN the user adjusts the speed range input
- THEN the scroll rate MUST change proportionally
