/* ==========================================================================
   Todos los oradores: tarjetas, filtros, calificaciones y ausencias
   Origen: DISCURSAPP .html, script principal (L7137-9684)
   ========================================================================== */
function populateRolFilter() {
    const sel = document.getElementById('rol-filter');
    if (!sel || !globalSpeakers.length) return;
    const unique = Array.from(new Map(globalSpeakers.map(s => [s.nombre + s.congregacion, s])).values());
    const roles = [...new Set(unique.map(s => s.rol?.trim()).filter(Boolean))].sort();
    const current = sel.value;
    sel.innerHTML = '<option value="">— Todos los roles —</option>' +
        roles.map(r => `<option value="${escHtml(r)}" ${r === current ? 'selected' : ''}>${escHtml(r)}</option>`).join('');

    const cSel = document.getElementById('cong-filter');
    if (cSel) {
        const congs = [...new Set(unique.map(s => s.congregacion?.trim()).filter(Boolean))].sort();
        const cCurrent = cSel.value;
        cSel.innerHTML = '<option value="">— Todas las congregaciones —</option>' +
            congs.map(c => `<option value="${escHtml(c)}" ${c === cCurrent ? 'selected' : ''}>${escHtml(c)}</option>`).join('');
    }
}

function renderCards() {
    const container = document.getElementById('cards-container'); if (!container) return;
    const term = document.getElementById('search-input').value.toLowerCase().trim();
    const rolFilter = (document.getElementById('rol-filter')?.value || '').toLowerCase();
    const congFilter = (document.getElementById('cong-filter')?.value || '').trim();
    const unique = getUnique();
    populateRolFilter();
    const byRol = rolFilter ? unique.filter(s => s.rol?.trim().toLowerCase() === rolFilter) : unique;
    const byCong = congFilter ? byRol.filter(s => s.congregacion?.trim() === congFilter) : byRol;

    // ── Barra de resumen de roles ──
    const summaryBar = document.getElementById('rol-summary-bar');
    if (summaryBar && globalSpeakers.length > 0) {
        const pool = byCong;
        const totalPool = pool.length;
        const ancianos = pool.filter(s => s.rol?.trim().toLowerCase().includes('anciano')).length;
        const ministeriales = pool.filter(s => s.rol?.trim().toLowerCase().includes('ministerial') || s.rol?.trim().toLowerCase().includes('siervo')).length;
        summaryBar.style.display = 'flex';
        summaryBar.innerHTML = `
            <span>👥 Total: <b>${totalPool}</b></span>
            <span style="color:var(--accent);">🔵 Ancianos: <b>${ancianos}</b></span>
            <span style="color:var(--success);">🟢 Ministeriales: <b>${ministeriales}</b></span>`;
    } else if (summaryBar) {
        summaryBar.style.display = 'none';
    }
    if (!term) {
        if (globalSpeakers.length > 0) {
            container.innerHTML = byCong.map(s => {
                const isC16 = s.congregacion.trim().toLowerCase().includes('circuito') && s.congregacion.includes('16');
                const badge = isC16 ? `<span class="badge-circ16">★ Circuito 16</span>` : '';
                const photoKey = 'sp_photo_' + btoa(unescape(encodeURIComponent(s.nombre + '|' + s.congregacion))).replace(/[^a-zA-Z0-9]/g,'').slice(0,40);
                const photoSrc = speakerPhotos[photoKey] || '';
                const avatarHtml = photoSrc
                    ? `<div class="card-avatar-wrap"><img class="card-avatar" src="${photoSrc}" alt="Foto de ${escHtml(s.nombre)}"><div class="card-avatar-btn" onclick="event.stopPropagation();triggerPhotoUpload('${photoKey}')">✏️</div></div>`
                    : `<div class="card-avatar-placeholder" onclick="event.stopPropagation();triggerPhotoUpload('${photoKey}')" title="Agregar foto de perfil">👤<div class="card-avatar-btn">+</div></div>`;
                const rat = getSpeakerRating(s.nombre, s.congregacion);
                const nrClass = rat === 'NR' ? ' nr-card' : rat === 'ND' ? ' nd-card' : '';
                return `<div class="speaker-card${nrClass}" data-nombre="${escHtml(s.nombre)}" data-cong="${escHtml(s.congregacion)}">
                    <div class="card-rating-badge">${ratingBadgeHtml(rat, false)}</div>
                    <div class="card-header">
                        ${avatarHtml}
                        <div class="card-info">
                            <div class="card-role">${escHtml(s.rol)}${badge}</div>
                            <div class="card-name">${escHtml(s.nombre)}</div>
                            <div class="card-cong">${escHtml(s.congregacion)}</div>
                        </div>
                    </div>
                    <div class="card-cta">Ver detalles <span>→</span></div>
                </div>`;
            }).join('') || `<div class="empty-state"><p>Sin oradores con el rol seleccionado.</p></div>`;
        } else {
            container.innerHTML = `<div class="empty-state"><p>Conéctate a Google Sheets o carga un archivo Excel para visualizar los datos.</p></div>`;
        }
        return;
    }
    let html = "", matchedThemes = [];
    if (!isNaN(term) && themesMap[parseInt(term,10).toString()]) matchedThemes.push(parseInt(term,10).toString());
    else { for (const n in themesMap) { if (themesMap[n].toLowerCase().includes(term)) matchedThemes.push(n); } }

    matchedThemes.slice(0, 5).forEach(num => {
        const sps = unique.filter(s => s.temas.includes(num));
        const blocked = isThemeBlockedAtAll(num);
        const blockedBadge = blocked ? `<span style="font-size:11px;font-weight:700;color:var(--danger);background:var(--danger-dim);padding:2px 8px;border-radius:4px;margin-left:8px;">🔴 NO DISPONIBLE</span>` : '';
        const binfo = blockedThemes[num];
        const blockDetail = blocked ? `<div style="font-size:11.5px;color:#c0392b;background:var(--danger-dim);border-radius:6px;padding:6px 10px;margin-top:8px;">🚫 ${binfo?.fromMonth === 'TODOS' ? 'Bloqueado todos los meses' : `Bloqueado desde ${binfo?.fromMonth || '?'} en adelante`}${binfo?.reason ? ` — "${escHtml(binfo.reason)}"` : ''}</div>` : '';
        html += `<div class="speaker-card theme-card ${blocked ? 'blocked' : ''}" style="${blocked ? 'border-left-color:var(--danger);background:var(--danger-dim);' : ''}"><div><div class="card-role">Bosquejo${blockedBadge}</div><div class="card-name" style="color:${blocked ? 'var(--danger)' : 'var(--accent)'};">#${num}</div><div class="card-cong" style="font-weight:500;color:var(--text-1);">${escHtml(themesMap[num])}</div>${blockDetail}</div><div class="theme-speakers-list">${sps.length ? `<p>Oradores disponibles: <span class="badge badge-accent">${sps.length}</span></p>${sps.map(s => `<div class="theme-speaker-item" data-nombre="${escHtml(s.nombre)}" data-cong="${escHtml(s.congregacion)}"><span>👤 ${escHtml(s.nombre)}</span><span style="font-size:11px;color:var(--text-3);">${escHtml(s.congregacion)}</span></div>`).join('')}` : '<p>Ninguno listo con este tema</p>'}</div></div>`;
    });

    unique.filter(s => (fuzzyMatch(term, s.nombre) || fuzzyMatch(term, s.congregacion)) && (!rolFilter || s.rol?.trim().toLowerCase() === rolFilter) && (!congFilter || s.congregacion?.trim() === congFilter)).forEach(s => {
        const themeBadges = s.temas.map(t => {
            const blocked = isThemeBlockedAtAll(t);
            return `<span class="mini-theme-badge ${blocked ? 'theme-blocked' : ''}">#${t}${blocked ? ' 🔴' : ''}</span>`;
        }).join('');
        const photoKey = 'sp_photo_' + btoa(unescape(encodeURIComponent(s.nombre + '|' + s.congregacion))).replace(/[^a-zA-Z0-9]/g,'').slice(0,40);
        const photoSrc = speakerPhotos[photoKey] || '';
        const avatarHtml = photoSrc
            ? `<div class="card-avatar-wrap"><img class="card-avatar" src="${photoSrc}" alt="Foto de ${escHtml(s.nombre)}"><div class="card-avatar-btn" onclick="event.stopPropagation();triggerPhotoUpload('${photoKey}')">✏️</div></div>`
            : `<div class="card-avatar-placeholder" onclick="event.stopPropagation();triggerPhotoUpload('${photoKey}')" title="Agregar foto de perfil">👤</div>`;
        const rat = getSpeakerRating(s.nombre, s.congregacion);
        const nrClass = rat === 'NR' ? ' nr-card' : rat === 'ND' ? ' nd-card' : '';
        html += `<div class="speaker-card${nrClass}" data-nombre="${escHtml(s.nombre)}" data-cong="${escHtml(s.congregacion)}">
            <div class="card-rating-badge">${ratingBadgeHtml(rat, false)}</div>
            <div class="card-header">
                ${avatarHtml}
                <div class="card-info">
                    <div class="card-role">${escHtml(s.rol)}</div>
                    <div class="card-name">${escHtml(s.nombre)}</div>
                    <div class="card-cong">${escHtml(s.congregacion)}</div>
                    <div class="card-themes-preview">${themeBadges}</div>
                </div>
            </div>
            <div class="card-cta">Ver detalles <span>→</span></div>
        </div>`;
    });
    container.innerHTML = html || `<div class="empty-state"><p>Sin coincidencias.</p></div>`;
}

