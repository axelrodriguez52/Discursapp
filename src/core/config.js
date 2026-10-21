/* ==========================================================================
   Configuracion de la app (IDs de Google, scopes, modo red)
   Origen: DISCURSAPP .html, script principal (L3491-3799)
   ========================================================================== */
        // CONFIGURACIÓN DE CREDENCIALES
window.CLIENT_ID = '782848886897-5457vdnmfpt96nd8325i9emlp7nec2sd.apps.googleusercontent.com';

window.SPREADSHEET_ID = '1lVyVzpxY3oQibHABlbMRJq23oFbFFBpgibdx0qZ96sw';

window.SCOPE_READ = 'https://www.googleapis.com/auth/spreadsheets.readonly';

window.SCOPE_WRITE = 'https://www.googleapis.com/auth/spreadsheets';

window.DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

        // ── PROXY DE GOOGLE SHEETS PARA DISPOSITIVOS DE RED ──
        // Cuando la app se accede desde una IP de red (no localhost),
        // se redirigen todas las llamadas a Google Sheets a través del servidor.
window.IS_NETWORK_MODE = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname);
