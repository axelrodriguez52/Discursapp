/* ==========================================================================
   Lectura y escritura en Google Sheets
   Origen: DISCURSAPP .html, script principal (L3541-10238)
   ========================================================================== */
// ── Retry helper para errores transitorios de Google API ──
async function retryGapiCall(fn, maxRetries = 3) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            const status = err?.status || err?.result?.error?.code || 0;
            const isTransient = [409, 429, 500, 502, 503, 504].includes(status);
            if (isTransient && attempt < maxRetries) {
                const delay = Math.min(500 * Math.pow(2, attempt), 5000);
                console.warn(`retryGapiCall: intento ${attempt + 1}/${maxRetries} falló (${status}), reintentando en ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            // Token expirado: intentar refrescar una vez
            if (status === 401 && attempt === 0) {
                console.warn('retryGapiCall: 401 token expirado, intentando refrescar...');
                try {
                    await new Promise((resolve, reject) => {
                        solicitarTokenEscritura(() => resolve());
                        setTimeout(() => reject(new Error('Timeout al refrescar token')), 8000);
                    });
                    continue;
                } catch (tkErr) {
                    console.error('retryGapiCall: no se pudo refrescar token:', tkErr);
                    err._userMessage = 'Sesión expirada. Conecta Google Sheets nuevamente.';
                    err.message = err._userMessage;
                }
            }
            throw err;
        }
    }
}

// CONTROLADOR DE EXTRACCIÓN SÍNCRONA DE LA HOJA MAESTRA
async function cargarDesdeGoogleSheets() {
    if (_isSyncing) return;
    _isSyncing = true;
    try {
        document.getElementById('status-text').innerText = 'Sincronizando hojas...';
        showLoading('Conectando con Google Sheets...');
        
        // 1. Descubrir la estructura de pestañas del documento original
        const metadata = await retryGapiCall(() => gapi.client.sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID }));
        const sheets = metadata.result.sheets;

        globalSpeakers = []; allAssignments = []; registeredCongs.clear(); destinationCongs.clear();

        // 2. Preparar ranges: contactos + todas las hojas de congregación (TODO en UNA sola llamada)
        const hojaContactos = sheets.find(s => normalizeStr(s.properties.title) === 'contactos');
        const sheetTitles = sheets
            .filter(s => s?.properties?.title)
            .map(s => s.properties.title.toString().trim())
            .filter(t => t && !['Formato Master', 'Contactos', 'MÁSTER', 'Master'].includes(t));

        // Registrar hojas y sheetIds inmediatamente
        for (const sheet of sheets) {
            if (!sheet?.properties?.title) continue;
            const t = sheet.properties.title.toString().trim();
            if (t && !['Formato Master', 'Contactos', 'MÁSTER', 'Master'].includes(t)) {
                registeredCongs.add(t);
                sheetIdMap[t] = sheet.properties.sheetId;
            }
        }

        // Un solo batchGet para TODO: contactos + todas las hojas
        const allRanges = [];
        if (hojaContactos) allRanges.push(`'${sanitizeSheetName(hojaContactos.properties.title)}'!A1:H100`);
        sheetTitles.forEach(t => allRanges.push(`'${sanitizeSheetName(t)}'!A1:N300`));

        if (allRanges.length > 0) {
            const batchResp = await retryGapiCall(() => gapi.client.sheets.spreadsheets.values.batchGet({
                spreadsheetId: SPREADSHEET_ID,
                ranges: allRanges,
                valueRenderOption: 'UNFORMATTED_VALUE'
            }));
            const valueRanges = batchResp.result.valueRanges || [];
            let rangeIdx = 0;

            // Procesar contactos (primer range si existe)
            if (hojaContactos && valueRanges.length > 0) {
                const filasContactos = valueRanges[rangeIdx++]?.values;
                if (filasContactos && filasContactos.length > 0) {
                    const cabecera = filasContactos[0].map(c => normalizeStr(c));
                    const idxCong = cabecera.findIndex(c => c.includes('congregac'));
                    const idxNom  = cabecera.findIndex(c => c.includes('nombre') || c.includes('encargado') || c.includes('contacto'));
                    const idxTel  = cabecera.findIndex(c => c.includes('tel'));
                    const idxDia  = cabecera.findIndex(c => c.startsWith('dia') || c.includes('reunion') || c.includes('reuni'));
                    const idxHora = cabecera.findIndex(c => c.startsWith('hora'));
                    const idxHor  = cabecera.findIndex(c => c.includes('horario'));

                    for (let i = 1; i < filasContactos.length; i++) {
                        try {
                            const fila = filasContactos[i] || [];
                            const name = idxCong >= 0 ? safeStr(fila[idxCong], '') : safeStr(fila[0], '');
                            if (!name) continue;
                            const key = normalizeStr(name);
                            let horario = '—';
                            if (idxHor >= 0 && !celdaVacia(fila[idxHor])) {
                                horario = safeStr(fila[idxHor], '—');
                            } else {
                                const partes = [
                                    idxDia  >= 0 ? safeStr(fila[idxDia],  '') : '',
                                    idxHora >= 0 ? safeStr(fila[idxHora], '') : ''
                                ].filter(v => v && v !== '—');
                                if (partes.length) horario = partes.join(' ');
                            }
                            contactsMap[key] = {
                                displayName: name,
                                encargado:   idxNom >= 0 ? safeStr(fila[idxNom], 'No definido') : 'No definido',
                                telefono:    idxTel >= 0 ? safeStr(fila[idxTel], '—') : '—',
                                horario
                            };
                        } catch (rowErr) {
                            console.warn(`Contactos GSheets: error en fila ${i}:`, rowErr);
                        }
                    }
                }
            }

            // Procesar hojas de congregación (ranges restantes)
            for (let i = 0; i < sheetTitles.length; i++) {
                try {
                    const matrizFilas = valueRanges[rangeIdx++]?.values;
                    if (Array.isArray(matrizFilas) && matrizFilas.length > 0) {
                        parseBlockSheet(matrizFilas, sheetTitles[i]);
                    }
                } catch (sheetErr) {
                    console.warn(`cargarDesdeGoogleSheets: error parseando hoja "${sheetTitles[i]}":`, sheetErr);
                }
            }
        }

        // 4. Deduplicar globalSpeakers por nombre+congregación
        globalSpeakers = Array.from(new Map(globalSpeakers.map(s => [s.nombre + '|' + s.congregacion, s])).values());
        // Deduplicar allAssignments por nombre+destino+fecha+tema
        allAssignments = Array.from(new Map(allAssignments.map(a => [a.nombre + '|' + a.destino + '|' + a.fecha + '|' + a.temaNum, a])).values());
        _cacheDirty = true;

        // 5. Repoblar y refrescar componentes relacionales de la UI
document.getElementById('aguayo-origin-selector').innerHTML = '<option value="TODOS">— Todos los orígenes —</option>' + Array.from(registeredCongs).sort().map(c => `<option value="${escHtml(c)}">${escHtml(c)}</option>`).join('');
        document.getElementById('aguayo-dest-selector').innerHTML = '<option value="TODOS">— Todos los destinos —</option>' + Array.from(destinationCongs).sort().map(d => `<option value="${escHtml(d)}">${escHtml(d)}</option>`).join('');
        document.getElementById('visitas-cong-selector').innerHTML = '<option value="">— Seleccione Congregación —</option>' + Array.from(destinationCongs).sort().map(d => `<option value="${escHtml(d)}">${escHtml(d)}</option>`).join('');
        poblarCalCongFilter();
        poblarMatrizCongSelector();

        document.getElementById('status-text').innerText = 'Sincronizado ✓';
        try { guardarAsignacionesLocal(allAssignments); } catch (e) { console.error('No se pudieron guardar las asignaciones localmente:', e); }
        const btnOk = document.getElementById('btn-google-login');
        if (btnOk) btnOk.textContent = '✓ Sincronizado';
        const mobOk = document.getElementById('btn-google-login-mob');
        if (mobOk) mobOk.textContent = '✓ Sincronizado';
        registrarDiagnosticoSync({ ok: true, pending: false, phase: 'ok', speakers: globalSpeakers.length, assignments: allAssignments.length, contacts: Object.keys(contactsMap || {}).length, sheets: sheetTitles.length, error: '' });
        mostrarToast(`✓ Google Sheets: ${globalSpeakers.length} oradores, ${allAssignments.length} asignaciones`, 'success');
        batchRender(renderEstadisticasDashboard, renderCards);
        // Inicializar wizard de registro si la pestaña está activa
        inicializarWizardSiActivo();
        if (document.getElementById('view-editor').classList.contains('active')) renderEditorView();

    } catch (err) {
        console.error("Error al leer datos de Google Sheets:", err);
        document.getElementById('status-dot').className = 'sync-dot offline';
        document.getElementById('status-text').innerText = 'Error — reconectar';
        const btnErr = document.getElementById('btn-google-login');
        if (btnErr) btnErr.textContent = '🔄 Reintentar sincronización';
        const mobErr = document.getElementById('btn-google-login-mob');
        if (mobErr) mobErr.textContent = '🔄 Reintentar';
        registrarDiagnosticoSync({ ok: false, pending: false, phase: 'sheets', error: mensajeErrorSync(err) });
        mostrarToast('❌ No se pudieron cargar los datos: ' + mensajeErrorSync(err), 'error');
        borrarTokenGuardado();
        throw err; // re-lanzar para que verificarLibreriasListas pueda manejarlo
    } finally {
        _isSyncing = false;
        hideLoading();
    }
}

// ── Localiza el bloque exacto del discursante leyendo la hoja en tiempo real ──
// Devuelve { anchorRow } (1-based, fila donde A="Nombre") o null si no se encuentra.
async function localizarBloqueDiscursante(sp) {
    const resp = await retryGapiCall(() => gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${sanitizeSheetName(sp.congregacion)}'!A1:N1000`,
        valueRenderOption: 'UNFORMATTED_VALUE'
    }));
    const rows = resp.result.values || [];
    const nNombre = normalizeStr(sp.nombre);

    // Intentar primero la posición original guardada
    const candidatas = [];
    if (sp._anchorRow) candidatas.push(sp._anchorRow - 1); // índice 0-based de la fila "Nombre"

    for (let i = 0; i < rows.length; i++) {
        const colA = ((rows[i] || [])[0] || '').toString().trim();
        if (colA.toLowerCase() === 'nombre') {
            const nombreSig = ((rows[i+1] || [])[0] || '').toString().trim();
            if (normalizeStr(nombreSig) === nNombre) candidatas.push(i);
        }
    }

    if (!candidatas.length) return null;
    // Preferir la candidata cuyo nombre coincide exactamente
    for (const idx of candidatas) {
        const nombreSig = ((rows[idx+1] || [])[0] || '').toString().trim();
        if (normalizeStr(nombreSig) === nNombre) return { anchorRow: idx + 1, rows };
    }
    return null;
}