// ── FIN HELPERS DE FOTOS ──────────────────────────────────────

// Cargar fotos guardadas al iniciar
try {
    const saved = localStorage.getItem('discursapp_speaker_photos');
    if (saved) speakerPhotos = JSON.parse(saved);
} catch(e) { console.warn('Error cargando fotos desde localStorage:', e); }

function saveSpeakerPhotos() {
    // Guardar en IndexedDB (persistente) — cada foto como entrada individual
    if (!db) return;
    try {
        const tx = db.transaction(["photos"], "readwrite");
        const store = tx.objectStore("photos");
        // Primero limpiar y reescribir todo (simple y seguro)
        const clearReq = store.clear();
        clearReq.onsuccess = () => {
            Object.entries(speakerPhotos).forEach(([key, val]) => {
                store.put(val, key);
            });
        };
    } catch(e) { console.warn('Error guardando fotos en IndexedDB:', e); }
}

function _migratePhotosToIDB(photosObj) {
    if (!db || !photosObj || !Object.keys(photosObj).length) return;
    try {
        const tx = db.transaction(["photos"], "readwrite");
        const store = tx.objectStore("photos");
        Object.entries(photosObj).forEach(([key, val]) => store.put(val, key));
    } catch(e) { console.warn('Error migrando fotos a IndexedDB:', e); }
}

