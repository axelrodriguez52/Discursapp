/* ==========================================================================
   Visitas entrantes
   Origen: DISCURSAPP .html, script principal (L9229-10293)
   ========================================================================== */
function renderVisitasView() {
    const cSel = document.getElementById('visitas-cong-selector');
    const mSel = document.getElementById('visitas-month-selector');
    const content = document.getElementById('visitas-content');
    const bar = document.getElementById('visitas-summary-bar');
    const btnPrint = document.getElementById('btn-print-entrantes');
    if (!cSel || !content) return;
    const c = cSel.value, m = mSel?.value || '';
    if (!c) { if (bar) bar.style.display = 'none'; content.innerHTML = ''; if (btnPrint) btnPrint.style.display = 'none'; return; }
    if (btnPrint) btnPrint.style.display = 'inline-flex';
    document.getElementById('print-title-entrantes').innerText = `Circuito 16 — Registro de Visitas Recibidas por ${c}`;
    const tok = m !== 'TODOS' ? m.substring(0,3).toLowerCase() : '';
    const filtered = allAssignments.filter(a => a.destino.toLowerCase() === c.toLowerCase() && (m === 'TODOS' || a.fecha.toLowerCase().includes(tok))).sort((a,b)=>parseStringToDate(a.fecha)-parseStringToDate(b.fecha));
    if (!filtered.length) { bar.style.display = 'none'; btnPrint.style.display = 'none'; content.innerHTML = '<div class="empty-state"><p>Sin visitas entrantes en este periodo.</p></div>'; return; }
    bar.style.display = 'block'; bar.innerHTML = `<p><b>${escHtml(c)}</b> — ${filtered.length} visitas asignadas en el periodo.</p>`;
    content.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Orador</th><th>Origen</th><th>Fecha / Hora</th><th>Bosquejo</th></tr></thead><tbody>${filtered.map(a=>`<tr><td><div style="display:flex;align-items:center;gap:8px;">${getPhotoMini(a.nombre,a.origen)}<b>${escHtml(a.nombre)}</b>${ratingBadgeHtml(getSpeakerRating(a.nombre,a.origen),true)}</div></td><td>${escHtml(a.origen)}</td><td><span class="badge badge-warn">${escHtml(a.fecha)}</span> <small>${escHtml(a.hora)}</small></td><td><b>#${escHtml(a.temaNum)}</b><div style="font-size:11px;color:var(--text-2);">${escHtml(themesMap[a.temaNum]||'')}</div></td></tr>`).join('')}</tbody></table></div>`;
}

// ── Botón CSV Visitas: mostrar junto con print ─────────────────
const _origRenderVisitas = renderVisitasView;

renderVisitasView = function() {
    _origRenderVisitas();
    const btnCSV = document.getElementById('btn-csv-entrantes');
    const btnPrint = document.getElementById('btn-print-entrantes');
    if (btnCSV && btnPrint) btnCSV.style.display = btnPrint.style.display;
};

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  renderVisitasView,
  _origRenderVisitas,
});
