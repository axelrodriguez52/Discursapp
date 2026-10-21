/* ==========================================================================
   Recordatorio de discurso y su plantilla
   Origen: DISCURSAPP .html, script principal (L9273-9406)
   ========================================================================== */
function cargarPlantillaRecordatorio() {
    let t = '';
    try { t = localStorage.getItem(REC_PLANTILLA_KEY) || ''; } catch(e) {}
    if (!t) t = recPlantillaDesdeIDB || '';
    if (!t) t = REC_PLANTILLA_DEFAULT;
    return t;
}

function guardarPlantillaRecordatorio(txt) {
    recPlantillaDesdeIDB = txt;
    try { localStorage.setItem(REC_PLANTILLA_KEY, txt); }
    catch(e) { console.warn('Error guardando la plantilla del recordatorio en localStorage:', e); }
    if (db) {
        try { db.transaction(["files"], "readwrite").objectStore("files").put(txt, "recordatorioPlantilla"); }
        catch(e) { console.warn('Error guardando la plantilla del recordatorio en IndexedDB:', e); }
    }
}

function _recAsignaciones() {
    const nM = normalizeStr(matrizCong);
    return allAssignments.filter(a => !nM || normalizeStr(a.destino) === nM)
        .sort((a, b) => parseStringToDate(a.fecha) - parseStringToDate(b.fecha));
}

function abrirRecordatorio() {
    _recSel = null;
    const fechas = [...new Set(_recAsignaciones().map(a => a.fecha))];
    document.getElementById('rec-fecha').innerHTML = '<option value="">— Todas las fechas —</option>' +
        fechas.map(f => `<option value="${escHtml(f)}">${escHtml(f)}</option>`).join('');
    document.getElementById('rec-nombre').value = '';
    document.getElementById('rec-mensaje').value = '';
    recRender();
    document.getElementById('modal-recordatorio').classList.add('active');
}

function cerrarRecordatorio() {
    document.getElementById('modal-recordatorio').classList.remove('active');
}

function recRender() {
    const q = document.getElementById('rec-nombre').value.toLowerCase().trim();
    const f = document.getElementById('rec-fecha').value;
    _recLista = _recAsignaciones().filter(a => (!q || fuzzyMatch(q, a.nombre)) && (!f || a.fecha === f));
    const box = document.getElementById('rec-lista');
    box.innerHTML = _recLista.length ? _recLista.map((a, i) => `
        <div onclick="recSeleccionar(${i})" style="padding:9px 12px;cursor:pointer;border-bottom:1px solid var(--border);font-size:13px;${_recSel === a ? 'background:var(--accent-glow);' : ''}">
            <b>${escHtml(a.nombre)}</b> · <span class="badge badge-warn">${escHtml(a.fecha)}</span>
            <div style="font-size:11px;color:var(--text-2);">🏠 ${escHtml(a.origen)} · #${escHtml(a.temaNum)} ${escHtml(themesMap[a.temaNum] || '')}</div>
        </div>`).join('') : '<div style="padding:16px;text-align:center;font-size:12px;color:var(--text-3);">Sin asignaciones que coincidan.</div>';
}

function recApellido(n) {
    n = (n || '').trim();
    if (n.includes(',')) return n.split(',')[0].trim();
    const p = n.split(/\s+/);
    return p[p.length - 1];
}

function recConstruir(a) {
    return recAplicarPlantilla(cargarPlantillaRecordatorio(), a);
}

// Sustituye las variables {…} de la plantilla por los datos de la asignación.
// Las variables desconocidas se dejan literales para que el usuario detecte el error.
function recAplicarPlantilla(tpl, a) {
    const cong = matrizCong || a.destino;
    let enc = contactsMap[normalizeStr(cong)]?.encargado || '';
    if (/^(no definido|no registrado|—)$/i.test(enc.trim())) enc = '';
    const tema = themesMap[a.temaNum] ? `${themesMap[a.temaNum]} (N.º ${a.temaNum})` : `Bosquejo N.º ${a.temaNum}`;
    const hora = a.hora && a.hora !== '—' ? a.hora : '';
    const vals = {
        hermano:   recApellido(a.nombre),
        nombre:    a.nombre || '',
        tema:      tema,
        fecha:     a.fecha || '',
        hora:      hora,
        congregacion: cong || '',
        origen:    a.origen || '',
        encargado: enc
    };
    return String(tpl == null ? '' : tpl)
        .replace(/\{(hermano|nombre|tema|fecha|hora|congregacion|origen|encargado)\}/g, (m, k) => vals[k]);
}

