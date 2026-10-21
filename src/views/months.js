/* ==========================================================================
   Disponibilidad por mes: tabla, wizard de registro y preseleccion
   Origen: DISCURSAPP .html, script principal (L7991-10284)
   ========================================================================== */
// ── FIN SINCRONIZACIÓN ─────────────────────────────────────────

// Sincronizan el selector superior de mes con el del panel
function onMesChange() {
    const val = document.getElementById('month-selector').value;
    document.getElementById('reg-mes').value = val;
    onRegMesChange();
    renderMonthView();
}

function toggleRegistroPanel() {
    const body  = document.getElementById('registro-panel-body');
    const arrow = document.getElementById('registro-panel-arrow');
    const open  = !body.classList.contains('collapsed');
    body.classList.toggle('collapsed');
    arrow.style.transform = open ? 'rotate(-90deg)' : 'rotate(0deg)';
}

// PASO 1 → 2: cambio de mes
function onRegMesChange() {
    const mes = document.getElementById('reg-mes').value;
    // Sincronizar selector superior
    document.getElementById('month-selector').value = mes;
    regState = { mes, discursante: null, tema: '', cong: '', fecha: '' };
    poblarDiscursantesDelMes(mes);
    resetDesdeDiscursante();
    actualizarSteps();
}

function poblarDiscursantesDelMes(mes) {
    const sel = document.getElementById('reg-discursante');
    const unique = Array.from(new Map(globalSpeakers.map(s => [s.nombre + s.congregacion, s])).values());
    const libres = unique.filter(s =>
        s.disponibilidad[mes] === 'disponible' &&
        !allAssignments.some(a =>
            normalizeStr(a.nombre) === normalizeStr(s.nombre) &&
            a.fecha.toLowerCase().includes(mes.substring(0,3).toLowerCase())
        )
    ).sort((a,b) => a.nombre.localeCompare(b.nombre));

    if (!libres.length) {
        sel.innerHTML = '<option value="">— Sin oradores disponibles este mes —</option>';
    } else {
        sel.innerHTML = '<option value="">— Selecciona un orador —</option>' +
            libres.map(s => `<option value="${escHtml(s.nombre)}|${escHtml(s.congregacion)}">${escHtml(s.nombre)} (${escHtml(s.congregacion)})</option>`).join('');
    }
}

// PASO 2 → 3: cambio de discursante
function onRegDiscursanteChange() {
    const val = document.getElementById('reg-discursante').value;
    regState.discursante = null; regState.tema = '';
    resetDesdeDiscursante();
    if (!val) { actualizarSteps(); return; }
    const [nombre, cong] = val.split('|');
    const sp = globalSpeakers.find(s => s.nombre === nombre && s.congregacion === cong)
            || globalSpeakers.find(s => normalizeStr(s.nombre) === normalizeStr(nombre) && normalizeStr(s.congregacion) === normalizeStr(cong));
    if (!sp) { actualizarSteps(); return; }
    regState.discursante = sp;
    renderRegTemas(sp);
    actualizarSteps();
}

function renderRegTemas(sp) {
    const grid = document.getElementById('reg-temas-grid');
    grid.classList.remove('disabled');
    if (!sp.temas.length) {
        grid.innerHTML = '<span class="reg-temas-empty">Este orador no tiene bosquejos registrados.</span>';
        return;
    }
    grid.innerHTML = sp.temas.map(t => {
        const mesSel = document.getElementById('reg-mes').value;
        // Bloquear solo si está bloqueado PARA EL MES SELECCIONADO (meses anteriores al fromMonth siguen libres)
        const bl = isThemeBlockedForMonth(t, mesSel);
        const isBlockedAnywhere = isThemeBlockedAtAll(t);
        const binfo = blockedThemes[t.toString()];
        const tooltipBlocked = bl
            ? `🔴 No disponible en ${mesSel}${binfo?.fromMonth && binfo.fromMonth !== 'TODOS' ? ` (bloqueado desde ${binfo.fromMonth})` : ''}`
            : (isBlockedAnywhere && binfo?.fromMonth
                ? `✓ Disponible en ${mesSel} (bloqueado desde ${binfo.fromMonth})`
                : `#${t}${themesMap[t] ? ' — ' + themesMap[t].substring(0,40) + (themesMap[t].length > 40 ? '…' : '') : ''}`);
        return `<button class="reg-tema-btn ${bl ? 'blocked' : ''}" data-tema="${escHtml(t)}" onclick="${bl ? '' : `selectRegTema('${escHtml(t)}')`}" title="${escHtml(tooltipBlocked)}">#${t}${bl ? ' 🔴' : (isBlockedAnywhere ? ' ⚠️' : '')}</button>`;
    }).join('');
}

// PASO 3: selección de bosquejo
function selectRegTema(t) {
    regState.tema = t;
    document.querySelectorAll('.reg-tema-btn').forEach(b => b.classList.toggle('selected', b.dataset.tema === t));
    // Habilitar paso 4
    const selCong = document.getElementById('reg-cong');
    selCong.disabled = false;
    if (selCong.options.length <= 1) {
        poblarCongsDestino();
    }
    // Auto-seleccionar la congregación matriz como destino
    if (matrizCong) {
        selCong.value = matrizCong;
    }
    actualizarSteps();
    checkRegistroReady();
}

function poblarCongsDestino() {
    const sel = document.getElementById('reg-cong');
    const todas = Array.from(registeredCongs).sort();
    sel.innerHTML = '<option value="">— Selecciona congregación —</option>' +
        todas.map(c => `<option value="${escHtml(c)}">${escHtml(c)}</option>`).join('');
}

