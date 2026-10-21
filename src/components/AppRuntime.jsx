'use client';

import { useEffect } from 'react';

/**
 * Arranca la logica imperativa de la app despues de que React haya montado el
 * marcado. Los modulos se importan de forma dinamica para que nunca se evalúen
 * durante el render del servidor (usan window, document e IndexedDB).
 */
export default function AppRuntime() {
  useEffect(() => {
    let alive = true;

    (async () => {
      const theme = await import('@/src/core/theme.js');
      if (!alive) return;
      theme.initThemeIcon();

      const splash = await import('@/src/core/splash.js');
      if (!alive) return;
      splash.initSplash();

      const { boot } = await import('@/src/boot.js');
      if (!alive) return;
      boot();
    })();

    return () => { alive = false; };
  }, []);

  return null;
}
