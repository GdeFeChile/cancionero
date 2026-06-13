# song-editor Specification

**Status**: Draft
**Last Updated**: 2026-06-08

## Purpose

Song creation and editing form with inline validation, localStorage persistence, and delete confirmation via styled modal.

## Affected Specs

- **app-shell**: Editor renders via hash routes `#/editar` (new) and `#/editar/:id` (edit)

## Acceptance Criteria

- [ ] New song form saves to localStorage with all required fields
- [ ] Edit form pre-fills fields from existing song and updates on save
- [ ] Inline validation errors show per-field messages on empty submission
- [ ] Delete opens styled confirmation modal (not browser `confirm()`)

## Requirements

### Requirement: Song Form

The system MUST render a form with fields: title, author, key (select with musical keys), section (select), genre, duration, and lyrics textarea.

#### Scenario: New song form renders

- GIVEN the user navigates to `#/editar`
- WHEN the editor view renders
- THEN all form fields MUST be empty
- AND a "Guardar" submit button MUST be present

### Requirement: Form Validation

The system MUST validate that title, author, key, section, and lyrics are non-empty before saving.

#### Scenario: Empty submission prevented

- GIVEN the form is empty
- WHEN the user clicks "Guardar"
- THEN each empty required field MUST show an inline error message below it
- AND the song MUST NOT be saved to localStorage

### Requirement: Save and Persist

On valid submission, the system MUST save the song to localStorage and navigate to its detail view.

#### Scenario: Valid song saved

- GIVEN all required fields are filled with valid data
- WHEN the user clicks "Guardar"
- THEN the song MUST persist in localStorage with a unique ID
- AND the view MUST navigate to `#/cancion/{newId}`

### Requirement: Edit Existing Song

The system MUST pre-fill the form when editing an existing song via `#/editar/:id`.

#### Scenario: Form pre-fills on edit

- GIVEN a song with ID 42 exists in localStorage
- WHEN the user navigates to `#/editar/42`
- THEN all fields MUST display the song's current values
- AND saving MUST update the existing record (same ID)

### Requirement: Delete Confirmation

The system MUST show a styled confirmation modal when deleting a song, replacing native `confirm()`.

#### Scenario: Delete confirmed

- GIVEN a song detail view is displayed
- WHEN the user clicks "Eliminar"
- THEN a styled modal MUST appear with "Cancelar" and "Eliminar" buttons
- AND clicking "Eliminar" MUST remove the song from localStorage
- AND the view MUST navigate to `#/canciones`

#### Scenario: Delete cancelled

- GIVEN the styled confirmation modal is visible
- WHEN the user clicks "Cancelar" or presses Escape
- THEN the modal MUST close
- AND the song MUST NOT be deleted
