/* ==========================================================================
   Pantalla de inicio
   Origen: DISCURSAPP .html, ultimo <script> del documento
   Se ejecuta al montar la app y oculta el overlay con el mismo tiempo que el
   original (3.1 s desde la carga, 5 s como red de seguridad, o al hacer clic).
   ========================================================================== */
export function initSplash() {
  const el = document.getElementById('app-splash');
  if (!el) return;
  let done = false;

  function close() {
    if (done) return;
    done = true;
    el.classList.add('hide');
    // Se oculta en lugar de quitarse del DOM: el nodo pertenece a React y eliminarlo
    // por fuera podria romper una re-renderizacion (Fast Refresh en desarrollo).
    setTimeout(function () { el.style.display = 'none'; }, 700);
  }

  const t0 = Date.now();
  function later() { setTimeout(close, Math.max(0, 3100 - (Date.now() - t0))); }

  if (document.readyState === 'complete') later();
  else window.addEventListener('load', later);

  setTimeout(close, 5000);
  el.addEventListener('click', close);
}
