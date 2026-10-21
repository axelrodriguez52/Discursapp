/* ==========================================================================
   Calendario de asignaciones y eventos especiales
   Origen: DISCURSAPP .html, script principal (L10345-10928)
   ========================================================================== */
// Convertir fechaStr (cualquier formato de allAssignments) a objeto Date o null
function parseFechaAsignacion(fechaStr) {
    if (!fechaStr || fechaStr === '—') return null;
    try {
        // Intento directo
        const d = new Date(fechaStr);
        if (!isNaN(d)) return d;

        // Formato español: "sábado 14 de junio de 2025" o "14 de junio de 2025"
        const mesesES = { enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,
            julio:6,agosto:7,septiembre:8,octubre:9,noviembre:10,diciembre:11 };
        const m = fechaStr.toLowerCase().match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/);
        if (m) {
            const mes = mesesES[m[2]];
            if (mes !== undefined) return new Date(parseInt(m[3]), mes, parseInt(m[1]));
        }
        // Sin año: "14 de junio"
        const m2 = fechaStr.toLowerCase().match(/(\d{1,2})\s+de\s+(\w+)/);
        if (m2) {
            const mes = mesesES[m2[2]];
            if (mes !== undefined) return new Date(new Date().getFullYear(), mes, parseInt(m2[1]));
        }
    } catch(e) {}
    return null;
}

// Obtener lista de asignaciones con fecha Date parseada
function getAsignacionesConFecha() {
    return allAssignments.map(a => ({
        ...a,
        _date: parseFechaAsignacion(a.fecha)
    })).filter(a => a._date);
}

function detectarConflictos() {
    if (_conflictosCache) return _conflictosCache;
    const asig = getAsignacionesConFecha();
    const byNombre = {};
    asig.forEach(a => {
        const key = normalizeStr(a.nombre);
        if (!byNombre[key]) byNombre[key] = [];
        byNombre[key].push(a);
    });
    const conflictos = [];
    Object.values(byNombre).forEach(lista => {
        lista.sort((a, b) => (a._date || 0) - (b._date || 0));
        for (let i = 0; i < lista.length; i++) {
            for (let j = i + 1; j < lista.length; j++) {
                const d1 = lista[i]._date, d2 = lista[j]._date;
                if (!d1 || !d2) continue;
                if ((d2 - d1) / 86400000 > 6) break;
                conflictos.push({ a: lista[i], b: lista[j] });
            }
        }
    });
    _conflictosCache = conflictos;
    return conflictos;
}

// Detectar asignaciones en períodos bloqueados por eventos especiales
// Solo aplica a la congregación matriz
function detectarAsigEnEventos() {
    const eventos = cargarEventos().filter(e => e.bloquea);
    if (!matrizCong) return [];
    const nMatriz = normalizeStr(matrizCong);
    const asig = getAsignacionesConFecha().filter(a => normalizeStr(a.destino) === nMatriz);
    const alertas = [];
    eventos.forEach(ev => {
        const inicio = new Date(ev.fechaInicio + 'T00:00:00');
        const fin = ev.fechaFin ? new Date(ev.fechaFin + 'T23:59:59') : new Date(ev.fechaInicio + 'T23:59:59');
        asig.forEach(a => {
            if (a._date >= inicio && a._date <= fin) {
                alertas.push({ asig: a, evento: ev });
            }
        });
    });
    return alertas;
}

function renderConflictsPanel() {
    const panel = document.getElementById('cal-conflicts-panel');
    const conflictos = detectarConflictos();
    const alertasEv  = detectarAsigEnEventos();
    const total = conflictos.length + alertasEv.length;

    if (!total) { panel.style.display = 'none'; return; }

    let html = `<div class="cal-conflicts-panel">
        <h4>⚠️ ${total} Alerta${total !== 1 ? 's' : ''} de Conflicto detectada${total !== 1 ? 's' : ''}</h4>`;

    conflictos.forEach(c => {
        html += `<div class="cal-conflict-row">
            🔴 <span><b>${escHtml(c.a.nombre)}</b> tiene <b>dos salidas en la misma semana</b>:
            ${escHtml(c.a.destino)} (${escHtml(c.a.fecha)}) y ${escHtml(c.b.destino)} (${escHtml(c.b.fecha)})</span>
        </div>`;
    });
    alertasEv.forEach(al => {
        html += `<div class="cal-conflict-row">
            🟣 <span><b>${escHtml(al.asig.nombre)}</b> tiene salida a ${escHtml(al.asig.destino)} el ${escHtml(al.asig.fecha)}
            durante: <b>${escHtml(al.evento.nombre)}</b></span>
        </div>`;
    });

    html += '</div>';
    panel.innerHTML = html;
    panel.style.display = 'block';
}

