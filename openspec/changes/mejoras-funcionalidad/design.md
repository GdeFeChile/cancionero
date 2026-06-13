# Design: mejoras-funcionalidad

## Enfoque Técnico

Tres funcionalidades independientes (favoritos, filtro por tonalidad, setlists) que se integran en la arquitectura Vanilla JS + ES modules + localStorage existente. Sin bundlers, sin nuevas dependencias. Cada funcionalidad se añade con el mínimo de módulos nuevos, reusando los patrones de `songs.js` (CRUD en localStorage) y de `app.js` (estado global + render functions + event wiring inline).

---

## Decisiones de Arquitectura

| Decisión | Opciones | Elegido | Razón |
|----------|----------|---------|-------|
| Dónde vive el estado de favoritos | `app.js` vs `songs.js` vs nuevo módulo | **`app.js`** | Es un array plano de IDs, sin lógica CRUD compleja. Un módulo separado añadiría ceremonia sin beneficio real. Sigue el patrón de `showFavoritesOnly`, `searchQuery` etc. |
| Módulo para setlists | En `app.js` vs nuevo `playlists.js` | **Nuevo `js/playlists.js`** | Tiene CRUD propio con estructura compleja (nombre, fecha, canciones, orden). Mismo patrón que `songs.js` — `getAll`, `create`, `remove`, `addSong`, `removeSong`, `moveSong` |
| UI de setlists | Página separada vs modal | **Modal overlay** | Reusa el sistema modal existente (`showModal`/`hideModal`). Sin nuevas rutas. Consistente con el modal de edición de canciones. |
| Reordenamiento | Drag & drop vs botones | **Botones subir/bajar** | Simplifica implementación, mejor accesibilidad, sin librerías externas. Los specs lo confirman. |
| Persistencia del filtro key | En localStorage vs estado volátil | **Estado volátil** | El filtro por tonalidad es temporal (como la búsqueda por título). No tiene sentido persistirlo. |

---

## Flujo de Datos

```
renderSongList()
  ├── getAll() → songs[]
  ├── filter by activeAlpha (letra)       ← state existente
  ├── filter by activeSection             ← state existente
  ├── filter by searchQuery               ← state existente
  ├── filter by showFavoritesOnly         ← NEW (filtra por favorites[])
  ├── filter by keyFilterQuery            ← NEW (prefix match sobre song.key)
  └── render HTML con:
        ├── .si-title + .si-key           ← existente
        ├── .si-star (⭐/☆)               ← NEW
        └── botón "+" si hay playlist seleccionada  ← NEW
```

### localStorage Schemas

```js
// gdefe_favorites — Array de IDs de canciones
["id1", "id2", "id3"]

// gdefe_playlists — Array de objetos setlist
[
  {
    "id": "pl_k8f3a1",
    "name": "Ensayo 12 Junio",
    "date": "2026-06-12",
    "songs": ["id1", "id3", "id5"],   // ordenado
    "createdAt": "2026-06-10T12:00:00.000Z"
  }
]
```

---

## Cambios por Archivo

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `js/playlists.js` | **Crear** | Módulo CRUD: `getAll()`, `getById()`, `create({name, date})`, `remove(id)`, `addSong(playlistId, songId)`, `removeSong(playlistId, songId)`, `moveSong(playlistId, songId, direction)` |
| `js/app.js` | Modificar | + Estado: `favorites[]`, `showFavoritesOnly`, `keyFilterQuery`, `selectedPlaylistId` + DOM refs: `$keyFilter`, `$favoritesFilter`, `$setlistBtn` + `renderSongList()`: filtros + estrella + botón add + `toggleFavorite(id)` + `renderPlaylistModal()` + `renderFavoritesFilter()` + import `./playlists.js` |
| `js/songs.js` | Sin cambios | No necesita cambios — la capa de favoritos es externa a songs |
| `index.html` | Modificar | + Input `#keyFilter` debajo del search actual + Contenedor `#setlistBtn` en sb-foot (reemplaza o añade junto a btnAddSong) |
| `css/components.css` | Modificar | + `.si-star` (estrella en song list item) + `.key-filter-input` + `.playlist-item` + `.playlist-song-row` |
| `css/layout.css` | Modificar | Ajuste menor al `.sb-search` para albergar el input de tonalidad |

---

## Interfaces / Contratos

```js
// playlists.js — API exportada
function getAll()       → playlist[]     // ordenado por date DESC
function getById(id)    → playlist|null
function create({ name, date }) → playlist
function remove(id)     → void
function addSong(playlistId, songId) → void   // previene duplicados
function removeSong(playlistId, songId) → void
function moveSong(playlistId, songId, direction) → void  // 'up' | 'down'

// app.js — estado nuevo
let favorites = [];              // cargado de localStorage al init
let showFavoritesOnly = false;   // toggle en sidebar
let keyFilterQuery = '';         // valor del input #keyFilter
let selectedPlaylistId = null;   // playlist activa para agregar canciones
```

---

## Estrategia de Testing (Manual)

| Funcionalidad | Qué probar | Cómo |
|---------------|-----------|------|
| Favoritos | Marcar/desmarcar desde sidebar y detalle; persistencia tras recarga | Click en estrella → recargar página → verificar estado |
| Filtro favoritos | Activar toggle con/sin favoritos; combinación con búsqueda y sección | Probar todas las combinaciones de filtros activos |
| Filtro tonalidad | Input con prefijos ("G" → "G", "G7", no "Gm"); case-insensitive; combinado con búsqueda | Escribir en input, verificar lista filtrada |
| Setlists | Crear con/sin nombre; lista ordenada por fecha; eliminar con confirmación | Abrir modal, crear, verificar orden, eliminar |
| Setlists — canciones | Agregar desde catálogo; prevenir duplicados; reordenar con botones; eliminar canción | Seleccionar playlist, click "+" en canción, verificar movimiento |

---

## Decisiones del Usuario

- Botón de setlists → **sb-foot** (junto a "Agregar canción")
- Toggle de favoritos → **checkbox** con estilo visual
- Estrella favorita → **después del título** en cada song item
