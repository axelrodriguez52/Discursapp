# DiscursApp — Circuito 16 (Next.js)

Migración estructural de `DISCURSAPP .html` a Next.js 16 con exportación estática.
La aplicación se comporta igual que el archivo original: se conservó la lógica y solo se
agrupó por secciones para que sea fácil encontrar cada parte. La única vista reescrita
como React real es **Contactos** (misma lógica, mismos datos y mismo aspecto).

El HTML original sigue estando en la carpeta superior y es la fuente de verdad.

---

## Requisitos

- Node.js 20.9 o superior (probado con 24.20)
- npm

## Comandos

```bash
npm install       # solo la primera vez
npm run dev       # desarrollo en http://localhost:3000
npm run build     # compila y exporta el sitio estático en out/
npm run preview   # sirve out/ en http://localhost:8000
```

`npm run build` genera `out/`, un sitio estático normal: se puede servir con cualquier
servidor HTTP, empaquetar en el `.exe` o incluir en el WebView de Android.

> No abras `out/index.html` con doble clic (`file://`): las rutas `/_next/...` necesitan
> un servidor. Usa `npm run preview` o el servidor de red.

---

## Estructura

```
app/
  layout.jsx        <head>, CSP, fuentes, scripts CDN y orden de las hojas de estilo
  page.jsx          AppShell + AppRuntime
  overrides.css     único ajuste necesario al pasar el marcado a JSX
styles/             18 hojas CSS, en el mismo orden de cascada que el original
src/
  boot.js           arranque: listeners globales y boot()
  core/             configuración, estado global, persistencia, utilidades, tema, splash
                    y el store de Contactos (contactos-store.js)
  services/         Google, Sheets, Excel, PDF, impresión y exportación
  ui/               navegación, toasts, fotos y modal de orador
  views/            lógica de cada vista (dashboard, meses, aguayo, visitas, ...)
  components/       marcado React, una carpeta por tipo de sección
public/             iconos, manifest y .nojekyll
out/                sitio exportado (generado por npm run build)
serve-out.js        servidor estático mínimo para probar out/
```

### Lógica (JavaScript)

| Archivo | Contenido |
| --- | --- |
| `src/core/config.js` | IDs de Google, scopes y detección de modo red |
| `src/core/state.js` | Estado global: oradores, asignaciones, mapas, filtros, selección |
| `src/core/caches.js` | Índices en memoria (oradores únicos, fotos, asignaciones por nombre) |
| `src/core/storage.js` | Persistencia: IndexedDB (`Circuito16Storage`) y `localStorage` |
| `src/core/utils.js` | Fechas, texto, comparaciones y `debounce` |
| `src/core/files.js` | Carga de Excel/PDF y estado de la UI de carga |
| `src/core/render-scheduler.js` | Agrupación de renders (`requestAnimationFrame` + `debounce`) |
| `src/core/contactos-store.js` | Store externo de Contactos: snapshot, suscripción y `publishContactos` |
| `src/core/animations.js` | Animaciones GSAP |
| `src/core/splash.js` | Pantalla de inicio (antes era el último `<script>` del HTML) |
| `src/core/theme.js` | Icono del botón de tema (antes parte de `initDarkMode`) |
| `src/ui/navigation.js` | Pestañas, sidebar, menú y tema claro/oscuro |
| `src/ui/toast.js` | Loading, confirmación y toasts |
| `src/ui/photos.js` | Fotos de perfil: subida, recorte y lightbox |
| `src/ui/speaker-modal.js` | Ficha de orador / contacto |
| `src/services/google.js` | Google Identity Services, `gapi` y token de escritura |
| `src/services/sheets.js` | Lectura y escritura en Google Sheets |
| `src/services/excel.js` | Parseo del Excel maestro |
| `src/services/pdf.js` | Parseo del catálogo de bosquejos en PDF |
| `src/services/print.js` | Impresión de vistas |
| `src/services/export.js` | Exportaciones CSV y PDF |
| `src/views/editor.js` | Editor de discursantes (CRUD en Sheets) |
| `src/views/bosquejos.js` | Bosquejos: disponibilidad, bloqueos y selección múltiple |
| `src/views/contactos.js` | Contactos: cálculo del snapshot, ficha y PDF (la vista es React) |
| `src/views/dashboard.js` | Todos los oradores: tarjetas, filtros, calificaciones, ausencias |
| `src/views/months.js` | Disponibilidad por mes: tabla, asistente de registro y preselección |
| `src/views/aguayo.js` | Salidas del circuito |
| `src/views/visitas.js` | Visitas entrantes |
| `src/views/estadisticas.js` | Panel de estadísticas y detalles |
| `src/views/calendar.js` | Calendario de asignaciones y eventos especiales |
| `src/views/recordatorio.js` | Recordatorio de discurso y su plantilla |
| `src/boot.js` | Arranque (a mano; los generadores no lo sobrescriben) |

`src/boot.js`, `src/views/contactos.js` y `src/components/views/ContactosView.jsx` se
mantienen a mano: los generadores de la migración no los sobrescriben.

