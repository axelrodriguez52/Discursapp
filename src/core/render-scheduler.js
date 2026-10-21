/* ==========================================================================
   Agrupacion de renders (requestAnimationFrame + debounce)
   Origen: DISCURSAPP .html, script principal (L9656-9735)
   ========================================================================== */
function _flushRenders() {
    _rafId = null;
    const fns = [..._pendingRenders];
    _pendingRenders.clear();
    fns.forEach(fn => fn());
}

function batchRender(...fns) {
    fns.forEach(fn => _pendingRenders.add(fn));
    if (!_rafId) _rafId = requestAnimationFrame(_flushRenders);
}

// Crear referencias debounced DESPUÉS del parche para capturar las versiones correctas
const debouncedRenderCards = debounce(renderCards, 220);

const debouncedAguayo      = debounce(renderAguayoView, 220);

const debouncedRenderMonthView = debounce(renderMonthView, 220);

const debouncedRenderDispCongView = debounce(renderDispCongView, 220);

const debouncedRenderContactosView = debounce(renderContactosView, 220);

const debouncedRenderBosquejosView = debounce(renderBosquejosView, 220);

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  _flushRenders,
  batchRender,
  debouncedRenderCards,
  debouncedAguayo,
  debouncedRenderMonthView,
  debouncedRenderDispCongView,
  debouncedRenderContactosView,
  debouncedRenderBosquejosView,
});
