import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

// Para publicar en una subruta (por ejemplo GitHub Pages: /Discursapp) compilar con
//   NEXT_BASE_PATH=/Discursapp npm run build
// Sin esa variable la app se sirve desde la raiz del dominio, como hasta ahora.
const basePath = process.env.NEXT_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exportacion estatica: la app sigue siendo un conjunto de archivos que se puede
  // abrir desde un servidor simple, empaquetar en .exe o incluir en un WebView Android.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // El arranque de la app es imperativo y se ejecuta una sola vez; StrictMode
  // duplicaria los efectos en desarrollo.
  reactStrictMode: false,
  // Evita que Turbopack tome como raiz una carpeta superior (aviso de package-lock.json).
  turbopack: { root },
  // En desarrollo se puede abrir la app como 127.0.0.1 o localhost.
  allowedDevOrigins: ['127.0.0.1'],
  // No generar AGENTS.md en cada `next dev`.
  agentRules: false,
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
