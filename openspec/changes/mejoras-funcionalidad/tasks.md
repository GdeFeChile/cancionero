# Tasks: mejoras-funcionalidad

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~275 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-always |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Módulo Playlists (Fundación)

- [x] 1.1 Crear `js/playlists.js` con CRUD completo: `getAll()`, `getById()`, `create({name, date})`, `remove(id)`, `addSong(playlistId, songId)`, `removeSong(playlistId, songId)`, `moveSong(playlistId, songId, direction)` — persistencia en localStorage con clave `gdefe_playlists`

## Phase 2: Favoritos (Estado y Render)

- [x] 2.1 Añadir estado `favorites[]`, `showFavoritesOnly` y función `toggleFavorite(id)` en `js/app.js`, con carga desde y salvado a localStorage bajo clave `gdefe_favorites`
- [x] 2.2 Renderizar estrella ⭐/☆ en `renderSongList()` tras el título de cada song item, con evento click que llama a `toggleFavorite(id)`
- [x] 2.3 Añadir estrella en el encabezado de la vista detalle, sincronizada con el estado del sidebar
- [x] 2.4 Añadir checkbox "⭐ Favoritos" como filtro en sidebar, integrado con los filtros existentes (AND: sección, búsqueda, tonalidad)

## Phase 3: Filtro por Tonalidad

- [x] 3.1 Añadir input `#keyFilter` en sidebar debajo del buscador actual, con placeholder "Tonalidad..."
- [x] 3.2 Implementar filtro por `song.key` con prefix matching case-insensitive en `renderSongList()`, combinado con filtros de sección, búsqueda y favoritos (AND lógico)

## Phase 4: UI de Setlists (Modal y Wiring)

- [x] 4.1 Crear función `renderPlaylistModal()` que muestre lista de setlists ordenados por fecha DESC, con estado vacío y botón "Crear" con campos name+date
- [x] 4.2 Implementar creación de setlist con validación (nombre requerido, ≤100 caracteres) y confirmación en borrado
- [x] 4.3 Colocar botón "📋 Setlists" en sb-foot (junto a "Agregar canción") que abre el modal de setlists
- [x] 4.4 Añadir botón "+" en song items del catálogo para agregar canción a la playlist seleccionada, con prevención de duplicados y feedback visual
- [x] 4.5 Renderizar canciones de la playlist activa con botones subir/bajar (deshabilitados en primer/último) y botón remove

## Phase 5: Estilos CSS

- [x] 5.1 Añadir estilos `.si-star` (activa/outline), `.key-filter-input` y `.favorites-checkbox` en `css/components.css`
- [x] 5.2 Añadir estilos `.playlist-item`, `.playlist-song-row`, `.playlist-controls` en `css/components.css`
- [x] 5.3 Ajustar `css/layout.css` para espaciar correctamente los nuevos inputs y botón en sidebar y sb-foot
