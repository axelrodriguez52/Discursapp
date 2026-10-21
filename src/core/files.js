/* ==========================================================================
   Carga de archivos locales (Excel/PDF) y estado de la UI
   Origen: DISCURSAPP .html, script principal (L5178-5215)
   ========================================================================== */
function handleFileSelect(e, type) {
    const file = e.target.files[0]; if (!file) return;
    const MAX_MB = type === 'excel' ? 50 : 20;
    if (file.size > MAX_MB * 1024 * 1024) {
        mostrarToast('⚠️ El archivo excede ' + MAX_MB + ' MB. Reduce el tamaño e intenta de nuevo.', 'error');
        e.target.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = function(evt) {
        if (db) db.transaction(["files"], "readwrite").objectStore("files").put(evt.target.result, type);
        if (type === 'excel') processExcelRaw(evt.target.result);
        if (type === 'pdf')   processPDFRaw(evt.target.result);
    };
    reader.readAsArrayBuffer(file);
}

function loadSavedFiles() {
    if (!db) return;
    try {
        const tx = db.transaction(["files"], "readonly");
        tx.onerror = e => console.warn('Error leyendo archivos guardados:', e.target.error);
        const reqExcel = tx.objectStore("files").get("excel");
        reqExcel.onsuccess = e => { if (e.target.result) { processExcelRaw(e.target.result); updateUiStatus('excel', true); } };
        reqExcel.onerror = e => console.warn('Error leyendo Excel guardado:', e.target.error);
        const reqPdf = tx.objectStore("files").get("pdf");
        reqPdf.onsuccess = e => { if (e.target.result) processPDFRaw(e.target.result); };
        reqPdf.onerror = e => console.warn('Error leyendo PDF guardado:', e.target.error);
    } catch(e) { console.warn('Error en loadSavedFiles:', e); }
}

function updateUiStatus(type, ok) {
    const selectors = type === 'excel' ? '.xlsx-status-text' : '.pdf-status-text';
    document.querySelectorAll(selectors).forEach(el => {
        el.innerHTML = ok ? `<span class="status-ok">✓ Cargado</span>` : 'Pendiente';
        el.closest('.upload-zone')?.classList.toggle('loaded', ok);
    });
}

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  handleFileSelect,
  loadSavedFiles,
  updateUiStatus,
});