try {
    const savedR = localStorage.getItem('discursapp_speaker_ratings');
    if (savedR) speakerRatings = JSON.parse(savedR);
} catch(e) { speakerRatings = {}; }

function _ratingKey(nombre, congregacion) {
    return nombre + '|' + congregacion;
}

function getSpeakerRating(nombre, congregacion) {
    const r = speakerRatings[_ratingKey(nombre, congregacion)];
    return r || 'B';
}

function setSpeakerRating(nombre, congregacion, rating) {
    const k = _ratingKey(nombre, congregacion);
    if (rating === 'B') { delete speakerRatings[k]; }
    else { speakerRatings[k] = rating; }
    try { localStorage.setItem('discursapp_speaker_ratings', JSON.stringify(speakerRatings)); } catch(e) {}
    renderCards();
}

function getRatingInfo(val) {
    return RATING_OPTIONS.find(r => r.val === val) || RATING_OPTIONS.find(r => r.val === 'B');
}

function ratingBadgeHtml(val, small) {
    const info = getRatingInfo(val);
    const fs = small ? '9px' : '10px';
    const sz = small ? '20px' : '24px';
    const bg = info.val === 'NR' ? '#fef2f2' : info.color + '18';
    return `<span class="speaker-rating-badge" style="font-size:${fs};width:${sz};height:${sz};display:inline-flex;align-items:center;justify-content:center;color:${info.color};background:${bg};border:1px solid ${info.color}30;border-radius:50%;font-weight:700;white-space:nowrap;vertical-align:middle;flex-shrink:0;">${info.val}</span>`;
}

