// ── Hojas de estilo ───────────────────────────────────────────────────────────
// El orden reproduce exactamente el orden de los <style> del HTML original.
// No reordenar: la cascada depende de este orden.
import '@/styles/01-base.css';
import '@/styles/02-sidebar.css';
import '@/styles/03-layout.css';
import '@/styles/04-dashboard.css';
import '@/styles/05-editor-contactos.css';
import '@/styles/06-bosquejos.css';
import '@/styles/07-responsive.css';
import '@/styles/08-estadisticas.css';
import '@/styles/09-registro.css';
import '@/styles/10-overlays.css';
import '@/styles/11-accesibilidad.css';
import '@/styles/12-cropper-foto.css';
import '@/styles/13-calendario.css';
import '@/styles/14-dia-detalle.css';
import '@/styles/15-design-v2.css';
import '@/styles/16-design-v3.css';
import '@/styles/17-recordatorio.css';
import '@/styles/18-design-v4.css';
import '@/app/overrides.css';

export const metadata = {
  title: 'DiscursApp - Circuito 16',
  description: 'Gestión de discursos — Circuito 16',
  manifest: 'manifest.json',
  icons: {
    icon: [
      { url: 'discursapp.ico', type: 'image/x-icon' },
      { url: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: 'apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'DiscursApp',
    statusBarStyle: 'default',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0071e3',
};

// Tema inicial: se ejecuta antes de pintar para que no haya parpadeo claro/oscuro.
// Solo toca la clase de <html> (el icono del boton se actualiza despues de hidratar
// para que React no detecte un cambio de texto inesperado).
const THEME_INIT = `(function () {
  try {
    var saved = localStorage.getItem('discursapp_darkMode');
    if (saved === '1') {
      document.documentElement.classList.add('dark-mode');
    } else if (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark-mode');
    }
  } catch (e) {}
})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Misma politica de seguridad que el HTML original */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src https: http: ws: wss:; frame-ancestors 'self';"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* Mismas librerias y mismo orden que el HTML original: las cuatro primeras
            eran bloqueantes y las de Google async/defer (la app las espera con polling). */}
        <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" />
        <script src="https://accounts.google.com/gsi/client" async defer />
        <script src="https://apis.google.com/js/api.js" async defer />

        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
