/* ==========================================================================
   Salidas del circuito
   Origen: DISCURSAPP .html, script principal (L9189-9727)
   ========================================================================== */
function renderAguayoView() {
    const tbody = document.getElementById('aguayo-table-body');
    const searchSp = document.getElementById('aguayo-speaker-search').value.toLowerCase().trim();
    const originSel = document.getElementById('aguayo-origin-selector').value;
    const monthSel = document.getElementById('aguayo-month-selector').value;
    const destSel = document.getElementById('aguayo-dest-selector').value;
    
    document.getElementById('print-title-salidas').innerText = `Circuito 16 — Registro de Salidas [Filtros Activos]`;
    const monthToken = monthSel !== 'TODOS' ? monthSel.substring(0, 3).toLowerCase() : '';
    
    const filtered = allAssignments.filter(a => {
        const matchSpeaker = !searchSp || fuzzyMatch(searchSp, a.nombre);
        const matchOrigin  = originSel === 'TODOS' || a.origen === originSel;
        const matchMonth   = monthSel === 'TODOS' || a.fecha.toLowerCase().includes(monthToken);
        const matchDest    = destSel === 'TODOS' || a.destino === destSel;
        return matchSpeaker && matchOrigin && matchMonth && matchDest;
    }).sort((a, b) => parseStringToDate(a.fecha) - parseStringToDate(b.fecha));
    
    tbody.innerHTML = filtered.length ? filtered.map(a => {
        const targetUrl = "https://hub.jw.org/meetings/es?q=%7B%22meetingType%22:%22meetings%22,%22location%22:%22Su%20ubicaci%C3%B3n%22,%22useCurrentLocation%22:true%7D";
        const idx = allAssignments.indexOf(a);
        return `<tr>
            <td><div style="display:flex;align-items:center;gap:8px;">${getPhotoMini(a.nombre,a.origen)}<b style="cursor:pointer;color:var(--accent);text-decoration:none;" onclick="openModal('${escJs(a.nombre)}','${escJs(a.origen)}')">${escHtml(a.nombre)}</b>${ratingBadgeHtml(getSpeakerRating(a.nombre,a.origen),true)}</div></td>
            <td>${escHtml(a.origen)}</td>
            <td>
                <span class="badge badge-accent badge-link" style="cursor:pointer;" onclick="window.open('${targetUrl}', '_blank')" title="Buscar mi ubicación actual en JW Hub">
                    📍 ${escHtml(a.destino)}
                </span>
            </td>
            <td><span class="badge badge-warn">${escHtml(a.fecha)}</span> <small>${escHtml(a.hora)}</small></td>
            <td><b>#${escHtml(a.temaNum)}</b> <div style="font-size:11px;color:var(--text-2);">${escHtml(themesMap[a.temaNum] || '')}</div></td>
            <td class="col-acciones" style="text-align:center;">
                ${normalizeStr(a.destino) === normalizeStr(matrizCong) ? `<button onclick="confirmarEliminarAsignacion(${idx})" title="Eliminar asignación" style="background:var(--danger-dim);border:1px solid var(--danger);color:var(--danger);width:28px;height:28px;border-radius:var(--radius-sm);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14H7L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                </button>` : ''}
            </td>
        </tr>`;
    }).join('') : `<tr><td colspan="6" style="text-align:center;padding:24px;">Sin asignaciones que coincidan con los filtros aplicados.</td></tr>`;
}

function sortAguayo(col) {
    if (aguayoSort.col === col) aguayoSort.dir *= -1;
    else { aguayoSort.col = col; aguayoSort.dir = 1; }
    // Actualizar flechas
    ['nombre','origen','destino','fecha'].forEach(c => {
        const el = document.getElementById('sort-' + c);
        if (el) el.textContent = c === col ? (aguayoSort.dir === 1 ? '↑' : '↓') : '↕';
    });
    renderAguayoView();
}

// Patch renderAguayoView para respetar el sort y mostrar contador
const _origRenderAguayo = renderAguayoView;

renderAguayoView = function() {
    _origRenderAguayo();
    // Ordenar filas del tbody ya renderizado
    const tbody = document.getElementById('aguayo-table-body');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    if (rows.length <= 1) return;
    // Índice de columna según sort
    const colIdx = { nombre: 0, origen: 1, destino: 2, fecha: 3 };
    const idx = colIdx[aguayoSort.col] ?? 3;
    rows.sort((a, b) => {
        const ta = a.cells[idx]?.textContent?.trim() || '';
        const tb = b.cells[idx]?.textContent?.trim() || '';
        if (aguayoSort.col === 'fecha') {
            return aguayoSort.dir * (parseStringToDate(ta) - parseStringToDate(tb));
        }
        return aguayoSort.dir * ta.localeCompare(tb, 'es');
    });
    rows.forEach(r => tbody.appendChild(r));
    // Contador
    const counter = document.getElementById('aguayo-counter');
    if (counter) {
        const n = rows.filter(r => r.cells.length > 1).length;
        counter.textContent = n ? `${n} asignación${n !== 1 ? 'es' : ''} encontrada${n !== 1 ? 's' : ''}` : '';
    }
};

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  renderAguayoView,
  sortAguayo,
  _origRenderAguayo,
});