// ── Actualizar un discursante existente ──
async function actualizarBloqueDiscursante(sp, datos) {
    const loc = await localizarBloqueDiscursante(sp);
    if (!loc) throw new Error(`No se encontró el bloque de "${sp.nombre}" en la hoja "${sp.congregacion}".`);
    await escribirBloqueDiscursante(sp.congregacion, loc.anchorRow, datos);
}

// ── Escribe los datos del discursante directamente en el bloque indicado por anchorRow ──
async function escribirBloqueDiscursante(hoja, A, datos, soloVacios = false) {
    hoja = sanitizeSheetName(hoja);
    let data = [];

    if (soloVacios) {
        const resp = await retryGapiCall(() => gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `'${hoja}'!A${A}:N${A+12}`,
            valueRenderOption: 'UNFORMATTED_VALUE'
        }));
        const rows = resp.result.values || [];
        const get = (r, c) => { const row = rows[r]; return row ? (row[c] ?? '') : ''; };
        const isEmpty = v => v === null || v === undefined || v.toString().trim() === '' || v.toString().trim() === '—';

        if (isEmpty(get(0, 0)) && datos.nombre) data.push({ range: `'${hoja}'!A${A+1}`, values: [[datos.nombre]] });
        if (isEmpty(get(0, 1)) && datos.rol) data.push({ range: `'${hoja}'!B${A+1}`, values: [[datos.rol]] });
        if (isEmpty(get(2, 0)) && datos.telefono) data.push({ range: `'${hoja}'!A${A+3}`, values: [[datos.telefono]] });
        if (isEmpty(get(5, 0)) && datos.email) data.push({ range: `'${hoja}'!A${A+6}`, values: [[datos.email]] });
        if (isEmpty(get(7, 0)) && datos.notas) data.push({ range: `'${hoja}'!A${A+8}`, values: [[datos.notas]] });
        for (let i = 0; i < 7; i++) {
            const valC = datos.temas[i], valE = datos.temas[i+7];
            if (isEmpty(get(i, 2)) && valC !== '' && valC !== undefined) data.push({ range: `'${hoja}'!C${A+i}`, values: [[valC]] });
            if (isEmpty(get(i, 4)) && valE !== '' && valE !== undefined) data.push({ range: `'${hoja}'!E${A+i}`, values: [[valE]] });
        }
        for (let i = 0; i < 12; i++) {
            const val = datos.disponibilidad[MESES[i]] || '';
            if (isEmpty(get(i, 7)) && val) data.push({ range: `'${hoja}'!H${A+i}`, values: [[val]] });
        }
    } else {
        data.push({ range: `'${hoja}'!A${A+1}`, values: [[datos.nombre]] });
        data.push({ range: `'${hoja}'!B${A+1}`, values: [[datos.rol]] });
        data.push({ range: `'${hoja}'!A${A+3}`, values: [[datos.telefono || '']] });
        data.push({ range: `'${hoja}'!A${A+6}`, values: [[datos.email || '']] });
        data.push({ range: `'${hoja}'!A${A+8}`, values: [[datos.notas || '']] });
        for (let i = 0; i < 7; i++) {
            const valC = datos.temas[i], valE = datos.temas[i+7];
            const cVacio = (valC === '' || valC === undefined);
            const eVacio = (valE === '' || valE === undefined);
            data.push({ range: `'${hoja}'!C${A+i}`, values: [[cVacio ? '' : valC]] });
            data.push({ range: `'${hoja}'!E${A+i}`, values: [[eVacio ? '' : valE]] });
            if (cVacio) data.push({ range: `'${hoja}'!D${A+i}`, values: [['']] });
            if (eVacio) data.push({ range: `'${hoja}'!F${A+i}`, values: [['']] });
        }
        for (let i = 0; i < 12; i++) {
            data.push({ range: `'${hoja}'!H${A+i}`, values: [[datos.disponibilidad[MESES[i]] || '']] });
        }
    }

    if (data.length === 0) return;

    await retryGapiCall(() => gapi.client.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: { valueInputOption: 'RAW', data }
    }));
}