function recSeleccionar(i) {
    _recSel = _recLista[i] || null;
    document.getElementById('rec-mensaje').value = _recSel ? recConstruir(_recSel) : '';
    recRender();
}

function recRestablecer() {
    if (_recSel) document.getElementById('rec-mensaje').value = recConstruir(_recSel);
}

// ── UI de edición de la plantilla predeterminada ──
function abrirPlantillaRecordatorio() {
    const ta = document.getElementById('rec-plantilla');
    ta.value = cargarPlantillaRecordatorio();
    document.getElementById('modal-plantilla-recordatorio').classList.add('active');
    try { ta.focus(); } catch(e) {}
}

function cerrarPlantillaRecordatorio() {
    document.getElementById('modal-plantilla-recordatorio').classList.remove('active');
}

function recInsertarVariable(v) {
    const ta = document.getElementById('rec-plantilla');
    if (!ta) return;
    const start = ta.selectionStart == null ? ta.value.length : ta.selectionStart;
    const end   = ta.selectionEnd   == null ? ta.value.length : ta.selectionEnd;
    ta.value = ta.value.slice(0, start) + v + ta.value.slice(end);
    try { ta.focus(); ta.setSelectionRange(start + v.length, start + v.length); } catch(e) {}
}

function recRestaurarPlantilla() {
    const ta = document.getElementById('rec-plantilla');
    if (!ta) return;
    ta.value = REC_PLANTILLA_DEFAULT;
    mostrarToast('Plantilla restaurada a la predeterminada. Pulsa «Guardar plantilla» para aplicarla.', 'success');
}

function recGuardarPlantilla() {
    const ta = document.getElementById('rec-plantilla');
    if (!ta) return;
    const t = ta.value;
    if (!t.trim()) { mostrarToast('⚠️ La plantilla no puede estar vacía.', 'error'); return; }
    guardarPlantillaRecordatorio(t);
    // Refrescar el mensaje del modal principal si ya hay una asignación seleccionada
    if (_recSel) document.getElementById('rec-mensaje').value = recConstruir(_recSel);
    cerrarPlantillaRecordatorio();
    mostrarToast('✓ Plantilla del recordatorio guardada.', 'success');
}

async function recCopiar() {
    const t = document.getElementById('rec-mensaje').value;
    if (!t.trim()) { mostrarToast('Selecciona una asignación primero.', 'error'); return; }
    try { await navigator.clipboard.writeText(t); }
    catch (e) { const el = document.getElementById('rec-mensaje'); el.select(); document.execCommand('copy'); }
    mostrarToast('✓ Mensaje copiado.', 'success');
}

function recWhatsApp() {
    const t = document.getElementById('rec-mensaje').value;
    if (!t.trim()) { mostrarToast('Selecciona una asignación primero.', 'error'); return; }
    const sp = _recSel && globalSpeakers.find(s => normalizeStr(s.nombre) === normalizeStr(_recSel.nombre) && normalizeStr(s.congregacion) === normalizeStr(_recSel.origen));
    let tel = ((sp && sp.telefono) || '').replace(/\D/g, '');
    if (tel.length === 10) tel = '1' + tel;
    window.open(`https://wa.me/${tel.length >= 11 ? tel : ''}?text=${encodeURIComponent(t)}`, '_blank');
}

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  cargarPlantillaRecordatorio,
  guardarPlantillaRecordatorio,
  _recAsignaciones,
  abrirRecordatorio,
  cerrarRecordatorio,
  recRender,
  recApellido,
  recConstruir,
  recAplicarPlantilla,
  recSeleccionar,
  recRestablecer,
  abrirPlantillaRecordatorio,
  cerrarPlantillaRecordatorio,
  recInsertarVariable,
  recRestaurarPlantilla,
  recGuardarPlantilla,
  recCopiar,
  recWhatsApp,
});
