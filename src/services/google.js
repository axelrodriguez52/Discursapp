/* ==========================================================================
   Google Identity Services, gapi y token de escritura
   Origen: DISCURSAPP .html, script principal (L3669-3918)
   ========================================================================== */
// INICIALIZACIÓN DE ENTORNO GOOGLE CLOUD
function iniciarGapi() {
    gapi.load('client', async () => {
        try {
            await gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });
            gapiIniciado = true;
            verificarLibreriasListas();
        } catch (err) {
            console.error("Error inicializando GAPI:", err);
        }
    });
}

// ── PERSISTENCIA DE TOKEN OAUTH ──────────────────────────────
const TOKEN_KEY = 'circ16_gtoken';

function guardarToken(tokenResponse) {
    const expira = Date.now() + (tokenResponse.expires_in - 60) * 1000; // 1 min de margen
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify({
        access_token: tokenResponse.access_token,
        expira
    }));
}

function cargarTokenGuardado() {
    try {
        const raw = sessionStorage.getItem(TOKEN_KEY);
        if (!raw) return null;
        const t = JSON.parse(raw);
        if (Date.now() < t.expira) return t.access_token;
    } catch(e) { console.warn('Error leyendo token de sessionStorage:', e); }
    return null;
}

function borrarTokenGuardado() {
    sessionStorage.removeItem(TOKEN_KEY);
}

function aplicarTokenAGapi(token) {
    gapi.client.setToken({ access_token: token });
    document.getElementById('status-dot').className = 'sync-dot';
    document.getElementById('status-text').innerText = 'Conectado a Google';
    document.getElementById('memory-badge').innerText = 'Nube Activa (Google Sheet)';
    document.getElementById('btn-google-login').textContent = '✓ Sincronizado';
    const mob = document.getElementById('btn-google-login-mob');
    if (mob) mob.textContent = '✓ Sincronizado';
}

// ─────────────────────────────────────────────────────────────

function iniciarGisi() {
    if (!CLIENT_ID) return; // esperar a que estén las credenciales
    try {
        // Token de LECTURA — se usa para sincronizar datos
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPE_READ,
            callback: async (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                    guardarToken(tokenResponse);
                    aplicarTokenAGapi(tokenResponse.access_token);
                    await cargarDesdeGoogleSheets();
                }
            },
        });
        gisiIniciado = true;
        verificarLibreriasListas();
    } catch (err) {
        console.error("Error inicializando GIS:", err);
    }
}

// Solicita scope de ESCRITURA solo cuando se va a registrar
function solicitarTokenEscritura(onSuccess) {
    if (IS_NETWORK_MODE) { hasWriteToken = true; onSuccess(); return; }
    if (!CLIENT_ID) { mostrarToast('⚠️ Configura las credenciales primero.', 'error'); return; }
    if (!tokenClientWrite) {
        tokenClientWrite = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPE_WRITE,
            callback: (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                    gapi.client.setToken({ access_token: tokenResponse.access_token });
                    hasWriteToken = true;
                    onSuccess();
                } else {
                    mostrarToast('❌ No se obtuvo permiso de escritura.', 'error');
                }
            },
        });
    }
    tokenClientWrite.requestAccessToken({ prompt: '' });
}

function verificarLibreriasListas() {
    if (!gapiIniciado || !gisiIniciado) return;
    document.getElementById('btn-google-login').disabled = false;
    const mob = document.getElementById('btn-google-login-mob');
    if (mob) mob.disabled = false;

    // Intentar restaurar sesión automáticamente
    const tokenGuardado = cargarTokenGuardado();
    if (tokenGuardado) {
        aplicarTokenAGapi(tokenGuardado);
        fetch('/api/google/token', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: tokenGuardado, expires_in: 3600 })
        }).then(r => r.json()).then(d => console.log('[Proxy] Token restaurado enviado al servidor:', d)).catch(() => {});
        document.getElementById('status-text').innerText = 'Restaurando sesión...';
        cargarDesdeGoogleSheets().catch(() => {
            // Si falla (token expirado), pedir nuevo token silenciosamente
            borrarTokenGuardado();
            tokenClient.requestAccessToken({ prompt: '' });
        });
    } else {
        // Intentar token silencioso si el usuario ya autorizó antes
        document.getElementById('status-text').innerText = 'Listo para conectar';
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

function solicitarAccesoGoogle() {
    if (tokenClient) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    }
}

// En AMBOS modos, enviar token al servidor para que iPad/Android puedan usar el proxy
const _origGuardarTokenRelay = guardarToken;

guardarToken = function(tokenResponse) {
    _origGuardarTokenRelay(tokenResponse);
    fetch('/api/google/token', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: tokenResponse.access_token, expires_in: tokenResponse.expires_in })
    }).then(r => r.json()).then(d => console.log('[Proxy] Token enviado al servidor:', d)).catch(e => console.error('[Proxy] Error enviando token:', e));
};

