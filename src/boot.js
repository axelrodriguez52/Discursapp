/* ==========================================================================
   Arranque de la app
   Origen: DISCURSAPP .html, script principal (L3485-10958)

   El script original se ejecutaba al final del <body>. Aqui se ejecuta una sola
   vez desde un useEffect, cuando el DOM ya esta montado. El orden de los imports
   reproduce el orden de las sentencias del script original.
   ========================================================================== */

import '@/src/core/config.js';
import '@/src/core/animations.js';
import '@/src/core/state.js';
import '@/src/core/caches.js';
import '@/src/core/storage.js';
import '@/src/core/utils.js';
import '@/src/core/files.js';
import '@/src/ui/toast.js';
import '@/src/ui/navigation.js';
import '@/src/services/google.js';
import '@/src/services/sheets.js';
import '@/src/services/excel.js';
import '@/src/services/pdf.js';
import '@/src/services/print.js';
import '@/src/services/export.js';
import '@/src/views/editor.js';
import '@/src/views/bosquejos.js';
import '@/src/views/contactos.js';
import '@/src/ui/photos.js';
import '@/src/views/dashboard.js';
import '@/src/views/months.js';
import '@/src/views/aguayo.js';
import '@/src/views/visitas.js';
import '@/src/views/estadisticas.js';
import '@/src/views/calendar.js';
import '@/src/views/recordatorio.js';
import '@/src/ui/speaker-modal.js';
import '@/src/core/render-scheduler.js';

let _started = false;

export function boot() {
  if (_started) return;
  _started = true;

  // ═══ GSAP ═══════════════════════════════════════════════════════════
  G.init();

  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
  }

  // ── Listeners de los inputs de archivo ──────────────────────────────
  document.getElementById('file-input').addEventListener('change', e => handleFileSelect(e, 'excel'));
  document.getElementById('pdf-input').addEventListener('change',  e => handleFileSelect(e, 'pdf'));

  document.getElementById('cards-container').addEventListener('click', e => {
      const card = e.target.closest('.speaker-card:not(.theme-card)'); if (card) { if (typeof G !== 'undefined') G.cardClick(card); return openModal(card.dataset.nombre, card.dataset.cong); }
      const item = e.target.closest('.theme-speaker-item'); if (item) { if (typeof G !== 'undefined') G.cardClick(item); openModal(item.dataset.nombre, item.dataset.cong); }
  });

  document.getElementById('cards-container')?.addEventListener('mouseenter', e => { if (typeof G !== 'undefined') { const c = e.target.closest('.speaker-card:not(.theme-card)'); if (c) G.cardHover(c, true); } }, true);

  document.getElementById('cards-container')?.addEventListener('mouseleave', e => { if (typeof G !== 'undefined') { const c = e.target.closest('.speaker-card:not(.theme-card)'); if (c) G.cardHover(c, false); } }, true);

  document.getElementById('contactos-grid')?.addEventListener('click', e => {
      const card = e.target.closest('.contact-card'); if (card && typeof G !== 'undefined') G.cardClick(card);
  });

  document.getElementById('contactos-grid')?.addEventListener('mouseenter', e => { if (typeof G !== 'undefined') { const c = e.target.closest('.contact-card'); if (c) G.cardHover(c, true); } }, true);

  document.getElementById('contactos-grid')?.addEventListener('mouseleave', e => { if (typeof G !== 'undefined') { const c = e.target.closest('.contact-card'); if (c) G.cardHover(c, false); } }, true);

  document.getElementById('month-table-body').addEventListener('click', e => { const row = e.target.closest('[data-nombre]'); if (row) openModal(row.dataset.nombre, row.dataset.cong); });

  if (IS_NETWORK_MODE) console.log('[Red] Modo red activado para:', location.hostname);

  // Cerrar menú al hacer clic fuera
  document.addEventListener('click', function(e) {
      const btn = document.getElementById('nav-menu-btn');
      const dropdown = document.getElementById('nav-dropdown');
      if (btn && dropdown && !btn.contains(e.target) && !dropdown.contains(e.target)) {
          closeNavMenu();
      }
  });

  // Cerrar lightbox con Escape
  document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') { closeLightbox(); closeCropper(); }
  });

  // Reemplazar el listener del search principal por versión con debounce
  document.getElementById('search-input').removeEventListener('input', debouncedRenderCards);
  document.getElementById('search-input').addEventListener('input', debouncedRenderCards);

  // Refrescar calendario si está activo después de cargar datos
  // (el switchTab ya llama renderCalendario cuando la pestaña está activa)

  // ACTIVACIÓN AUTOMÁTICA AL CARGAR LA VENTANA
  function activarAlCargar() {
      // Recuperar asignaciones guardadas localmente si no hay datos en memoria
      const localAsigs = cargarAsignacionesLocal();
      if (localAsigs.length > 0 && (!allAssignments || allAssignments.length === 0)) {
          allAssignments = Array.from(new Map(localAsigs.map(a => [a.nombre + '|' + a.destino + '|' + a.fecha + '|' + a.temaNum, a])).values());
          renderCalendario();
      }
      function intentarIniciar() {
          const gapiListo   = typeof gapi !== 'undefined';
          const googleListo = typeof google !== 'undefined' && google.accounts;
          if (gapiListo && !gapiIniciado) iniciarGapi();
          if (googleListo && !gisiIniciado) iniciarGisi();
          if (!gapiIniciado || !gisiIniciado) setTimeout(intentarIniciar, 300);
      }
      intentarIniciar();
  }

  // En el HTML original esto colgaba de window.onload. Al montar React el evento
  // load puede haberse disparado ya, asi que se comprueba el estado del documento.
  if (document.readyState === 'complete') activarAlCargar();
  else window.addEventListener('load', activarAlCargar);

  // Capturar errores no manejados
  window.onerror = function(msg, url, line, col, error) {
      console.error('Error no manejado:', msg, 'en', url, 'línea', line, error);
      return false;
  };
  window.addEventListener('unhandledrejection', function(e) {
      console.error('Promesa rechazada sin handler:', e.reason);
  });
}