// ── Eliminar (vaciar) un discursante: limpia los datos del bloque sin alterar filas/formato ──
async function eliminarDiscursante(idx) {
    const sp = globalSpeakers[idx];
    if (!sp) return;

    const token = gapi?.client?.getToken?.()?.access_token;
    if (!token) { mostrarToast('⚠️ Conecta Google Sheets antes de eliminar.', 'error'); return; }
    if (!hasWriteToken) {
        mostrarToast('🔑 Solicitando permiso de escritura…', 'success');
        solicitarTokenEscritura(() => eliminarDiscursante(idx));
        return;
    }

    try {
        const loc = await localizarBloqueDiscursante(sp);
        if (!loc) throw new Error(`No se encontró el bloque de "${sp.nombre}".`);
        const A = loc.anchorRow;
        const hoja = sanitizeSheetName(sp.congregacion);

        // Limpiar TODO el bloque: columnas A–N, 14 filas (A a A+13)
        // Cubre: nombre, rol, bosquejos, contacto, email, notas, disponibilidad, asignación
        const emptyRows = [];
        for (let r = 0; r < 14; r++) {
            emptyRows.push(new Array(14).fill(''));
        }
        await retryGapiCall(() => gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `'${hoja}'!A${A}:N${A + 13}`,
            valueInputOption: 'RAW',
            resource: { values: emptyRows }
        }));

        mostrarToast(`✓ "${sp.nombre}" fue eliminado de ${sp.congregacion}.`, 'success');
        await cargarDesdeGoogleSheets();
        renderEditorView();
    } catch (err) {
        console.error('Error al eliminar discursante:', err);
        mostrarToast('❌ Error al eliminar: ' + (err.result?.error?.message || err.message || 'Verifica la conexión.'), 'error');
    }
}

