/* ==========================================================================
   Panel de estadisticas y detalles
   Origen: DISCURSAPP .html, script principal (L5531-7135)
   ========================================================================== */
function gfUpdate(key) {
    const s = gfState[key];
    if (!s) return;
    const track = document.getElementById(key + '-gf-track');
    if (!track) return;
    const cards = track.querySelectorAll('.gf-card');
    const total = cards.length;
    if (!total) return;
    const vw = track.parentElement.clientWidth;
    const cx = vw / 2;
    const cardW = s.cardW || 200;
    const step = cardW * 0.38;

    cards.forEach((card, i) => {
        const offset = i - s.center;
        const absOff = Math.abs(offset);
        let tx = offset * step;
        let ty = 0, sc = 1, op = 1;
        let z = total - absOff;
        let cls = '';

        if (offset === 0) {
            sc = 1.1; ty = -6; op = 1; cls = 'gf-card-center';
        } else if (absOff === 1) {
            sc = 0.92; ty = 2; op = 0.7; cls = 'gf-card-near';
        } else {
            sc = 0.7; ty = 8; op = 0; cls = 'gf-card-edge';
        }

        card.style.transform = `translateX(${cx + tx - cardW / 2}px) translateY(${ty}px) scale(${sc})`;
        card.style.opacity = op;
        card.style.zIndex = z;
        card.classList.remove('gf-card-center', 'gf-card-near', 'gf-card-edge');
        if (cls) card.classList.add(cls);
    });

    const dots = document.getElementById(key + '-gf-dots');
    if (dots) {
        dots.querySelectorAll('.gf-dot').forEach((d, i) => {
            d.classList.toggle('active', i === s.center);
        });
    }
}

function gfNav(key, dir) {
    const s = gfState[key];
    if (!s) return;
    s.center = Math.max(0, Math.min(s.total - 1, s.center + dir));
    gfUpdate(key);
}

function gfGoTo(key, idx) {
    const s = gfState[key];
    if (!s) return;
    s.center = idx;
    gfUpdate(key);
}

function gfInitDrag(key) {
    const track = document.getElementById(key + '-gf-track');
    const viewport = document.getElementById(key + '-gf-viewport');
    if (!track) return;
    if (track._gfDragBound) return;
    track._gfDragBound = true;
    let dragging = false, startX = 0, startCenter = 0;

    track.addEventListener('mousedown', e => {
        if (e.target.closest('.gf-nav')) return;
        dragging = true; startX = e.clientX; startCenter = gfState[key].center;
        e.preventDefault();
    });
    window.addEventListener('mousemove', e => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const step = (gfState[key].cardW || 200) * 0.38;
        const newCenter = Math.round(startCenter - dx / step);
        const s = gfState[key];
        const clamped = Math.max(0, Math.min(s.total - 1, newCenter));
        if (clamped !== s.center) { s.center = clamped; gfUpdate(key); }
    });
    window.addEventListener('mouseup', () => { dragging = false; });

    let touchStartX = 0, touchStartCenter = 0;
    track.addEventListener('touchstart', e => {
        if (e.target.closest('.gf-nav')) return;
        touchStartX = e.touches[0].clientX;
        touchStartCenter = gfState[key].center;
    }, { passive: true });
    track.addEventListener('touchmove', e => {
        const dx = e.touches[0].clientX - touchStartX;
        const step = (gfState[key].cardW || 200) * 0.38;
        const newCenter = Math.round(touchStartCenter - dx / step);
        const s = gfState[key];
        const clamped = Math.max(0, Math.min(s.total - 1, newCenter));
        if (clamped !== s.center) { s.center = clamped; gfUpdate(key); }
    }, { passive: true });

    if (viewport) {
        viewport.addEventListener('wheel', e => {
            e.preventDefault();
            if (e.deltaY > 0 || e.deltaX > 0) gfNav(key, 1);
            else if (e.deltaY < 0 || e.deltaX < 0) gfNav(key, -1);
        }, { passive: false });
    }
}

function toggleStatCard(cardEl) {
    cardEl.classList.toggle('expanded');
}

