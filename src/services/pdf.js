/* ==========================================================================
   Parseo del catalogo de bosquejos en PDF
   Origen: DISCURSAPP .html, script principal (L5515-5526)
   ========================================================================== */
async function processPDFRaw(buf) {
    try {
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise; themesMap = {}; let txt = "";
        for (let i = 1; i <= pdf.numPages; i++) { txt += " " + (await (await pdf.getPage(i)).getTextContent()).items.map(t => t.str).join(" "); }
        let m, rx = /(?:NO\.\s*)?(\b\d{1,3}\b)[:.-]?\s+([^0-9]{15,100})/gi;
        while ((m = rx.exec(txt.replace(/\s+/g, ' '))) !== null) { const num = parseInt(m[1],10).toString(); if (!themesMap[num]) themesMap[num] = m[2].trim().replace(/ÚLTIMA REVISIÓN.*/i,'').trim(); }
        updateUiStatus('pdf', true); renderCards();
        // Refrescar vista de bosquejos si está activa
        const activeTab2 = document.querySelector('.tab-btn.active')?.dataset?.tab;
        if (activeTab2 === 'bosquejos') renderBosquejosView();
    } catch(e) { updateUiStatus('pdf', false); }
}

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  processPDFRaw,
});
