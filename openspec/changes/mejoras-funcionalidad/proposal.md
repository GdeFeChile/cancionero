# Propuesta: mejoras-funcionalidad

## Intención

Añadir tres funcionalidades solicitadas por los músicos que usan el cancionero en reuniones: crear setlists por fecha, marcar canciones favoritas, y filtrar por tonalidad. Mejoran la experiencia de uso durante los ensayos y presentaciones en vivo.

## Alcance

### Incluido
1. **Setlists (Playlists)**: crear, ver y eliminar listas de canciones asociadas a una fecha de reunión; reordenar canciones dentro de una lista; añadir canciones desde el catálogo principal.
2. **Favoritos (⭐)**: marcar/desmarcar canción como favorita desde la lista lateral y desde la vista de detalle; filtro en sidebar para mostrar solo favoritas.
3. **Búsqueda por tonalidad**: input que filtra canciones cuyo campo `key` coincida con la tonalidad escrita; compatible con filtros de sección y búsqueda por título existentes.

### Excluido
- Importar/exportar setlists
- Setlists compartidos entre dispositivos
- Ordenación automática por tonalidad dentro de una lista
- Edición masiva del campo `key` en canciones
- Sincronización con calendario

## Capacidades

### Nuevas Capacidades
- `playlists`: Creación, listado, eliminación de setlists por fecha; añadir/quitar canciones; reordenar mediante botones subir/bajar.
- `song-favorites`: Marcar/desmarcar favorito con estrella en sidebar y detalle; filtro "Favoritos" en sidebar.

### Capacidades Modificadas
- `song-search`: Ampliar para incluir filtro por campo `key` (tonalidad) que funciona junto al filtro por título y por sección existentes.

## Enfoque Técnico

Misma arquitectura Vanilla JS sin bundlers. Datos de favoritos y setlists en localStorage (estructuras separadas de las canciones). Sin nuevas rutas — los setlists se gestionan desde un modal overlay y el sidebar existente. Reordenamiento por botones (no drag) para mantenerlo simple y accesible. El filtro por tonalidad se integra como un input adicional en la barra de filtros del sidebar.

## Áreas Afectadas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `js/app.js` | Alto | Nuevos state: favoritos, filtro key; render condicional en sidebar y detalle |
| `js/ui.js` | Alto | Nuevas factories: `renderPlaylistModal()`, `renderSetlistBar()`, star icon, key filter input |
| `js/songs.js` | Medio | Helper `getFavorites()`, `toggleFavorite()`, persistencia en localStorage |
| `js/nuevo-modulo.js` | Nuevo | Módulo `setlists.js` con factory de setlist y CRUD en localStorage |
| `css/components.css` | Bajo | Estilos para star activa, key filter, setlist modal items |
| `css/layout.css` | Bajo | Ajustes menores al sidebar para filtros adicionales |

## Riesgos

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Datos `key` vacíos en 208/211 canciones | Alta | El filtro funciona pero mostrará pocos resultados; documentar como limitación |
| Feature creep en setlists | Media | Scope estricto: sin drag, sin import/export, sin ordenación automática |

## Plan de Rollback

`git revert <merge-commit>` del PR. Como toca varios archivos, verificar manualmente que sidebar y detalle vuelven al estado anterior. Los datos en localStorage persisten pero no se pierde funcionalidad si se revierte el código.

## Dependencias

Ninguna. Todo es client-side, mismo stack.

## Criterios de Éxito

- [ ] Crear setlist con nombre+fecha, verlo en lista, eliminarlo
- [ ] Añadir canciones a un setlist desde el catálogo; reordenar con botones
- [ ] Marcar/desmarcar favorito desde sidebar y desde vista de detalle
- [ ] Filtro "Favoritos" en sidebar muestra solo canciones marcadas
- [ ] Input de tonalidad filtra canciones por campo `key`
- [ ] Filtros de sección, título y tonalidad funcionan simultáneamente
