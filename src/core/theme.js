/* ==========================================================================
   Tema claro/oscuro
   Origen: DISCURSAPP .html, bloque initDarkMode del script principal
   La clase de <html> se aplica desde un script inline en el <head> (antes de
   pintar). El icono del boton se sincroniza aqui, despues de hidratar.
   ========================================================================== */
export function initThemeIcon() {
  const isDark = document.documentElement.classList.contains('dark-mode');
  const btn = document.getElementById('dark-toggle');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}