// Comprobar si una fecha Date cae en un evento especial (devuelve array de eventos)
function eventosEnFecha(d) {
    const calCongFilter = (document.getElementById('cal-cong-filter')?.value || '').trim();
    if (!calCongFilter || normalizeStr(calCongFilter) !== normalizeStr(matrizCong)) return [];
    const eventos = cargarEventos();
    return eventos.filter(ev => {
        const ini = new Date(ev.fechaInicio + 'T00:00:00');
        const fin = ev.fechaFin ? new Date(ev.fechaFin + 'T23:59:59') : new Date(ev.fechaInicio + 'T23:59:59');
        return d >= ini && d <= fin;
    });
}

// Asignaciones de un día concreto (filtrado por congregación destino si está activo)
function asignacionesDeHoy(d) {
    const year = d.getFullYear(), month = d.getMonth(), day = d.getDate();
    const calCongFilter = (document.getElementById('cal-cong-filter')?.value || '').trim();
    return getAsignacionesConFecha().filter(a => {
        const ad = a._date;
        const fechaOk = ad.getFullYear() === year && ad.getMonth() === month && ad.getDate() === day;
        if (!fechaOk) return false;
        if (calCongFilter) return normalizeStr(a.destino) === normalizeStr(calCongFilter);
        return true;
    });
}

// ─── POBLAR SELECTOR DE CONGREGACIÓN DEL CALENDARIO ──────────
function poblarCalCongFilter() {
    const sel = document.getElementById('cal-cong-filter');
    if (!sel) return;
    const currentVal = sel.value; // preservar selección actual
    // Usar destinationCongs (congregaciones que recibieron oradores)
    const todas = Array.from(destinationCongs).sort();
    sel.innerHTML = '<option value="">— Todas las congregaciones —</option>' +
        todas.map(c => `<option value="${escHtml(c)}"${currentVal === c ? ' selected' : ''}>${escHtml(c)}</option>`).join('');
    // Si hay congregación matriz configurada y aún no se ha filtrado, pre-seleccionarla
    if (!currentVal && matrizCong && destinationCongs.has(matrizCong)) {
        sel.value = matrizCong;
    }
}

// ─── RENDER PRINCIPAL ──────────────────────────────────────────
function renderCalendario() {
    const label = document.getElementById('cal-month-label');
    if (!label) return;
    sincronizarAsignacionesLocal();
    // Actualizar subtítulo del calendario con la congregación filtrada
    const calCongFilter = (document.getElementById('cal-cong-filter')?.value || '').trim();
    const calSubtitle = document.querySelector('#view-calendario .view-title p');
    if (calSubtitle) {
        calSubtitle.textContent = calCongFilter
            ? `Mostrando salidas hacia: ${calCongFilter}`
            : 'Vista mensual/semanal de salidas registradas. Marca eventos importantes para evitar conflictos.';
    }
    renderConflictsPanel();
    if (calView === 'mes')    renderCalMes();
    else                      renderCalSemana();
}

