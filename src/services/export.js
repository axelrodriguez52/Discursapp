/* ==========================================================================
   Exportaciones CSV y PDF
   Origen: DISCURSAPP .html, script principal (L9742-10201)
   ========================================================================== */
// ── Exportar CSV ──────────────────────────────────────────────
function exportarBosquejosBloqueados() {
    const keys = Object.keys(blockedThemes);
    if (!keys.length) { mostrarToast('No hay bosquejos bloqueados para exportar.', 'error'); return; }

    const unique = Array.from(new Map(globalSpeakers.map(s => [s.nombre+s.congregacion, s])).values());

    const headers = ['Bosquejo #', 'Título', 'Bloqueado desde', 'Motivo', 'Oradores con este tema'];
    const rows = keys
        .map(k => parseInt(k,10))
        .filter(n => !isNaN(n))
        .sort((a,b) => a-b)
        .map(n => {
            const key = n.toString();
            const info = blockedThemes[key] || {};
            const title = themesMap[key] || '';
            const desde = info.fromMonth === 'TODOS' ? 'Todos los meses' : (info.fromMonth || '');
            const speakerCount = unique.filter(s => s.temas.includes(key)).length;
            return [`#${n}`, title, desde, info.reason || '', speakerCount];
        });

    const escape = v => `"${(v||'').toString().replace(/"/g,'""')}"`;
    const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discursapp_bosquejos_bloqueados_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast(`✓ Exportados ${rows.length} bosquejo(s) bloqueado(s).`, 'success');
}

