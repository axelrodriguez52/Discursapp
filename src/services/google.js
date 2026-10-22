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
            registrarDiagnosticoSync({ ok: false, phase: 'gapi-init', error: mensajeErrorSync(err) });
            const st = document.getElementById('status-text');
            if (st) st.innerText = 'Error al cargar Google';
            mostrarToast('❌ No se pudo cargar la librería de Google. Revisa tu conexión y recarga la app.', 'error');
        }
    });
}

// ── DIAGNÓSTICO DE SINCRONIZACIÓN ────────────────────────────
// Guarda un resumen pequeño del último intento en localStorage para poder
// revisar qué pasó (oradores, asignaciones, error) sin abrir la consola.
function registrarDiagnosticoSync(data = {}) {
    try {
        let anterior = {};
        try { anterior = JSON.parse(localStorage.getItem('discursapp_last_sync') || '{}') || {}; } catch (e) { anterior = {}; }
        const limpio = { ...anterior, ...data, time: new Date().toISOString() };
        if (limpio.error) limpio.error = String(limpio.error).slice(0, 400);
        localStorage.setItem('discursapp_last_sync', JSON.stringify(limpio));
    } catch (e) { /* almacenamiento no disponible */ }
}

function mensajeErrorSync(err) {
    const api = err?.result?.error?.message || err?.error?.message || '';
    const status = err?.status || err?.result?.error?.code || '';
    const base = api || err?._userMessage || err?.message || String(err || 'Error desconocido');
    return (status ? '(' + status + ') ' : '') + base;
}

// Espera a que gapi tenga cargada la API de Sheets (puede tardar unos segundos
// después de iniciar sesión, sobre todo en móviles o conexiones lentas).
async function esperarGapiListo(timeoutMs = 15000) {
    const inicio = Date.now();
    while (Date.now() - inicio < timeoutMs) {
        if (gapi?.client?.sheets?.spreadsheets?.values?.get) return true;
        await new Promise(r => setTimeout(r, 250));
    }
    throw new Error('La librería de Google aún no está lista. Espera unos segundos y vuelve a intentar.');
}

// Evita mostrar errores de los intentos silenciosos de token (prompt: '').
let _gisSilenciosoHasta = 0;
function _marcarSolicitudSilenciosa(ms = 8000) { _gisSilenciosoHasta = Date.now() + ms; }

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
    // No mostrar "Sincronizado" hasta que los datos estén realmente cargados.
    document.getElementById('btn-google-login').textContent = '⏳ Sincronizando…';
    const mob = document.getElementById('btn-google-login-mob');
    if (mob) mob.textContent = '⏳ Sincronizando…';
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
                if (!tokenResponse || !tokenResponse.access_token) {
                    const msg = tokenResponse?.error || 'No se obtuvo el token de Google.';
                    registrarDiagnosticoSync({ ok: false, phase: 'token', error: 'oauth: ' + msg });
                    mostrarToast('❌ Google: ' + msg, 'error');
                    return;
                }
                try {
                    guardarToken(tokenResponse);
                    aplicarTokenAGapi(tokenResponse.access_token);
                    registrarDiagnosticoSync({ ok: false, pending: true, phase: 'token-obtenido', scope: tokenResponse.scope || '', error: '' });
                    await esperarGapiListo(15000);
                    await cargarDesdeGoogleSheets();
                } catch (err) {
                    console.error('Error al sincronizar tras el inicio de sesión:', err);
                    registrarDiagnosticoSync({ ok: false, pending: false, phase: 'sync', error: mensajeErrorSync(err) });
                    mostrarToast('❌ No se pudieron cargar los datos: ' + mensajeErrorSync(err), 'error');
                    const st = document.getElementById('status-text');
                    if (st) st.innerText = 'Error — reconectar';
                    const dot = document.getElementById('status-dot');
                    if (dot) dot.className = 'sync-dot offline';
                    const btn = document.getElementById('btn-google-login');
                    if (btn) btn.textContent = '🔄 Reintentar sincronización';
                    const mob = document.getElementById('btn-google-login-mob');
                    if (mob) mob.textContent = '🔄 Reintentar';
                }
            },
            error_callback: (err) => {
                console.warn('Google Identity Services:', err);
                if (Date.now() < _gisSilenciosoHasta) return;
                const msg = err?.type || 'No se pudo completar el inicio de sesión con Google.';
                registrarDiagnosticoSync({ ok: false, phase: 'gis', error: msg });
                mostrarToast('❌ Google: ' + msg, 'error');
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
            error_callback: (err) => {
                console.warn('Google Identity Services (escritura):', err);
                mostrarToast('❌ Google: ' + (err?.type || 'No se pudo autorizar la escritura.'), 'error');
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
        cargarDesdeGoogleSheets().catch((err) => {
            // Si falla (token expirado), pedir nuevo token silenciosamente
            registrarDiagnosticoSync({ ok: false, phase: 'restaurar', error: mensajeErrorSync(err) });
            borrarTokenGuardado();
            if (tokenClient) {
                _marcarSolicitudSilenciosa();
                tokenClient.requestAccessToken({ prompt: '' });
            }
        });
    } else {
        // Intentar token silencioso si el usuario ya autorizó antes
        document.getElementById('status-text').innerText = 'Listo para conectar';
        if (tokenClient) {
            _marcarSolicitudSilenciosa();
            tokenClient.requestAccessToken({ prompt: '' });
        }
    }
}

function solicitarAccesoGoogle() {
    if (!tokenClient) {
        mostrarToast('⚠️ Google todavía se está cargando. Espera un momento y vuelve a intentar.', 'error');
        return;
    }
    _gisSilenciosoHasta = 0;
    tokenClient.requestAccessToken({ prompt: 'consent' });
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
  registrarDiagnosticoSync,
  mensajeErrorSync,
  esperarGapiListo,
});
