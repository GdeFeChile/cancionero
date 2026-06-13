# song-favorites Specification

## Purpose

Allow musicians to mark songs as favorites using a star icon in both the sidebar and detail view, with a sidebar filter to show only favorited songs. Favorite state persists across sessions via localStorage.

## Requirements

### Requirement: Toggle Favorite from Sidebar

Each song item in the sidebar list MUST display a star icon that toggles the favorite state on click.

#### Scenario: Mark as favorite from sidebar

- GIVEN a song in the sidebar list that is NOT a favorite
- WHEN the user clicks the empty star icon
- THEN the star MUST render as filled (active state)
- AND the song MUST be persisted as a favorite

#### Scenario: Unmark as favorite from sidebar

- GIVEN a song in the sidebar list that IS a favorite
- WHEN the user clicks the filled star icon
- THEN the star MUST render as empty
- AND the song MUST be removed from favorites

### Requirement: Toggle Favorite from Detail View

The song detail view MUST display a star icon that toggles the favorite state, synchronized with the sidebar state.

#### Scenario: Toggle favorite in detail reflects in sidebar

- GIVEN a song detail view is open
- WHEN the user clicks the star icon in the detail view
- THEN the star state MUST update in both the detail view and the sidebar list simultaneously

### Requirement: Persistent State

The system MUST persist the set of favorite song IDs in localStorage. Favorites MUST survive a full page reload.

#### Scenario: Favorites survive reload

- GIVEN the user has marked song "A" and song "B" as favorites
- WHEN the page is reloaded
- THEN songs "A" and "B" MUST still show as favorites (star filled)

### Requirement: Favorites Filter in Sidebar

The sidebar MUST include a filter toggle (e.g., "Favoritos" checkbox or button) that, when active, shows only favorited songs in the list.

#### Scenario: Filter shows only favorites

- GIVEN the user has marked 3 songs as favorites out of 50 total
- WHEN the user activates the "Favoritos" filter
- THEN only the 3 favorite songs MUST be visible in the sidebar list

#### Scenario: Filter with no favorites

- GIVEN no songs are marked as favorites
- WHEN the user activates the "Favoritos" filter
- THEN the list MUST show an empty state message (e.g., "No hay canciones favoritas")

#### Scenario: Filter combines with other filters

- GIVEN the "Favoritos" filter is active AND a title search is entered
- WHEN the user types a search query
- THEN only songs matching BOTH the favorite filter AND the title query MUST be visible

### Requirement: Visual Indicator

The star icon MUST clearly distinguish between favorited (filled) and non-favorited (empty) states with accessible color contrast.

#### Scenario: Star states are visually distinct

- GIVEN a song marked as favorite and another not marked
- WHEN inspecting their star icons
- THEN the favorited star MUST be filled (solid color, e.g., gold/amber)
- AND the non-favorited star MUST be an outline only