// ─── VISTA MENSUAL ─────────────────────────────────────────────
function renderCalMes() {
    const label = document.getElementById('cal-month-label');
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    label.textContent = `${meses[calMonth]} ${calYear}`;

    const hoy = new Date();
    const firstDay = new Date(calYear, calMonth, 1);
    // Pre-computar conflictos UNA vez para todo el render (evita O(n^2) repetido)
    const _conflictosCache = detectarConflictos();
    const _conflictosMap = {};
    _conflictosCache.forEach(c => {
        const keyA = normalizeStr(c.a.nombre);
        const keyB = normalizeStr(c.b.nombre);
        if (!_conflictosMap[keyA]) _conflictosMap[keyA] = [];
        if (!_conflictosMap[keyB]) _conflictosMap[keyB] = [];
        _conflictosMap[keyA].push(c.a);
        _conflictosMap[keyB].push(c.b);
    });
    const lastDay  = new Date(calYear, calMonth + 1, 0);
    // Semana empieza en lunes (0=Lun…6=Dom)
    let startDow = firstDay.getDay() - 1; if (startDow < 0) startDow = 6;
    const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7;

    const dias = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
    let html = `<div class="cal-month-grid">`;
    dias.forEach(d => html += `<div class="cal-day-header">${d}</div>`);

    for (let i = 0; i < totalCells; i++) {
        const dayOffset = i - startDow;
        const cellDate  = new Date(calYear, calMonth, 1 + dayOffset);
        const isCurrMonth = cellDate.getMonth() === calMonth && cellDate.getFullYear() === calYear;
        const isToday = cellDate.toDateString() === hoy.toDateString();
        const asigs   = asignacionesDeHoy(cellDate);
        const evts    = eventosEnFecha(cellDate);
        const tieneBloqueo = evts.some(e => e.bloquea);
        const dow = cellDate.getDay(); // 0=dom,6=sáb
        const esFinDeSemana = dow === 0 || dow === 6;

        let cls = 'cal-day';
        if (!isCurrMonth) cls += ' other-month';
        if (isToday)      cls += ' today';
        if (tieneBloqueo) cls += ' blocked-day';
        if (evts.length && !tieneBloqueo) cls += ' has-evento-especial';

        const dateKey = cellDate.toISOString().slice(0,10);
        html += `<div class="${cls}${asigs.length ? ' cal-day-has-asig' : ''}" data-date="${dateKey}" onclick="mostrarDiaDetalle('${dateKey}')">`;
        html += `<span class="cal-day-num">${cellDate.getDate()}</span>`;

        // Mostrar eventos especiales primero
        evts.slice(0,1).forEach(ev => {
            html += `<span class="cal-event-chip ${ev.tipo}" 
                data-ev-id="${ev.id}"
                onclick="event.stopPropagation();openEventoModal('${escJs(ev.id)}')"
                onmouseenter="showCalTooltip(event,'${escJs(ev.nombre)} [${escJs(ev.tipo)}]')" 
                onmouseleave="hideCalTooltip()">
                ${ev.tipo === 'superintendente' ? '🔵' : ev.tipo === 'asamblea' ? '🟡' : ev.tipo === 'especial' ? '🟢' : '⚫'} ${escHtml(ev.nombre)}
            </span>`;
        });

        // Asignaciones (max 2 visibles)
        const maxVisible = 2 - Math.min(evts.length, 1);
        asigs.slice(0, maxVisible).forEach(a => {
            const _keyA = normalizeStr(a.nombre);
            const _dateStr = cellDate.toDateString();
            const conflicto = (_conflictosMap[_keyA] || []).some(c => 
                parseFechaAsignacion(c.fecha)?.toDateString() === _dateStr
            );
            const bloqEvt = evts.some(e => e.bloquea);
            const warn = conflicto || bloqEvt;
            const _fotoSrcMes = speakerPhotos[getSpeakerPhotoKey(a.nombre, a.origen)] || '';
            const fotoChip = _fotoSrcMes ? `<img class="cal-chip-avatar" src="${_fotoSrcMes}" alt="">` : '🎤 ';
            html += `<span class="cal-event-chip asignacion has-foto${warn ? '" style="border-left:2px solid var(--danger)' : ''}" 
                onclick="event.stopPropagation();mostrarDiaDetalle('${cellDate.toISOString().slice(0,10)}')"
                onmouseenter="showCalTooltip(event,'🎤 ${escJs(a.nombre)}\\n→ ${escJs(a.destino)}\\n📋 #${escJs(String(a.temaNum))}${warn ? '\\n⚠️ Posible conflicto' : ''}')" 
                onmouseleave="hideCalTooltip()">${fotoChip}${escHtml(a.nombre.split(' ')[0])} → ${escHtml(a.destino.length > 9 ? a.destino.slice(0,9)+'…' : a.destino)}
            </span>`;
        });

        const sobrantes = asigs.length - maxVisible + Math.max(0, evts.length - 1);
        if (sobrantes > 0) {
            html += `<span class="cal-more-chip" 
                onclick="event.stopPropagation();mostrarDiaDetalle('${cellDate.toISOString().slice(0,10)}')"
                onmouseenter="showCalTooltip(event,'+${sobrantes} más en este día')" 
                onmouseleave="hideCalTooltip()">+${sobrantes} más</span>`;
        }

        html += '</div>';
    }
    html += '</div>';
    document.getElementById('cal-content').innerHTML = html;
}

