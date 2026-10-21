/* ==========================================================================
   Impresion de vistas
   Origen: DISCURSAPP .html, script principal (L8957-9781)
   ========================================================================== */
function printDispCongView() {
    const unique = Array.from(new Map(globalSpeakers.map(s => [s.nombre + s.congregacion, s])).values());
    const congFilter = document.getElementById('disp-cong-filter');
    const searchVal = normalizeStr((document.getElementById('disp-speaker-search')?.value || '').trim());
    const selectedCong = congFilter ? congFilter.value : 'TODOS';
    let pool = unique;
    if (selectedCong !== 'TODOS') pool = pool.filter(s => s.congregacion === selectedCong);
    if (searchVal) pool = pool.filter(s => normalizeStr(s.nombre).includes(searchVal) || normalizeStr(s.congregacion).includes(searchVal));
    pool.sort((a, b) => { const cg = a.congregacion.localeCompare(b.congregacion); return cg !== 0 ? cg : a.nombre.localeCompare(b.nombre); });
    if (!pool.length) return;

    const groups = {};
    pool.forEach(s => { (groups[s.congregacion] = groups[s.congregacion] || []).push(s); });

    const currentYear = new Date().getFullYear();
    const eventos = cargarEventos();
    const asignacionesConFecha = getAsignacionesConFecha();

    function getSaturdayNumbers(monthIdx) {
        const sats = [];
        const d = new Date(currentYear, monthIdx, 1);
        while (d.getMonth() === monthIdx) {
            if (d.getDay() === 6) sats.push(d.getDate());
            d.setDate(d.getDate() + 1);
        }
        return sats;
    }

    function isDateBlockedByEvent(date) {
        return eventos.some(ev => {
            if (!ev.bloquea) return false;
            const ini = new Date(ev.fechaInicio + 'T00:00:00');
            const fin = ev.fechaFin ? new Date(ev.fechaFin + 'T23:59:59') : new Date(ev.fechaInicio + 'T23:59:59');
            return date >= ini && date <= fin;
        });
    }

    const monthHeaders = MESES.map(m => `<th style="padding:5px 3px;font-size:9px;text-align:center;width:38px;border:1px solid #ccc;background:#f5f5f7;">${m.substring(0,3)}</th>`).join('');

    let bodyHtml = '';
    Object.entries(groups).sort((a,b) => a[0].localeCompare(b[0])).forEach(([cong, speakers]) => {
        const contact = contactsMap[normalizeStr(cong)] || { encargado: '—', telefono: '—', horario: '—' };
        let rows = '';
        let detailBlocks = '';
        let printedCount = 0;
        speakers.forEach(s => {
            const hasTemas = (s.temas || []).length > 0;
            const hasDisp = Object.keys(s.disponibilidad || {}).length > 0;
            const hasAsign = allAssignments.some(a => normalizeStr(a.nombre) === normalizeStr(s.nombre) && normalizeStr(a.origen) === normalizeStr(cong));
            if (!hasTemas && !hasDisp && !hasAsign) return;
            printedCount++;

            const outsThisCong = asignacionesConFecha.filter(a =>
                normalizeStr(a.nombre) === normalizeStr(s.nombre) &&
                normalizeStr(a.origen) === normalizeStr(cong)
            );

            const monthCells = MESES.map(mes => {
                const val = (s.disponibilidad[mes] || '').toLowerCase();
                let bg = '', color = '', label = '—';
                if (val === 'disponible') { bg = '#d4edda'; color = '#155724'; label = '✓'; }
                else if (val === 'asignado') { bg = '#fff3cd'; color = '#856404'; label = 'A'; }
                return `<td style="text-align:center;padding:5px 3px;font-size:10px;font-weight:700;border:1px solid #ccc;background:${bg};color:${color};">${label}</td>`;
            }).join('');

            const temasHtml = (s.temas || []).length
                ? s.temas.map(n => `<span style="display:inline-block;background:#f0f4ff;border:1px solid #cce0ff;border-radius:3px;padding:1px 5px;font-size:9px;margin:1px 2px;color:#333;"><b>#${n}</b> ${escHtml(themesMap[n] || '')}</span>`).join(' ')
                : '<span style="color:#999;">—</span>';

            const outs = allAssignments.filter(a => normalizeStr(a.nombre) === normalizeStr(s.nombre) && normalizeStr(a.origen) === normalizeStr(cong));
            const lastOut = outs.length ? outs.sort((a,b) => parseStringToDate(b.fecha) - parseStringToDate(a.fecha))[0] : null;

            rows += `<tr>
                <td style="padding:8px;font-weight:600;font-size:11px;border:1px solid #ccc;white-space:nowrap;vertical-align:top;">${escHtml(s.nombre)}<br><span style="font-weight:400;font-size:9px;color:#888;">${escHtml(s.rol || '')}${s.telefono ? ' · ' + escHtml(s.telefono) : ''}</span></td>
                ${monthCells}
                <td style="padding:6px 8px;font-size:9px;border:1px solid #ccc;color:#555;vertical-align:top;">${temasHtml}${lastOut ? `<br><span style="font-size:8px;color:#999;">Última: ${escHtml(lastOut.fecha)} → ${escHtml(lastOut.destino)}</span>` : ''}</td>
            </tr>`;

            const mesLines = [];
            MESES.forEach((mes, mesIdx) => {
                const val = (s.disponibilidad[mes] || '').toLowerCase();
                if (val !== 'disponible' && val !== 'asignado') return;
                const satNums = getSaturdayNumbers(mesIdx);
                const diasAsig = [];
                outsThisCong.forEach(a => {
                    if (a._date && a._date.getMonth() === mesIdx) diasAsig.push(a._date.getDate());
                });
                const sabadosLibres = [];
                satNums.forEach(sat => {
                    const satDate = new Date(currentYear, mesIdx, sat);
                    if (!diasAsig.includes(sat) && !isDateBlockedByEvent(satDate)) sabadosLibres.push(sat);
                });
                if (!diasAsig.length && !sabadosLibres.length) return;
                const parts = [];
                const abbrMes = ['Ene.','Feb.','Mar.','Abr.','May.','Jun.','Jul.','Ago.','Sep.','Oct.','Nov.','Dic.'];
                if (diasAsig.length) parts.push(`<span style="color:#856404;"><b>Asig:</b> ${diasAsig.map(d => d + ' ' + abbrMes[mesIdx]).join(', ')}</span>`);
                if (sabadosLibres.length) parts.push(`<span style="color:#155724;"><b>Lib:</b> ${sabadosLibres.map(d => d + ' ' + abbrMes[mesIdx]).join(', ')}</span>`);
                mesLines.push(`<span style="margin-right:14px;"><b>${mes}:</b> ${parts.join(' · ')}</span>`);
            });
            if (mesLines.length) {
                detailBlocks += `<div style="margin-bottom:10px;"><span style="font-weight:700;font-size:9px;color:#333;">${escHtml(s.nombre)}:</span> <span style="font-size:8px;line-height:1.6;">${mesLines.join('<br>')}</span></div>`;
            }
        });

        if (!printedCount) return;

        bodyHtml += `<div style="margin-bottom:24px;">
            <div style="font-size:13px;font-weight:700;padding:8px 12px;background:#f0f7ff;border:1px solid #cce0ff;border-radius:4px 4px 0 0;display:flex;justify-content:space-between;flex-wrap:wrap;">
                <span>${escHtml(cong)} (${printedCount})</span>
                <span style="font-weight:400;font-size:10px;color:#666;">Coord: ${escHtml(contact.encargado)} · Tel: ${escHtml(contact.telefono)} · ${escHtml(contact.horario)}</span>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:10px;">
                <thead><tr>
                    <th style="padding:5px 8px;text-align:left;border:1px solid #ccc;font-size:9px;background:#f5f5f7;width:130px;">Orador</th>
                    ${monthHeaders}
                    <th style="padding:5px 8px;text-align:left;border:1px solid #ccc;font-size:9px;background:#f5f5f7;">Bosquejos</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>
            ${detailBlocks ? `<div style="margin-top:8px;padding:8px 12px;background:#fafafa;border:1px solid #eee;border-radius:0 0 4px 4px;font-size:9px;color:#444;"><div style="font-weight:700;font-size:10px;color:#333;margin-bottom:4px;">📋 Asignaciones y Sábados Libres (${currentYear})</div>${detailBlocks}</div>` : ''}
        </div>`;
    });

    const now = new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'long', year:'numeric' });
    const win = openPdfWindow(`<!DOCTYPE html><html><head><title>Circuito 16 — Listado por Congregación</title>
        <style>
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; color: #1d1d1f; margin: 0; }
            h1 { font-size: 18px; text-align: center; margin: 0 0 2px; }
            p.sub { text-align: center; font-size: 11px; color: #86868b; margin: 0 0 4px; }
            p.date { text-align: center; font-size: 10px; color: #aaa; margin: 0 0 20px; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
            @media print { body { padding: 10px; } @page { margin: 10mm; } }
        </style></head><body>
        <h1>Circuito 16 — Listado por Congregación</h1>
        <p class="sub">Disponibilidad anual y bosquejos de discursantes</p>
        <p class="date">${now}</p>
        ${bodyHtml}
        </body></html>`);
    if (win) { win.focus(); setTimeout(() => { try { win.print(); } catch(e) {} }, 500); }
}