// PASO 4+5: verificar que todo esté listo
function checkRegistroReady() {
    const mes   = document.getElementById('reg-mes').value;
    const disc  = document.getElementById('reg-discursante').value;
    const tema  = regState.tema;
    const cong  = document.getElementById('reg-cong').value;
    const fecha = document.getElementById('reg-fecha').value;

    regState.mes   = mes;
    regState.cong  = cong;
    regState.fecha = fecha;

    // Habilitar fecha cuando hay congregación
    const dateInput = document.getElementById('reg-fecha');
    if (cong && dateInput.disabled) {
        dateInput.disabled = false;
        // Pre-filtrar fechas al mes seleccionado
        setFechaLimitsMes(mes);
    }

    const listo = mes && disc && tema && cong && fecha;
    const btn   = document.getElementById('btn-registrar');
    btn.disabled = !listo;
    const btnPs = document.getElementById('btn-add-preselect');
    if (btnPs) btnPs.disabled = !listo || preselectBatchRunning;

    // Mostrar / actualizar resumen
    const sumEl = document.getElementById('reg-summary');
    if (listo) {
        document.getElementById('rs-mes').textContent = mes;
        document.getElementById('rs-discursante').textContent = regState.discursante?.nombre || '—';
        document.getElementById('rs-tema').textContent = `#${tema}${themesMap[tema] ? ' — ' + themesMap[tema].substring(0,35) + (themesMap[tema].length > 35 ? '…' : '') : ''}`;
        document.getElementById('rs-cong').textContent = cong;
        document.getElementById('rs-fecha').textContent = formatFechaDisplay(fecha);
        sumEl.classList.add('visible');
    } else {
        sumEl.classList.remove('visible');
    }

    // Advertencia si Google Sheets no está conectado
    const gapiConectado = gapi?.client?.getToken?.()?.access_token;
    document.getElementById('reg-cloud-warn').style.display = (listo && !gapiConectado) ? 'inline' : 'none';

    actualizarSteps();
}

function setFechaLimitsMes(mes) {
    const mIdx = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].indexOf(mes);
    if (mIdx < 0) return;
    const anio = new Date().getFullYear(); // 2026
    const primerDia = new Date(anio, mIdx, 1);
    const ultimoDia = new Date(anio, mIdx + 1, 0);
    const pad = n => String(n).padStart(2,'0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const inp = document.getElementById('reg-fecha');
    inp.min = fmt(primerDia);
    inp.max = fmt(ultimoDia);
}

