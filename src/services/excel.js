/* ==========================================================================
   Parseo del Excel maestro
   Origen: DISCURSAPP .html, script principal (L5312-5513)
   ========================================================================== */
function processExcelRaw(buf) {
    // Guardar estado actual por si falla el parseo
    const prevSpeakers = globalSpeakers.slice();
    const prevAssignments = allAssignments.slice();
    const prevRegisteredCongs = new Set(registeredCongs);
    const prevDestinationCongs = new Set(destinationCongs);
    const prevContactsMap = { ...contactsMap };
    try {
    const workbook = XLSX.read(new Uint8Array(buf), { type: 'array', cellDates: true });
    // Preservar contactsMap si ya fue cargado desde Google Sheets
    const contactsDesdeSheets = Object.keys(contactsMap).length > 0;
    globalSpeakers = []; allAssignments = []; registeredCongs.clear(); destinationCongs.clear();
    if (!contactsDesdeSheets) contactsMap = {};

    if (!contactsDesdeSheets && workbook.SheetNames.includes('Contactos')) {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Contactos'], { defval: '' });
        rows.forEach(row => {
            try {
                const keys = Object.keys(row);
                const findVal = (matcher) => { const k = keys.find(k => matcher(k.toLowerCase().trim())); return k ? row[k] : ''; };
                const name = findVal(k => k.includes('congregaci'));
                if (!name || celdaVacia(name)) return;
                const encargado = findVal(k => k.includes('nombre') || k.includes('encargado'));
                const telefono  = findVal(k => k.includes('tel'));
                const dia       = findVal(k => k.startsWith('dia') || k.startsWith('d\u00eda'));
                const hora      = findVal(k => k.startsWith('hora'));
                const partes    = [dia, hora].map(v => safeStr(v, '')).filter(v => v && v !== '—');
                const key = normalizeStr(safeStr(name, ''));
                if (!key) return;
                contactsMap[key] = {
                    displayName: safeStr(name, key),
                    encargado:   safeStr(encargado, 'No definido') || 'No definido',
                    telefono:    safeStr(telefono, '—'),
                    horario:     partes.length ? partes.join(' ') : '—'
                };
            } catch (rowErr) {
                console.warn('Contactos Excel: error en fila:', rowErr);
            }
        });
    }
    workbook.SheetNames.forEach(sn => {
        // Solo saltar las pestañas de formato/estructura, nunca "Circuito 16"
        if (['Formato Master','Contactos','MÁSTER','Master'].includes(sn)) return;
        registeredCongs.add(sn.toString().trim());
        parseBlockSheet(XLSX.utils.sheet_to_json(workbook.Sheets[sn], { header: 1 }), sn.toString().trim());
    });
    
    document.getElementById('aguayo-origin-selector').innerHTML = '<option value="TODOS">— Todos los orígenes —</option>' + Array.from(registeredCongs).sort().map(c => `<option value="${escHtml(c)}">${escHtml(c)}</option>`).join('');
    document.getElementById('aguayo-dest-selector').innerHTML = '<option value="TODOS">— Todos los destinos —</option>' + Array.from(destinationCongs).sort().map(d => `<option value="${escHtml(d)}">${escHtml(d)}</option>`).join('');
    document.getElementById('visitas-cong-selector').innerHTML = '<option value="">— Seleccione Congregación —</option>' + Array.from(destinationCongs).sort().map(d => `<option value="${escHtml(d)}">${escHtml(d)}</option>`).join('');
    poblarCalCongFilter();
    poblarMatrizCongSelector();

    // Deduplicar globalSpeakers por nombre+congregación
    globalSpeakers = Array.from(new Map(globalSpeakers.map(s => [s.nombre + '|' + s.congregacion, s])).values());
    // Deduplicar allAssignments por nombre+destino+fecha+tema
    allAssignments = Array.from(new Map(allAssignments.map(a => [a.nombre + '|' + a.destino + '|' + a.fecha + '|' + a.temaNum, a])).values());
    _cacheDirty = true;

    updateUiStatus('excel', true);
    guardarAsignacionesLocal(allAssignments);
    batchRender(renderCards, renderEstadisticasDashboard);
    inicializarWizardSiActivo();
    } catch(parseErr) {
        console.error('Error procesando Excel, restaurando datos previos:', parseErr);
        globalSpeakers = prevSpeakers;
        allAssignments = prevAssignments;
        registeredCongs.clear(); prevRegisteredCongs.forEach(c => registeredCongs.add(c));
        destinationCongs.clear(); prevDestinationCongs.forEach(d => destinationCongs.add(d));
        contactsMap = prevContactsMap;
        mostrarToast('⚠️ Error al procesar archivo Excel. Se mantienen los datos anteriores.', 'error');
    }
}