// ─── VISTA SEMANAL ─────────────────────────────────────────────
function renderCalSemana() {
    if (!calWeekStart) {
        // Calcular el lunes de la semana actual dentro del mes seleccionado
        const hoy = new Date();
        const d = new Date(calYear, calMonth, 1);
        const dow = d.getDay(); let delta = dow === 0 ? -6 : 1 - dow;
        calWeekStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta);
    }

    const hoy = new Date();
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const diasSemana = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

    // Calcular los 7 días de la semana
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(calWeekStart);
        d.setDate(d.getDate() + i);
        weekDays.push(d);
    }

    const label = document.getElementById('cal-month-label');
    label.textContent = `Semana del ${weekDays[0].getDate()} ${meses[weekDays[0].getMonth()]} – ${weekDays[6].getDate()} ${meses[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`;

    // Pre-computar conflictos UNA vez para todo el render
    const _conflictosCache2 = detectarConflictos();
    const _conflictosMap2 = {};
    _conflictosCache2.forEach(c => {
        const keyA = normalizeStr(c.a.nombre);
        const keyB = normalizeStr(c.b.nombre);
        if (!_conflictosMap2[keyA]) _conflictosMap2[keyA] = [];
        if (!_conflictosMap2[keyB]) _conflictosMap2[keyB] = [];
        _conflictosMap2[keyA].push(c.a);
        _conflictosMap2[keyB].push(c.b);
    });

    let html = `<div class="cal-week-grid">
        <div class="cal-week-header"></div>`;
    weekDays.forEach((d, i) => {
        const isToday = d.toDateString() === hoy.toDateString();
        html += `<div class="cal-week-header day-head${isToday ? ' today-head' : ''}">
            <span class="wh-dayname">${diasSemana[i]}</span>
            <span class="wh-daynum">${d.getDate()}</span>
        </div>`;
    });
    html += `</div><div class="cal-week-grid">`;
    html += `<div class="cal-week-header" style="border-bottom:none;background:var(--bg-card-alt);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--text-3);writing-mode:vertical-lr;transform:rotate(180deg);">Eventos</div>`;

    weekDays.forEach(d => {
        const isToday = d.toDateString() === hoy.toDateString();
        const asigs   = asignacionesDeHoy(d);
        const evts    = eventosEnFecha(d);
        const tieneBloqueo = evts.some(e => e.bloquea);
        let cls = 'cal-week-cell';
        if (isToday)       cls += ' today-col';
        if (tieneBloqueo)  cls += ' blocked-col';

        const wDateKey = d.toISOString().slice(0,10);
        html += `<div class="${cls}" data-date="${wDateKey}" onclick="mostrarDiaDetalle('${wDateKey}')">`;

        evts.forEach(ev => {
            html += `<span class="cal-event-chip ${ev.tipo}" 
                onclick="openEventoModal('${escJs(ev.id)}')"
                onmouseenter="showCalTooltip(event,'${escJs(ev.nombre)}')" 
                onmouseleave="hideCalTooltip()">
                ${ev.tipo === 'superintendente' ? '🔵' : ev.tipo === 'asamblea' ? '🟡' : '🟢'} ${escHtml(ev.nombre)}
            </span>`;
        });

        asigs.forEach(a => {
            const _keyA2 = normalizeStr(a.nombre);
            const conflicto = !!(_conflictosMap2[_keyA2] && _conflictosMap2[_keyA2].length);
            const bloqEvt = evts.some(e => e.bloquea);
            const warn = conflicto || bloqEvt;
            const _fotoSrcSem = speakerPhotos[getSpeakerPhotoKey(a.nombre, a.origen)] || '';
            const fotoChip = _fotoSrcSem ? `<img class="cal-chip-avatar" src="${_fotoSrcSem}" alt="" style="width:20px;height:20px;">` : '🎤 ';
            html += `<span class="cal-event-chip asignacion has-foto" 
                style="${warn ? 'border-left:3px solid var(--danger)' : ''}"
                onclick="event.stopPropagation();mostrarDiaDetalle('${d.toISOString().slice(0,10)}')"
                onmouseenter="showCalTooltip(event,'🎤 ${escJs(a.nombre)}\\n→ ${escJs(a.destino)}\\n📋 Bosquejo #${escJs(String(a.temaNum))}\\n🏠 ${escJs(a.origen)}${warn ? '\\n⚠️ Posible conflicto' : ''}')" 
                onmouseleave="hideCalTooltip()">${fotoChip}${escHtml(a.nombre)}<br><small style="font-weight:400;opacity:0.8;">→ ${escHtml(a.destino.length > 12 ? a.destino.slice(0,12)+'…' : a.destino)}</small>
            </span>`;
        });
        if (!asigs.length && !evts.length) html += `<div style="font-size:11px;color:var(--text-3);padding:8px 4px;text-align:center;">—</div>`;
        html += `</div>`;
    });
    html += '</div>';
    document.getElementById('cal-content').innerHTML = html;
}