function formatFechaDisplay(iso) {
    if (!iso) return '—';
    const [y,m,d] = iso.split('-').map(Number);
    const fecha = new Date(y, m-1, d);
    return fecha.toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

function resetDesdeDiscursante() {
    regState.tema = ''; regState.cong = ''; regState.fecha = '';
    const grid = document.getElementById('reg-temas-grid');
    grid.classList.add('disabled');
    grid.innerHTML = '<span class="reg-temas-empty">Selecciona un discursante para ver sus bosquejos.</span>';
    const selCong = document.getElementById('reg-cong');
    selCong.disabled = true;
    selCong.innerHTML = '<option value="">— Selecciona un bosquejo primero —</option>';
    const dateInput = document.getElementById('reg-fecha');
    dateInput.disabled = true;
    dateInput.value = '';
    document.getElementById('btn-registrar').disabled = true;
    const btnPs = document.getElementById('btn-add-preselect');
    if (btnPs) btnPs.disabled = true;
    document.getElementById('reg-summary').classList.remove('visible');
}

// Actualiza los indicadores visuales de pasos
function actualizarSteps() {
    const mes   = document.getElementById('reg-mes').value;
    const disc  = document.getElementById('reg-discursante').value;
    const tema  = regState.tema;
    const cong  = document.getElementById('reg-cong').value;
    const fecha = document.getElementById('reg-fecha').value;
    const steps = [
        { id: 'step-ind-1', ok: !!mes },
        { id: 'step-ind-2', ok: !!disc },
        { id: 'step-ind-3', ok: !!tema },
        { id: 'step-ind-4', ok: !!cong },
        { id: 'step-ind-5', ok: !!fecha },
    ];
    let primeroPendiente = -1;
    steps.forEach(({ id, ok }, i) => {
        const el = document.getElementById(id);
        if (ok) {
            el.classList.add('done'); el.classList.remove('active');
        } else {
            el.classList.remove('done');
            if (primeroPendiente < 0) { el.classList.add('active'); primeroPendiente = i; }
            else el.classList.remove('active');
        }
    });
}

// ── ESCRITURA SEGURA EN GOOGLE SHEETS ──────────────────────────
// REGLAS DE SEGURIDAD APLICADAS:
//   • Lee la fila destino ANTES de escribir
//   • Si cualquiera de las 3 celdas (I, J, L) ya tiene dato → CANCELA
//   • Verifica que la fila pertenece al bloque correcto (orador + mes)
//   • Usa SOLO RAW como valueInputOption para nunca disparar fórmulas
//   • Escribe exactamente 3 celdas, nada más
//   • Nunca modifica columnas A-H ni M-N (encabezados, disponibilidad, fórmulas)

async function ejecutarRegistro() {
    if (_isSaving) return;
    const btn = document.getElementById('btn-registrar');
    const { mes, discursante, tema, cong, fecha } = regState;
    if (!mes || !discursante || !tema || !cong || !fecha) return;

    // — Si no tenemos token de escritura, solicitarlo primero —
    const token = gapi?.client?.getToken?.()?.access_token;
    const esReadOnly = !hasWriteToken;
    if (!token) {
        mostrarToast('⚠️ Conecta Google Sheets antes de registrar.', 'error');
        return;
    }
    if (esReadOnly) {
        mostrarToast('🔑 Solicitando permiso de escritura…', 'success');
        solicitarTokenEscritura(() => ejecutarRegistro());
        return;
    }

    btn.disabled = true;
    btn.classList.add('loading');
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 1s linear infinite"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Verificando…`;

    try {
        const hojaName = sanitizeSheetName(discursante.congregacion);

        // ── PASO 1: Leer la hoja completa (solo lectura, sin modificar nada) ──
        const respLectura = await retryGapiCall(() => gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `'${hojaName}'!A1:N300`,
            valueRenderOption: 'UNFORMATTED_VALUE'
        }));
        const rows = respLectura.result.values || [];

        // ── PASO 2: Localizar la fila del mes con verificación estricta ──
        const resultado = localizarFilaMes(rows, discursante.nombre, mes);

        // El resultado incluye el número de fila Y las celdas actuales I, J, L
        if (!resultado) {
            mostrarToast(`⚠️ No se encontró la fila "${mes}" para ${discursante.nombre}. Operación cancelada.`, 'error');
            return;
        }

        const { fila: rowNum, celdaI, celdaJ, celdaL } = resultado;

        // ── PASO 3: GUARDIA ANTI-SOBREESCRITURA ──
        // Si CUALQUIERA de las 3 celdas ya tiene un valor real, cancelar la operación
        const celdaIOcupada = !celdaVacia(celdaI);
        const celdaJOcupada = !celdaVacia(celdaJ);
        const celdaLOcupada = !celdaVacia(celdaL);

        if (celdaIOcupada || celdaJOcupada || celdaLOcupada) {
            const detalle = [
                celdaIOcupada ? `Congregación: "${celdaI}"` : null,
                celdaJOcupada ? `Bosquejo: "${celdaJ}"` : null,
                celdaLOcupada ? `Fecha: "${celdaL}"` : null
            ].filter(Boolean).join(' | ');
            mostrarToast(`🚫 Ya existe una asignación en ${mes} para ${discursante.nombre}. Datos actuales → ${detalle}`, 'error');
            return;
        }

        // ── PASO 4: Convertir fecha a serial numérico de Excel/Sheets ──
        const [y, mo, d] = fecha.split('-').map(Number);
        const fechaSerial = fechaToExcelSerial(y, mo, d);

        // ── PASO 5: Escribir SOLO las 3 celdas correctas ──
        // valueInputOption: 'RAW' → los valores se guardan tal cual, sin interpretar
        // fórmulas ni disparar efectos secundarios en otras celdas.
        _isSaving = true;
        btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 1s linear infinite"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Guardando…`;

        await retryGapiCall(() => gapi.client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: {
                valueInputOption: 'RAW',
                data: [
                    { range: `'${hojaName}'!I${rowNum}`, values: [[cong]] },
                    { range: `'${hojaName}'!J${rowNum}`, values: [[parseInt(tema, 10)]] },
                    { range: `'${hojaName}'!L${rowNum}`, values: [[fechaSerial]] }
                ]
            }
        }));

        // ── PASO 6: Actualizar estado local (solo lectura local, sin re-parsear la hoja) ──
        const fechaFormateada = formatFechaDisplay(fecha) + ' de ' + mes;
        allAssignments.push({
            nombre: discursante.nombre,
            origen: discursante.congregacion,
            destino: cong,
            fecha: fechaFormateada,
            hora: contactsMap[normalizeStr(cong)]?.horario || '—',
            temaNum: parseInt(tema, 10).toString(),
            mes: mes
        });
        _cacheDirty = true;
        _conflictosCache = null;
        destinationCongs.add(cong);
        const spLocal = globalSpeakers.find(s =>
            normalizeStr(s.nombre) === normalizeStr(discursante.nombre) &&
            normalizeStr(s.congregacion) === normalizeStr(discursante.congregacion)
        );
        if (spLocal) spLocal.disponibilidad[mes] = 'asignado';

        // ── PASO 7: Refrescar UI sin recargar página ──
        batchRender(renderMonthView, renderDispCongView);
        poblarDiscursantesDelMes(mes);
        resetDesdeDiscursante();
        document.getElementById('reg-discursante').value = '';
        actualizarSteps();

        mostrarToast(`✓ Registrado: ${discursante.nombre} → ${cong} | #${tema} | ${formatFechaDisplay(fecha)}`, 'success');

    } catch (err) {
        console.error('Error al registrar en Sheets:', err);
        mostrarToast('❌ Error al guardar: ' + (err.result?.error?.message || err.message || 'Verifica la conexión.'), 'error');
    } finally {
        _isSaving = false;
        btn.disabled = false;
        btn.classList.remove('loading');
        btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Registrar en Google Sheets`;
        checkRegistroReady();
    }
}

// ══════════════════════════════════════════════════
//  PRE-SELECCIÓN — Registro masivo de oradores
// ══════════════════════════════════════════════════
function agregarAPreSeleccion() {
    if (preselectBatchRunning) return;
    const { mes, discursante, tema, cong, fecha } = regState;
    if (!mes || !discursante || !tema || !cong || !fecha) return;

    // Evitar duplicados exactos
    const dup = preseleccion.find(p =>
        p.discursante.nombre === discursante.nombre &&
        p.discursante.congregacion === discursante.congregacion &&
        p.mes === mes && p.tema === tema && p.cong === cong && p.fecha === fecha
    );
    if (dup) { mostrarToast('⚠️ Este orador ya está en la pre-selección con los mismos datos.', 'error'); return; }

    preseleccion.push({ mes, discursante: { ...discursante }, tema, cong, fecha });
    renderPreseleccion();
    mostrarToast(`✓ ${discursante.nombre} agregado a pre-selección (${preseleccion.length})`, 'success');

    // Reset form for next speaker
    resetDesdeDiscursante();
    document.getElementById('reg-discursante').value = '';
    actualizarSteps();
}

function eliminarDePreseleccion(idx) {
    preseleccion.splice(idx, 1);
    renderPreseleccion();
}

async function limpiarPreseleccion() {
    if (preselectBatchRunning) return;
    if (preseleccion.length && !(await showConfirm('Limpiar pre-selección', '¿Vaciar toda la lista de pre-selección?'))) return;
    preseleccion = [];
    renderPreseleccion();
}

function renderPreseleccion() {
    const panel = document.getElementById('preselect-panel');
    const list = document.getElementById('preselect-list');
    const countBadge = document.getElementById('preselect-count');
    const regCount = document.getElementById('preselect-reg-count');
    const btnReg = document.getElementById('btn-preselect-register');

    if (!preseleccion.length) {
        panel.style.display = 'none';
        return;
    }
    panel.style.display = '';
    countBadge.textContent = preseleccion.length;
    regCount.textContent = preseleccion.length;
    btnReg.disabled = preselectBatchRunning;

    list.innerHTML = preseleccion.map((p, i) => `
        <div class="preselect-item">
            <span style="flex-shrink:0;">${getPhotoMini(p.discursante.nombre, p.discursante.congregacion)}</span>
            <div class="preselect-item-info">
                <div class="preselect-item-name">${escHtml(p.discursante.nombre)}</div>
                <div class="preselect-item-detail">${escHtml(p.mes)} → #${escHtml(p.tema)} → ${escHtml(p.cong)} | ${formatFechaDisplay(p.fecha)}</div>
            </div>
            <button class="preselect-item-remove" onclick="eliminarDePreseleccion(${i})" title="Quitar">✕</button>
        </div>
    `).join('');
}

async function ejecutarPreseleccion() {
    if (!preseleccion.length || preselectBatchRunning) return;

    const token = gapi?.client?.getToken?.()?.access_token;
    if (!token) { mostrarToast('⚠️ Conecta Google Sheets antes de registrar.', 'error'); return; }
    if (!hasWriteToken) {
        mostrarToast('🔑 Solicitando permiso de escritura…', 'success');
        solicitarTokenEscritura(() => ejecutarPreseleccion());
        return;
    }

    preselectBatchRunning = true;
    const btnReg = document.getElementById('btn-preselect-register');
    const btnAdd = document.getElementById('btn-add-preselect');
    const progressEl = document.getElementById('preselect-progress');
    const progressBar = document.getElementById('preselect-progress-bar');
    btnReg.disabled = true;
    btnAdd.disabled = true;
    progressEl.style.display = '';

    let exitosos = 0, fallidos = 0, omitidos = 0;
    const omitidosDetalles = [];
    const total = preseleccion.length;
    const items = [...preseleccion];

    // Agrupar por congregación del orador (cada congregación = 1 hoja)
    const porHoja = {};
    items.forEach((p, idx) => {
        const hoja = sanitizeSheetName(p.discursante.congregacion);
        if (!porHoja[hoja]) porHoja[hoja] = [];
        porHoja[hoja].push({ ...p, _idx: idx });
    });

    const hojas = Object.keys(porHoja);
    let procesados = 0;

    for (const hoja of hojas) {
        const grupo = porHoja[hoja];

        // 1 LECTURA por hoja (en vez de 1 por orador)
        progressBar.style.width = Math.round((procesados / total) * 100) + '%';
        btnReg.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 1s linear infinite"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Leyendo ${escHtml(hoja)}…`;

        let rows;
        try {
            const resp = await retryGapiCall(() => gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: `'${hoja}'!A1:N300`,
                valueRenderOption: 'UNFORMATTED_VALUE'
            }));
            rows = resp.result.values || [];
        } catch (err) {
            console.error(`Error leyendo hoja ${hoja}:`, err);
            fallidos += grupo.length;
            procesados += grupo.length;
            continue;
        }

        // Localizar filas y celdas para cada orador del grupo
        const writes = [];
        for (const p of grupo) {
            progressBar.style.width = Math.round((procesados / total) * 100) + '%';
            btnReg.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 1s linear infinite"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> ${procesados + 1}/${total} — ${escHtml(p.discursante.nombre)}`;

            try {
                const resultado = localizarFilaMes(rows, p.discursante.nombre, p.mes);
                if (!resultado) { fallidos++; procesados++; continue; }

                const { fila: rowNum, celdaI, celdaJ, celdaL } = resultado;
                if (!celdaVacia(celdaI) || !celdaVacia(celdaJ) || !celdaVacia(celdaL)) {
                    omitidos++;
                    omitidosDetalles.push({ nombre: p.discursante.nombre, motivo: 'ya tiene asignación en ' + p.mes });
                    procesados++; continue;
                }

                const [y, mo, d] = p.fecha.split('-').map(Number);
                const fechaSerial = fechaToExcelSerial(y, mo, d);
                writes.push({ p, rowNum, fechaSerial });
            } catch (err) {
                console.error(`Error localizando ${p.discursante.nombre}:`, err);
                fallidos++;
            }
            procesados++;
        }

        // 1 ESCRITURA batchUpdate por hoja con todas las celdas del grupo
        if (writes.length) {
            // RE-LEER para verificar que otro usuario no escribió mientras tanto
            let verifRows;
            try {
                const resp2 = await retryGapiCall(() => gapi.client.sheets.spreadsheets.values.get({
                    spreadsheetId: SPREADSHEET_ID,
                    range: `'${hoja}'!A1:N300`,
                    valueRenderOption: 'UNFORMATTED_VALUE'
                }));
                verifRows = resp2.result.values || [];
            } catch (err) { verifRows = rows; } // fallback a la lectura anterior

            const writesOk = [];
            for (const w of writes) {
                const res2 = localizarFilaMes(verifRows, w.p.discursante.nombre, w.p.mes);
                if (!res2 || !celdaVacia(res2.celdaI) || !celdaVacia(res2.celdaJ) || !celdaVacia(res2.celdaL)) {
                    omitidos++;
                    omitidosDetalles.push({ nombre: w.p.discursante.nombre, motivo: 'registrado por otro usuario mientras se procesaba' });
                } else {
                    writesOk.push(w);
                }
            }

            if (writesOk.length) {
                try {
                    const data = writesOk.flatMap(w => [
                        { range: `'${hoja}'!I${w.rowNum}`, values: [[w.p.cong]] },
                        { range: `'${hoja}'!J${w.rowNum}`, values: [[parseInt(w.p.tema, 10)]] },
                        { range: `'${hoja}'!L${w.rowNum}`, values: [[w.fechaSerial]] }
                    ]);
                    await retryGapiCall(() => gapi.client.sheets.spreadsheets.values.batchUpdate({
                        spreadsheetId: SPREADSHEET_ID,
                        resource: { valueInputOption: 'RAW', data }
                    }));
                    exitosos += writesOk.length;
                    // Actualizar estado local solo los que se escribieron
                    for (const w of writesOk) {
                        const p = w.p;
                        const fechaFormateada = formatFechaDisplay(p.fecha) + ' de ' + p.mes;
                        allAssignments.push({
                            nombre: p.discursante.nombre,
                            origen: p.discursante.congregacion,
                            destino: p.cong,
                            fecha: fechaFormateada,
                            hora: contactsMap[normalizeStr(p.cong)]?.horario || '—',
                            temaNum: parseInt(p.tema, 10).toString(),
                            mes: p.mes
                        });
                        _conflictosCache = null;
                        destinationCongs.add(p.cong);
                        const spLocal = globalSpeakers.find(s =>
                            normalizeStr(s.nombre) === normalizeStr(p.discursante.nombre) &&
                            normalizeStr(s.congregacion) === normalizeStr(p.discursante.congregacion)
                        );
                        if (spLocal) spLocal.disponibilidad[p.mes] = 'asignado';
                    }
                } catch (err) {
                    console.error(`Error batch ${hoja}:`, err);
                    fallidos += writesOk.length;
                }
            }
        }

        // Pausa breve entre hojas para no saturar
        if (hojas.indexOf(hoja) < hojas.length - 1) await new Promise(r => setTimeout(r, 300));
    }

    progressBar.style.width = '100%';
    preselectBatchRunning = false;
    btnAdd.disabled = false;

    preseleccion = [];
    renderPreseleccion();
    renderMonthView();
    renderDispCongView();
    poblarDiscursantesDelMes(document.getElementById('reg-mes').value || 'Enero');
    resetDesdeDiscursante();
    document.getElementById('reg-discursante').value = '';
    actualizarSteps();
    progressEl.style.display = 'none';

    const partes = [];
    if (exitosos) partes.push(`${exitosos} registrado(s)`);
    if (omitidos) partes.push(`${omitidos} omitido(s)`);
    if (fallidos) partes.push(`${fallidos} fallido(s)`);
    mostrarToast(`✓ Pre-selección completada: ${partes.join(', ')}`, exitosos > 0 ? 'success' : 'error');

    if (omitidosDetalles.length) {
        const nombres = omitidosDetalles.map(o => o.nombre).join(', ');
        mostrarToast(`⏭️ Omitidos (${omitidosDetalles.length}): ${nombres}`, 'warn');
    }
}

