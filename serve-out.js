// Sirve la carpeta out/ (resultado de `npm run build`) sin dependencias.
// Uso: npm run preview   ->  http://localhost:8000
// No incluye el proxy de Google Sheets: para el modo red usa start-network.js.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8000;
const ROOT = path.join(__dirname, 'out');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.map': 'application/json',
};

if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
  console.error('No existe out/index.html. Ejecuta primero: npm run build');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = path.normalize(path.join(ROOT, urlPath));

  // evitar salir de la carpeta out/
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  if (urlPath === '/' || urlPath.endsWith('/')) filePath = path.join(filePath, 'index.html');
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) filePath += '.html';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 ' + urlPath);
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  DiscursApp (Next) en http://localhost:${PORT}`);
  console.log(`  Red local:            http://<tu-ip>:${PORT}\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') console.error(`El puerto ${PORT} está en uso. Usa PORT=8001 npm run preview`);
  else console.error(err);
  process.exit(1);
});