function openMonthDetail(mes) {
    const asigs = allAssignments
        .filter(a => a.mes === mes)
        .sort((a, b) => parseStringToDate(a.fecha) - parseStringToDate(b.fecha));
    const existing = document.querySelector('.stat-expanded-overlay');
    if (existing) { window._prevExpandedOverlay = existing; existing.remove(); }
    const overlay = document.createElement('div');
    overlay.className = 'stat-expanded-overlay';
    overlay.onclick = e => { if (e.target === overlay) { overlay.remove(); goBackToExpanded(); } };
    const rows = asigs.length ? asigs.map(a => `
        <div class="stat-list-row" style="cursor:pointer;" onclick="event.stopPropagation();closeStatExpanded();openModal('${escJs(a.nombre)}','${escJs(a.origen)}')">
            <span style="flex-shrink:0;">${getPhotoMini(a.nombre, a.origen)}</span>
            <div class="stat-list-info">
                <div class="stat-list-name">${escHtml(a.nombre)} ${ratingBadgeHtml(getSpeakerRating(a.nombre, a.origen), true)}</div>
                <div class="stat-list-sub">${escHtml(a.origen)} → ${escHtml(a.destino)} · ${escHtml(a.fecha)}</div>
            </div>
            <span class="stat-list-val blue">#${escHtml(a.temaNum)}</span>
        </div>`).join('') : '<div class="stat-no-data">Sin asignaciones registradas en este mes</div>';
    const title = MESES.includes(mes) ? mes : mes;
    const abbr = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const idx = MESES.indexOf(mes);
    overlay.innerHTML = `
        <div class="stat-expanded-box">
            <div class="stat-expanded-header">
                <div class="stat-expanded-header-left">
                    <span style="font-size:20px;">📊</span>
                    <span style="font-weight:700;font-size:14px;color:var(--text-1);">Asignaciones de ${escHtml(title)} (${abbr[idx] || ''})</span>
                    <span style="font-size:11px;color:var(--text-3);">${asigs.length} asignación${asigs.length !== 1 ? 'es' : ''}</span>
                </div>
                <div class="stat-expanded-nav">
                    <button onclick="goBackToExpanded()" title="Volver" style="width:auto;padding:0 12px;border-radius:var(--radius-sm);font-size:12px;font-weight:600;gap:4px;">← Volver</button>
                    <button onclick="closeStatExpanded()" title="Cerrar">✕</button>
                </div>
            </div>
            <div class="stat-expanded-body">
                <div class="stat-card-list">${rows}</div>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    if (typeof G !== 'undefined') G.statOverlayIn(overlay, overlay.querySelector('.stat-expanded-box'));
}

function openCongDetail(congName) {
    const enviados = allAssignments
        .filter(a => normalizeStr(a.origen) === normalizeStr(congName))
        .sort((a, b) => parseStringToDate(a.fecha) - parseStringToDate(b.fecha));
    const recibidos = allAssignments
        .filter(a => normalizeStr(a.destino) === normalizeStr(congName))
        .sort((a, b) => parseStringToDate(a.fecha) - parseStringToDate(b.fecha));
    const existing = document.querySelector('.stat-expanded-overlay');
    if (existing) { window._prevExpandedOverlay = existing; existing.remove(); }
    const overlay = document.createElement('div');
    overlay.className = 'stat-expanded-overlay';
    overlay.onclick = e => { if (e.target === overlay) { overlay.remove(); goBackToExpanded(); } };

    function buildRows(arr, type) {
        if (!arr.length) return '<div class="stat-no-data">Sin datos en esta categoría</div>';
        return arr.map(a => {
            return `<div class="stat-list-row" style="cursor:pointer;" onclick="event.stopPropagation();closeStatExpanded();openModal('${escJs(a.nombre)}','${escJs(a.origen)}')">
                <span style="flex-shrink:0;">${getPhotoMini(a.nombre, a.origen)}</span>
                <div class="stat-list-info">
                    <div class="stat-list-name">${escHtml(a.nombre)} ${ratingBadgeHtml(getSpeakerRating(a.nombre, a.origen), true)}</div>
                    <div class="stat-list-sub">${type === 'env' ? '→ ' + escHtml(a.destino) : '← ' + escHtml(a.origen)} · ${escHtml(a.fecha)}</div>
                </div>
                <span class="stat-list-val blue">#${escHtml(a.temaNum)}</span>
            </div>`;
        }).join('');
    }

    overlay.innerHTML = `
        <div class="stat-expanded-box">
            <div class="stat-expanded-header">
                <div class="stat-expanded-header-left">
                    <span style="font-size:20px;">🏛️</span>
                    <span style="font-weight:700;font-size:14px;color:var(--text-1);">${escHtml(congName)}</span>
                    <span style="font-size:11px;color:var(--text-3);">${enviados.length} envío${enviados.length !== 1 ? 's' : ''} · ${recibidos.length} visita${recibidos.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="stat-expanded-nav">
                    <button onclick="goBackToExpanded()" title="Volver" style="width:auto;padding:0 12px;border-radius:var(--radius-sm);font-size:12px;font-weight:600;gap:4px;">← Volver</button>
                    <button onclick="closeStatExpanded()" title="Cerrar">✕</button>
                </div>
            </div>
            <div class="stat-expanded-body">
                <div class="stat-card-list">
                    <div style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">📤 Oradores enviados (${enviados.length})</div>
                    ${buildRows(enviados, 'env')}
                    <div style="font-size:11px;font-weight:700;color:var(--accent);margin:14px 0 6px;text-transform:uppercase;letter-spacing:0.5px;">📥 Visitas recibidas (${recibidos.length})</div>
                    ${buildRows(recibidos, 'rec')}
                </div>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    if (typeof G !== 'undefined') G.statOverlayIn(overlay, overlay.querySelector('.stat-expanded-box'));
}

function openDuplicateDetail(idx) {
    const lista = (window._duplicadas || [])[idx];
    if (!lista || !lista.length) return;
    const primerA = lista[0];
    const existing = document.querySelector('.stat-expanded-overlay');
    if (existing) { window._prevExpandedOverlay = existing; existing.remove(); }
    const overlay = document.createElement('div');
    overlay.className = 'stat-expanded-overlay';
    overlay.onclick = e => { if (e.target === overlay) { overlay.remove(); goBackToExpanded(); } };

    const rows = lista.map(a => `
        <div class="stat-list-row" style="cursor:pointer;" onclick="event.stopPropagation();closeStatExpanded();openModal('${escJs(a.nombre)}','${escJs(a.origen)}')">
            <span style="flex-shrink:0;">${getPhotoMini(a.nombre, a.origen)}</span>
            <div class="stat-list-info">
                <div class="stat-list-name">${escHtml(a.nombre)} ${ratingBadgeHtml(getSpeakerRating(a.nombre, a.origen), true)}</div>
                <div class="stat-list-sub">${escHtml(a.origen)} · ${escHtml(a.fecha)}</div>
            </div>
            <span class="stat-list-val blue">#${escHtml(String(a.temaNum || ''))}</span>
        </div>`).join('');

    overlay.innerHTML = `
        <div class="stat-expanded-box">
            <div class="stat-expanded-header">
                <div class="stat-expanded-header-left">
                    <span style="font-size:20px;">🔁</span>
                    <span style="font-weight:700;font-size:14px;color:var(--text-1);">${escHtml(primerA.destino)} — ${escHtml(primerA.fecha)}</span>
                    <span style="font-size:11px;color:var(--text-3);">${lista.length} oradores asignados</span>
                </div>
                <div class="stat-expanded-nav">
                    <button onclick="goBackToExpanded()" title="Volver" style="width:auto;padding:0 12px;border-radius:var(--radius-sm);font-size:12px;font-weight:600;gap:4px;">← Volver</button>
                    <button onclick="closeStatExpanded()" title="Cerrar">✕</button>
                </div>
            </div>
            <div class="stat-expanded-body">
                <div class="stat-card-list">${rows}</div>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    if (typeof G !== 'undefined') G.statOverlayIn(overlay, overlay.querySelector('.stat-expanded-box'));
}

function openTemaDetail(num) {
    const temaNum = String(num).trim();
    const titulo = themesMap[temaNum] || '';
    const asigs = allAssignments
        .filter(a => String(a.temaNum).trim() === temaNum)
        .sort((a, b) => parseStringToDate(a.fecha) - parseStringToDate(b.fecha));
    const unique = Array.from(new Map(globalSpeakers.map(s => [s.nombre + '|' + s.congregacion, s])).values());
    const preparadores = unique.filter(s => (s.temas || []).map(String).map(t => t.trim()).includes(temaNum));
    const existing = document.querySelector('.stat-expanded-overlay');
    if (existing) { window._prevExpandedOverlay = existing; existing.remove(); }
    const overlay = document.createElement('div');
    overlay.className = 'stat-expanded-overlay';
    overlay.onclick = e => { if (e.target === overlay) { overlay.remove(); goBackToExpanded(); } };

    const prepRows = preparadores.length ? preparadores.map(s => `
        <div class="stat-list-row" style="cursor:pointer;" onclick="event.stopPropagation();closeStatExpanded();openModal('${escJs(s.nombre)}','${escJs(s.congregacion)}')">
            <span style="flex-shrink:0;">${getPhotoMini(s.nombre, s.congregacion)}</span>
            <div class="stat-list-info">
                <div class="stat-list-name">${escHtml(s.nombre)} ${ratingBadgeHtml(getSpeakerRating(s.nombre, s.congregacion), true)}</div>
                <div class="stat-list-sub">${escHtml(s.congregacion)}${s.rol ? ' · ' + escHtml(s.rol) : ''}</div>
            </div>
            <span class="stat-list-val green" style="font-size:11px;">Preparado</span>
        </div>`).join('') : '<div class="stat-no-data">Ningún orador tiene registrado este bosquejo</div>';

    const asigRows = asigs.length ? asigs.map(a => `
        <div class="stat-list-row" style="cursor:pointer;" onclick="event.stopPropagation();closeStatExpanded();openModal('${escJs(a.nombre)}','${escJs(a.origen)}')">
            <span style="flex-shrink:0;">${getPhotoMini(a.nombre, a.origen)}</span>
            <div class="stat-list-info">
                <div class="stat-list-name">${escHtml(a.nombre)} ${ratingBadgeHtml(getSpeakerRating(a.nombre, a.origen), true)}</div>
                <div class="stat-list-sub">${escHtml(a.origen)} → ${escHtml(a.destino)} · ${escHtml(a.fecha)}</div>
            </div>
            <span class="stat-list-val blue">${escHtml(a.mes || '')}</span>
        </div>`).join('') : '<div class="stat-no-data">Sin asignaciones registradas con este bosquejo</div>';

    overlay.innerHTML = `
        <div class="stat-expanded-box">
            <div class="stat-expanded-header">
                <div class="stat-expanded-header-left">
                    <span style="font-size:20px;">📖</span>
                    <span style="font-weight:700;font-size:14px;color:var(--text-1);">Bosquejo #${escHtml(temaNum)}${titulo ? ' — ' + escHtml(titulo) : ''}</span>
                    <span style="font-size:11px;color:var(--text-3);">${preparadores.length} preparador${preparadores.length !== 1 ? 'es' : ''} · ${asigs.length} asignación${asigs.length !== 1 ? 'es' : ''}</span>
                </div>
                <div class="stat-expanded-nav">
                    <button onclick="goBackToExpanded()" title="Volver" style="width:auto;padding:0 12px;border-radius:var(--radius-sm);font-size:12px;font-weight:600;gap:4px;">← Volver</button>
                    <button onclick="closeStatExpanded()" title="Cerrar">✕</button>
                </div>
            </div>
            <div class="stat-expanded-body">
                <div class="stat-card-list">
                    <div style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">👥 Oradores que lo tienen (${preparadores.length})</div>
                    ${prepRows}
                    <div style="font-size:11px;font-weight:700;color:var(--accent);margin:14px 0 6px;text-transform:uppercase;letter-spacing:0.5px;">📋 Asignaciones con este bosquejo (${asigs.length})</div>
                    ${asigRows}
                </div>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    if (typeof G !== 'undefined') G.statOverlayIn(overlay, overlay.querySelector('.stat-expanded-box'));
}

function openStatDetail(tipo) {
    const unique = Array.from(new Map(globalSpeakers.map(s => [s.nombre + '|' + s.congregacion, s])).values());
    let title = '', subtitle = '', rows = [], icon = '';

    if (tipo === 'oradores') {
        icon = '👥';
        title = 'Listado de Oradores';
        subtitle = `${unique.length} orador${unique.length !== 1 ? 'es' : ''} registrado${unique.length !== 1 ? 's' : ''}`;
        rows = unique.sort((a,b) => a.nombre.localeCompare(b.nombre)).map(s => ({
            name: s.nombre,
            sub: s.congregacion + (s.rol ? ' · ' + s.rol : '') + (s.telefono ? ' · ' + s.telefono : ''),
            val: (s.temas || []).length + ' bosq.',
            avatarHtml: getPhotoMini(s.nombre, s.congregacion),
            rating: getSpeakerRating(s.nombre, s.congregacion),
            onclick: `event.stopPropagation();openModal('${escJs(s.nombre)}','${escJs(s.congregacion)}')`
        }));
    } else if (tipo === 'congregaciones') {
        icon = '🏛️';
        title = 'Congregaciones del Circuito';
        const congs = {};
        unique.forEach(s => { congs[s.congregacion] = (congs[s.congregacion] || 0) + 1; });
        const sorted = Object.entries(congs).sort((a,b) => b[1] - a[1]);
        subtitle = `${sorted.length} congregación${sorted.length !== 1 ? 'es' : ''}`;
        rows = sorted.map(([name, count]) => ({
            name: name,
            sub: `${count} orador${count !== 1 ? 'es' : ''} registrado${count !== 1 ? 's' : ''}`,
            val: count,
            onclick: `event.stopPropagation();openCongDetail('${escJs(name)}')`
        }));
    } else if (tipo === 'asignaciones') {
        icon = '📋';
        title = 'Todas las Asignaciones';
        subtitle = `${allAssignments.length} asignación${allAssignments.length !== 1 ? 'es' : ''} registrada${allAssignments.length !== 1 ? 's' : ''}`;
        rows = [...allAssignments].sort((a,b) => (parseStringToDate(b.fecha)||0) - (parseStringToDate(a.fecha)||0)).slice(0, 50).map(a => ({
            name: a.nombre,
            sub: `${a.origen} → ${a.destino} · ${a.fecha}`,
            val: '#' + a.temaNum,
            avatarHtml: getPhotoMini(a.nombre, a.origen),
            rating: getSpeakerRating(a.nombre, a.origen),
            onclick: `event.stopPropagation();openModal('${escJs(a.nombre)}','${escJs(a.origen)}')`
        }));
    } else if (tipo === 'bosquejos') {
        icon = '📖';
        title = 'Bosquejos Utilizados';
        const temaCount = {};
        allAssignments.forEach(a => { if (a.temaNum) temaCount[a.temaNum] = (temaCount[a.temaNum] || 0) + 1; });
        const temasUsados = Object.entries(temaCount).sort((a,b) => b[1] - a[1]);
        subtitle = `${temasUsados.length} bosquejo${temasUsados.length !== 1 ? 's' : ''} usado${temasUsados.length !== 1 ? 's' : ''}`;
        rows = temasUsados.map(([num, count]) => ({
            name: `#${num} — ${themesMap[num] || 'Sin título'}`,
            sub: `${count} asignación${count !== 1 ? 'es' : ''}`,
            val: count,
            onclick: `event.stopPropagation();openTemaDetail('${escJs(num)}')`
        }));
    } else if (tipo === 'bloqueados') {
        icon = '🚫';
        title = 'Bosquejos Bloqueados';
        const bloq = Object.entries(blockedThemes);
        subtitle = `${bloq.length} bosquejo${bloq.length !== 1 ? 's' : ''} bloqueado${bloq.length !== 1 ? 's' : ''}`;
        rows = bloq.map(([num, info]) => {
            const fromIdx = info.fromMonth === 'TODOS' ? -1 : MESES.indexOf(info.fromMonth);
            const nAsig = allAssignments.filter(a => {
                if (String(a.temaNum).trim() !== num) return false;
                if (fromIdx < 0) return true;
                const aIdx = MESES.indexOf(a.mes);
                return aIdx >= fromIdx;
            }).length;
            return {
                name: `#${num} — ${themesMap[num] || 'Sin título'}`,
                sub: info.motivo || 'Sin motivo especificado',
                val: nAsig > 0 ? `${nAsig} asignación${nAsig !== 1 ? 'es' : ''}` : info.congregacion || 'Todos',
                avatarHtml: nAsig > 0 ? `<span style="font-size:10px;padding:2px 8px;background:#fef3c7;color:#8a4c0e;border-radius:8px;font-weight:700;white-space:nowrap;">⚠️ ${nAsig} asignado${nAsig !== 1 ? 's' : ''}</span>` : '',
                onclick: `event.stopPropagation();openTemaDetail('${escJs(num)}')`
            };
        });
    } else if (tipo === 'ausencias') {
        icon = '🔴';
        title = 'Ausencias de Oradores';
        const absent = allAssignments.filter(a => isAbsent(a)).sort((a,b) => (parseStringToDate(b.fecha)||0) - (parseStringToDate(a.fecha)||0));
        subtitle = `${absent.length} ausencia${absent.length !== 1 ? 's' : ''} registrada${absent.length !== 1 ? 's' : ''}`;
        rows = absent.map(a => {
            const info = getAbsenceInfo(a);
            const hasSust = info && info.sustituto;
            return {
                name: a.nombre,
                sub: `${a.origen} → ${a.destino} · ${a.fecha}${hasSust ? ' · Sustituido por ' + info.sustituto.split('|')[0] : ''}${hasSust && info.temaSust ? ' · #' + info.temaSust + ' ' + (themesMap[info.temaSust] || '') : ''}${info && info.motivo ? ' · ' + info.motivo : ''}`,
                val: '#' + a.temaNum,
                avatarHtml: getPhotoMini(a.nombre, a.origen),
                onclick: `event.stopPropagation();openModal('${escJs(a.nombre)}','${escJs(a.origen)}')`
            };
        });

    }

    const existing = document.querySelector('.stat-expanded-overlay');
    if (existing) { window._prevExpandedOverlay = existing; existing.remove(); }
    const overlay = document.createElement('div');
    overlay.className = 'stat-expanded-overlay';
    overlay.onclick = e => { if (e.target === overlay) { overlay.remove(); goBackToExpanded(); } };

    const listHtml = rows.map((r, i) => `
        <div class="stat-list-row ${r.onclick ? 'clickable' : ''}" ${r.onclick ? `onclick="${r.onclick}"` : ''}>
            <span class="stat-list-pos ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${i + 1}</span>
            ${r.avatarHtml ? `<span style="flex-shrink:0;">${r.avatarHtml}</span>` : ''}
            <div class="stat-list-info">
                <div class="stat-list-name">${escHtml(r.name)}${r.rating ? ' ' + ratingBadgeHtml(r.rating, true) : ''}</div>
                ${r.sub ? `<div class="stat-list-sub">${escHtml(r.sub)}</div>` : ''}
            </div>
            <span class="stat-list-val">${r.val}</span>
            ${r.onclick ? '<span style="font-size:10px;color:var(--accent);margin-left:2px;">→</span>' : ''}
        </div>`).join('') || '<div class="stat-no-data">Sin datos</div>';

    overlay.innerHTML = `
        <div class="stat-expanded-box">
            <div class="stat-expanded-header">
                <div class="stat-expanded-header-left">
                    <span style="font-size:20px;">${icon}</span>
                    <span style="font-weight:700;font-size:14px;color:var(--text-1);">${title}</span>
                    <span style="font-size:11px;color:var(--text-3);">${subtitle}</span>
                </div>
                <div class="stat-expanded-nav">
                    <button onclick="goBackToExpanded()" title="Volver" style="width:auto;padding:0 12px;border-radius:var(--radius-sm);font-size:12px;font-weight:600;gap:4px;">← Volver</button>
                    <button onclick="closeStatExpanded()" style="width:32px;height:32px;border-radius:50%;border:1px solid var(--border);background:var(--bg-card);cursor:pointer;font-size:14px;color:var(--text-2);display:flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.borderColor='var(--danger)';this.style.color='var(--danger)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-2)'">✕</button>
                </div>
            </div>
            <div class="stat-expanded-body">
                <div class="stat-card-list">${listHtml}</div>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    if (typeof G !== 'undefined') G.statOverlayIn(overlay, overlay.querySelector('.stat-expanded-box'));
}

function openSugTemaDetail(temaNum, tipo) {
    const data = window._sugBosquejos;
    if (!data) return;
    const lista = tipo === 'nunca' ? data.nunca : data.masDeAnno;
    const tema = lista.find(t => String(t.num).trim() === String(temaNum).trim());
    if (!tema) return;
    const titulo = themesMap[String(temaNum).trim()] || '';
    const nMatriz = normalizeStr(matrizCong);

    const visitasAMatriz = allAssignments.filter(a => normalizeStr(a.destino) === nMatriz);
    const visitasBySpk = new Map();
    visitasAMatriz.forEach(a => {
        const key = normalizeStr(a.nombre) + '|' + normalizeStr(a.origen);
        if (!visitasBySpk.has(key)) visitasBySpk.set(key, []);
        visitasBySpk.get(key).push(a);
    });

    const spkRows = tema.oradores.map(s => {
        const key = normalizeStr(s.nombre) + '|' + normalizeStr(s.congregacion);
        const vis = visitasBySpk.get(key) || [];
        const fechas = vis.map(a => parseFechaStr(a.fecha)).filter(Boolean).sort((a,b) => b-a);
        const ultima = fechas[0] || null;
        const dias = ultima ? Math.floor((Date.now() - ultima.getTime()) / 86400000) : null;
        const ultimaVisita = ultima
            ? ultima.toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' })
            : null;
        const badge = dias === null
            ? '<span style="font-size:10px;padding:2px 8px;background:#ede9fe;color:#5b21b6;border-radius:8px;font-weight:600;">Nunca visitó</span>'
            : dias >= 365
                ? `<span style="font-size:10px;padding:2px 8px;background:#fef3c7;color:#8a4c0e;border-radius:8px;font-weight:600;">Hace ${dias}d</span>`
                : `<span style="font-size:10px;padding:2px 8px;background:#dcfce7;color:#166534;border-radius:8px;font-weight:600;">Hace ${dias}d</span>`;
        const rowBorder = (dias === null || dias >= 365) ? 'border-left:2px solid var(--success);background:rgba(76,175,80,0.06);' : '';
        return `<div class="stat-list-row" style="cursor:pointer;${rowBorder}" onclick="event.stopPropagation();closeStatExpanded();openModal('${escJs(s.nombre)}','${escJs(s.congregacion)}')">
            <span style="flex-shrink:0;">${getPhotoMini(s.nombre, s.congregacion)}</span>
            <div class="stat-list-info">
                <div class="stat-list-name">${escHtml(s.nombre)} ${ratingBadgeHtml(getSpeakerRating(s.nombre, s.congregacion), true)}</div>
                <div class="stat-list-sub">${escHtml(s.congregacion)}${s.rol ? ' · ' + escHtml(s.rol) : ''}${ultimaVisita ? ' · Última visita: ' + ultimaVisita : ''}</div>
            </div>
            ${badge}
        </div>`;
    }).join('');

    const existing = document.querySelector('.stat-expanded-overlay');
    if (existing) { window._prevExpandedOverlay = existing; existing.remove(); }
    const overlay = document.createElement('div');
    overlay.className = 'stat-expanded-overlay';
    overlay.onclick = e => { if (e.target === overlay) { overlay.remove(); goBackToExpanded(); } };

    const tipoLabel = tipo === 'nunca' ? 'Nunca dado en matriz' : `Dado hace ${tema.dias} días (${Math.floor(tema.dias/365)}a ${Math.floor((tema.dias%365)/30)}m)`;
    const tipoColor = tipo === 'nunca' ? 'var(--accent)' : 'var(--warn)';
    const tipoBg = tipo === 'nunca' ? 'var(--accent-dim)' : '#fef3c7';

    overlay.innerHTML = `
        <div class="stat-expanded-box">
            <div class="stat-expanded-header">
                <div class="stat-expanded-header-left">
                    <span style="font-size:20px;">💡</span>
                    <span style="font-weight:700;font-size:14px;color:var(--text-1);">Bosquejo #${escHtml(temaNum)}${titulo ? ' — ' + escHtml(titulo) : ''}</span>
                    <span style="font-size:11px;color:var(--text-3);">${tipoLabel}</span>
                </div>
                <div class="stat-expanded-nav">
                    <button onclick="goBackToExpanded()" title="Volver" style="width:auto;padding:0 12px;border-radius:var(--radius-sm);font-size:12px;font-weight:600;gap:4px;">← Volver</button>
                    <button onclick="closeStatExpanded()" title="Cerrar">✕</button>
                </div>
            </div>
            <div class="stat-expanded-body">
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
                    <span style="font-size:11px;padding:4px 10px;border-radius:8px;font-weight:700;background:${tipoBg};color:${tipoColor};">${tipoLabel}</span>
                    <span style="font-size:11px;padding:4px 10px;border-radius:8px;font-weight:700;background:var(--bg-card-alt);color:var(--text-2);border:1px solid var(--border);">${tema.oradores.length} orador${tema.oradores.length !== 1 ? 'es' : ''}</span>
                    ${tipo === 'masdeanno' ? `<span style="font-size:11px;padding:4px 10px;border-radius:8px;font-weight:700;background:var(--bg-card-alt);color:var(--text-2);border:1px solid var(--border);">Días: ${tema.dias}</span>` : ''}
                </div>
                <div class="stat-card-list">
                    <div style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">👥 Oradores con este bosquejo (${tema.oradores.length})</div>
                    ${spkRows || '<div class="stat-no-data">Sin oradores registrados</div>'}
                </div>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    if (typeof G !== 'undefined') G.statOverlayIn(overlay, overlay.querySelector('.stat-expanded-box'));
}

function renderEstadisticasDashboard() {
    const grid = document.getElementById('stats-cards-grid');
    const summaryBar = document.getElementById('stats-summary-bar');
    const emptyState = document.getElementById('stats-empty-state');
    if (!grid) return;
    if (!globalSpeakers.length) {
        grid.innerHTML = '';
        if (summaryBar) summaryBar.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    if (emptyState) emptyState.style.display = 'none';

    const unique = Array.from(new Map(globalSpeakers.map(s => [s.nombre + s.congregacion, s])).values());

    // ═══════════════════════════════════════════════
    //  BARRA DE RESUMEN
    // ═══════════════════════════════════════════════
    const totalOradores = unique.length;
    const totalCongs = registeredCongs.size;
    const totalAsigs = allAssignments.length;
    const totalTemas = Object.keys(themesMap).length;
    const temasUsados = new Set(allAssignments.map(a => a.temaNum)).size;
    const temasBloq = Object.keys(blockedThemes).length;
    const totalAusencias = allAssignments.filter(a => isAbsent(a)).length;

    if (summaryBar) {
        summaryBar.style.display = 'grid';
            summaryBar.innerHTML = `
            <div class="stats-summary-item accent" onclick="openStatDetail('oradores')"><div class="ss-value">${totalOradores}</div><div class="ss-label">Oradores</div></div>
            <div class="stats-summary-item success" onclick="openStatDetail('congregaciones')"><div class="ss-value">${totalCongs}</div><div class="ss-label">Congregaciones</div></div>
            <div class="stats-summary-item warn" onclick="openStatDetail('asignaciones')"><div class="ss-value">${totalAsigs}</div><div class="ss-label">Asignaciones</div></div>
            <div class="stats-summary-item purple" onclick="openStatDetail('bosquejos')"><div class="ss-value">${temasUsados}<span style="font-size:13px;font-weight:400;color:var(--text-3)">/${totalTemas}</span></div><div class="ss-label">Bosquejos usados</div></div>
            <div class="stats-summary-item ${temasBloq > 0 ? 'danger' : ''}" onclick="openStatDetail('bloqueados')"><div class="ss-value">${temasBloq}</div><div class="ss-label">Bloqueados</div></div>
            <div class="stats-summary-item ${totalAusencias > 0 ? 'danger' : ''}" onclick="openStatDetail('ausencias')"><div class="ss-value">${totalAusencias}</div><div class="ss-label">Ausencias</div></div>
        `;
        if (typeof G !== 'undefined') {
            G.summaryBar(summaryBar.querySelectorAll('.stats-summary-item'));
            const vals = summaryBar.querySelectorAll('.ss-value');
            const nums = [totalOradores, totalCongs, totalAsigs, temasUsados, temasBloq, totalAusencias];
            vals.forEach((el, i) => { if (nums[i] !== undefined) G.numberCount(el, 0, nums[i]); });
        }
    }

    // ═══════════════════════════════════════════════
    //  DATOS PRE-CALCULADOS
    // ═══════════════════════════════════════════════
    // Asignaciones por mes
    const asigsPorMes = {};
    MESES.forEach(m => asigsPorMes[m] = 0);
    allAssignments.forEach(a => { if (a.mes && asigsPorMes[a.mes] !== undefined) asigsPorMes[a.mes]++; });
    const maxAsigsMes = Math.max(...Object.values(asigsPorMes), 1);

    // Congregaciones que más envían
    const enviosPorCong = {};
    allAssignments.forEach(a => { enviosPorCong[a.origen] = (enviosPorCong[a.origen] || 0) + 1; });
    const topEnvios = Object.entries(enviosPorCong).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxEnvio = topEnvios.length ? topEnvios[0][1] : 1;

    // Congregaciones que más reciben
    const recibosPorCong = {};
    allAssignments.forEach(a => { recibosPorCong[a.destino] = (recibosPorCong[a.destino] || 0) + 1; });
    const topRecibos = Object.entries(recibosPorCong).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxRecibo = topRecibos.length ? topRecibos[0][1] : 1;

    // Oradores disponibles sin uso
    const oradoresConAsig = new Set(allAssignments.map(a => a.nombre + '|' + a.origen));
    const sinUso = unique.filter(s => {
        if (oradoresConAsig.has(s.nombre + '|' + s.congregacion)) return false;
        return Object.values(s.disponibilidad || {}).some(v => v === 'disponible');
    });

    // Bosquejos mas solicitados
    const temaCount = {};
    allAssignments.forEach(a => { if (a.temaNum) temaCount[a.temaNum] = (temaCount[a.temaNum] || 0) + 1; });
    const topTemas = Object.entries(temaCount)
        .sort((a, b) => b[1] - a[1]).slice(0, 10)
        .map(([num, count]) => ({ num, count, title: themesMap[num] || '' }));

    // Discursantes mas solicitados
    const discCount = {};
    allAssignments.forEach(a => {
        const key = a.nombre + '|' + a.origen;
        if (!discCount[key]) discCount[key] = { nombre: a.nombre, origen: a.origen, count: 0 };
        discCount[key].count++;
    });
    const topSolicitados = Object.values(discCount).sort((a, b) => b.count - a.count).slice(0, 10);

    // Mayor disponibilidad
    const dispArr = [];
    unique.forEach(s => {
        const n = Object.values(s.disponibilidad || {}).filter(v => v === 'disponible').length;
        if (n > 0) dispArr.push({ nombre: s.nombre, congregacion: s.congregacion, count: n });
    });
    dispArr.sort((a, b) => b.count - a.count);
    const topDisp = dispArr.slice(0, 10);

    // Oradores con más bosquejos preparados
    const temasPorOrador = [];
    unique.forEach(s => {
        const t = (s.temas || []).filter(v => v !== '' && v !== null && v !== undefined).length;
        if (t > 0) temasPorOrador.push({ nombre: s.nombre, congregacion: s.congregacion, count: t });
    });
    temasPorOrador.sort((a, b) => b.count - a.count);
    const topTemasOrador = temasPorOrador.slice(0, 10);

    function posClass(i) { return i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''; }

    function buildCard({ id, accentClass, title, subtitle, colorClass, totalLabel, rows }) {
        const preview = rows.slice(0, 3).map((r, i) => `
            <div class="stat-preview-row">
                <span class="stat-preview-pos">${i + 1}.</span>
                ${r.avatarHtml ? `<span style="flex-shrink:0;">${r.avatarHtml}</span>` : ''}
                <span class="stat-preview-name">${r.nameHtml || escHtml(r.name)}${r.rating ? ' ' + ratingBadgeHtml(r.rating, true) : ''}</span>
                <span class="stat-preview-val ${colorClass}">${r.val}</span>
            </div>`).join('') || `<div class="stat-no-data">Sin datos aún</div>`;

        const listRows = rows.map((r, i) => `
            <div class="stat-list-row ${r.onclick ? 'clickable' : ''}" ${r.onclick ? `onclick="${r.onclick}"` : ''}>
                <span class="stat-list-pos ${posClass(i)}">${i + 1}</span>
                ${r.avatarHtml ? `<span style="flex-shrink:0;">${r.avatarHtml}</span>` : ''}
                <div class="stat-list-info">
                    <div class="stat-list-name">${r.nameHtml || escHtml(r.name)}${r.rating ? ' ' + ratingBadgeHtml(r.rating, true) : ''}</div>                            ${r.sub ? `<div class="stat-list-sub">${escHtml(r.sub)}</div>` : ''}
                </div>
                <span class="stat-list-val ${colorClass}">${r.val}</span>
                ${r.onclick ? `<span style="font-size:10px;color:var(--accent);margin-left:2px;">→</span>` : ''}
            </div>`).join('') || `<div class="stat-no-data">Sin datos suficientes</div>`;

        return `<div class="stat-card" id="${id}" onclick="toggleStatCard(this)">
            <div class="stat-card-header">
                <div class="stat-card-header-left">
                    <div class="stat-card-accent-bar ${accentClass}"></div>
                    <div class="stat-card-texts">
                        <div class="stat-card-title">${title}</div>
                        <div class="stat-card-subtitle">${subtitle}</div>
                    </div>
                </div>
                <div class="stat-card-right">
                    <span class="stat-card-count-pill ${colorClass}">${totalLabel}</span>
                    <span class="stat-card-chevron">▼</span>
                </div>
            </div>
            <div class="stat-card-preview">${preview}</div>
            <div class="stat-card-body">
                <div class="stat-card-divider"></div>
                <div class="stat-card-list">${listRows}</div>
            </div>
        </div>`;
    }

    // ═══════════════════════════════════════════════
    //  TARJETA: ASIGNACIONES POR MES
    // ═══════════════════════════════════════════════
    const abbrMes = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const monthlyBars = MESES.map((m, i) => {
        const count = asigsPorMes[m];
        const pct = Math.max(4, (count / maxAsigsMes) * 100);
        return `<div class="stats-monthly-bar${count === 0 ? ' empty' : ''}" style="height:${pct}%;${count > 0 ? 'cursor:pointer;' : ''}" onclick="${count > 0 ? `event.stopPropagation();openMonthDetail('${escJs(m)}')` : ''}" title="${escHtml(m)}: ${count} asignación${count !== 1 ? 'es' : ''}">
            ${count > 0 ? `<span class="stats-monthly-bar-count">${count}</span>` : ''}
            <span class="stats-monthly-bar-label">${abbrMes[i]}</span>
        </div>`;
    }).join('');

    const cardMonthly = `<div class="stat-card" id="stat-monthly" onclick="toggleStatCard(this)">
        <div class="stat-card-header">
            <div class="stat-card-header-left">
                <div class="stat-card-accent-bar blue"></div>
                <div class="stat-card-texts">
                    <div class="stat-card-title">Asignaciones por mes</div>
                    <div class="stat-card-subtitle">Distribución mensual de asignaciones</div>
                </div>
            </div>
            <div class="stat-card-right">
                <span class="stat-card-count-pill blue">${totalAsigs} total</span>
                <span class="stat-card-chevron">▼</span>
            </div>
        </div>
        <div class="stat-card-preview" style="padding-bottom:24px;">
            <div class="stats-monthly-chart">${monthlyBars}</div>
        </div>
        <div class="stat-card-body">
            <div class="stat-card-divider"></div>
            <div class="stat-card-list" style="padding:12px 18px 16px;">
                ${MESES.map((m, i) => `<div class="stat-list-row${asigsPorMes[m] > 0 ? ' clickable' : ''}"${asigsPorMes[m] > 0 ? ` onclick="event.stopPropagation();openMonthDetail('${escJs(m)}')"` : ''} style="${asigsPorMes[m] > 0 ? 'cursor:pointer;' : ''}">
                    <span class="stat-list-pos">${abbrMes[i]}</span>
                    <div class="stat-list-info"><div class="stat-list-name">${m}</div></div>
                    <span class="stat-list-val blue">${asigsPorMes[m]} asignación${asigsPorMes[m] !== 1 ? 'es' : ''}</span>
                    ${asigsPorMes[m] > 0 ? '<span style="font-size:10px;color:var(--accent);margin-left:2px;">→</span>' : ''}
                </div>`).join('')}
            </div>
        </div>
    </div>`;

    // ═══════════════════════════════════════════════
    //  TARJETA: CONGREGACIONES MÁS ACTIVAS
    // ═══════════════════════════════════════════════
    const congEnvRows = topEnvios.map(([name, count]) => {
        const pct = (count / maxEnvio) * 100;
        return `<div class="stats-cong-bar-row" style="cursor:pointer;" onclick="event.stopPropagation();openCongDetail('${escJs(name)}')" title="${escHtml(name)}: ${count} orador${count !== 1 ? 'es' : ''} enviado${count !== 1 ? 's' : ''}">
            <span class="stats-cong-bar-name">${escHtml(name)}</span>
            <div class="stats-cong-bar-track"><div class="stats-cong-bar-fill blue" style="width:${pct}%;"></div></div>
            <span class="stats-cong-bar-count">${count}</span>
        </div>`;
    }).join('') || '<div class="stat-no-data">Sin datos</div>';

    const congRecRows = topRecibos.map(([name, count]) => {
        const pct = (count / maxRecibo) * 100;
        return `<div class="stats-cong-bar-row" style="cursor:pointer;" onclick="event.stopPropagation();openCongDetail('${escJs(name)}')" title="${escHtml(name)}: ${count} visita${count !== 1 ? 's' : ''}">
            <span class="stats-cong-bar-name">${escHtml(name)}</span>
            <div class="stats-cong-bar-track"><div class="stats-cong-bar-fill green" style="width:${pct}%;"></div></div>
            <span class="stats-cong-bar-count">${count}</span>
        </div>`;
    }).join('') || '<div class="stat-no-data">Sin datos</div>';

    const cardCongregaciones = `<div class="stat-card" id="stat-congs" onclick="toggleStatCard(this)">
        <div class="stat-card-header">
            <div class="stat-card-header-left">
                <div class="stat-card-accent-bar green"></div>
                <div class="stat-card-texts">
                    <div class="stat-card-title">Congregaciones más activas</div>
                    <div class="stat-card-subtitle">Quién envía y quién recibe más</div>
                </div>
            </div>
            <div class="stat-card-right">
                <span class="stat-card-count-pill green">${totalCongs} congs</span>
                <span class="stat-card-chevron">▼</span>
            </div>
        </div>
        <div class="stat-card-preview">
            <div style="font-size:11px;font-weight:700;color:var(--text-2);margin-bottom:4px;">📤 Más envíos</div>
            ${topEnvios.slice(0, 2).map(([n, c]) => `<div class="stat-preview-row" style="cursor:pointer;" onclick="event.stopPropagation();openCongDetail('${escJs(n)}')"><span class="stat-preview-name">${escHtml(n)}</span><span class="stat-preview-val blue">${c}</span></div>`).join('') || '<div class="stat-no-data">Sin datos</div>'}
            <div style="font-size:11px;font-weight:700;color:var(--text-2);margin:8px 0 4px;">📥 Más recibos</div>
            ${topRecibos.slice(0, 2).map(([n, c]) => `<div class="stat-preview-row" style="cursor:pointer;" onclick="event.stopPropagation();openCongDetail('${escJs(n)}')"><span class="stat-preview-name">${escHtml(n)}</span><span class="stat-preview-val green">${c}</span></div>`).join('') || '<div class="stat-no-data">Sin datos</div>'}
        </div>
        <div class="stat-card-body">
            <div class="stat-card-divider"></div>
            <div class="stat-card-list">
                <div style="font-size:11px;font-weight:700;color:var(--text-2);margin-bottom:6px;">📤 Congregaciones que más envían oradores</div>
                ${congEnvRows}
                <div style="font-size:11px;font-weight:700;color:var(--text-2);margin:12px 0 6px;">📥 Congregaciones que más reciben visitas</div>
                ${congRecRows}
            </div>
        </div>
    </div>`;

    // ═══════════════════════════════════════════════
    //  TARJETA: ORADORES SIN USO
    // ═══════════════════════════════════════════════
    const sinUsoRows = sinUso.slice(0, 10).map(s => {
        const dispMonths = Object.entries(s.disponibilidad || {}).filter(([,v]) => v === 'disponible').map(([m]) => m.substring(0,3));
        return {
            name: s.nombre,
            sub: s.congregacion + (s.rol ? ' · ' + s.rol : '') + (dispMonths.length ? ' · Disp: ' + dispMonths.join(', ') : ''),
            val: '0 asig.',
            avatarHtml: getPhotoMini(s.nombre, s.congregacion),
            rating: getSpeakerRating(s.nombre, s.congregacion),
            onclick: `event.stopPropagation();openModal('${escJs(s.nombre)}','${escJs(s.congregacion)}')`
        };
    });

    const cardSinUso = buildCard({
        id: 'stat-sinuso', accentClass: 'warn', colorClass: 'warn',
        title: 'Oradores sin uso',
        subtitle: 'Disponibles pero nunca asignados',
        totalLabel: sinUso.length + ' oradores',
        rows: sinUsoRows
    });

    // ═══════════════════════════════════════════════
    //  TARJETAS EXISTENTES (mejoradas)
    // ═══════════════════════════════════════════════
    const card1 = buildCard({
        id: 'stat-temas', accentClass: 'blue', colorClass: 'blue',
        title: 'Bosquejos más solicitados',
        subtitle: 'Temas con más asignaciones registradas',
        totalLabel: topTemas.length + ' temas',
        rows: topTemas.map(t => ({
            name: `#${t.num}${t.title ? ' — ' + t.title : ''}`,
            sub: t.count + (t.count === 1 ? ' asignación' : ' asignaciones'),
            val: t.count + (t.count === 1 ? ' asig.' : ' asig.'),
            onclick: `event.stopPropagation();openTemaDetail('${escJs(t.num)}')`
        }))
    });

    const card2 = buildCard({
        id: 'stat-solicitados', accentClass: 'warn', colorClass: 'warn',
        title: 'Oradores más activos',
        subtitle: 'Discursantes con más salidas registradas',
        totalLabel: topSolicitados.length + ' oradores',
        rows: topSolicitados.map(d => ({
            name: d.nombre,
            sub: d.origen,
            val: d.count + (d.count === 1 ? ' vez' : ' veces'),
            avatarHtml: getPhotoMini(d.nombre, d.origen),
            rating: getSpeakerRating(d.nombre, d.origen),
            onclick: `event.stopPropagation();openModal('${escJs(d.nombre)}','${escJs(d.origen)}')`
        }))
    });

    const card4 = buildCard({
        id: 'stat-disponibilidad', accentClass: 'purple', colorClass: 'purple',
        title: 'Mayor disponibilidad',
        subtitle: 'Oradores con más meses marcados como disponible',
        totalLabel: topDisp.length + ' oradores',
        rows: topDisp.map(d => ({
            name: d.nombre,
            sub: d.congregacion,
            val: d.count + (d.count === 1 ? ' mes' : ' meses'),
            avatarHtml: getPhotoMini(d.nombre, d.congregacion),
            rating: getSpeakerRating(d.nombre, d.congregacion),
            onclick: `event.stopPropagation();openModal('${escJs(d.nombre)}','${escJs(d.congregacion)}')`
        }))
    });

    // ═══════════════════════════════════════════════
    //  TARJETA: HISTORIAL DE DISCURSOS EN MATRIZ
    // ═══════════════════════════════════════════════
    const nMatriz = normalizeStr(matrizCong);
    const histMatriz = nMatriz
        ? allAssignments.filter(a => normalizeStr(a.destino) === nMatriz)
        : [];
    const histPorMes = {};
    MESES.forEach(m => histPorMes[m] = []);
    histMatriz.forEach(a => { if (a.mes && histPorMes[a.mes]) histPorMes[a.mes].push(a); });
    const mesesConHistorial = MESES.filter(m => histPorMes[m].length > 0);
    const totalHist = histMatriz.length;

    // ═══════════════════════════════════════════════
    //  TARJETA: DISCURSOS PRESENTADOS
    // ═══════════════════════════════════════════════
    const hoy = new Date();
    hoy.setHours(23,59,59,999);
    const discPresentados = nMatriz
        ? allAssignments.filter(a => {
            if (normalizeStr(a.destino) !== nMatriz) return false;
            const d = parseStringToDate(a.fecha);
            return d && d <= hoy;
        }).sort((a, b) => {
            const mi = MESES.indexOf(a.mes) - MESES.indexOf(b.mes);
            if (mi !== 0) return mi;
            return parseStringToDate(a.fecha) - parseStringToDate(b.fecha);
        })
        : [];

    const temasPresentados = new Set();
    discPresentados.forEach(a => {
        temasPresentados.add(String(a.temaNum).trim());
        const ai = isAbsent(a) ? getAbsenceInfo(a) : null;
        if (ai && ai.temaSust) temasPresentados.add(String(ai.temaSust).trim());
    });

    const histRows = [];
    mesesConHistorial.forEach(m => {
        histPorMes[m].sort((a, b) => parseStringToDate(a.fecha) - parseStringToDate(b.fecha));
        histPorMes[m].forEach(a => {
            histRows.push({
                name: a.nombre,
                sub: `${a.origen} → ${a.fecha}`,
                val: `#${a.temaNum}`,
                avatarHtml: getPhotoMini(a.nombre, a.origen),
                rating: getSpeakerRating(a.nombre, a.origen),
                onclick: `event.stopPropagation();openModal('${escJs(a.nombre)}','${escJs(a.origen)}')`
            });
        });
    });

    const cardHistorial = `<div class="stat-card" id="stat-historial" onclick="toggleStatCard(this)">
        <div class="stat-card-header">
            <div class="stat-card-header-left">
                <div class="stat-card-accent-bar green"></div>
                <div class="stat-card-texts">
                    <div class="stat-card-title">Historial de Discursos</div>
                    <div class="stat-card-subtitle">${matrizCong ? 'Discursos dados en ' + escHtml(matrizCong) : 'Selecciona congregación matriz'}</div>
                </div>
            </div>
            <div class="stat-card-right">
                <span class="stat-card-count-pill green">${totalHist} discursos</span>
                <span class="stat-card-chevron">▼</span>
            </div>
        </div>
        <div class="stat-card-preview">
            ${histRows.length ? histRows.slice(0, 3).map((r, i) => `
                <div class="stat-preview-row">
                    <span class="stat-preview-pos">${i + 1}.</span>
                    <span style="flex-shrink:0;">${r.avatarHtml}</span>
                    <span class="stat-preview-name">${escHtml(r.name)}</span>
                    <span class="stat-preview-val green">${r.val}</span>
                </div>`).join('') : `<div class="stat-no-data">${matrizCong ? 'Sin discursos registrados' : 'Configura la congregación matriz'}</div>`}
        </div>
        <div class="stat-card-body">
            <div class="stat-card-divider"></div>
            <div style="padding:8px 18px 4px;display:flex;justify-content:flex-end;gap:8px;">
                <button onclick="event.stopPropagation();exportarHistorialMatrizPDF()" style="padding:6px 14px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--bg-card-alt);font-size:11px;font-weight:600;color:var(--text-2);cursor:pointer;display:flex;align-items:center;gap:5px;transition:all 0.2s;" onmouseover="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-2)'">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    PDF
                </button>
                <button onclick="event.stopPropagation();exportarHistorialMatriz()" style="padding:6px 14px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--bg-card-alt);font-size:11px;font-weight:600;color:var(--text-2);cursor:pointer;display:flex;align-items:center;gap:5px;transition:all 0.2s;" onmouseover="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-2)'">⬇ CSV</button>
            </div>
            <div class="stat-card-list">
                ${mesesConHistorial.length ? mesesConHistorial.map(m => {
                    const items = histPorMes[m];
                    return `<div style="margin-bottom:10px;">
                        <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--accent);margin-bottom:4px;letter-spacing:0.5px;">${escHtml(m)} (${items.length})</div>
                        ${items.map(a => {
                            const histAbs = isAbsent(a);
                            const histAbsInfo = histAbs ? getAbsenceInfo(a) : null;
                            const histHasSust = histAbs && histAbsInfo && histAbsInfo.sustituto;
                            const histAbsStyle = histAbs ? (histHasSust ? 'border-left:3px solid #16a34a;background:#f0fdf4;' : 'border-left:3px solid #dc2626;background:#fef2f2;') : '';
                            const histAbsInfoHtml = histHasSust ? '<div style="margin-top:2px;display:flex;flex-wrap:wrap;align-items:center;gap:4px;"><span style="display:inline-flex;align-items:center;gap:3px;font-size:9px;padding:1px 5px;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:6px;font-weight:700;">🟢 Sust. ' + escHtml(histAbsInfo.sustituto.split('|')[0]) + '</span>' + (histAbsInfo.temaSust ? '<span style="font-size:9px;padding:1px 5px;background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;border-radius:6px;font-weight:600;">#' + escHtml(histAbsInfo.temaSust) + ' ' + escHtml(themesMap[histAbsInfo.temaSust] || '') + '</span>' : '') + '</div>' : (histAbs ? '<div style="margin-top:2px;"><span style="display:inline-flex;align-items:center;gap:3px;font-size:9px;padding:1px 5px;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:6px;font-weight:700;">🔴 Ausente</span></div>' : '');
                            return `<div class="stat-list-row" onclick="event.stopPropagation();openModal('${escJs(a.nombre)}','${escJs(a.origen)}')" style="cursor:pointer;${histAbsStyle}${histAbsStyle ? 'padding:8px 10px;border-radius:6px;margin-bottom:4px;' : ''}">
                                <span style="flex-shrink:0;">${getPhotoMini(a.nombre, a.origen)}</span>
                                <div class="stat-list-info">
                                    <div class="stat-list-name">${escHtml(a.nombre)} ${ratingBadgeHtml(getSpeakerRating(a.nombre, a.origen), true)}</div>
                                    <div class="stat-list-sub">${escHtml(a.origen)} — ${escHtml(a.fecha)}</div>
                                    ${histAbsInfoHtml}
                                </div>
                                <span class="stat-list-val green">#${escHtml(a.temaNum)}</span>
                                <span style="font-size:10px;color:var(--accent);margin-left:2px;">→</span>
                            </div>`;
                        }).join('')}
                    </div>`;
                }).join('') : `<div class="stat-no-data">${matrizCong ? 'Sin discursos en ' + escHtml(matrizCong) : 'Configura la congregación matriz para ver el historial'}</div>`}
            </div>
        </div>
    </div>`;

    const discPresentadosRows = discPresentados.map(a => {
        const ai = isAbsent(a) ? getAbsenceInfo(a) : null;
        const hasSust = ai && ai.sustituto;
        let subText = a.origen + ' → ' + a.fecha;
        if (hasSust) {
            if (ai.temaSust) subText += ' · #' + ai.temaSust + ' ' + (themesMap[ai.temaSust] || '');
        } else if (ai) {
            subText += ' · Ausente' + (ai.motivo ? ' (' + ai.motivo + ')' : '');
        }
        const themeLabel = hasSust && ai.temaSust
            ? '#' + ai.temaSust + ' ' + (themesMap[ai.temaSust] || '')
            : '#' + a.temaNum + ' ' + (themesMap[a.temaNum] || '');
        let nameHtml = escHtml(a.nombre);
        if (hasSust) {
            const sustName = escHtml(ai.sustituto.split('|')[0]);
            nameHtml = '<span style="text-decoration:line-through;opacity:0.5;">' + escHtml(a.nombre) + '</span> <span style="color:var(--success);font-weight:600;">→ ' + sustName + '</span>';
        }
        return {
            name: hasSust ? ai.sustituto.split('|')[0] : a.nombre,
            nameHtml: nameHtml,
            sub: subText,
            val: themeLabel,
            avatarHtml: getPhotoMini(hasSust ? ai.sustituto.split('|')[0] : a.nombre, hasSust ? ai.sustituto.split('|')[1] || a.origen : a.origen),
            rating: getSpeakerRating(hasSust ? ai.sustituto.split('|')[0] : a.nombre, hasSust ? ai.sustituto.split('|')[1] || a.origen : a.origen),
            onclick: `event.stopPropagation();openModal('${escJs(hasSust ? ai.sustituto.split('|')[0] : a.nombre)}','${escJs(hasSust ? ai.sustituto.split('|')[1] || a.origen : a.origen)}')`
        };
    });

    const cardDiscPresentados = buildCard({
        id: 'stat-discpresentados', accentClass: 'success', colorClass: 'success',
        title: 'Discursos Presentados',
        subtitle: matrizCong ? 'Discursos cumplidos en ' + escHtml(matrizCong) : 'Selecciona congregación matriz',
        totalLabel: discPresentados.length + ' presentado' + (discPresentados.length !== 1 ? 's' : ''),
        rows: discPresentadosRows
    });

    // ═══════════════════════════════════════════════
    //  TARJETA: CALIFICACIONES
    // ═══════════════════════════════════════════════
    const speakersByRating = {};
    RATING_OPTIONS.forEach(opt => { speakersByRating[opt.val] = []; });
    unique.forEach(s => {
        const rat = getSpeakerRating(s.nombre, s.congregacion);
        if (speakersByRating[rat]) {
            speakersByRating[rat].push(s);
        }
    });
    Object.keys(speakersByRating).forEach(k => {
        speakersByRating[k].sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
    const totalCalificados = unique.length;

    const calLegendHtml = RATING_OPTIONS.map(opt => {
        const count = speakersByRating[opt.val] ? speakersByRating[opt.val].length : 0;
        return `<div style="display:flex;align-items:center;gap:6px;font-size:11px;padding:3px 0;"><span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:${opt.color}18;color:${opt.color};border:1px solid ${opt.color}30;font-weight:700;font-size:10px;flex-shrink:0;">${opt.val}</span><span style="flex:1;color:var(--text-2);">${opt.label}</span><span style="font-weight:600;color:var(--text-1);">${count}</span></div>`;
    }).join('');

    const calGroupedHtml = RATING_OPTIONS.filter(opt => speakersByRating[opt.val].length > 0).map(opt => {
        const speakers = speakersByRating[opt.val];
        const speakersHtml = speakers.map(s => {
            return `<div class="stat-list-row clickable" onclick="event.stopPropagation();openModal('${escJs(s.nombre)}','${escJs(s.congregacion)}')" style="cursor:pointer;">
                <span style="flex-shrink:0;">${getPhotoMini(s.nombre, s.congregacion)}</span>
                <div class="stat-list-info">
                    <div class="stat-list-name">${escHtml(s.nombre)}</div>
                    <div class="stat-list-sub">${escHtml(s.congregacion)}${s.rol ? ' · ' + escHtml(s.rol) : ''}</div>
                </div>
                <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:${opt.color}18;color:${opt.color};border:1px solid ${opt.color}30;font-weight:700;font-size:9px;flex-shrink:0;">${opt.val}</span>
                <span style="font-size:10px;color:var(--accent);margin-left:2px;">→</span>
            </div>`;
        }).join('');
        return `<div style="margin-bottom:10px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:${opt.color};margin-bottom:4px;letter-spacing:0.5px;display:flex;align-items:center;gap:6px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:${opt.color}18;color:${opt.color};border:1px solid ${opt.color}30;font-size:9px;">${opt.val}</span>${opt.label} (${speakers.length})</div>
            ${speakersHtml}
        </div>`;
    }).join('');

    const cardCalificaciones = `<div class="stat-card" id="stat-calificaciones" onclick="toggleStatCard(this)">
        <div class="stat-card-header">
            <div class="stat-card-header-left">
                <div class="stat-card-accent-bar blue"></div>
                <div class="stat-card-texts">
                    <div class="stat-card-title">Calificaciones</div>
                    <div class="stat-card-subtitle">Oradores organizados por categoría</div>
                </div>
            </div>
            <div class="stat-card-right">
                <span class="stat-card-count-pill blue">${totalCalificados} orador${totalCalificados !== 1 ? 'es' : ''}</span>
                <span class="stat-card-chevron">▼</span>
            </div>
        </div>
        <div class="stat-card-preview">
            ${RATING_OPTIONS.filter(opt => speakersByRating[opt.val].length > 0).slice(0, 3).map((opt, i) => `
                <div class="stat-preview-row">
                    <span class="stat-preview-pos">${i + 1}.</span>
                    <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:${opt.color}18;color:${opt.color};border:1px solid ${opt.color}30;font-weight:700;font-size:9px;flex-shrink:0;">${opt.val}</span>
                    <span class="stat-preview-name">${opt.label}</span>
                    <span class="stat-preview-val blue">${speakersByRating[opt.val].length}</span>
                </div>`).join('') || `<div class="stat-no-data">Sin calificaciones asignadas</div>`}
        </div>
        <div class="stat-card-body">
            <div class="stat-card-divider"></div>
            <div style="padding:12px 18px 8px;">
                <div style="font-size:11px;font-weight:700;color:var(--text-1);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Leyenda de categorías</div>
                ${calLegendHtml}
            </div>
            <div class="stat-card-divider"></div>
            <div class="stat-card-list">
                ${calGroupedHtml || `<div class="stat-no-data">Sin calificaciones asignadas</div>`}
            </div>
        </div>
    </div>`;

    // ═══════════════════════════════════════════════
    //  TARJETA: INVITADOS A LA CONGREGACIÓN MATRIZ
    // ═══════════════════════════════════════════════
    const invitadosMap = {};
    histMatriz.forEach(a => {
        const key = normalizeStr(a.nombre) + '|' + normalizeStr(a.origen);
        if (!invitadosMap[key]) invitadosMap[key] = { nombre: a.nombre, origen: a.origen, count: 0, temas: new Set(), fechas: [] };
        invitadosMap[key].count++;
        if (a.temaNum) invitadosMap[key].temas.add(a.temaNum);
        invitadosMap[key].fechas.push(a.fecha);
    });
    const invitadosList = Object.values(invitadosMap).sort((a, b) => b.count - a.count);

    const cardInvitados = `<div class="stat-card" id="stat-invitados" onclick="toggleStatCard(this)">
        <div class="stat-card-header">
            <div class="stat-card-header-left">
                <div class="stat-card-accent-bar purple"></div>
                <div class="stat-card-texts">
                    <div class="stat-card-title">Invitados a la Matriz</div>
                    <div class="stat-card-subtitle">${matrizCong ? 'Discursantes que han visitado ' + escHtml(matrizCong) : 'Selecciona congregación matriz'}</div>
                </div>
            </div>
            <div class="stat-card-right">
                <span class="stat-card-count-pill purple">${invitadosList.length} orador${invitadosList.length !== 1 ? 'es' : ''}</span>
                <span class="stat-card-chevron">▼</span>
            </div>
        </div>
        <div class="stat-card-preview">
            ${invitadosList.length ? invitadosList.slice(0, 3).map((d, i) => `
                <div class="stat-preview-row">
                    <span class="stat-preview-pos">${i + 1}.</span>
                    <span style="flex-shrink:0;">${getPhotoMini(d.nombre, d.origen)}</span>
                    <span class="stat-preview-name">${escHtml(d.nombre)} ${ratingBadgeHtml(getSpeakerRating(d.nombre, d.origen), true)}</span>
                    <span class="stat-preview-val purple">${d.count} vez${d.count !== 1 ? 'es' : ''}</span>
                </div>`).join('') : `<div class="stat-no-data">${matrizCong ? 'Sin visitas registradas' : 'Configura la congregación matriz'}</div>`}
        </div>
        <div class="stat-card-body">
            <div class="stat-card-divider"></div>
            <div style="padding:8px 18px 4px;display:flex;justify-content:flex-end;gap:8px;">
                <button onclick="event.stopPropagation();exportarInvitadosPDF()" style="padding:6px 14px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--bg-card-alt);font-size:11px;font-weight:600;color:var(--text-2);cursor:pointer;display:flex;align-items:center;gap:5px;transition:all 0.2s;" onmouseover="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-2)'">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    PDF
                </button>
                <button onclick="event.stopPropagation();exportarInvitadosCSV()" style="padding:6px 14px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--bg-card-alt);font-size:11px;font-weight:600;color:var(--text-2);cursor:pointer;display:flex;align-items:center;gap:5px;transition:all 0.2s;" onmouseover="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-2)'">⬇ CSV</button>
            </div>
            <div class="stat-card-list">
                ${invitadosList.length ? invitadosList.map((d, i) => {
                    const temasHtml = d.temas.size > 0
                        ? [...d.temas].sort((a,b) => parseInt(a)-parseInt(b)).map(n => `<span style="display:inline-block;background:#ede9fe;color:#5b21b6;border-radius:6px;padding:1px 6px;font-size:9px;font-weight:700;margin:1px 2px;">#${n} ${escHtml((themesMap[n] || '').substring(0,20))}${(themesMap[n]||'').length > 20 ? '…' : ''}</span>`).join(' ')
                        : '<span style="color:var(--text-3);font-size:10px;">—</span>';
                    return `<div class="stat-list-row" style="cursor:pointer;align-items:flex-start;" onclick="event.stopPropagation();openModal('${escJs(d.nombre)}','${escJs(d.origen)}')">
                        <span class="stat-list-pos ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${i + 1}</span>
                        <span style="flex-shrink:0;">${getPhotoMini(d.nombre, d.origen)}</span>
                        <div class="stat-list-info">
                            <div class="stat-list-name">${escHtml(d.nombre)} ${ratingBadgeHtml(getSpeakerRating(d.nombre, d.origen), true)}</div>
                            <div class="stat-list-sub">${escHtml(d.origen)} · ${d.fechas.length} visita${d.fechas.length !== 1 ? 's' : ''}</div>
                            <div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:3px;">${temasHtml}</div>
                        </div>
                        <span class="stat-list-val purple">${d.count}x</span>
                        <span style="font-size:10px;color:var(--accent);margin-left:2px;">→</span>
                    </div>`;
                }).join('') : `<div class="stat-no-data">${matrizCong ? 'Sin discursos en ' + escHtml(matrizCong) : 'Configura la congregación matriz para ver los invitados'}</div>`}
            </div>
        </div>
    </div>`;

    // ═══════════════════════════════════════════════
    //  TARJETA: ORADORES CON MÁS BOSQUEJOS
    // ═══════════════════════════════════════════════
    const cardBosquejosPorOrador = buildCard({
        id: 'stat-temaspororador', accentClass: 'blue', colorClass: 'blue',
        title: 'Oradores con más bosquejos',
        subtitle: 'Discursantes con mayor cantidad de temas preparados',
        totalLabel: temasPorOrador.length + ' oradores',
        rows: topTemasOrador.map(d => ({
            name: d.nombre,
            sub: d.congregacion,
            val: d.count + (d.count === 1 ? ' bosquejo' : ' bosquejos'),
            avatarHtml: getPhotoMini(d.nombre, d.congregacion),
            rating: getSpeakerRating(d.nombre, d.congregacion),
            onclick: `event.stopPropagation();openModal('${escJs(d.nombre)}','${escJs(d.congregacion)}')`
        }))
    });

    grid.innerHTML = '';

    // ═══════════════════════════════════════════════
    //  TARJETA: ASIGNACIONES DUPLICADAS
    // ═══════════════════════════════════════════════
    const duplicadasMap = {};
    allAssignments.forEach(a => {
        const dateStr = a.fecha || '';
        const key = normalizeStr(a.destino) + '|' + dateStr;
        if (!duplicadasMap[key]) duplicadasMap[key] = [];
        duplicadasMap[key].push(a);
    });
    const duplicadas = [];
    Object.values(duplicadasMap).forEach(lista => {
        if (lista.length > 1) duplicadas.push(lista);
    });
    duplicadas.sort((a, b) => b.length - a.length);

    const duplicadasRows = duplicadas.length ? duplicadas.map((lista, idx) => {
        const primerA = lista[0];
        const nombres = lista.map(a => a.nombre).join(', ');
        return {
            name: primerA.destino,
            sub: `${nombres} — ${primerA.fecha}`,
            val: lista.length + ' oradores',
            avatarHtml: '',
            onclick: `event.stopPropagation();openDuplicateDetail(${idx})`
        };
    }) : [];
    window._duplicadas = duplicadas;

    const cardDuplicadas = buildCard({
        id: 'stat-duplicadas', accentClass: 'danger', colorClass: 'danger',
        title: 'Asignaciones duplicadas',
        subtitle: 'Más de un orador asignado a la misma congregación el mismo día',
        totalLabel: duplicadas.length + ' duplicada' + (duplicadas.length !== 1 ? 's' : ''),
        rows: duplicadasRows
    });

    // ═══════════════════════════════════════════════
    //  TARJETA: BLOQUEADOS CON ASIGNACIONES POSTERIORES
    // ═══════════════════════════════════════════════
    const bloqAsignados = [];
    Object.entries(blockedThemes).forEach(([num, info]) => {
        const fromIdx = info.fromMonth === 'TODOS' ? -1 : MESES.indexOf(info.fromMonth);
        const asigs = allAssignments.filter(a => {
            if (String(a.temaNum).trim() !== num) return false;
            if (fromIdx < 0) return true;
            return MESES.indexOf(a.mes) >= fromIdx;
        });
        if (asigs.length > 0) {
            const title = themesMap[num] || 'Sin título';
            const congregaciones = [...new Set(asigs.map(a => a.destino))].join(', ');
            bloqAsignados.push({
                name: `#${num} — ${title}`,
                sub: `Bloqueado desde ${info.fromMonth || 'Todos'} · ${congregaciones}`,
                val: asigs.length + ' asignación' + (asigs.length !== 1 ? 'es' : ''),
                onclick: `event.stopPropagation();openTemaDetail('${escJs(num)}')`
            });
        }
    });

    const cardBloqAsignados = bloqAsignados.length ? buildCard({
        id: 'stat-bloq-asig', accentClass: 'danger', colorClass: 'danger',
        title: 'Bloqueados asignados',
        subtitle: 'Bosquejos bloqueados que ya tienen asignaciones',
        totalLabel: bloqAsignados.length + ' tema' + (bloqAsignados.length !== 1 ? 's' : ''),
        rows: bloqAsignados
    }) : null;

    // ═══════════════════════════════════════════════
    //  TARJETA: HORARIOS DE REUNIÓN
    // ═══════════════════════════════════════════════
    const allContacts = Object.values(contactsMap).filter(c => c.horario && c.horario !== '—');
    function parseHorario(h) {
        const raw = (h || '').trim();
        const parts = raw.split(/\s+/);
        const day = parts[0] || '';
        const time = parts.slice(1).join(' ') || '';
        const m = raw.match(/(\d{1,2}):(\d{2})/);
        const sortKey = m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 9999;
        return { day, time: m ? m[0] : (time || '—'), sortKey };
    }
    const sabado = [], domingo = [];
    allContacts.forEach(c => {
        const p = parseHorario(c.horario);
        const entry = { name: c.displayName, time: p.time, day: p.day, horario: c.horario, sortKey: p.sortKey };
        const raw = (c.horario || '').toLowerCase();
        if (/s[aá]b|sabado|sábado/i.test(raw)) sabado.push(entry);
        else if (/domingo|dom\b/i.test(raw)) domingo.push(entry);
    });
    sabado.sort((a, b) => a.sortKey - b.sortKey);
    domingo.sort((a, b) => a.sortKey - b.sortKey);
    const horariosCount = sabado.length + domingo.length;

    function renderHorariosRows(list, dayLabel) {
        if (!list.length) return '';
        return list.map(r => `
            <div class="stat-list-row">
                <div class="stat-list-info" style="flex:1;min-width:0;">
                    <div class="stat-list-name">${escHtml(r.name)}</div>
                </div>
                <span style="font-size:11px;font-weight:600;color:var(--text-2);background:var(--bg-card-alt);border:1px solid var(--border);border-radius:4px;padding:2px 8px;white-space:nowrap;flex-shrink:0;">${escHtml(dayLabel)}</span>
                <span class="stat-list-val blue" style="font-size:12px;font-weight:600;flex-shrink:0;">${escHtml(r.time)}</span>
            </div>`).join('');
    }

    const cardHorarios = `<div class="stat-card" id="stat-horarios" onclick="toggleStatCard(this)">
        <div class="stat-card-header">
            <div class="stat-card-header-left">
                <div class="stat-card-accent-bar green"></div>
                <div class="stat-card-texts">
                    <div class="stat-card-title">Horarios de Reunión</div>
                    <div class="stat-card-subtitle">Día y hora de cada congregación del circuito</div>
                </div>
            </div>
            <div class="stat-card-right">
                <span class="stat-card-count-pill green">${horariosCount} congregación${horariosCount !== 1 ? 'es' : ''}</span>
                <span class="stat-card-chevron">▼</span>
            </div>
        </div>
        <div class="stat-card-preview">
            <div class="stat-preview-row"><span class="stat-preview-name">🟩 Sáb.</span><span class="stat-preview-val green">${sabado.length}</span></div>
            <div class="stat-preview-row"><span class="stat-preview-name">🟦 Dom.</span><span class="stat-preview-val blue">${domingo.length}</span></div>
        </div>
        <div class="stat-card-body">
            <div class="stat-card-divider"></div>
            <div class="stat-card-list">
                ${sabado.length ? `<div style="font-size:11px;font-weight:700;color:var(--success);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">🟩 Sábado (${sabado.length})</div>${renderHorariosRows(sabado, 'Sáb.')}` : ''}
                ${domingo.length ? `<div style="font-size:11px;font-weight:700;color:var(--accent);margin:14px 0 6px;text-transform:uppercase;letter-spacing:0.5px;">🟦 Domingo (${domingo.length})</div>${renderHorariosRows(domingo, 'Dom.')}` : ''}
                ${!sabado.length && !domingo.length ? '<div class="stat-no-data">No hay horarios registrados en Contactos</div>' : ''}
            </div>
        </div>
    </div>`;

    // ═══════════════════════════════════════════════
    //  TARJETA: SUGERENCIAS DE BOSQUEJOS PARA MATRIZ
    // ═══════════════════════════════════════════════
    const cardSugBosquejos = (function() {
        if (!nMatriz) return null;
        const ANNO = 365 * 86400000;
        const now = Date.now();
        const visitasAMatrizLocal = allAssignments.filter(a => normalizeStr(a.destino) === nMatriz);
        const visitasByTemaLocal = new Map();
        visitasAMatrizLocal.forEach(a => {
            const k = String(a.temaNum).trim();
            if (!visitasByTemaLocal.has(k)) visitasByTemaLocal.set(k, []);
            visitasByTemaLocal.get(k).push(a);
        });
        const temasCountGlobal = {};
        allAssignments.forEach(a => { if (a.temaNum) temasCountGlobal[a.temaNum] = (temasCountGlobal[a.temaNum] || 0) + 1; });
        const uniqueLocal = getUnique();
        const speakersByTemaLocal = new Map();
        uniqueLocal.forEach(s => { if (s.temas) s.temas.forEach(t => { const k = String(t).trim(); if (!speakersByTemaLocal.has(k)) speakersByTemaLocal.set(k, []); speakersByTemaLocal.get(k).push(s); }); });
        const temasConOrador = new Set();
        globalSpeakers.forEach(s => { if (s.temas) s.temas.forEach(t => temasConOrador.add(String(t).trim())); });

        const nunca = [];
        const masDeAnno = [];
        const temasList = Object.entries(themesMap)
            .filter(([num]) => temasConOrador.has(String(num).trim()))
            .filter(([num]) => !temasPresentados.has(String(num).trim()))
            .map(([num, titulo]) => {
                const visitas = visitasByTemaLocal.get(String(num).trim()) || [];
                const fechas = visitas.map(a => parseFechaStr(a.fecha)).filter(Boolean).sort((a,b) => b-a);
                const ultima = fechas[0] || null;
                const dias = ultima ? Math.floor((now - ultima.getTime()) / 86400000) : null;
                const oradores = (speakersByTemaLocal.get(String(num).trim()) || []);
                const asignaciones = temasCountGlobal[num] || 0;
                const popularidad = oradores.length * 10 + asignaciones;
                const esNunca = dias === null;
                const esAnno = dias !== null && dias >= 365;
                const score = esNunca ? 999999 + popularidad : esAnno ? dias * 100 + popularidad : 0;
                const item = { num, titulo, dias, oradores, asignaciones, esNunca, esAnno, score };
                if (esNunca) nunca.push(item);
                else if (esAnno) masDeAnno.push(item);
                return item;
            })
            .filter(t => t.esNunca || t.esAnno)
            .sort((a, b) => b.score - a.score);

        const totalSug = temasList.length;

        window._sugBosquejos = { nunca, masDeAnno };

        return `<div class="stat-card" id="stat-sugbosquejos" onclick="toggleStatCard(this)">
            <div class="stat-card-header">
                <div class="stat-card-header-left">
                    <div class="stat-card-accent-bar blue"></div>
                    <div class="stat-card-texts">
                        <div class="stat-card-title">Bosquejos Sugeridos</div>
                        <div class="stat-card-subtitle">${matrizCong ? 'Pendientes en ' + escHtml(matrizCong) : 'Configura congregación matriz'}</div>
                    </div>
                </div>
                <div class="stat-card-right">
                    <span class="stat-card-count-pill blue">${totalSug} pendiente${totalSug !== 1 ? 's' : ''}</span>
                    <span class="stat-card-chevron">▼</span>
                </div>
            </div>
            <div class="stat-card-preview">
                ${temasList.slice(0, 3).map((t, i) => {
                    const tipoTag = t.esNunca ? '✨' : '⏰';
                    const tipoColor = t.esNunca ? 'blue' : 'warn';
                    return `<div class="stat-preview-row" style="cursor:pointer;" onclick="event.stopPropagation();openSugTemaDetail('${escJs(t.num)}','${t.esNunca ? 'nunca' : 'masdeanno'}')">
                        <span class="stat-preview-pos">${i+1}.</span>
                        <span class="stat-preview-name">#${escHtml(t.num)} — ${escHtml((t.titulo || '').substring(0,25))}${(t.titulo||'').length > 25 ? '…' : ''}</span>
                        <span class="stat-preview-val ${tipoColor}">${tipoTag}</span>
                    </div>`;
                }).join('') || '<div class="stat-no-data">Sin sugerencias</div>'}
            </div>
            <div class="stat-card-body">
                <div class="stat-card-divider"></div>
                <div class="stat-card-list">
                    ${temasList.length ? temasList.map((t, i) => {
                        const tipoTag = t.esNunca
                            ? '<span style="font-size:9px;padding:1px 6px;background:#ede9fe;color:#5b21b6;border-radius:8px;font-weight:700;">NUNCA</span>'
                            : `<span style="font-size:9px;padding:1px 6px;background:#fef3c7;color:#8a4c0e;border-radius:8px;font-weight:700;">+${Math.floor(t.dias/365)}A</span>`;
                        const popTag = t.oradores.length > 0 ? `<span style="font-size:9px;padding:1px 6px;background:var(--bg-card-alt);color:var(--text-2);border:1px solid var(--border);border-radius:8px;font-weight:600;">${t.oradores.length} or.</span>` : '';
                        const daysSub = t.esNunca ? 'Nunca dado' : `Hace ${t.dias} días`;
                        return `<div class="stat-list-row" onclick="event.stopPropagation();openSugTemaDetail('${escJs(t.num)}','${t.esNunca ? 'nunca' : 'masdeanno'}')" style="cursor:pointer;">
                            <span class="stat-list-pos ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${i+1}</span>
                            <div class="stat-list-info">
                                <div class="stat-list-name">#${escHtml(t.num)} — ${escHtml(t.titulo || 'Sin título')}</div>
                                <div class="stat-list-sub">${daysSub} · ${t.oradores.length} orador${t.oradores.length !== 1 ? 'es' : ''}</div>
                            </div>
                            <div style="display:flex;gap:4px;align-items:center;flex-shrink:0;">
                                ${tipoTag}
                                ${popTag}
                            </div>
                            <span style="font-size:10px;color:var(--accent);margin-left:2px;">→</span>
                        </div>`;
                    }).join('') : '<div class="stat-no-data">No hay bosquejos pendientes para sugerir</div>'}
                </div>
            </div>
        </div>`;
    })();

    // ═══════════════════════════════════════════════
    //  TARJETA: DISCURSANTES SIN BOSQUEJO
    // ═══════════════════════════════════════════════
    const sinBosquejoTotal = unique.filter(s => !(s.temas && s.temas.length > 0));
    const asignadosSinBosquejo = sinBosquejoTotal.filter(s => {
        return allAssignments.some(a => normalizeStr(a.nombre) === normalizeStr(s.nombre) && normalizeStr(a.origen) === normalizeStr(s.congregacion));
    });
    const registradosSinBosquejo = sinBosquejoTotal.filter(s => !asignadosSinBosquejo.includes(s));
    const cardSinBosquejo = `<div class="stat-card" id="stat-sinbosquejo" onclick="toggleStatCard(this)">
        <div class="stat-card-header">
            <div class="stat-card-header-left">
                <div class="stat-card-accent-bar warn"></div>
                <div class="stat-card-texts">
                    <div class="stat-card-title">Discursantes sin bosquejo</div>
                    <div class="stat-card-subtitle">Oradores sin número de bosquejo seleccionado</div>
                </div>
            </div>
            <div class="stat-card-right">
                <span class="stat-card-count-pill warn">${sinBosquejoTotal.length} orador${sinBosquejoTotal.length !== 1 ? 'es' : ''}</span>
                <span class="stat-card-chevron">▼</span>
            </div>
        </div>
        <div class="stat-card-preview">
            ${asignadosSinBosquejo.slice(0, 2).map(s => `
                <div class="stat-preview-row" style="cursor:pointer;" onclick="event.stopPropagation();openModal('${escJs(s.nombre)}','${escJs(s.congregacion)}')">
                    <span style="flex-shrink:0;">${getPhotoMini(s.nombre, s.congregacion)}</span>
                    <span class="stat-preview-name">${escHtml(s.nombre)} ${ratingBadgeHtml(getSpeakerRating(s.nombre, s.congregacion), true)}</span>
                    <span class="stat-preview-val warn">Asignado</span>
                </div>`).join('') || ''}
            ${registradosSinBosquejo.slice(0, 2).map(s => `
                <div class="stat-preview-row" style="cursor:pointer;" onclick="event.stopPropagation();openModal('${escJs(s.nombre)}','${escJs(s.congregacion)}')">
                    <span style="flex-shrink:0;">${getPhotoMini(s.nombre, s.congregacion)}</span>
                    <span class="stat-preview-name">${escHtml(s.nombre)} ${ratingBadgeHtml(getSpeakerRating(s.nombre, s.congregacion), true)}</span>
                    <span class="stat-preview-val" style="color:var(--text-3);">Registrado</span>
                </div>`).join('') || ''}
            ${!sinBosquejoTotal.length ? '<div class="stat-no-data">Todos tienen bosquejo asignado</div>' : ''}
        </div>
        <div class="stat-card-body">
            <div class="stat-card-divider"></div>
            <div class="stat-card-list">
                ${asignadosSinBosquejo.length ? `<div style="font-size:11px;font-weight:700;color:var(--warn);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">⚠️ Con asignaciones pero sin bosquejo (${asignadosSinBosquejo.length})</div>${asignadosSinBosquejo.map(s => {
                    const numAsigs = allAssignments.filter(a => normalizeStr(a.nombre) === normalizeStr(s.nombre) && normalizeStr(a.origen) === normalizeStr(s.congregacion)).length;
                    return `<div class="stat-list-row" style="cursor:pointer;border-left:2px solid var(--warn);background:rgba(234,179,8,0.04);" onclick="event.stopPropagation();openModal('${escJs(s.nombre)}','${escJs(s.congregacion)}')">
                        <span style="flex-shrink:0;">${getPhotoMini(s.nombre, s.congregacion)}</span>
                        <div class="stat-list-info">
                            <div class="stat-list-name">${escHtml(s.nombre)} ${ratingBadgeHtml(getSpeakerRating(s.nombre, s.congregacion), true)}</div>
                            <div class="stat-list-sub">${escHtml(s.congregacion)}${s.rol ? ' · ' + escHtml(s.rol) : ''}</div>
                        </div>
                        <span class="stat-list-val warn">${numAsigs} asig.</span>
                        <span style="font-size:10px;color:var(--accent);margin-left:2px;">→</span>
                    </div>`;
                }).join('')}` : ''}
                ${registradosSinBosquejo.length ? `<div style="font-size:11px;font-weight:700;color:var(--text-3);margin:${asignadosSinBosquejo.length ? '14' : '0'}px 0 6px;text-transform:uppercase;letter-spacing:0.5px;">📋 Registrados sin bosquejo (${registradosSinBosquejo.length})</div>${registradosSinBosquejo.map(s => `
                    <div class="stat-list-row" style="cursor:pointer;" onclick="event.stopPropagation();openModal('${escJs(s.nombre)}','${escJs(s.congregacion)}')">
                        <span style="flex-shrink:0;">${getPhotoMini(s.nombre, s.congregacion)}</span>
                        <div class="stat-list-info">
                            <div class="stat-list-name">${escHtml(s.nombre)} ${ratingBadgeHtml(getSpeakerRating(s.nombre, s.congregacion), true)}</div>
                            <div class="stat-list-sub">${escHtml(s.congregacion)}${s.rol ? ' · ' + escHtml(s.rol) : ''}</div>
                        </div>
                        <span style="font-size:10px;color:var(--text-3);">Sin bosquejo</span>
                        <span style="font-size:10px;color:var(--accent);margin-left:2px;">→</span>
                    </div>`).join('')}` : ''}
                ${!sinBosquejoTotal.length ? '<div class="stat-no-data">Todos los oradores tienen bosquejo asignado</div>' : ''}
            </div>
        </div>
    </div>`;

    // ── Render all stat cards directly in grid ──
    // ═══════════════════════════════════════════════
    //  TARJETA: AUSENCIAS
    // ═══════════════════════════════════════════════
    const absentSpkMap = {};
    allAssignments.forEach(a => {
        if (!isAbsent(a)) return;
        const k = a.nombre + '|' + a.origen;
        if (!absentSpkMap[k]) absentSpkMap[k] = { nombre: a.nombre, origen: a.origen, count: 0, asignaciones: [] };
        absentSpkMap[k].count++;
        absentSpkMap[k].asignaciones.push(a);
    });
    const absentSpks = Object.values(absentSpkMap).sort((a, b) => b.count - a.count);
    const totalAbsences = absentSpks.reduce((s, x) => s + x.count, 0);

    const cardAusencias = buildCard({
        id: 'stat-ausencias', accentClass: 'danger', colorClass: 'danger',
        title: 'Ausencias de Oradores',
        subtitle: 'Discursantes con asignaciones incumplidas',
        totalLabel: totalAbsences + ' ausencia' + (totalAbsences !== 1 ? 'es' : ''),
        rows: absentSpks.map(s => ({
            name: s.nombre,
            sub: s.origen + ' · Última: ' + s.asignaciones.sort((a,b) => parseStringToDate(b.fecha) - parseStringToDate(a.fecha))[0]?.fecha,
            val: s.count + (s.count === 1 ? ' vez' : ' veces'),
            avatarHtml: getPhotoMini(s.nombre, s.origen),
            rating: getSpeakerRating(s.nombre, s.origen),
            onclick: `event.stopPropagation();openModal('${escJs(s.nombre)}','${escJs(s.origen)}')`
        }))
    });

    const allStatCards = [];
    if (cardSugBosquejos) allStatCards.push({ html: cardSugBosquejos, title: 'Bosquejos Sugeridos', color: 'blue', icon: '💡' });
    if (cardBloqAsignados) allStatCards.push({ html: cardBloqAsignados, title: 'Bloqueados asignados', color: 'danger', icon: '🚫' });
    allStatCards.push(
        { html: cardMonthly,      title: 'Asignaciones por mes',      color: 'blue',  icon: '📊' },
        { html: cardCongregaciones, title: 'Congregaciones activas',   color: 'green', icon: '🏛️' },
        { html: cardSinBosquejo,  title: 'Discursantes sin bosquejo', color: 'warn',  icon: '📝' },
        { html: cardHorarios,     title: 'Horarios de Reunión',       color: 'green', icon: '📅' },
        { html: cardSinUso,        title: 'Oradores sin uso',         color: 'warn',  icon: '👤' },
        { html: cardAusencias,     title: 'Ausencias',                color: 'danger', icon: '🔴' },
        { html: cardDuplicadas,    title: 'Asignaciones duplicadas',  color: 'danger', icon: '🔁' },
        { html: card1,             title: 'Bosquejos más solicitados', color: 'blue',  icon: '📋' },
        { html: cardBosquejosPorOrador, title: 'Oradores con más bosquejos', color: 'blue', icon: '📚' },
        { html: card2,             title: 'Oradores más activos',     color: 'warn',  icon: '🎤' },
        { html: card4,             title: 'Mayor disponibilidad',     color: 'purple', icon: '📅' },
        { html: cardHistorial,     title: 'Historial de Discursos',   color: 'green', icon: '📜' },
        { html: cardInvitados,     title: 'Invitados a la Matriz',    color: 'purple', icon: '🎟️' },
        { html: cardDiscPresentados, title: 'Discursos Presentados',  color: 'green',  icon: '📣' },
        { html: cardCalificaciones, title: 'Calificaciones',         color: 'blue',   icon: '🏷️' }
    );
    window._statCards = allStatCards;

    grid.innerHTML = allStatCards.map((c, i) => {
        const countMatch = c.html.match(/class="stat-card-count-pill[^"]*">([^<]+)</);
        const count = countMatch ? countMatch[1] : '';
        return `<div class="stat-mini-card" onclick="openStatExpanded(${i})">
            <span style="font-size:22px;">${c.icon}</span>
            <div style="font-size:13px;font-weight:700;color:var(--text-1);">${c.title}</div>
            <span class="stat-card-count-pill ${c.color}" style="font-size:10px;">${count}</span>
        </div>`;
    }).join('');

    if (typeof G !== 'undefined') G.miniCards(grid.querySelectorAll('.stat-mini-card'));
}