// Localiza la fila exacta del mes dentro del bloque del orador.
// Devuelve { fila (1-based), celdaI, celdaJ, celdaL } o null si no encuentra.
// SEGURIDAD:
//   • Requiere coincidencia EXACTA de nombre del orador (con fallback normalizado)
//   • Verifica que la fila encontrada esté DENTRO del bloque correcto (entre su
//     cabecera "Nombre" y la siguiente cabecera "Nombre" del siguiente orador)
//   • Devuelve los valores actuales de I, J, L para que el llamador pueda
//     detectar sobreescritura antes de escribir
function localizarFilaMes(rows, nombreOrador, mes) {
    const nNombre = normalizeStr(nombreOrador);
    const nMes    = normalizeStr(mes);

    let inicioBloque = -1;  // fila donde empieza el bloque de ESTE orador
    let finBloque    = -1;  // fila donde empieza el SIGUIENTE bloque (exclusivo)

    // — Primer paso: ubicar el bloque exacto del orador —
    for (let i = 0; i < rows.length; i++) {
        const colA = ((rows[i] || [])[0] || '').toString().trim();

        if (colA === 'Nombre') {
            const nombreSiguiente = ((rows[i + 1] || [])[0] || '').toString().trim();
            const coincide = normalizeStr(nombreSiguiente) === nNombre;

            if (coincide && inicioBloque < 0) {
                // Encontramos el inicio del bloque de este orador
                inicioBloque = i;
            } else if (inicioBloque >= 0) {
                // Encontramos el inicio del SIGUIENTE bloque → fin del actual
                finBloque = i;
                break;
            }
        }
    }

    // Si no encontramos el bloque del orador → cancelar
    if (inicioBloque < 0) return null;

    // Si no encontramos un bloque siguiente, el fin es el total de filas
    if (finBloque < 0) finBloque = rows.length;

    // — Segundo paso: buscar la fila del mes SOLO dentro del bloque confirmado —
    for (let i = inicioBloque; i < finBloque; i++) {
        const fila = rows[i] || [];
        const colG = normalizeStr((fila[6] || '').toString().trim());

        if (colG === nMes) {
            // Extraer los valores actuales de I (índice 8), J (índice 9), L (índice 11)
            // para que el llamador pueda verificar si ya están ocupados
            return {
                fila:   i + 1,               // 1-based para Sheets API
                celdaI: fila[8]  ?? null,    // Discursará en (col I)
                celdaJ: fila[9]  ?? null,    // Discurso # (col J)
                celdaL: fila[11] ?? null     // Fecha (col L)
            };
        }
    }

    // Mes no encontrado dentro del bloque
    return null;
}