### Marcado (componentes)

| Componente | Sección |
| --- | --- |
| `AppShell.jsx` | Compone todo en el orden exacto del DOM original |
| `Splash.jsx` | Pantalla de inicio |
| `Sidebar.jsx`, `SidebarBackdrop.jsx` | Barra lateral y fondo móvil |
| `TopNav.jsx`, `NavDropdown.jsx`, `MobileDrawer.jsx` | Navegación superior y menú móvil |
| `LoadingOverlay.jsx`, `FileInputs.jsx` | Carga y selectores de archivo |
| `views/DashboardView.jsx` | Todos los oradores |
| `views/MonthsView.jsx`, `views/RegToast.jsx` | Disponibilidad mensual y aviso de registro |
| `views/AguayoView.jsx` | Salidas |
| `views/VisitasView.jsx` | Visitas |
| `views/ContactosView.jsx` | Contactos (React: tarjetas JSX + store externo; no generado) |
| `views/BosquejosView.jsx` | Bosquejos |
| `views/EstadisticasView.jsx` | Estadísticas |
| `views/EditorView.jsx` | Editor |
| `views/CalendarioView.jsx`, `views/CalTooltip.jsx` | Calendario y tooltip |
| `modals/EventoModal.jsx`, `DiaDetalleModal.jsx` | Eventos y detalle del día |
| `modals/SpeakerModal.jsx` | Ficha de orador |
| `modals/SpeakerFormModal.jsx`, `BloqueoModal.jsx` | Formulario y bloqueo masivo |
| `modals/RecordatorioModal.jsx`, `PlantillaRecordatorioModal.jsx` | Recordatorio y plantilla |
| `Cropper.jsx`, `PhotoLightbox.jsx` | Recorte de foto y visor |

---

## Cómo se conecta el código (el puente `window`)

El script original era un único ámbito: todas las funciones y variables se veían entre sí.
Para dividirlo sin reescribirlo:

- `src/core/state.js` declara el estado compartido como `window.X = ...`.
- Cada módulo publica sus funciones al final con `Object.assign(window, { ... })`.
- Los módulos usan identificadores desnudos (`globalSpeakers`, `renderCards`); el navegador
  los resuelve contra `window`.
- `src/boot.js` importa los módulos en el orden en que se ejecutaban las sentencias
  originales. Ese orden importa: por ejemplo, `render-scheduler.js` debe evaluarse al final
  porque captura las versiones finales de `renderCards`, `renderAguayoView`, etc.

La vista de Contactos es la única sección convertida a React de verdad:
`ContactosView.jsx` se suscribe con `useSyncExternalStore` a
`src/core/contactos-store.js`. `renderContactosView()` sigue siendo el punto de entrada
global: calcula los datos con la misma lógica del original y publica un snapshot; ya no
escribe HTML.

Reglas al tocar estos archivos:

1. No declares `let`/`const` con el mismo nombre que un global dentro de un módulo:
   romperías el puente.
2. Si agregas una función que otra sección necesita, publícala con
   `Object.assign(window, { ... })`.
3. Si mueves código de un módulo a otro, revisa el orden de imports de `boot.js`.
4. `boot.js`, `contactos.js` y `ContactosView.jsx` se mantienen a mano; los generadores no
   los sobrescriben.

## Arranque

1. `app/layout.jsx` aplica el tema guardado antes de pintar (script inline en `<head>`) y
   carga las librerías CDN.
2. `AppShell` renderiza el mismo DOM del original (SSR), con un componente por sección.
3. `AppRuntime` (cliente) espera a que React hidrate y entonces:
   - `initThemeIcon()` sincroniza el icono del botón de tema;
   - `initSplash()` oculta la pantalla de inicio con los mismos tiempos (3,1 s, `display:none`
     0,7 s después y red de seguridad a 5 s); la animación es solo CSS;
   - `boot()` importa todos los módulos y arranca la lógica imperativa.

Nada de esto se evalúa en el servidor: los módulos usan `window`, `document` e IndexedDB.

## CSS

`styles/01-...` a `styles/18-...` se importan en orden desde `app/layout.jsx`, igual que
los bloques `<style>` del HTML. **No reordenar**: la cascada depende de ese orden.
Verificado: los 5 bloques originales (155.921 caracteres) están completos y en orden.

La animación del splash se concentra en `styles/15-design-v2.css` (entrada escalonada,
halo, logo y barra) y `styles/16-design-v3.css` (color de marca de la barra). Los tiempos
de cierre no cambiaron.

## Marcado

`src/components/AppShell.jsx` compone los 28 componentes en el mismo orden del DOM original.
Cada componente contiene su sección tal cual, con:

- `class` → `className`
- `style="..."` → objeto de estilo
- `onclick="foo()"` → `onClick={(event) => { foo() }}` (`this` → `event.currentTarget`)
- texto como `{"..."}` para conservar el espaciado

Para editar una sección, busca su componente en `src/components/views|modals|...` y su
lógica en `src/views/*.js`. La excepción es `ContactosView.jsx`: se edita a mano y las
tarjetas se generan con JSX desde el snapshot de `contactos-store.js`.