function parseBlockSheet(rows, congName) {
    for (let i = 0; i < rows.length; i++) {
        try {
            // Detectar inicio de bloque: celda A = "Nombre" y siguiente fila tiene un nombre real
            const filaAncla = rows[i];
            if (!filaAncla) continue;
            const anclaVal = safeStr(filaAncla[0], '');
            if (anclaVal.toLowerCase() !== 'nombre') continue;

            const filaOrador = rows[i + 1];
            if (!filaOrador) continue;

            const nameVal = safeStr(filaOrador[0], '');
            // Rechazar si el nombre está vacío, es solo espacios, o es literalmente "Nombre" (fila de cabecera)
            if (!nameVal || nameVal.toLowerCase() === 'nombre') continue;

            // Rol: puede faltar o ser un número/símbolo → normalizar
            let rolVal = safeStr(filaOrador[1], 'Anciano');
            // Si el rol parece un número de bosquejo o símbolo, ignorarlo
            if (/^\d+$/.test(rolVal) || rolVal === '—') rolVal = 'Anciano';

            const sp = {
                nombre:       nameVal,
                rol:          rolVal,
                congregacion: congName,
                telefono:     '—',
                email:        '—',
                notas:        '—',
                _anchorRow:   i + 1, // fila 1-based de la etiqueta "Nombre"
                temas:        [],
                _temaSlots:   [null,null,null,null,null,null,null,null,null,null,null,null,null,null], // C(0-6), E(0-6)
                disponibilidad: {}
            };

            for (let sub = i; sub < Math.min(i + 14, rows.length); sub++) {
                try {
                    const sr = rows[sub];
                    if (!sr) continue;

                    const lbl = safeStr(sr[0], '').toLowerCase();

                    // Teléfono
                    if (lbl === 'contacto' && rows[sub + 1]) {
                        const tel = safeStr(rows[sub + 1][0], '—');
                        sp.telefono = tel;
                    }
                    // Email
                    if (lbl === 'email' && rows[sub + 1]) {
                        const em = safeStr(rows[sub + 1][0], '—');
                        // Solo guardar si parece un email o texto válido (no un número)
                        sp.email = /^\d+$/.test(em) ? '—' : em;
                    }
                    // Notas
                    if (['notas adicionales', 'notas', 'observaciones'].includes(lbl) && rows[sub + 1]) {
                        sp.notas = safeStr(rows[sub + 1][0], '—');
                    }

                    // Bosquejo slots: columnas C (idx2) y E (idx4), offsets 0-6
                    const offset = sub - i;
                    if (offset >= 0 && offset <= 6) {
                        const tC = safeTemaNum(sr[2]);
                        const tE = safeTemaNum(sr[4]);
                        if (tC !== null) { sp._temaSlots[offset] = tC; sp.temas.push(tC); }
                        if (tE !== null) { sp._temaSlots[offset + 7] = tE; sp.temas.push(tE); }
                    }

                    // Disponibilidad: columna G (mes) + H (estado)
                    const mesLabel = safeStr(sr[6], '');
                    const dispStat = safeStr(sr[7], '');
                    // Solo registrar si el mes es uno de los 12 meses conocidos
                    if (mesLabel && MESES.some(m => normalizeStr(m) === normalizeStr(mesLabel))) {
                        // Normalizar el estado: solo aceptar valores reconocibles
                        const dispNorm = dispStat.toLowerCase();
                        const estadoFinal = ['disponible', 'no disponible', 'nodisponible',
                            'no disp', 'asignado', 'ocupado', 'libre']
                            .some(v => dispNorm.includes(v))
                            ? dispNorm : dispStat.toLowerCase() || '';
                        if (estadoFinal) sp.disponibilidad[mesLabel] = estadoFinal;
                    }

                    // Asignación: col I (destino=8), J (tema=9), L (fecha=11), M (hora=12)
                    const dest  = safeStr(sr[8], '');
                    const tema  = safeTemaNum(sr[9]);
                    const fecha = sr[11]; // puede ser Date, número serial o string
                    const hora  = safeStr(sr[12], '—');

                    const destSkip = ['destino', 'discursara en', 'discursará en', '—', ''];
                    const fechaSkip = ['fecha', '—', ''];

                    if (
                        dest && !destSkip.includes(normalizeStr(dest)) &&
                        !celdaVacia(fecha) && !fechaSkip.includes(normalizeStr(safeStr(fecha, '')))
                    ) {
                        const fechaStr = safeExcelDate(fecha, mesLabel);
                        if (fechaStr !== '—') {
                            // Asegurarse de que el destino sea texto, no un número
                            const destClean = /^\d+$/.test(dest) ? '' : dest;
                            if (destClean) {
                                destinationCongs.add(destClean);
                                allAssignments.push({
                                    nombre:   sp.nombre,
                                    origen:   congName,
                                    destino:  destClean,
                                    fecha:    fechaStr,
                                    hora:     hora,
                                    temaNum:  tema || '',
                                    mes:      mesLabel || ''
                                });
                                _conflictosCache = null;
                            }
                        }
                    }
                } catch (subErr) {
                    // Error en una subfila: continuar con la siguiente, no abortar el orador
                    console.warn(`parseBlockSheet: error en subfila ${sub} de "${congName}":`, subErr);
                }
            }

            // Deduplicar y ordenar temas
            sp.temas = [...new Set(sp.temas)].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
            globalSpeakers.push(sp);

        } catch (rowErr) {
            // Error en un bloque completo: continuar con el siguiente, no abortar la hoja
            console.warn(`parseBlockSheet: error en bloque fila ${i} de "${congName}":`, rowErr);
        }
    }
}

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  processExcelRaw,
  parseBlockSheet,
});