// ── FIN REGISTRO ────────────────────────────────────────────────

// ── ELIMINAR ASIGNACIÓN (Google Sheets + estado local) ─────────
async function confirmarEliminarAsignacion(idx) {
    const a = allAssignments[idx];
    if (!a) return;
    const ok = await showConfirm('Eliminar asignación', `Discursante: ${a.nombre}\nOrigen: ${a.origen}\nDestino: ${a.destino}\nFecha: ${a.fecha}\nBosquejo #${a.temaNum}\n\nEsta acción modificará Google Sheets y no se puede deshacer.`, { okLabel: 'Eliminar' });
    if (ok) eliminarAsignacion(idx);
}

async function eliminarAsignacion(idx) {
    const a = allAssignments[idx];
    if (!a) return;

    const token = gapi?.client?.getToken?.()?.access_token;
    if (!token) {
        mostrarToast('⚠️ Conecta Google Sheets antes de eliminar.', 'error');
        return;
    }
    if (!hasWriteToken) {
        mostrarToast('🔑 Solicitando permiso de escritura…', 'success');
        solicitarTokenEscritura(() => eliminarAsignacion(idx));
        return;
    }
    if (!a.mes) {
        mostrarToast('⚠️ No se pudo determinar el mes de esta asignación. Operación cancelada.', 'error');
        return;
    }

    try {
        const hojaName = sanitizeSheetName(a.origen);

        // ── Leer la hoja completa (solo lectura) ──
        const respLectura = await retryGapiCall(() => gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `'${hojaName}'!A1:N300`,
            valueRenderOption: 'UNFORMATTED_VALUE'
        }));
        const rows = respLectura.result.values || [];

        // ── Localizar la fila exacta del mes para este orador ──
        const resultado = localizarFilaMes(rows, a.nombre, a.mes);
        if (!resultado) {
            mostrarToast(`⚠️ No se encontró la fila de "${a.mes}" para ${a.nombre} en la hoja. Operación cancelada.`, 'error');
            return;
        }
        const { fila: rowNum } = resultado;

        // ── Limpiar SOLO las celdas I, J, L de esa fila ──
        await retryGapiCall(() => gapi.client.sheets.spreadsheets.values.batchClear({
            spreadsheetId: SPREADSHEET_ID,
            resource: {
                ranges: [
                    `'${hojaName}'!I${rowNum}`,
                    `'${hojaName}'!J${rowNum}`,
                    `'${hojaName}'!L${rowNum}`
                ]
            }
        }));

        // ── Actualizar estado local ──
        allAssignments.splice(idx, 1);
        _conflictosCache = null;
        const sp = globalSpeakers.find(s =>
            normalizeStr(s.nombre) === normalizeStr(a.nombre) &&
            normalizeStr(s.congregacion) === normalizeStr(a.origen)
        );
        if (sp && a.mes) delete sp.disponibilidad[a.mes];

        // Evitar conflicto con el "Deshacer" del último registro
        if (lastRegistro) {
            clearTimeout(undoTimer);
            const toast = document.getElementById('reg-toast');
            toast?.classList.remove('show');
            lastRegistro = null;
        }

        renderMonthView();
        renderDispCongView();
        renderAguayoView();
        poblarDiscursantesDelMes(document.getElementById('reg-mes')?.value || a.mes);

        mostrarToast(`✓ Asignación eliminada: ${a.nombre} → ${a.destino} | ${a.fecha}`, 'success');

    } catch (err) {
        console.error('Error al eliminar asignación:', err);
        mostrarToast('❌ Error al eliminar la asignación. Revisa la consola.', 'error');
    }
}