function getAssignmentKey(a) {
    return [a.nombre, a.origen, a.destino, a.fecha, a.temaNum].join('|');
}

function isAbsent(a) {
    return !!speakerAbsences[getAssignmentKey(a)];
}

function getAbsenceInfo(a) {
    return speakerAbsences[getAssignmentKey(a)] || null;
}

function isSubstituted(a) {
    const info = getAbsenceInfo(a);
    return !!(info && info.sustituto);
}

function toggleAbsence(a, motivo, sustituto, temaSust) {
    const k = getAssignmentKey(a);
    if (speakerAbsences[k]) {
        delete speakerAbsences[k];
    } else {
        speakerAbsences[k] = {
            date: new Date().toISOString(),
            motivo: motivo || '',
            sustituto: sustituto || '',
            temaSust: temaSust || ''
        };
    }
    try { localStorage.setItem(ABSENCES_KEY, JSON.stringify(speakerAbsences)); } catch(e) {}
}

function setAbsenceSubstitute(a, sustituto) {
    const k = getAssignmentKey(a);
    if (speakerAbsences[k]) {
        speakerAbsences[k].sustituto = sustituto || '';
        try { localStorage.setItem(ABSENCES_KEY, JSON.stringify(speakerAbsences)); } catch(e) {}
    }
}

function getSpeakerAbsences(nombre, origen) {
    return allAssignments.filter(a =>
        normalizeStr(a.nombre) === normalizeStr(nombre) &&
        normalizeStr(a.origen) === normalizeStr(origen) &&
        isAbsent(a)
    );
}

function getAbsenceCount(nombre, origen) {
    return getSpeakerAbsences(nombre, origen).length;
}

function absenceBadgeHtml(count) {
    if (!count) return '';
    return `<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;padding:2px 7px;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:6px;font-weight:700;white-space:nowrap;">🔴 ${count} ausencia${count !== 1 ? 'es' : ''}</span>`;
}

function getSpeakerThemesByName(nombre, congregacion) {
    var found = null;
    var all = getUnique();
    for (var i = 0; i < all.length; i++) {
        if (normalizeStr(all[i].nombre) === normalizeStr(nombre) && normalizeStr(all[i].congregacion) === normalizeStr(congregacion)) {
            found = all[i];
            break;
        }
    }
    if (!found) {
        var gs = globalSpeakers;
        for (var j = 0; j < gs.length; j++) {
            if (normalizeStr(gs[j].nombre) === normalizeStr(nombre) && normalizeStr(gs[j].congregacion) === normalizeStr(congregacion)) {
                found = gs[j];
                break;
            }
        }
    }
    return found && found.temas ? found.temas : [];
}