---

## Diferencias conocidas con el original

Todas son cosméticas o de infraestructura; no cambian lo que se ve ni lo que hace la app:

1. El HTML que algunas funciones generan por `innerHTML` sale con menos indentación (el
   código se desindentó 8 espacios al pasar a módulos). El texto y los datos son idénticos.
2. `<img id="photo-lightbox-img">` ya no lleva `src=""` (React lo omite). La app asigna
   `.src` igual que antes.
3. El CSP añade `ws: wss:` en `connect-src` para que funcione el recargado en caliente de
   `next dev`.
4. `initDarkMode` se dividió: la clase de `<html>` se aplica en el `<head>` (sin parpadeo) y
   el icono del botón se sincroniza después de hidratar. El resultado visual es el mismo.
5. Las tarjetas de Contactos las genera React: no llevan atributos inline
   `onclick`/`onmouseover` (React usa listeners delegados). El clic, el hover del botón PDF y
   el `stopPropagation` de los botones de foto/visor se comportan igual.
6. El splash conserva los tiempos y el mismo marcado, pero la animación es más rica
   (entrada escalonada, halo, palabra con desenfoque y brillo en la barra). Es solo CSS.

## Verificación realizada

- `npm run build` sin errores; `out/index.html` generado.
- DOM estático: 630 vs 635 elementos (los 5 extra son nodos de infraestructura de Next);
  etiquetas, atributos y texto: 1 diferencia, el `src=""` del lightbox que React omite.
- CSS: 5/5 bloques idénticos.
- Paridad funcional con el Excel real: 107 oradores, 8 asignaciones, 18 congregaciones;
  28 medidas → 26 exactas y 2 diferencias de indentación en el HTML generado
  (`calendario` y `modal`); el texto y los datos son idénticos.
- Contactos: 26/26 comprobaciones (18 tarjetas, subtítulo, filtro, sin coincidencias,
  limpiar, modal al clic, botón de foto sin abrir modal, actualización externa del store).
- Splash: 12 fotogramas entre 0 y 3,45 s, 19 animaciones, barra de 2 capas, halo y
  reduced-motion; cierre automático correcto y sin errores.
- Móvil (390×844 y 320×568): 0 desbordes en las 8 vistas, 107 tarjetas, búsqueda "a" → 103.
- `npm run dev`: arranca e hidrata sin errores de CSP.

Los únicos errores de consola son de Google Identity Services en modo headless
(`Failed to open popup window`), que también aparecen con el HTML original.

---

## Despliegue

### Servidor estático, .exe o Android

Sirve el contenido de `out/`. En el `.exe` actual (`server.js`), cambia la ruta `/` para que
entregue `out/index.html` y resuelve los archivos dentro de `out/`.

### Red local (Google Sheets)

El modo red sigue usando el proxy `/api/sheets/` de `start-network.js`. Para usarlo con la
versión Next:

1. compila (`npm run build`);
2. en `start-network.js`, apunta `PROJECT_DIR` a la carpeta `out/` y cambia
   `urlPath === '/' ? '/DISCURSAPP .html'` por `'/index.html'`.

El resto (login, token, proxy) no cambia.

### GitHub Pages (subruta)

Las rutas de Next son absolutas. Para publicar en `https://usuario.github.io/Discursapp/`:

```powershell
$env:NEXT_BASE_PATH="/Discursapp"; npm run build
```

`public/.nojekyll` ya está incluido para que GitHub sirva la carpeta `_next`.

---

## Vista Contactos (React)

`ContactosView.jsx` ya está convertida y sirve de patrón:

1. `src/views/contactos.js` conserva `renderContactosView()` como contrato global, pero en
   vez de escribir `innerHTML` calcula el snapshot (total, búsqueda y tarjetas) y llama a
   `publishContactos()`.
2. `src/core/contactos-store.js` guarda ese snapshot y notifica a los suscriptores.
3. `ContactosView.jsx` usa `useSyncExternalStore` para renderizar las tarjetas con JSX.
   El buscador sigue siendo no controlado, como el original, y llama al render con debounce.
4. El snapshot inicial (`ready: false`) reproduce el texto estático del SSR hasta el primer
   render real, para no romper la hidratación.

Para migrar otra sección:

1. elige una vista pequeña (`AguayoView`, por ejemplo);
2. mueve su render a un store/estado de React manteniendo la función global;
3. conserva las funciones que otras secciones usan (publícalas en `window`);
4. elimina el HTML generado por `innerHTML` solo cuando nadie más lo use;
5. agrega el componente y el módulo a las listas de omisión de `gen-jsx.js` y `gen-js.js`.

## Nota sobre seguridad

La migración no cambia el modelo de seguridad del original. Siguen vigentes las mismas
consideraciones: XSS almacenado en nombres/notas, proxy `/api/sheets/` sin lista blanca de
rutas, contraseña en texto plano y HTTP sin TLS en la red local. No se tocaron en esta
migración.