// ── FIN ELIMINAR ASIGNACIÓN ─────────────────────────────────────

function inicializarWizardSiActivo() {
    const activeTab = document.querySelector('.tab-btn.active')?.dataset?.tab;
    if (activeTab !== 'months') return;
    const mes = document.getElementById('month-selector').value;
    document.getElementById('reg-mes').value = mes;
    if (globalSpeakers.length) poblarDiscursantesDelMes(mes);
    poblarCongsDestino();
    actualizarSteps();
}

function renderMonthView() {
    const m = document.getElementById('month-selector').value;
    const tbody = document.getElementById('month-table-body');
    const searchVal = normalizeStr((document.getElementById('month-speaker-search')?.value || '').trim());
    const statusFilter = document.getElementById('month-status-filter')?.value || 'TODOS';
    const unique = getUnique();
    let pool = unique.filter(s => {
        const d = (s.disponibilidad[m] || '').toLowerCase();
        return d === 'disponible' || d === 'asignado';
    });

    const summaryBox = document.getElementById('month-availability-summary');
    const mesPrefix = m.substring(0,3).toLowerCase();
    let libresCount = 0, asignadosCount = 0;
    if (unique.length) {
        pool.forEach(s => {
            const myAsigs = getAssignmentsFor(s.nombre);
            const tieneAsig = myAsigs.some(a => a.fecha.toLowerCase().includes(mesPrefix));
            if (tieneAsig) asignadosCount++; else libresCount++;
        });
        document.getElementById('month-avail-count').textContent = pool.length;
        document.getElementById('month-libre-count').textContent = libresCount;
        document.getElementById('month-asignado-count').textContent = asignadosCount;
        summaryBox.style.display = 'flex';
    } else {
        summaryBox.style.display = 'none';
    }

    if (searchVal) {
        pool = pool.filter(s => normalizeStr(s.nombre).includes(searchVal));
    }
    const temaVal = (document.getElementById('month-tema-search')?.value || '').trim();
    if (temaVal) {
        const temaNum = parseInt(temaVal, 10).toString();
        pool = pool.filter(s => (s.temas || []).includes(temaNum));
    }
    if (statusFilter === 'LIBRE') {
        pool = pool.filter(s => !getAssignmentsFor(s.nombre).some(a => a.fecha.toLowerCase().includes(mesPrefix)));
    } else if (statusFilter === 'ASIGNADO') {
        pool = pool.filter(s => getAssignmentsFor(s.nombre).some(a => a.fecha.toLowerCase().includes(mesPrefix)));
    }
    if (!pool.length) {
        const msg = statusFilter === 'LIBRE' ? 'No hay discursantes libres este mes.'
            : statusFilter === 'ASIGNADO' ? 'No hay discursantes asignados este mes.'
            : 'Ninguno disponible este mes.';
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;">${msg}</td></tr>`;
        return;
    }
    tbody.innerHTML = pool.map(s => {
        const tieneAsig = getAssignmentsFor(s.nombre).some(a => a.fecha.toLowerCase().includes(mesPrefix));
        const estadoBadge = tieneAsig
            ? `<span class="badge badge-warn">Asignado</span>`
            : `<span class="badge badge-success">Libre</span>`;
        return `<tr class="clickable" data-nombre="${escHtml(s.nombre)}" data-cong="${escHtml(s.congregacion)}">
            <td><div style="display:flex;align-items:center;gap:8px;">${getPhotoMini(s.nombre,s.congregacion)}<b>${escHtml(s.nombre)}</b>${ratingBadgeHtml(getSpeakerRating(s.nombre,s.congregacion),true)}</div></td>
            <td>${escHtml(s.rol)}</td>
            <td>${escHtml(s.congregacion)}</td>
            <td>${escHtml(s.telefono)}</td>
            <td>${estadoBadge}</td>
        </tr>`;
    }).join('');
}