function openStatExpanded(idx) {
    if (!window._statCards) return;
    const cards = window._statCards;
    const total = cards.length;
    if (idx < 0 || idx >= total) return;

    const card = cards[idx];
    window._prevExpandedOverlay = null;
    const existing = document.querySelector('.stat-expanded-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'stat-expanded-overlay';
    overlay.onclick = e => { if (e.target === overlay) closeStatExpanded(); };

    overlay.innerHTML = `
        <div class="stat-expanded-box">
            <div class="stat-expanded-header">
                <div class="stat-expanded-header-left">
                    <span style="font-size:20px;">${card.icon}</span>
                    <span style="font-weight:700;font-size:14px;color:var(--text-1);">${card.title}</span>
                    <span style="font-size:11px;color:var(--text-3);">${idx + 1} / ${total}</span>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div class="stat-expanded-nav">
                        <button onclick="navigateStatExpanded(-1)" ${idx === 0 ? 'disabled' : ''}>‹</button>
                        <button onclick="navigateStatExpanded(1)" ${idx === total - 1 ? 'disabled' : ''}>›</button>
                    </div>
                    <button onclick="closeStatExpanded()" style="width:32px;height:32px;border-radius:50%;border:1px solid var(--border);background:var(--bg-card);cursor:pointer;font-size:14px;color:var(--text-2);display:flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.borderColor='var(--danger)';this.style.color='var(--danger)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-2)'">✕</button>
                </div>
            </div>
            <div class="stat-expanded-body">${card.html}</div>
        </div>
    `;

    document.body.appendChild(overlay);

    const expandedCard = overlay.querySelector('.stat-card');
    if (expandedCard) expandedCard.classList.add('expanded');
    if (typeof G !== 'undefined') G.statOverlayIn(overlay, overlay.querySelector('.stat-expanded-box'));
}

function closeStatExpanded() {
    window._prevExpandedOverlay = null;
    const overlay = document.querySelector('.stat-expanded-overlay');
    if (overlay) {
        if (typeof G !== 'undefined') G.statOverlayOut(overlay, () => overlay.remove());
        else overlay.remove();
    }
}

function goBackToExpanded() {
    const detailOverlay = document.querySelector('.stat-expanded-overlay');
    if (detailOverlay) detailOverlay.remove();
    if (window._prevExpandedOverlay) {
        document.body.appendChild(window._prevExpandedOverlay);
        window._prevExpandedOverlay = null;
    }
}

function navigateStatExpanded(dir) {
    if (!window._statCards) return;
    const overlay = document.querySelector('.stat-expanded-overlay');
    if (!overlay) return;
    const currentIdx = parseInt(overlay.querySelector('.stat-expanded-header-left span:last-child')?.textContent) - 1 || 0;
    const newIdx = Math.max(0, Math.min(window._statCards.length - 1, currentIdx + dir));
    closeStatExpanded();
    setTimeout(() => openStatExpanded(newIdx), 50);
}

document.addEventListener('keydown', e => {
    const overlay = document.querySelector('.stat-expanded-overlay');
    if (!overlay) return;
    if (e.key === 'Escape') closeStatExpanded();
    else if (e.key === 'ArrowLeft') navigateStatExpanded(-1);
    else if (e.key === 'ArrowRight') navigateStatExpanded(1);
});

// ── ATAJOS DE TECLADO GLOBALES ──
document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        switchTab('dashboard');
        setTimeout(() => { const si = document.getElementById('search-input'); if (si) si.focus(); }, 200);
    }
    if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        const tabs = ['dashboard', 'estadisticas', 'months', 'aguayo', 'bosquejos', 'contactos'];
        const idx = parseInt(e.key) - 1;
        if (tabs[idx]) switchTab(tabs[idx]);
    }
});

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  gfUpdate,
  gfNav,
  gfGoTo,
  gfInitDrag,
  toggleStatCard,
  openMonthDetail,
  openCongDetail,
  openDuplicateDetail,
  openTemaDetail,
  openStatDetail,
  openSugTemaDetail,
  renderEstadisticasDashboard,
  openStatExpanded,
  closeStatExpanded,
  goBackToExpanded,
  navigateStatExpanded,
});