// ─── TOOLTIP ───────────────────────────────────────────────────
function showCalTooltip(e, text) {
    const tt = document.getElementById('cal-tooltip');
    tt.textContent = '';
    text.split('\n').forEach((line, i) => {
        if (i > 0) tt.appendChild(document.createElement('br'));
        tt.appendChild(document.createTextNode(line));
    });
    tt.style.opacity = '1';
    posicionarTooltip(e, tt);
}

function posicionarTooltip(e, tt) {
    const rect = e.target.getBoundingClientRect();
    let top = rect.bottom + 6;
    let left = rect.left;
    if (left + 220 > window.innerWidth) left = window.innerWidth - 230;
    if (top + 100 > window.innerHeight) top = rect.top - 80;
    tt.style.left = left + 'px';
    tt.style.top  = top  + 'px';
}

function hideCalTooltip() {
    document.getElementById('cal-tooltip').style.opacity = '0';
}

// ─── MODAL DETALLE DEL DÍA ────────────────────────────────────
function mostrarDiaDetalle(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    const asigs = asignacionesDeHoy(d);
    const evts  = eventosEnFecha(d);

    const diasNombre = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const mesesNombre = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const labelDia = `${diasNombre[d.getDay()]}, ${d.getDate()} de ${mesesNombre[d.getMonth()]} ${d.getFullYear()}`;
    const hoy = new Date();
    const esHoy = d.toDateString() === hoy.toDateString();

    document.getElementById('mdd-label').textContent = esHoy ? '📅 Hoy' : '📅 Detalle del día';
    document.getElementById('mdd-date').textContent = labelDia;
    const totalItems = asigs.length + evts.length;
    document.getElementById('mdd-summary').textContent = totalItems
        ? `${asigs.length} asignación${asigs.length !== 1 ? 'es' : ''} · ${evts.length} evento${evts.length !== 1 ? 's' : ''} especial${evts.length !== 1 ? 'es' : ''}`
        : 'Sin actividades registradas';

    let bodyHTML = '';

    if (evts.length) {
        bodyHTML += `<div class="mdd-section-label">Eventos Especiales</div>`;
        evts.forEach((ev, i) => {
            const icons = { superintendente:'🔵', asamblea:'🟡', especial:'🟢', otro:'⚫' };
            const colores = { superintendente:'purple', asamblea:'warn', especial:'green', otro:'' };
            bodyHTML += `<div class="mdd-ev-card" style="animation-delay:${i*0.06}s" onclick="closeDiaDetalle();openEventoModal('${ev.id}')">
                <div class="mdd-ev-icon">${icons[ev.tipo] || '📌'}</div>
                <div class="mdd-card-info">
                    <div class="mdd-card-name">${escHtml(ev.nombre)}</div>
                    <div class="mdd-card-sub">${ev.tipo.charAt(0).toUpperCase()+ev.tipo.slice(1)}${ev.notas ? ' · ' + escHtml(ev.notas) : ''}</div>
                    <div class="mdd-card-meta">
                        <span class="mdd-meta-pill ${colores[ev.tipo]}">${ev.bloquea ? '🚫 Restricción activa' : '📌 Sin restricción'}</span>
                        ${ev.fechaFin && ev.fechaFin !== ev.fechaInicio ? `<span class="mdd-meta-pill">Hasta ${ev.fechaFin}</span>` : ''}
                    </div>
                </div>
            </div>`;
        });
    }

    if (asigs.length) {
        bodyHTML += `<div class="mdd-section-label" style="margin-top:${evts.length?'8px':'0'}">Asignaciones</div>`;
        const conflictos = detectarConflictos();
        const conflictosMap = {};
        conflictos.forEach(c => {
            const kA = normalizeStr(c.a.nombre), kB = normalizeStr(c.b.nombre);
            if (!conflictosMap[kA]) conflictosMap[kA] = [];
            if (!conflictosMap[kB]) conflictosMap[kB] = [];
            conflictosMap[kA].push(c.a);
            conflictosMap[kB].push(c.b);
        });
        asigs.forEach((a, i) => {
            const foto = speakerPhotos[getSpeakerPhotoKey(a.nombre, a.origen)] || null;
            const fotoHTML = foto
                ? `<img class="mdd-card-avatar" src="${foto}" alt="${escHtml(a.nombre)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
                : '';
            const placeholderHTML = `<div class="mdd-card-avatar-ph" ${foto ? 'style="display:none"' : ''}>🎤</div>`;

            const _kConf = normalizeStr(a.nombre);
            const _dStr = d.toDateString();
            const tieneConflicto = (conflictosMap[_kConf] || []).some(c =>
                parseFechaAsignacion(c.fecha)?.toDateString() === _dStr
            );
            const bloqEvt = evts.some(e => e.bloquea);

            bodyHTML += `<div class="mdd-card" style="animation-delay:${(i + evts.length)*0.06}s" onclick="closeDiaDetalle();abrirSpeakerPorNombre('${escJs(a.nombre)}','${escJs(a.origen)}')">
                ${fotoHTML}${placeholderHTML}
                <div class="mdd-card-info">
                    <div class="mdd-card-name">${escHtml(a.nombre)}</div>
                    <div class="mdd-card-sub">🏠 ${escHtml(a.origen)} → 📍 ${escHtml(a.destino)}</div>
                    <div class="mdd-card-meta">
                        ${a.temaNum ? `<span class="mdd-meta-pill">📋 #${escHtml(String(a.temaNum))}</span>` : ''}
                        ${a.mes ? `<span class="mdd-meta-pill">${escHtml(a.mes)}</span>` : ''}
                        ${tieneConflicto ? `<span class="mdd-meta-pill danger">⚠️ Conflicto</span>` : ''}
                        ${bloqEvt ? `<span class="mdd-meta-pill danger">🚫 Período restringido</span>` : ''}
                    </div>
                </div>
            </div>`;
        });
    }

    if (!totalItems) {
        bodyHTML = `<div class="mdd-empty">
            <div style="font-size:36px;margin-bottom:8px;">📭</div>
            <p>No hay asignaciones ni eventos en este día.</p>
            <p style="margin-top:4px;font-size:12px;">Haz clic en "Agregar Evento Especial" para registrar algo.</p>
        </div>`;
    }

    document.getElementById('mdd-body').innerHTML = bodyHTML;
    document.getElementById('modal-dia-detalle').classList.add('active');
}

function closeDiaDetalle() {
    document.getElementById('modal-dia-detalle').classList.remove('active');
}

// Abrir ficha del discursante desde el modal del día
function abrirSpeakerPorNombre(nombre, origen) {
    if (!globalSpeakers) return;
    const sp = globalSpeakers.find(s =>
        normalizeStr(s.nombre) === normalizeStr(nombre) &&
        normalizeStr(s.congregacion) === normalizeStr(origen)
    );
    if (sp) openModal(sp.nombre, sp.congregacion);
}

// ─── NAVEGACIÓN ───────────────────────────────────────────────
function calNav(dir) {
    if (calView === 'mes') {
        calMonth += dir;
        if (calMonth > 11) { calMonth = 0; calYear++; }
        if (calMonth < 0)  { calMonth = 11; calYear--; }
        calWeekStart = null;
    } else {
        const d = new Date(calWeekStart);
        d.setDate(d.getDate() + dir * 7);
        calWeekStart = d;
        calYear  = d.getFullYear();
        calMonth = d.getMonth();
    }
    renderCalendario();
}

function calGoToday() {
    const hoy = new Date();
    calYear  = hoy.getFullYear();
    calMonth = hoy.getMonth();
    calWeekStart = null;
    renderCalendario();
}

function setCalView(v) {
    calView = v;
    if (v === 'semana' && !calWeekStart) {
        const hoy = new Date(calYear, calMonth, 1);
        const dow = hoy.getDay(); let delta = dow === 0 ? -6 : 1 - dow;
        calWeekStart = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + delta);
    }
    document.getElementById('cal-btn-mes').classList.toggle('active', v === 'mes');
    document.getElementById('cal-btn-semana').classList.toggle('active', v === 'semana');
    renderCalendario();
}

// ─── MODAL DE EVENTO ESPECIAL ─────────────────────────────────
function onMevTipoChange() {
    const tipo = document.getElementById('mev-tipo').value;
    document.getElementById('mev-bloquea').checked = 
        tipo === 'superintendente' || tipo === 'asamblea';
}

function openEventoModal(id) {
    eventoEditId = id;
    const eventos = cargarEventos();
    const ev = id ? eventos.find(e => e.id === id) : null;

    document.getElementById('mev-title').textContent = ev ? 'Editar Evento' : 'Agregar Evento Especial';
    document.getElementById('mev-id').value = ev?.id || '';
    document.getElementById('mev-tipo').value = ev?.tipo || 'superintendente';
    document.getElementById('mev-nombre').value = ev?.nombre || '';
    document.getElementById('mev-fecha-inicio').value = ev?.fechaInicio || '';
    document.getElementById('mev-fecha-fin').value = ev?.fechaFin || '';
    document.getElementById('mev-bloquea').checked = ev ? ev.bloquea : true;
    document.getElementById('mev-notas').value = ev?.notas || '';
    document.getElementById('mev-btn-delete').style.display = ev ? '' : 'none';
    onMevTipoChange();
    document.getElementById('modal-evento').classList.add('active');
}

function closeEventoModal() {
    document.getElementById('modal-evento').classList.remove('active');
    eventoEditId = null;
}

function saveEvento() {
    const nombre = document.getElementById('mev-nombre').value.trim();
    const fechaInicio = document.getElementById('mev-fecha-inicio').value;
    if (!nombre) { mostrarToast('⚠️ Escribe un nombre para el evento.', 'error'); return; }
    if (!fechaInicio) { mostrarToast('⚠️ Selecciona la fecha de inicio.', 'error'); return; }
    const fechaFin = document.getElementById('mev-fecha-fin').value;
    if (fechaFin && fechaFin < fechaInicio) { mostrarToast('⚠️ La fecha fin no puede ser anterior al inicio.', 'error'); return; }

    const eventos = cargarEventos();
    const obj = {
        id:           eventoEditId || genEventoId(),
        tipo:         document.getElementById('mev-tipo').value,
        nombre,
        fechaInicio,
        fechaFin:     fechaFin || '',
        bloquea:      document.getElementById('mev-bloquea').checked,
        notas:        document.getElementById('mev-notas').value.trim()
    };
    const idx = eventos.findIndex(e => e.id === obj.id);
    if (idx >= 0) eventos[idx] = obj; else eventos.push(obj);
    guardarEventos(eventos);
    closeEventoModal();
    mostrarToast(`✓ Evento "${nombre}" guardado.`, 'success');
    renderCalendario();
}

async function deleteEvento() {
    if (!eventoEditId) return;
    if (!(await showConfirm('Eliminar evento', '¿Eliminar este evento?'))) return;
    const eventos = cargarEventos().filter(e => e.id !== eventoEditId);
    guardarEventos(eventos);
    closeEventoModal();
    mostrarToast('🗑 Evento eliminado.', 'error');
    renderCalendario();
}

// Cerrar modal de evento con clic fuera
document.getElementById('modal-evento').addEventListener('click', function(e) {
    if (e.target === this) closeEventoModal();
});

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  parseFechaAsignacion,
  getAsignacionesConFecha,
  detectarConflictos,
  detectarAsigEnEventos,
  renderConflictsPanel,
  eventosEnFecha,
  asignacionesDeHoy,
  poblarCalCongFilter,
  renderCalendario,
  renderCalMes,
  renderCalSemana,
  showCalTooltip,
  posicionarTooltip,
  hideCalTooltip,
  mostrarDiaDetalle,
  closeDiaDetalle,
  abrirSpeakerPorNombre,
  calNav,
  calGoToday,
  setCalView,
  onMevTipoChange,
  openEventoModal,
  closeEventoModal,
  saveEvento,
  deleteEvento,
});