// ═══ LISTADO POR CONGREGACIÓN — Disponibilidad anual + ficha ═══
function renderDispCongView() {
    const container = document.getElementById('disp-cong-container');
    const counter = document.getElementById('disp-cong-counter');
    const congFilter = document.getElementById('disp-cong-filter');
    const searchVal = normalizeStr((document.getElementById('disp-speaker-search')?.value || '').trim());
    if (!container) return;
    const unique = getUnique();

    // Populate congregation filter
    if (congFilter) {
        const prevVal = congFilter.value;
        const congs = [...new Set(unique.map(s => s.congregacion))].sort();
        congFilter.innerHTML = '<option value="TODOS">— Todas las congregaciones —</option>' +
            congs.map(c => `<option value="${escHtml(c)}"${prevVal === c ? ' selected' : ''}>${escHtml(c)}</option>`).join('');
    }

    const selectedCong = congFilter ? congFilter.value : 'TODOS';
    let pool = unique;
    if (selectedCong !== 'TODOS') pool = pool.filter(s => s.congregacion === selectedCong);
    if (searchVal) pool = pool.filter(s => normalizeStr(s.nombre).includes(searchVal) || normalizeStr(s.congregacion).includes(searchVal));
    pool.sort((a, b) => { const cg = a.congregacion.localeCompare(b.congregacion); return cg !== 0 ? cg : a.nombre.localeCompare(b.nombre); });

    if (!pool.length) {
        container.innerHTML = '<div class="empty-state"><p>Sin discursantes que coincidan con los filtros.</p></div>';
        if (counter) counter.textContent = '';
        return;
    }

    // Group by congregation
    const groups = {};
    pool.forEach(s => { (groups[s.congregacion] = groups[s.congregacion] || []).push(s); });

    let totalDisp = 0;
    const html = Object.entries(groups).sort((a,b) => a[0].localeCompare(b[0])).map(([cong, speakers]) => {
        const contact = contactsMap[normalizeStr(cong)] || { encargado: '—', telefono: '—', horario: '—' };
        const speakersHtml = speakers.map(s => {
            const monthBadges = MESES.map(mes => {
                const val = (s.disponibilidad[mes] || '').toLowerCase();
                let cls = 'vacio', label = '—';
                if (val === 'disponible') { cls = 'disponible'; label = '✓'; totalDisp++; }
                else if (val === 'asignado') { cls = 'asignado'; label = 'A'; }
                const short = mes.substring(0,3);
                return `<span class="month-dot ${cls}" title="${mes}: ${val || 'sin registro'}" style="display:inline-flex;">${short}</span>`;
            }).join(' ');

            const temas = (s.temas || []).length ? s.temas.join(', ') : '—';
            const outs = getAssignmentsFor(s.nombre).filter(a => normalizeStr(a.origen) === normalizeStr(cong));
            const lastOut = outs.length ? outs.sort((a,b) => parseStringToDate(b.fecha) - parseStringToDate(a.fecha))[0] : null;

            return `<div class="disp-speaker-card">
                <div class="disp-speaker-header">
                    <div style="display:flex;align-items:center;gap:10px;">
                        ${getPhotoMini(s.nombre, s.congregacion)}
                        <div>
                            <div style="font-weight:700;font-size:13.5px;color:var(--text-1);">${escHtml(s.nombre)} ${ratingBadgeHtml(getSpeakerRating(s.nombre, s.congregacion), true)}</div>
                            <div style="font-size:11.5px;color:var(--text-3);">${escHtml(s.rol || 'Sin rol')}${s.telefono ? ' · ' + escHtml(s.telefono) : ''}</div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:11px;color:var(--text-3);">${outs.length} salida${outs.length !== 1 ? 's' : ''}</span>
                        <button class="btn-mini" onclick="openModal('${escJs(s.nombre)}','${escJs(s.congregacion)}')" title="Ver ficha completa">→ Ficha</button>
                    </div>
                </div>
                <div class="disp-months-row">${monthBadges}</div>
                <div class="disp-details">
                    <div class="disp-detail-item"><span class="disp-detail-label">Bosquejos:</span> <span class="disp-detail-value">${temas}</span></div>
                    ${lastOut ? `<div class="disp-detail-item"><span class="disp-detail-label">Última salida:</span> <span class="disp-detail-value">${escHtml(lastOut.fecha)} → ${escHtml(lastOut.destino)}</span></div>` : ''}
                </div>
            </div>`;
        }).join('');

        return `<div class="disp-cong-group">
            <div class="disp-cong-header">
                <div>
                    <span style="font-weight:700;font-size:14px;color:var(--text-1);">${escHtml(cong)}</span>
                    <span style="font-size:12px;color:var(--text-3);margin-left:6px;">(${speakers.length} discursantes)</span>
                </div>
                <div style="font-size:11.5px;color:var(--text-3);">
                    Coord: ${escHtml(contact.encargado)} · Tel: ${escHtml(contact.telefono)} · Reunión: ${escHtml(contact.horario)}
                </div>
            </div>
            ${speakersHtml}
        </div>`;
    }).join('');

    container.innerHTML = html;
    if (counter) counter.textContent = `${pool.length} discursantes en ${Object.keys(groups).length} congregaciones`;
}

