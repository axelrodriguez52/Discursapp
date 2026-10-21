/* ==========================================================================
   Persistencia: IndexedDB y localStorage
   Origen: DISCURSAPP .html, script principal (L3577-10342)
   ========================================================================== */
const dbRequest = indexedDB.open("Circuito16Storage", 3);

dbRequest.onupgradeneeded = e => {
    const db2 = e.target.result;
    if (!db2.objectStoreNames.contains("files"))  db2.createObjectStore("files");
    if (!db2.objectStoreNames.contains("photos")) db2.createObjectStore("photos");
};

dbRequest.onerror = e => { console.error('Error abriendo IndexedDB:', e.target.error); };

dbRequest.onsuccess = e => {
    db = e.target.result;
    // Restaurar la plantilla del recordatorio desde IndexedDB (respaldo si localStorage está vacío)
    try {
        const txT = db.transaction(["files"], "readonly");
        const reqT = txT.objectStore("files").get("recordatorioPlantilla");
        reqT.onsuccess = ev => { if (ev.target.result) recPlantillaDesdeIDB = ev.target.result; };
        reqT.onerror = () => {};
    } catch(e) {}
    // Cargar bosquejos bloqueados — primero localStorage como respaldo rápido
    try {
        const lsBk = localStorage.getItem('discursapp_blockedThemes');
        if (lsBk) blockedThemes = JSON.parse(lsBk);
    } catch(e) { console.warn('Error parsing blockedThemes from localStorage:', e); }
    // Cargar fotos desde IndexedDB (fuente primaria)
    function cargarFotosYArchivos() {
        try {
            const txF = db.transaction(["files"], "readonly");
            const reqBT = txF.objectStore("files").get("blockedThemes");
            reqBT.onsuccess = ev => {
                if (ev.target.result) {
                    try { blockedThemes = JSON.parse(ev.target.result); } catch(e) { console.warn('Error parsing blockedThemes from IDB:', e); }
                }
                loadSavedFiles();
            };
            reqBT.onerror = () => loadSavedFiles();
        } catch(e) {
            loadSavedFiles();
        }
    }
    // Primero cargar fotos del store "photos"
    try {
        const txP = db.transaction(["photos"], "readonly");
        const store = txP.objectStore("photos");
        // Iterar con cursor para obtener key+value
        const cursor_req = store.openCursor();
        const photosTmp = {};
        cursor_req.onsuccess = ev => {
            const cursor = ev.target.result;
            if (cursor) {
                photosTmp[cursor.key] = cursor.value;
                cursor.continue();
            } else {
                // Cursor terminó — todas las fotos cargadas
                if (Object.keys(photosTmp).length > 0) {
                    speakerPhotos = photosTmp;
                } else {
                    // Migrar desde localStorage si existen fotos allí
                    try {
                        const lsPhotos = localStorage.getItem('discursapp_speaker_photos');
                        if (lsPhotos) {
                            const parsed = JSON.parse(lsPhotos);
                            speakerPhotos = parsed;
                            // Migrar a IndexedDB y limpiar localStorage
                            _migratePhotosToIDB(parsed);
                            localStorage.removeItem('discursapp_speaker_photos');
                        }
                    } catch(err) {}
                }
                cargarFotosYArchivos();
            }
        };
        cursor_req.onerror = () => cargarFotosYArchivos();
    } catch(e) {
        cargarFotosYArchivos();
    }
};

async function clearStorage() {
    if (!(await showConfirm('Borrar memoria', '¿Limpiar almacenamiento interno? Esto eliminará todos los archivos guardados.', { okLabel: 'Borrar' }))) return;
    if (db) {
        db.transaction(["files"], "readwrite").objectStore("files").clear();
        try { db.transaction(["photos"], "readwrite").objectStore("photos").clear(); } catch(e) { console.warn('Error limpiando store de fotos:', e); }
    }
    location.reload();
}

function cargarEventos() {
    try { return JSON.parse(localStorage.getItem(EVENTOS_KEY) || '[]'); }
    catch(e) { return []; }
}

function guardarEventos(arr) {
    try { localStorage.setItem(EVENTOS_KEY, JSON.stringify(arr)); } catch(e) { console.warn('Error guardando eventos en localStorage:', e); }
}

// ── Persistencia local de asignaciones ──────────────────────────
// Las asignaciones vienen de Google Sheets (allAssignments) pero
// también guardamos una copia local para que el calendario muestre
// datos aunque no haya conexión a Sheets.
function guardarAsignacionesLocal(asigs) {
    try { localStorage.setItem(ASIGNACIONES_KEY, JSON.stringify(asigs)); } catch(e) { console.warn('Error guardando asignaciones en localStorage:', e); }
}

function cargarAsignacionesLocal() {
    try { return JSON.parse(localStorage.getItem(ASIGNACIONES_KEY) || '[]'); }
    catch(e) { return []; }
}

// Sincronizar allAssignments con localStorage cuando se cargan de Sheets
function sincronizarAsignacionesLocal() {
    if (allAssignments && allAssignments.length > 0) {
        guardarAsignacionesLocal(allAssignments);
    } else {
        // Si allAssignments está vacío, intentar recuperar del localStorage
        const local = cargarAsignacionesLocal();
        if (local.length > 0 && (!allAssignments || allAssignments.length === 0)) {
            allAssignments = Array.from(new Map(local.map(a => [a.nombre + '|' + a.destino + '|' + a.fecha + '|' + a.temaNum, a])).values());
        }
    }
}

function genEventoId() { return 'ev_' + Date.now() + '_' + Math.random().toString(36).slice(2,6); }

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  dbRequest,
  clearStorage,
  cargarEventos,
  guardarEventos,
  guardarAsignacionesLocal,
  cargarAsignacionesLocal,
  sincronizarAsignacionesLocal,
  genEventoId,
});