function buildTemaSelectOptions(themes, selectedVal) {
    var html = '<option value="">— Sin bosquejo —</option>';
    for (var i = 0; i < themes.length; i++) {
        var t = themes[i];
        var label = '#' + t + (themesMap[t] ? ' — ' + themesMap[t] : '');
        var sel = (String(t) === String(selectedVal)) ? ' selected' : '';
        html += '<option value="' + escHtml(String(t)) + '"' + sel + '>' + escHtml(label) + '</option>';
    }
    return html;
}

function onAbsenceSustitutoChange() {
    var sustEl = document.getElementById('absence-sustituto') || document.getElementById('absence-sust-edit');
    var temaEl = document.getElementById('absence-tema-sust') || document.getElementById('absence-tema-sust-edit');
    if (!sustEl || !temaEl) return;
    var val = sustEl.value;
    if (!val) { temaEl.innerHTML = '<option value="">— Sin bosquejo —</option>'; return; }
    var parts = val.split('|');
    var themes = getSpeakerThemesByName(parts[0], parts[1]);
    var currentTema = temaEl.value;
    temaEl.innerHTML = buildTemaSelectOptions(themes, currentTema);
}

function showAbsenceModal(a) {
    window._absenceTarget = a;
    var modal = document.getElementById('modal');
    var body = document.getElementById('modal-body');
    if (!modal || !body) return;
    var prevContent = body.innerHTML;
    window._prevAbsenceContent = prevContent;
    var info = getAbsenceInfo(a);
    var existing = !!info;
    var speakers = getUnique().filter(function(s) {
        return !(normalizeStr(s.nombre) === normalizeStr(a.nombre) && normalizeStr(s.congregacion) === normalizeStr(a.origen));
    });
    var selOpts = '';
    for (var i = 0; i < speakers.length; i++) {
        var sp = speakers[i];
        var spVal = escHtml(sp.nombre) + '|' + escHtml(sp.congregacion);
        var spLabel = escHtml(sp.nombre) + ' (' + escHtml(sp.congregacion) + ')';
        var selected = (info && info.sustituto === sp.nombre + '|' + sp.congregacion) ? ' selected' : '';
        selOpts += '<option value="' + spVal + '"' + selected + '>' + spLabel + '</option>';
    }
    var sustLabel = (info && info.sustituto) ? '🟢 Sustituido' : '🔴 Ausente';
    var html = '<div style="max-width:420px;">';
    html += '<h3 style="margin:0 0 12px;font-size:16px;color:var(--text-1);">' + (existing ? '📋 Detalle de Ausencia' : '🔴 Marcar Ausencia') + '</h3>';
    html += '<div style="background:var(--bg-card-alt);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;margin-bottom:14px;">';
    html += '<div style="font-weight:600;font-size:13px;">' + escHtml(a.nombre) + '</div>';
    html += '<div style="font-size:12px;color:var(--text-2);">' + escHtml(a.origen) + ' → ' + escHtml(a.destino) + '</div>';
    html += '<div style="font-size:12px;color:var(--text-2);">' + escHtml(a.fecha) + ' · #' + escHtml(a.temaNum) + '</div>';
    html += '</div>';
    if (existing) {
        var fDate = info.date ? new Date(info.date).toLocaleDateString('es-ES') : '—';
        html += '<div style="font-size:12px;color:var(--text-2);margin-bottom:6px;">Marcada: ' + fDate + (info.motivo ? ' · Motivo: ' + escHtml(info.motivo) : '') + '</div>';
        html += '<div style="font-size:12px;font-weight:600;margin-bottom:10px;">Estado: ' + sustLabel + (info.sustituto ? ' → ' + escHtml(info.sustituto.split('|')[0]) : '') + '</div>';
        html += '<div style="margin-bottom:10px;">';
        html += '<label style="font-size:12px;font-weight:600;color:var(--text-2);display:block;margin-bottom:4px;">Motivo</label>';
        html += '<input id="absence-motivo-edit" type="text" value="' + escHtml(info.motivo || '') + '" placeholder="Ej: Enfermedad, viaje..." style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;box-sizing:border-box;">';
        html += '</div>';
        html += '<div style="margin-bottom:12px;">';
        html += '<label style="font-size:12px;font-weight:600;color:var(--text-2);display:block;margin-bottom:4px;">Sustituto</label>';
        html += '<select id="absence-sust-edit" onchange="onAbsenceSustitutoChange()" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;box-sizing:border-box;">';
        html += '<option value="">— Sin sustituto —</option>';
        html += selOpts;
        html += '</select>';
        html += '</div>';
        html += '<div style="margin-bottom:12px;">';
        html += '<label style="font-size:12px;font-weight:600;color:var(--text-2);display:block;margin-bottom:4px;">Bosquejo del sustituto</label>';
        var temasSust = [];
        if (info && info.sustituto) {
            var sustParts = info.sustituto.split('|');
            temasSust = getSpeakerThemesByName(sustParts[0], sustParts[1]);
        }
        html += '<select id="absence-tema-sust-edit" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;box-sizing:border-box;">';
        html += buildTemaSelectOptions(temasSust, info ? info.temaSust : '');
        html += '</select>';
        html += '</div>';
        html += '<div style="display:flex;gap:8px;">';
        html += '<button onclick="saveAbsenceEdit()" style="flex:1;padding:8px;border-radius:var(--radius-sm);border:none;background:var(--accent);color:#fff;font-size:12px;font-weight:600;cursor:pointer;">💾 Guardar</button>';
        html += '<button onclick="removeAbsence()" style="flex:1;padding:8px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--bg-card);font-size:12px;font-weight:600;cursor:pointer;">↩ Quitar ausencia</button>';
        html += '<button onclick="closeModal()" style="flex:1;padding:8px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--bg-card);font-size:12px;font-weight:600;cursor:pointer;">Cerrar</button>';
        html += '</div>';
    } else {
        html += '<div style="margin-bottom:10px;">';
        html += '<label style="font-size:12px;font-weight:600;color:var(--text-2);display:block;margin-bottom:4px;">Motivo (opcional)</label>';
        html += '<input id="absence-motivo" type="text" placeholder="Ej: Enfermedad, viaje, emergencia..." style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;box-sizing:border-box;">';
        html += '</div>';
        html += '<div style="margin-bottom:12px;">';
        html += '<label style="font-size:12px;font-weight:600;color:var(--text-2);display:block;margin-bottom:4px;">Sustituto (opcional)</label>';
        html += '<select id="absence-sustituto" onchange="onAbsenceSustitutoChange()" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;box-sizing:border-box;">';
        html += '<option value="">— Sin sustituto —</option>';
        html += selOpts;
        html += '</select>';
        html += '</div>';
        html += '<div style="margin-bottom:12px;" id="absence-tema-sust-wrap">';
        html += '<label style="font-size:12px;font-weight:600;color:var(--text-2);display:block;margin-bottom:4px;">Bosquejo del sustituto</label>';
        html += '<select id="absence-tema-sust" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;box-sizing:border-box;">';
        html += '<option value="">— Sin bosquejo —</option>';
        html += '</select>';
        html += '</div>';
        html += '<div style="display:flex;gap:8px;">';
        html += '<button onclick="confirmMarkAbsence()" style="flex:1;padding:8px;border-radius:var(--radius-sm);border:none;background:#dc2626;color:#fff;font-size:12px;font-weight:600;cursor:pointer;">🔴 Confirmar Ausencia</button>';
        html += '<button onclick="closeModal()" style="flex:1;padding:8px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--bg-card);font-size:12px;font-weight:600;cursor:pointer;">Cancelar</button>';
        html += '</div>';
    }
    html += '</div>';
    body.innerHTML = html;
    modal.classList.add('active');
}