const _origEjecutarRegistro = ejecutarRegistro;

ejecutarRegistro = async function() {
    await _origEjecutarRegistro();
    // Persistir asignaciones localmente tras cada registro
    guardarAsignacionesLocal(allAssignments);
    // Si el registro fue exitoso, allAssignments habrá crecido
    // Capturamos el último para ofrecer undo visual (solo UI local)
    const last = allAssignments[allAssignments.length - 1];
    if (!last) return;
    lastRegistro = { ...last, index: allAssignments.length - 1 };

    // Reemplazar el toast de éxito con uno que tiene botón Deshacer
    clearTimeout(undoTimer);
    const toast = document.getElementById('reg-toast');
    toast.innerHTML = `✓ Registrado: ${escHtml(last.nombre)} → ${escHtml(last.destino)} &nbsp;|&nbsp; <button onclick="undoLastRegistro()" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.5);color:#fff;padding:2px 10px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:700;
">Deshacer (5s)</button>`;
    toast.className = 'reg-toast success show';
    undoTimer = setTimeout(() => {
        toast.classList.remove('show');
        lastRegistro = null;
    }, 5000);
};

function undoLastRegistro() {
    if (!lastRegistro) return;
    clearTimeout(undoTimer);
    // Revertir en memoria local
    allAssignments.splice(lastRegistro.index, 1);
    // Revertir estado de disponibilidad del orador
    const sp = globalSpeakers.find(s =>
        normalizeStr(s.nombre) === normalizeStr(lastRegistro.nombre) &&
        normalizeStr(s.congregacion) === normalizeStr(lastRegistro.origen)
    );
    if (sp && lastRegistro.mes) delete sp.disponibilidad[lastRegistro.mes];

    renderMonthView();
    renderDispCongView();
    renderAguayoView();
    lastRegistro = null;
    mostrarToast('↩ Asignación revertida (solo localmente)', 'error');
}

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  onMesChange,
  toggleRegistroPanel,
  onRegMesChange,
  poblarDiscursantesDelMes,
  onRegDiscursanteChange,
  renderRegTemas,
  selectRegTema,
  poblarCongsDestino,
  checkRegistroReady,
  setFechaLimitsMes,
  formatFechaDisplay,
  resetDesdeDiscursante,
  actualizarSteps,
  ejecutarRegistro,
  agregarAPreSeleccion,
  eliminarDePreseleccion,
  limpiarPreseleccion,
  renderPreseleccion,
  ejecutarPreseleccion,
  localizarFilaMes,
  confirmarEliminarAsignacion,
  eliminarAsignacion,
  inicializarWizardSiActivo,
  renderMonthView,
  renderDispCongView,
  _origEjecutarRegistro,
  undoLastRegistro,
});