// ── Crear un nuevo discursante: duplica el último bloque (formato/merges) y llena los datos ──
async function crearBloqueDiscursante(congName, datos) {
    const sheetId = sheetIdMap[congName];
    if (sheetId === undefined) throw new Error(`No se encontró el ID de la hoja "${congName}".`);

    // 1. Leer la hoja completa para determinar dónde termina el último bloque
    const resp = await retryGapiCall(() => gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${sanitizeSheetName(congName)}'!A1:N2000`,
        valueRenderOption: 'UNFORMATTED_VALUE'
    }));
    const rows = resp.result.values || [];

    // Encontrar el último anchor ("Nombre" en columna A)
    let lastAnchor = -1;
    for (let i = 0; i < rows.length; i++) {
        const colA = ((rows[i] || [])[0] || '').toString().trim();
        if (colA.toLowerCase() === 'nombre') lastAnchor = i;
    }
    if (lastAnchor < 0) throw new Error(`No se encontró ningún bloque de discursante en "${congName}" para usar como plantilla.`);

    // El bloque de plantilla ocupa BLOCK_SIZE filas a partir de lastAnchor (0-based)
    const srcStart = lastAnchor;
    const srcEnd = lastAnchor + BLOCK_SIZE; // exclusivo
    const destStart = srcEnd;
    const destEnd = destStart + BLOCK_SIZE;

    // 2. Insertar BLOCK_SIZE filas nuevas después del último bloque (mantiene formato siguiente)
    //    y copiar el formato/estructura del último bloque a las filas nuevas.
    await retryGapiCall(() => gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
            requests: [
                {
                    insertDimension: {
                        range: { sheetId, dimension: 'ROWS', startIndex: destStart, endIndex: destEnd },
                        inheritFromBefore: false
                    }
                },
                {
                    copyPaste: {
                        source: { sheetId, startRowIndex: srcStart, endRowIndex: srcEnd, startColumnIndex: 0, endColumnIndex: 14 },
                        destination: { sheetId, startRowIndex: destStart, endRowIndex: destEnd, startColumnIndex: 0, endColumnIndex: 14 },
                        pasteType: 'PASTE_NORMAL'
                    }
                }
            ]
        }
    }));

    // 3. El nuevo anchor ("Nombre") está en la misma posición relativa que el de origen
    const newAnchorRow = destStart + 1; // 1-based, fila "Nombre" del nuevo bloque

    // 4. Limpiar valores residuales copiados (asignación previa, bosquejos del bloque clonado)
    //    y luego escribir los datos del nuevo discursante
    await escribirBloqueDiscursante(congName, newAnchorRow, datos, true);

    // 5. Limpiar también la asignación copiada (col I-N) por si el bloque plantilla tenía una
    const A = newAnchorRow;
    await retryGapiCall(() => gapi.client.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
            valueInputOption: 'RAW',
            data: ['I','J','K','L','M','N'].map(col => ({ range: `'${sanitizeSheetName(congName)}'!${col}${A+7}`, values: [['']] }))
        }
    }));
}