function printMonthView() {
    const m = document.getElementById('month-selector').value;
    const searchVal = normalizeStr((document.getElementById('month-speaker-search')?.value || '').trim());
    const statusFilter = document.getElementById('month-status-filter')?.value || 'TODOS';
    const unique = getUnique();
    const mesPrefix = m.substring(0,3).toLowerCase();
    let pool = unique.filter(s => {
        const d = (s.disponibilidad[m] || '').toLowerCase();
        return d === 'disponible' || d === 'asignado';
    });
    let libresCount = 0, asignadosCount = 0;
    pool.forEach(s => {
        const tieneAsig = getAssignmentsFor(s.nombre).some(a => a.fecha.toLowerCase().includes(mesPrefix));
        if (tieneAsig) asignadosCount++; else libresCount++;
    });
    if (searchVal) pool = pool.filter(s => normalizeStr(s.nombre).includes(searchVal));
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
    if (!pool.length) { mostrarToast('No hay discursantes para imprimir.', 'error'); return; }

    const statusLabel = statusFilter === 'LIBRE' ? '— Libres' : statusFilter === 'ASIGNADO' ? '— Asignados' : '';
    const rowsHtml = pool.map(s => {
        const tieneAsig = getAssignmentsFor(s.nombre).some(a => a.fecha.toLowerCase().includes(mesPrefix));
        const estadoBadge = tieneAsig
            ? `<span style="color:#856404;font-weight:700;">Asignado</span>`
            : `<span style="color:#155724;font-weight:700;">Libre</span>`;
        const temas = (s.temas || []).length ? s.temas.map(n => `<b>#${n}</b> ${themesMap[n] || ''}`).join(', ') : '—';
        const outs = getAssignmentsFor(s.nombre);
        const outsThisMonth = outs.filter(a => a.fecha.toLowerCase().includes(mesPrefix));
        const outDetail = outsThisMonth.length ? outsThisMonth.map(a => `${a.fecha} → ${a.destino}`).join(', ') : '—';
        return `<tr>
            <td style="padding:8px 10px;font-weight:600;font-size:11px;border:1px solid #ccc;">${escHtml(s.nombre)}</td>
            <td style="padding:8px 10px;font-size:10px;border:1px solid #ccc;color:#555;">${escHtml(s.rol || '—')}</td>
            <td style="padding:8px 10px;font-size:10px;border:1px solid #ccc;color:#555;">${escHtml(s.congregacion)}</td>
            <td style="padding:8px 10px;font-size:10px;border:1px solid #ccc;color:#555;">${escHtml(s.telefono || '—')}</td>
            <td style="padding:8px 10px;text-align:center;border:1px solid #ccc;">${estadoBadge}</td>
            <td style="padding:8px 10px;font-size:9px;border:1px solid #ccc;color:#444;">${temas}</td>
            <td style="padding:8px 10px;font-size:9px;border:1px solid #ccc;color:#555;">${outDetail}</td>
        </tr>`;
    }).join('');

    const now = new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'long', year:'numeric' });
    const win = openPdfWindow(`<!DOCTYPE html><html><head><title>Circuito 16 — ${m} — Discursantes Libres</title>
        <style>
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; color: #1d1d1f; margin: 0; }
            h1 { font-size: 18px; text-align: center; margin: 0 0 2px; }
            p.sub { text-align: center; font-size: 11px; color: #86868b; margin: 0 0 4px; }
            p.date { text-align: center; font-size: 10px; color: #aaa; margin: 0 0 16px; }
            .stats { text-align: center; font-size: 11px; color: #555; margin-bottom: 16px; display: flex; justify-content: center; gap: 24px; }
            .stat { display: flex; flex-direction: column; align-items: center; }
            .stat-val { font-size: 18px; font-weight: 700; color: #111; }
            .stat-lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            tr { page-break-inside: avoid; }
            @media print { body { padding: 10px; } @page { margin: 10mm; } }
        </style></head><body>
        <h1>Circuito 16 — ${escHtml(m)} ${escHtml(statusLabel)}</h1>
        <p class="sub">Discursantes disponibles del mes</p>
        <p class="date">${now}</p>
        <div class="stats">
            <div class="stat"><span class="stat-val">${pool.length}</span><span class="stat-lbl">Disponibles</span></div>
            <div class="stat"><span class="stat-val">${libresCount}</span><span class="stat-lbl">Libres</span></div>
            <div class="stat"><span class="stat-val">${asignadosCount}</span><span class="stat-lbl">Asignados</span></div>
        </div>
        <table>
            <thead><tr>
                <th style="padding:6px 10px;text-align:left;border:1px solid #ccc;font-size:9px;background:#f5f5f7;">Orador</th>
                <th style="padding:6px 10px;text-align:left;border:1px solid #ccc;font-size:9px;background:#f5f5f7;">Rol</th>
                <th style="padding:6px 10px;text-align:left;border:1px solid #ccc;font-size:9px;background:#f5f5f7;">Congregación</th>
                <th style="padding:6px 10px;text-align:left;border:1px solid #ccc;font-size:9px;background:#f5f5f7;">Contacto</th>
                <th style="padding:6px 10px;text-align:center;border:1px solid #ccc;font-size:9px;background:#f5f5f7;">Estado</th>
                <th style="padding:6px 10px;text-align:left;border:1px solid #ccc;font-size:9px;background:#f5f5f7;">Bosquejos</th>
                <th style="padding:6px 10px;text-align:left;border:1px solid #ccc;font-size:9px;background:#f5f5f7;">Salidas este mes</th>
            </tr></thead>
            <tbody>${rowsHtml}</tbody>
        </table>
        </body></html>`);
    if (win) { win.focus(); setTimeout(() => { try { win.print(); } catch(e) {} }, 500); }
}

function openPdfWindow(html) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) { mostrarToast('⚠️ Permite popups para exportar PDF.', 'error'); URL.revokeObjectURL(url); return null; }
    win.addEventListener('afterprint', () => { URL.revokeObjectURL(url); }, { once: true });
    return win;
}

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  printDispCongView,
  printMonthView,
  openPdfWindow,
});