function exportarBosquejosBloqueadosPDF() {
    const keys = Object.keys(blockedThemes);
    if (!keys.length) { mostrarToast('No hay bosquejos bloqueados para exportar.', 'error'); return; }

    const unique = Array.from(new Map(globalSpeakers.map(s => [s.nombre+s.congregacion, s])).values());

    const sorted = keys
        .map(k => parseInt(k,10))
        .filter(n => !isNaN(n))
        .sort((a,b) => a-b);

    const tableRows = sorted.map(n => {
        const key = n.toString();
        const info = blockedThemes[key] || {};
        const title = themesMap[key] || '';
        const desde = info.fromMonth === 'TODOS' ? 'Todos los meses' : (info.fromMonth || '—');
        const speakerCount = unique.filter(s => s.temas.includes(key)).length;
        const speakers = unique.filter(s => s.temas.includes(key)).map(s => s.nombre).join(', ');
        return `<tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:10px 12px;font-weight:700;color:#dc2626;">#${n}</td>
            <td style="padding:10px 12px;font-weight:600;color:#111827;">${escHtml(title) || '<i style="color:#9ca3af;">Sin título</i>'}</td>
            <td style="padding:10px 12px;font-size:12px;color:#374151;">${escHtml(desde)}</td>
            <td style="padding:10px 12px;font-size:12px;color:#6b7280;">${escHtml(info.reason || '—')}</td>
            <td style="padding:10px 12px;font-size:12px;color:#6b7280;">${speakerCount > 0 ? escHtml(speakers) : '<i style="color:#9ca3af;">Ninguno</i>'}</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
    @page { margin: 18mm 14mm; size: A4 landscape; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; margin: 0; padding: 20px; font-size: 12px; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #dc2626; padding-bottom: 14px; }
    .header h1 { font-size: 20px; color: #111827; margin: 0 0 4px; }
    .header h2 { font-size: 14px; color: #dc2626; margin: 0 0 6px; font-weight: 600; }
    .header p { font-size: 11px; color: #6b7280; margin: 2px 0; }
    .summary { display: flex; justify-content: center; gap: 30px; margin-bottom: 18px; }
    .summary-item { text-align: center; }
    .summary-val { font-size: 22px; font-weight: 800; color: #dc2626; }
    .summary-lbl { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #dc2626; color: #fff; padding: 9px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    th:first-child { border-radius: 6px 0 0 0; }
    th:last-child { border-radius: 0 6px 0 0; }
    .footer { margin-top: 16px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    @media print { body { padding: 0; } .no-print { display: none !important; } }
</style>
</head><body>
    <div class="no-print" style="text-align:right;margin-bottom:10px;">
<button onclick="window.print()" style="padding:8px 20px;background:#dc2626;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">🖨 Imprimir / Guardar PDF</button>
    </div>
    <div class="header">
<h1>🔴 Bosquejos Bloqueados</h1>
<h2>Circuito 16</h2>
<p>Generado el ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
    <div class="summary">
<div class="summary-item"><div class="summary-val">${sorted.length}</div><div class="summary-lbl">Bloqueados</div></div>
<div class="summary-item"><div class="summary-val">${Object.keys(themesMap).length - sorted.length}</div><div class="summary-lbl">Libres</div></div>
<div class="summary-item"><div class="summary-val">${Object.keys(themesMap).length}</div><div class="summary-lbl">Total Bosquejos</div></div>
    </div>
    <table>
<thead><tr><th style="width:60px;">#</th><th>Título</th><th>Bloqueado desde</th><th>Motivo</th><th>Oradores afectados</th></tr></thead>
<tbody>${tableRows}</tbody>
    </table>
    <div class="footer">DiscursApp · Circuito 16 · ${new Date().getFullYear()}</div>
</body></html>`;

    const win = openPdfWindow(html);
    if (win) { setTimeout(() => { try { win.print(); } catch(e) {} }, 500); }
    else { mostrarToast('⚠️ Permite popups para exportar PDF.', 'error'); }
}

function exportarHistorialMatriz() {
    if (!matrizCong) { mostrarToast('⚠️ Selecciona una congregación matriz primero.', 'error'); return; }
    const nMatriz = normalizeStr(matrizCong);
    const hist = allAssignments.filter(a => normalizeStr(a.destino) === nMatriz);
    if (!hist.length) { mostrarToast('No hay discursos registrados en ' + matrizCong + ' para exportar.', 'error'); return; }

    const sorted = [...hist].sort((a, b) => {
        const mi = MESES.indexOf(a.mes) - MESES.indexOf(b.mes);
        if (mi !== 0) return mi;
        return parseStringToDate(a.fecha) - parseStringToDate(b.fecha);
    });

    const headers = ['Mes', 'Orador', 'Origen', 'Bosquejo #', 'Tema', 'Fecha', 'Hora'];
    const rows = sorted.map(a => [
        a.mes || '',
        a.nombre || '',
        a.origen || '',
        a.temaNum || '',
        themesMap[a.temaNum] || '',
        a.fecha || '',
        a.hora || ''
    ]);

    const escape = v => `"${(v||'').toString().replace(/"/g,'""')}"`;
    const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discursapp_historial_${normalizeStr(matrizCong)}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast(`✓ Exportados ${rows.length} discurso(s) del historial de ${matrizCong}.`, 'success');
}

function exportarHistorialMatrizPDF() {
    if (!matrizCong) { mostrarToast('⚠️ Selecciona una congregación matriz primero.', 'error'); return; }
    const nMatriz = normalizeStr(matrizCong);
    const hist = allAssignments.filter(a => normalizeStr(a.destino) === nMatriz);
    if (!hist.length) { mostrarToast('No hay discursos registrados en ' + matrizCong + ' para exportar.', 'error'); return; }

    const sorted = [...hist].sort((a, b) => {
        const mi = MESES.indexOf(a.mes) - MESES.indexOf(b.mes);
        if (mi !== 0) return mi;
        return parseStringToDate(a.fecha) - parseStringToDate(b.fecha);
    });

    // Agrupar por mes
    const porMes = {};
    sorted.forEach(a => { if (!porMes[a.mes]) porMes[a.mes] = []; porMes[a.mes].push(a); });
    const mesesConHist = MESES.filter(m => porMes[m]?.length);

    const tableRows = mesesConHist.map(m => {
        const items = porMes[m];
        const monthHeader = `<tr><td colspan="6" style="background:#f0f4ff;padding:8px 12px;font-weight:700;color:#2563eb;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">${escHtml(m)} (${items.length})</td></tr>`;
        const rows = items.map((a, i) => {
            const abs = isAbsent(a);
            const absInfo = abs ? getAbsenceInfo(a) : null;
            const hasSust = abs && absInfo && absInfo.sustituto;
            let absCell = '';
            if (hasSust) {
                absCell = '<td style="padding:8px 12px;font-size:11px;background:#f0fdf4;"><span style="color:#16a34a;font-weight:700;">🟢 Sustituido</span><div style="font-size:10px;color:#16a34a;margin-top:2px;">' + escHtml(absInfo.sustituto.split('|')[0]) + (absInfo.temaSust ? '<br>#' + escHtml(absInfo.temaSust) + ' ' + escHtml(themesMap[absInfo.temaSust] || '') : '') + '</div></td>';
            } else if (abs) {
                absCell = '<td style="padding:8px 12px;font-size:11px;background:#fef2f2;"><span style="color:#dc2626;font-weight:700;">🔴 Ausente</span>' + (absInfo && absInfo.motivo ? '<div style="font-size:10px;color:#dc2626;margin-top:2px;">' + escHtml(absInfo.motivo) + '</div>' : '') + '</td>';
            } else {
                absCell = '<td style="padding:8px 12px;font-size:11px;color:#9ca3af;">—</td>';
            }
            const rowBg = hasSust ? 'background:#f0fdf4;' : (abs ? 'background:#fef2f2;' : '');
            return `<tr style="border-bottom:1px solid #e5e7eb;${rowBg}">
                <td style="padding:8px 12px;font-size:12px;color:#374151;">${escHtml(a.nombre)}</td>
                <td style="padding:8px 12px;font-size:12px;color:#6b7280;">${escHtml(a.origen)}</td>
                <td style="padding:8px 12px;font-weight:700;color:#111827;">#${escHtml(a.temaNum)}<div style="font-size:10px;color:#6b7280;font-weight:400;">${escHtml(themesMap[a.temaNum] || '')}</div></td>
                <td style="padding:8px 12px;font-size:12px;color:#374151;">${escHtml(a.fecha)}</td>
                <td style="padding:8px 12px;font-size:12px;color:#6b7280;">${escHtml(a.hora)}</td>
                ${absCell}
            </tr>`;
        }).join('');
        return monthHeader + rows;
    }).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
    @page { margin: 18mm 14mm; size: A4 landscape; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; margin: 0; padding: 20px; font-size: 12px; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #2563eb; padding-bottom: 14px; }
    .header h1 { font-size: 20px; color: #111827; margin: 0 0 4px; }
    .header h2 { font-size: 14px; color: #2563eb; margin: 0 0 6px; font-weight: 600; }
    .header p { font-size: 11px; color: #6b7280; margin: 2px 0; }
    .summary { display: flex; justify-content: center; gap: 30px; margin-bottom: 18px; }
    .summary-item { text-align: center; }
    .summary-val { font-size: 22px; font-weight: 800; color: #2563eb; }
    .summary-lbl { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #2563eb; color: #fff; padding: 9px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    th:first-child { border-radius: 6px 0 0 0; }
    th:last-child { border-radius: 0 6px 0 0; }
    .footer { margin-top: 16px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    @media print { body { padding: 0; } .no-print { display: none !important; } }
</style>
</head><body>
    <div class="no-print" style="text-align:right;margin-bottom:10px;">
<button onclick="window.print()" style="padding:8px 20px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">🖨 Imprimir / Guardar PDF</button>
    </div>
    <div class="header">
<h1>📜 Historial de Discursos</h1>
<h2>Congregación: ${escHtml(matrizCong)}</h2>
<p>Generado el ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
    <div class="summary">
<div class="summary-item"><div class="summary-val">${sorted.length}</div><div class="summary-lbl">Total Discursos</div></div>
<div class="summary-item"><div class="summary-val">${new Set(sorted.map(a => a.nombre)).size}</div><div class="summary-lbl">Oradores</div></div>
<div class="summary-item"><div class="summary-val">${mesesConHist.length}</div><div class="summary-lbl">Meses con Actividad</div></div>
    </div>
    <table>
<thead><tr><th>Orador</th><th>Origen</th><th>Bosquejo</th><th>Fecha</th><th>Hora</th><th>Ausencia</th></tr></thead>
<tbody>${tableRows}</tbody>
    </table>
    <div class="footer">DiscursApp · Circuito 16 · ${new Date().getFullYear()}</div>
</body></html>`;

    const win = openPdfWindow(html);
    if (win) { setTimeout(() => { try { win.print(); } catch(e) {} }, 500); }
    else { mostrarToast('⚠️ Permite popups para exportar PDF.', 'error'); }
}

// ── EXPORTAR INVITADOS A MATRIZ ──
function _getInvitadosData() {
    if (!matrizCong) return null;
    const nMatriz = normalizeStr(matrizCong);
    const hist = allAssignments.filter(a => normalizeStr(a.destino) === nMatriz);
    if (!hist.length) return null;
    const map = {};
    hist.forEach(a => {
        const key = normalizeStr(a.nombre) + '|' + normalizeStr(a.origen);
        if (!map[key]) map[key] = { nombre: a.nombre, origen: a.origen, count: 0, temas: new Set(), fechas: [] };
        map[key].count++;
        if (a.temaNum) map[key].temas.add(a.temaNum);
        map[key].fechas.push(a.fecha);
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
}

function exportarInvitadosCSV() {
    const data = _getInvitadosData();
    if (!data) { mostrarToast('No hay datos de invitados para exportar.', 'error'); return; }
    const headers = ['Orador', 'Origen', 'Visitas', 'Bosquejos', 'Fechas'];
    const rows = data.map(d => [
        d.nombre, d.origen, d.count,
        [...d.temas].sort((a,b)=>parseInt(a)-parseInt(b)).map(n => '#' + n).join(' '),
        d.fechas.join('; ')
    ]);
    const escape = v => `"${(v||'').toString().replace(/"/g,'""')}"`;
    const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discursapp_invitados_${normalizeStr(matrizCong)}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast(`✓ Exportados ${data.length} orador(es) invitados.`, 'success');
}

function exportarInvitadosPDF() {
    const data = _getInvitadosData();
    if (!data) { mostrarToast('No hay datos de invitados para exportar.', 'error'); return; }
    const tableRows = data.map((d, i) => {
        const temas = [...d.temas].sort((a,b)=>parseInt(a)-parseInt(b)).map(n => `<span style="display:inline-block;background:#ede9fe;color:#5b21b6;border-radius:4px;padding:1px 5px;font-size:9px;font-weight:700;margin:1px;">#${n} ${escHtml((themesMap[n]||'').substring(0,25))}</span>`).join(' ');
        return `<tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:8px 12px;font-size:12px;font-weight:600;color:#111827;">${i+1}</td>
            <td style="padding:8px 12px;font-size:12px;color:#111827;">${escHtml(d.nombre)}</td>
            <td style="padding:8px 12px;font-size:11px;color:#6b7280;">${escHtml(d.origen)}</td>
            <td style="padding:8px 12px;font-size:14px;font-weight:800;color:#7c3aed;text-align:center;">${d.count}</td>
            <td style="padding:8px 12px;">${temas || '<span style="color:#9ca3af;">—</span>'}</td>
        </tr>`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
    @page { margin: 18mm 14mm; size: A4; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; margin: 0; padding: 20px; font-size: 12px; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #7c3aed; padding-bottom: 14px; }
    .header h1 { font-size: 20px; color: #111827; margin: 0 0 4px; }
    .header h2 { font-size: 14px; color: #7c3aed; margin: 0 0 6px; font-weight: 600; }
    .header p { font-size: 11px; color: #6b7280; margin: 2px 0; }
    .summary { display: flex; justify-content: center; gap: 30px; margin-bottom: 18px; }
    .summary-item { text-align: center; }
    .summary-val { font-size: 22px; font-weight: 800; color: #7c3aed; }
    .summary-lbl { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #7c3aed; color: #fff; padding: 9px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    th:first-child { border-radius: 6px 0 0 0; }
    th:last-child { border-radius: 0 6px 0 0; }
    .footer { margin-top: 16px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    @media print { body { padding: 0; } }
</style></head><body>
    <div class="header">
<h1>DiscursApp — Circuito 16</h1>
<h2>Invitados a ${escHtml(matrizCong)}</h2>
<p>Discursantes que han visitado la congregación matriz</p>
<p>Generado el ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
    <div class="summary">
<div class="summary-item"><div class="summary-val">${data.length}</div><div class="summary-lbl">Oradores</div></div>
<div class="summary-item"><div class="summary-val">${data.reduce((s,d) => s + d.count, 0)}</div><div class="summary-lbl">Total Visitas</div></div>
<div class="summary-item"><div class="summary-val">${new Set(data.flatMap(d => [...d.temas])).size}</div><div class="summary-lbl">Bosquejos Diferentes</div></div>
    </div>
    <table>
<thead><tr><th>#</th><th>Orador</th><th>Origen</th><th>Visitas</th><th>Bosquejos</th></tr></thead>
<tbody>${tableRows}</tbody>
    </table>
    <div class="footer">DiscursApp · Circuito 16 · ${new Date().getFullYear()}</div>
</body></html>`;
    const win = openPdfWindow(html);
    if (win) { setTimeout(() => { try { win.print(); } catch(e) {} }, 500); }
    else { mostrarToast('⚠️ Permite popups para exportar PDF.', 'error'); }
}

function exportarCSV(vista) {
    let headers, rows;
    if (vista === 'aguayo') {
        headers = ['Discursante','Origen','Destino','Fecha','Bosquejo #','Título'];
        const tbody = document.getElementById('aguayo-table-body');
        rows = Array.from(tbody?.querySelectorAll('tr') || []).map(tr => {
            const cells = tr.querySelectorAll('td');
            if (!cells.length) return null;
            const nombre  = cells[0]?.querySelector('b')?.textContent?.trim() || '';
            const origen  = cells[1]?.textContent?.trim() || '';
            const destino = cells[2]?.textContent?.trim().replace('📍','').trim() || '';
            const fecha   = cells[3]?.querySelector('.badge-warn')?.textContent?.trim() || '';
            const numEl   = cells[4]?.querySelector('b')?.textContent?.trim() || '';
            const tit     = cells[4]?.querySelector('div')?.textContent?.trim() || '';
            return [nombre, origen, destino, fecha, numEl.replace('#',''), tit];
        }).filter(Boolean);
    } else {
        headers = ['Orador','Origen','Fecha','Bosquejo #','Título'];
        const content = document.getElementById('visitas-content');
        rows = Array.from(content?.querySelectorAll('tr') || []).slice(1).map(tr => {
            const cells = tr.querySelectorAll('td');
            if (!cells.length) return null;
            const nombre = cells[0]?.querySelector('b')?.textContent?.trim() || '';
            const origen = cells[1]?.textContent?.trim() || '';
            const fecha  = cells[2]?.querySelector('.badge-warn')?.textContent?.trim() || '';
            const num    = cells[3]?.querySelector('b')?.textContent?.trim().replace('#','') || '';
            const tit    = cells[3]?.querySelector('div')?.textContent?.trim() || '';
            return [nombre, origen, fecha, num, tit];
        }).filter(Boolean);
    }

    if (!rows.length) { mostrarToast('Sin datos para exportar.', 'error'); return; }

    const escape = v => `"${(v||'').toString().replace(/"/g,'""')}"`;
    const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discursapp_${vista}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast('✓ CSV exportado correctamente.', 'success');
}

// ── EXPORTAR CONTACTO A PDF ──────────────────────────────────────
function exportarContactoPDF(congName) {
    const key = normalizeStr(congName);
    const data = contactsMap[key] || { encargado: 'No registrado', telefono: '—', horario: '—' };
    const speakers = Array.from(new Map(globalSpeakers.map(s => [s.nombre + s.congregacion, s])).values())
        .filter(s => normalizeStr(s.congregacion) === key || fuzzyMatch(key, s.congregacion));

    const hasTel = data.telefono && data.telefono.toString().trim() !== '—' && data.telefono.toString().trim() !== '';
    const hasHorario = data.horario && data.horario.toString().trim() !== '—' && data.horario.toString().trim() !== '';

    const speakerRows = speakers.map((s, i) => {
        const temas = (s.temas || []).filter(t => t !== '' && t !== null && t !== undefined);
        const temasHtml = temas
            .map(t => {
                const title = themesMap[t] || '';
                return `<span style="display:inline-block;background:#e8f0fe;border:1px solid #c4d9f2;border-radius:4px;padding:2px 8px;margin:2px;font-size:11px;color:#1a56db;"><b>#${t}</b>${title ? ' ' + title : ''}</span>`;
            }).join(' ');
        return `<tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:10px 12px;font-weight:600;color:#111827;">${i + 1}</td>
            <td style="padding:10px 12px;">
                <div style="font-weight:600;color:#111827;font-size:13px;">${escHtml(s.nombre)}</div>
                ${s.rol ? `<div style="font-size:11px;color:#6b7280;">${escHtml(s.rol)}</div>` : ''}
            </td>
            <td style="padding:10px 12px;text-align:center;font-weight:700;color:#2563eb;font-size:13px;">${temas.length}</td>
            <td style="padding:10px 12px;">${temasHtml || '<span style="color:#9ca3af;font-style:italic;">Sin temas</span>'}</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
    @page { margin: 20mm 15mm; size: A4; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; margin: 0; padding: 20px; font-size: 12px; }
    .header { text-align: center; margin-bottom: 24px; border-bottom: 3px solid #2563eb; padding-bottom: 16px; }
    .header h1 { font-size: 22px; color: #111827; margin: 0 0 4px; }
    .header h2 { font-size: 15px; color: #2563eb; margin: 0 0 8px; font-weight: 600; }
    .header p { font-size: 11px; color: #6b7280; margin: 2px 0; }
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
    .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 600; margin-bottom: 4px; }
    .info-value { font-size: 14px; font-weight: 700; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #2563eb; color: #fff; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    th:first-child { border-radius: 6px 0 0 0; }
    th:last-child { border-radius: 0 6px 0 0; }
    .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    @media print { body { padding: 0; } .no-print { display: none !important; } }
</style>
</head><body>
    <div class="no-print" style="text-align:right;margin-bottom:10px;">
<button onclick="window.print()" style="padding:8px 20px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">🖨 Imprimir / Guardar PDF</button>
    </div>
    <div class="header">
<h1>📋 Listado de Oradores</h1>
<h2>${escHtml(congName)}</h2>
<p>Encargado: <b>${escHtml(data.encargado || '—')}</b></p>
<p>Generado el ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
    <div class="info-grid">
<div class="info-box">
    <div class="info-label">📞 Teléfono</div>
    <div class="info-value">${hasTel ? escHtml(data.telefono) : '—'}</div>
</div>
<div class="info-box">
    <div class="info-label">📅 Día de Reunión</div>
    <div class="info-value">${hasHorario ? escHtml(data.horario.toString().split(/\s+/)[0]) : '—'}</div>
</div>
<div class="info-box">
    <div class="info-label">🕐 Hora de Reunión</div>
    <div class="info-value">${hasHorario ? escHtml(data.horario.toString().split(/\s+/).slice(1).join(' ') || data.horario.toString()) : '—'}</div>
</div>
    </div>
    <table>
<thead><tr><th style="width:30px;">#</th><th>Orador</th><th style="width:50px;text-align:center;">Cant.</th><th>Bosquejos Preparados</th></tr></thead>
<tbody>${speakerRows || `<tr><td colspan="4" style="text-align:center;padding:20px;color:#9ca3af;font-style:italic;">Sin oradores registrados en esta congregación</td></tr>`}</tbody>
    </table>
    <div class="footer">DiscursApp · Circuito 16 · ${new Date().getFullYear()}</div>
</body></html>`;

    const win = openPdfWindow(html);
    if (win) { setTimeout(() => { try { win.print(); } catch(e) {} }, 500); }
    else { mostrarToast('⚠️ Permite popups para exportar PDF.', 'error'); }
}

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  exportarBosquejosBloqueados,
  exportarBosquejosBloqueadosPDF,
  exportarHistorialMatriz,
  exportarHistorialMatrizPDF,
  _getInvitadosData,
  exportarInvitadosCSV,
  exportarInvitadosPDF,
  exportarCSV,
  exportarContactoPDF,
});