function confirmMarkAbsence() {
    var a = window._absenceTarget;
    if (!a) return;
    var motivoEl = document.getElementById('absence-motivo');
    var sustEl = document.getElementById('absence-sustituto');
    var temaEl = document.getElementById('absence-tema-sust');
    var motivo = motivoEl ? motivoEl.value.trim() : '';
    var sustRaw = sustEl ? sustEl.value : '';
    var temaSust = temaEl ? temaEl.value : '';
    toggleAbsence(a, motivo, sustRaw, temaSust);
    closeModal();
    var sustName = sustRaw ? sustRaw.split('|')[0] : '';
    mostrarToast(sustRaw ? '🟢 Ausencia con sustituto: ' + sustName : '🔴 Ausencia registrada: ' + a.nombre, sustRaw ? 'success' : 'warn');
    renderAguayoView();
    renderVisitasView();
    if (typeof renderEstadisticasDashboard === 'function') renderEstadisticasDashboard();
}

function saveAbsenceEdit() {
    var a = window._absenceTarget;
    if (!a) return;
    var motivoEl = document.getElementById('absence-motivo-edit');
    var sustEl = document.getElementById('absence-sust-edit');
    var temaEl = document.getElementById('absence-tema-sust-edit');
    var motivo = motivoEl ? motivoEl.value.trim() : '';
    var sustRaw = sustEl ? sustEl.value : '';
    var temaSust = temaEl ? temaEl.value : '';
    var k = getAssignmentKey(a);
    if (speakerAbsences[k]) {
        speakerAbsences[k].motivo = motivo;
        speakerAbsences[k].sustituto = sustRaw;
        speakerAbsences[k].temaSust = temaSust;
        try { localStorage.setItem(ABSENCES_KEY, JSON.stringify(speakerAbsences)); } catch(e) {}
    }
    closeModal();
    mostrarToast('Ausencia actualizada', 'success');
    renderAguayoView();
    renderVisitasView();
    if (typeof renderEstadisticasDashboard === 'function') renderEstadisticasDashboard();
}