// ── Progreso de sincronización Google Sheets ───────────────────
// Patch cargarDesdeGoogleSheets para mostrar progreso por hoja
const _origCargar = cargarDesdeGoogleSheets;

cargarDesdeGoogleSheets = async function() {
    // La función original ya tiene toda la lógica; hacemos un wrapper
    // que inyecta actualizaciones de progreso en status-text.
    // Como no podemos parchear el loop interno fácilmente, usamos
    // un proxy en gapi.client.sheets.spreadsheets.values.get
    if (!gapi?.client?.sheets?.spreadsheets?.values?.get || !gapi?.client?.sheets?.spreadsheets?.get) {
        const err = new Error('La librería de Google aún no está lista. Espera unos segundos y vuelve a intentar.');
        console.error('cargarDesdeGoogleSheets:', err.message);
        registrarDiagnosticoSync({ ok: false, phase: 'gapi-no-listo', error: err.message });
        const st = document.getElementById('status-text');
        if (st) st.innerText = 'Error — reintentar';
        const dot = document.getElementById('status-dot');
        if (dot) dot.className = 'sync-dot offline';
        const btn = document.getElementById('btn-google-login');
        if (btn) btn.textContent = '🔄 Reintentar sincronización';
        const mob = document.getElementById('btn-google-login-mob');
        if (mob) mob.textContent = '🔄 Reintentar';
        mostrarToast('⚠️ ' + err.message, 'error');
        throw err;
    }
    let sheetCount = 0;
    let totalSheets = 0;
    const origGet = gapi.client.sheets.spreadsheets.values.get.bind(gapi.client.sheets.spreadsheets.values);
    const origMeta = gapi.client.sheets.spreadsheets.get.bind(gapi.client.sheets.spreadsheets);

    gapi.client.sheets.spreadsheets.get = async (...args) => {
        const res = await origMeta(...args);
        totalSheets = (res.result.sheets || []).length;
        sheetCount = 0;
        return res;
    };
    gapi.client.sheets.spreadsheets.values.get = async (...args) => {
        sheetCount++;
        if (totalSheets > 0) {
            document.getElementById('status-text').innerText = `Cargando hoja ${sheetCount} de ${totalSheets}…`;
        }
        const res = await origGet(...args);
        return res;
    };

    try {
        await _origCargar();
    } finally {
        // Restaurar originales
        gapi.client.sheets.spreadsheets.values.get = origGet;
        gapi.client.sheets.spreadsheets.get = origMeta;
    }
};

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  retryGapiCall,
  cargarDesdeGoogleSheets,
  localizarBloqueDiscursante,
  actualizarBloqueDiscursante,
  escribirBloqueDiscursante,
  eliminarDiscursante,
  crearBloqueDiscursante,
  _origCargar,
});