if (IS_NETWORK_MODE) {
    console.log('[Red] Modo red detectado — Google Sheets se Proxeará por el servidor');

    async function proxySheetsCall(method, apiPath, body) {
        const resp = await fetch('/api/sheets/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method, path: apiPath, body })
        });
        const data = await resp.json();
        if (!data.ok) {
            const errMsg = data.error || 'Proxy error del servidor';
            if (errMsg.includes('No hay token')) {
                mostrarToast('⚠️ Espera: la PC debe conectar Google primero.', 'error');
            }
            throw { status: data.status || 500, result: { error: { message: errMsg } } };
        }
        if (data.status >= 400) {
            throw { status: data.status, result: data.result || { error: { message: 'Error de Google API: ' + data.status } } };
        }
        return { result: data.result, status: data.status };
    }

    function installSheetsProxy() {
        if (!gapi?.client?.sheets?.spreadsheets) return false;

        gapi.client.sheets.spreadsheets.get = async function(args) {
            const sid = args.spreadsheetId || args.resource?.spreadsheetId || SPREADSHEET_ID;
            return proxySheetsCall('GET', '/v4/spreadsheets/' + sid);
        };

        gapi.client.sheets.spreadsheets.values.get = async function(args) {
            const sid = args.spreadsheetId || SPREADSHEET_ID;
            const range = encodeURIComponent(args.range || '');
            let url = '/v4/spreadsheets/' + sid + '/values/' + range + '?valueRenderOption=' + (args.valueRenderOption || 'FORMATTED_VALUE');
            if (args.majorDimension) url += '&majorDimension=' + args.majorDimension;
            return proxySheetsCall('GET', url);
        };

        gapi.client.sheets.spreadsheets.values.batchGet = async function(args) {
            const sid = args.spreadsheetId || SPREADSHEET_ID;
            let url = '/v4/spreadsheets/' + sid + '/values:batchGet?valueRenderOption=' + (args.valueRenderOption || 'FORMATTED_VALUE');
            if (args.ranges) {
                args.ranges.forEach(r => { url += '&ranges=' + encodeURIComponent(r); });
            }
            return proxySheetsCall('GET', url);
        };

        gapi.client.sheets.spreadsheets.values.update = async function(args) {
            const sid = args.spreadsheetId || SPREADSHEET_ID;
            const range = encodeURIComponent(args.range || '');
            const url = '/v4/spreadsheets/' + sid + '/values/' + range + '?valueInputOption=' + (args.valueInputOption || 'RAW');
            return proxySheetsCall('PUT', url, args.resource || args.body);
        };

        gapi.client.sheets.spreadsheets.values.batchUpdate = async function(args) {
            const sid = args.spreadsheetId || SPREADSHEET_ID;
            const url = '/v4/spreadsheets/' + sid + '/values:batchUpdate';
            return proxySheetsCall('POST', url, args.resource || args.body);
        };

        gapi.client.sheets.spreadsheets.values.append = async function(args) {
            const sid = args.spreadsheetId || SPREADSHEET_ID;
            const range = encodeURIComponent(args.range || '');
            const url = '/v4/spreadsheets/' + sid + '/values/' + range + ':append?valueInputOption=' + (args.valueInputOption || 'RAW') + '&insertDataOption=' + (args.insertDataOption || 'INSERT_ROWS');
            return proxySheetsCall('POST', url, args.resource || args.body);
        };

        gapi.client.sheets.spreadsheets.values.batchClear = async function(args) {
            const sid = args.spreadsheetId || SPREADSHEET_ID;
            const url = '/v4/spreadsheets/' + sid + '/values:batchClear';
            return proxySheetsCall('POST', url, args.resource || args.body);
        };

        gapi.client.sheets.spreadsheets.batchUpdate = async function(args) {
            const sid = args.spreadsheetId || SPREADSHEET_ID;
            const url = '/v4/spreadsheets/' + sid + ':batchUpdate';
            return proxySheetsCall('POST', url, args.resource || args.body);
        };

        const _origGetToken = gapi.client.getToken.bind(gapi.client);
        gapi.client.getToken = function() {
            return { access_token: 'network-proxy-token', token_type: 'Bearer' };
        };

        console.log('[Red] Proxy de Google Sheets instalado');
        return true;
    }

    const _origCheckLib = verificarLibreriasListas;
    verificarLibreriasListas = function() {
        if (gapiIniciado && gisiIniciado) {
            installSheetsProxy();
            hasWriteToken = true;
            document.getElementById('btn-google-login').disabled = false;
            document.getElementById('status-text').innerText = 'Conectado (modo red)';
            document.getElementById('status-dot').className = 'sync-dot';
            document.getElementById('memory-badge').innerText = 'Red Local (proxy del servidor)';
            document.getElementById('btn-google-login').textContent = '✓ Modo Red';
            const mob = document.getElementById('btn-google-login-mob');
            if (mob) { mob.disabled = false; mob.textContent = '✓ Modo Red'; }
            cargarDesdeGoogleSheets();
        }
    };
}

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  iniciarGapi,
  TOKEN_KEY,
  guardarToken,
  cargarTokenGuardado,
  borrarTokenGuardado,
  aplicarTokenAGapi,
  iniciarGisi,
  solicitarTokenEscritura,
  verificarLibreriasListas,
  solicitarAccesoGoogle,
  _origGuardarTokenRelay,
});