function removeAbsence() {
    var a = window._absenceTarget;
    if (!a) return;
    toggleAbsence(a, '', '');
    closeModal();
    mostrarToast('Ausencia eliminada', 'success');
    renderAguayoView();
    renderVisitasView();
    if (typeof renderEstadisticasDashboard === 'function') renderEstadisticasDashboard();
}

// ── Contador de resultados en renderCards ──────────────────────
// Patch: sobreescribir renderCards para inyectar contador
const _origRenderCards = renderCards;

renderCards = function() {
    _origRenderCards();
    const counter = document.getElementById('search-counter');
    if (!counter) return;
    const unique = getUnique();
    const term = document.getElementById('search-input').value.trim();
    const rol  = (document.getElementById('rol-filter')?.value || '').toLowerCase();
    if (!globalSpeakers.length) { counter.style.display = 'none'; return; }
    const visible = unique.filter(s =>
        (!rol || s.rol?.trim().toLowerCase() === rol) &&
        (!term || fuzzyMatch(term, s.nombre) || fuzzyMatch(term, s.congregacion))
    ).length;
    counter.textContent = `${visible} de ${unique.length} oradores`;
    counter.style.display = 'inline';
};

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  populateRolFilter,
  renderCards,
  saveSpeakerPhotos,
  _migratePhotosToIDB,
  _ratingKey,
  getSpeakerRating,
  setSpeakerRating,
  getRatingInfo,
  ratingBadgeHtml,
  getAssignmentKey,
  isAbsent,
  getAbsenceInfo,
  isSubstituted,
  toggleAbsence,
  setAbsenceSubstitute,
  getSpeakerAbsences,
  getAbsenceCount,
  absenceBadgeHtml,
  getSpeakerThemesByName,
  buildTemaSelectOptions,
  onAbsenceSustitutoChange,
  showAbsenceModal,
  confirmMarkAbsence,
  saveAbsenceEdit,
  removeAbsence,
  _origRenderCards,
});
