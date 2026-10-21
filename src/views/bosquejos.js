/* ==========================================================================
   Bosquejos: disponibilidad, bloqueos y seleccion multiple
   Origen: DISCURSAPP .html, script principal (L4642-5054)
   ========================================================================== */
function saveBlockedThemes() {
    const json = JSON.stringify(blockedThemes);
    if (db) {
        try { db.transaction(["files"], "readwrite").objectStore("files").put(json, "blockedThemes"); }
        catch(e) { console.warn('Error guardando bosquejos bloqueados en IndexedDB:', e); }
    }
    try { localStorage.setItem('discursapp_blockedThemes', json); } catch(e) { console.warn('Error guardando bosquejos bloqueados en localStorage:', e); }
}

function isThemeBlockedForMonth(num, monthName) {
    const b = blockedThemes[num.toString()];
    if (!b) return false;
    // Bloqueo desde todos los meses
    if (b.fromMonth === 'TODOS') return true;
    // Bloqueo desde un mes específico: bloqueado si monthName >= fromMonth en orden calendario
    const fromIdx = MESES.indexOf(b.fromMonth);
    const checkIdx = MESES.indexOf(monthName);
    if (fromIdx < 0 || checkIdx < 0) return true; // dato inválido → bloquear por seguridad
    return checkIdx >= fromIdx;
}

function isThemeBlockedAtAll(num) {
    // Devuelve true si el bosquejo está bloqueado en AL MENOS un mes (útil para badges visuales)
    return !!blockedThemes[num.toString()];
}

function toggleBsqSelMode() {
    bsqSelMode = !bsqSelMode;
    if (!bsqSelMode) bsqSel.clear();
    const btn = document.getElementById('btn-bsq-selmode');
    if (btn) {
        btn.style.background = bsqSelMode ? 'var(--accent)' : '';
        btn.style.color = bsqSelMode ? '#fff' : '';
        btn.style.borderColor = bsqSelMode ? 'var(--accent)' : '';
        btn.innerHTML = bsqSelMode ? '☑️ Seleccionando…' : '☑️ Selección múltiple';
    }
    renderBosquejosView();
}

function toggleBsqSel(key) {
    if (!bsqSelMode) return;
    if (bsqSel.has(key)) bsqSel.delete(key); else bsqSel.add(key);
    renderBosquejosView();
}

function removeBsqSel(key) {
    bsqSel.delete(key);
    renderBosquejosView();
}

function selectVisibleBsq() {
    if (!bsqVisibleKeys.length) { mostrarToast('No hay bosquejos visibles para seleccionar.', 'error'); return; }
    bsqVisibleKeys.forEach(k => bsqSel.add(k));
    renderBosquejosView();
}

function clearBsqSel() {
    if (!bsqSel.size) return;
    bsqSel.clear();
    renderBosquejosView();
}

function renderBsqPreselectPanel() {
    const panel = document.getElementById('bsq-preselect-panel');
    if (!panel) return;
    if (!bsqSelMode) { panel.style.display = 'none'; return; }
    panel.style.display = 'block';

    const countEl = document.getElementById('bsq-sel-count');
    if (countEl) countEl.textContent = bsqSel.size;

    const list = document.getElementById('bsq-sel-list');
    if (list) {
        const keys = Array.from(bsqSel).sort((a, b) => (parseInt(a,10)||0) - (parseInt(b,10)||0));
        list.innerHTML = keys.length
            ? `<div style="display:flex;flex-wrap:wrap;gap:6px;">` + keys.map(k => {
                const t = themesMap[k] || '';
                return `<span class="bsq-sel-chip">🔴 #${escHtml(k)}${t ? ' · ' + escHtml(t.length > 34 ? t.slice(0,34) + '…' : t) : ''}
                    <button onclick="event.stopPropagation();removeBsqSel('${k}')" title="Quitar">✕</button></span>`;
            }).join('') + `</div>`
            : `<div class="preselect-empty">Marca los bosquejos que quieres marcar como no disponibles.</div>`;
    }

    const btn = document.getElementById('bsq-bulk-block-btn');
    if (btn) {
        btn.disabled = !bsqSel.size;
        btn.textContent = `🔴 Marcar no disponibles (${bsqSel.size})`;
    }
}

function renderBosquejosView() {
    const grid = document.getElementById('bosquejos-grid');
    const search = (document.getElementById('bosquejos-search')?.value || '').trim().toLowerCase();
    const filter = document.getElementById('bosquejos-filter')?.value || 'TODOS';

    const allNums = Object.keys(themesMap).map(n => parseInt(n,10)).filter(n => !isNaN(n)).sort((a,b)=>a-b);

    if (!allNums.length) {
        grid.innerHTML = `<div class="empty-state"><p>Carga el catálogo PDF de bosquejos para visualizar el listado.</p></div>`;
        document.getElementById('bosquejos-summary-bar').style.display = 'none';
        bsqVisibleKeys = [];
        renderBsqPreselectPanel();
        return;
    }

    const unique = Array.from(new Map(globalSpeakers.map(s => [s.nombre+s.congregacion, s])).values());

    let entries = allNums.map(n => {
        const key = n.toString();
        const title = themesMap[key] || '';
        const blocked = isThemeBlockedAtAll(key);
        const info = blockedThemes[key];
        const speakerCount = unique.filter(s => s.temas.includes(key)).length;
        return { n, key, title, blocked, info, speakerCount };
    });

    // Filtro de búsqueda
    if (search) {
        entries = entries.filter(e =>
            e.key.includes(search) ||
            e.title.toLowerCase().includes(search) ||
            fuzzyMatch(search, e.title)
        );
    }
    // Filtro estado
    if (filter === 'BLOQUEADOS') entries = entries.filter(e => e.blocked);
    if (filter === 'LIBRES') entries = entries.filter(e => !e.blocked);

    // Resumen
    const totalAll = allNums.length;
    const totalBlocked = Object.keys(blockedThemes).length;
    document.getElementById('bsq-total').textContent = totalAll;
    document.getElementById('bsq-blocked').textContent = totalBlocked;
    document.getElementById('bsq-free').textContent = totalAll - totalBlocked;
    document.getElementById('bosquejos-summary-bar').style.display = 'flex';

    // Claves visibles (para "Seleccionar visibles")
    bsqVisibleKeys = entries.map(e => e.key);
    renderBsqPreselectPanel();

    if (!entries.length) {
        grid.innerHTML = `<div class="empty-state"><p>Sin bosquejos que coincidan con los filtros.</p></div>`;
        return;
    }

    grid.innerHTML = entries.map(({n, key, title, blocked, info, speakerCount}) => {
        const selected = bsqSelMode && bsqSel.has(key);
        const stopSel = bsqSelMode ? `event.stopPropagation();` : '';
        return `<div class="bsq-card ${blocked ? 'blocked' : ''}${bsqSelMode ? ' selectable' : ''}${selected ? ' selected' : ''}"${bsqSelMode ? ` onclick="toggleBsqSel('${key}')"` : ''}>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span class="bsq-num">Bosquejo #${n}</span>
                ${bsqSelMode ? `<span style="display:flex;align-items:center;gap:6px;">
                <input type="checkbox" class="bsq-sel-chk" ${selected ? 'checked' : ''} onclick="${stopSel}toggleBsqSel('${key}')" aria-label="Seleccionar bosquejo ${n}"></span>` : ''}
                ${blocked ? `<span style="font-size:11px;font-weight:700;color:var(--danger);background:var(--danger-dim);padding:2px 8px;border-radius:4px;">🔴 NO DISPONIBLE</span>` : `<span style="font-size:11px;font-weight:700;color:var(--success);background:var(--success-dim);padding:2px 8px;border-radius:4px;">🟢 Libre</span>`}
            </div>
            <div class="bsq-title">${title ? escHtml(title) : '<span style="color:var(--text-3);font-style:italic;">Sin título en catálogo</span>'}</div>
            ${blocked ? `<div class="bsq-blocked-info">🚫 ${info.fromMonth === 'TODOS' ? 'Todos los meses' : `Desde ${escHtml(info.fromMonth)} en adelante`}${info.reason ? ` — "${escHtml(info.reason)}"` : ''}</div>` : ''}
            <div class="bsq-speakers" onclick="event.stopPropagation();openBsqTemaDetail('${key}')">🎤 ${speakerCount} orador${speakerCount !== 1 ? 'es' : ''} con este tema →</div>
            <div class="bsq-actions">
                ${blocked
                    ? `<button class="btn-block btn-block-off" onclick="${stopSel}unblockTheme('${key}')">✅ Desbloquear</button>
                       <button class="btn-block btn-block-edit" onclick="${stopSel}openBloqueoModal('${key}')">✏️ Editar</button>`
                    : `<button class="btn-block btn-block-on" onclick="${stopSel}openBloqueoModal('${key}')">🔴 Marcar No Disponible</button>`
                }
            </div>
        </div>`;
    }).join('');

}

function openBsqTemaDetail(themeKey) {
    const titulo = themesMap[themeKey] || '';
    const speakers = getUnique().filter(s => s.temas.includes(themeKey));

    const spkRows = speakers.map(s => {
        return `<div class="stat-list-row" style="cursor:pointer;" onclick="event.stopPropagation();openModal('${escJs(s.nombre)}','${escJs(s.congregacion)}')">
            <span style="flex-shrink:0;">${getPhotoMini(s.nombre, s.congregacion)}</span>
            <div class="stat-list-info">
                <div class="stat-list-name">${escHtml(s.nombre)} ${ratingBadgeHtml(getSpeakerRating(s.nombre, s.congregacion), true)}</div>
                <div class="stat-list-sub">${escHtml(s.congregacion)}${s.rol ? ' · ' + escHtml(s.rol) : ''}</div>
            </div>
        </div>`;
    }).join('');

    const existing = document.querySelector('.stat-expanded-overlay');
    if (existing) { window._prevExpandedOverlay = existing; existing.remove(); }
    const overlay = document.createElement('div');
    overlay.className = 'stat-expanded-overlay';
    overlay.onclick = e => { if (e.target === overlay) { overlay.remove(); goBackToExpanded(); } };

    overlay.innerHTML = `
        <div class="stat-expanded-box">
            <div class="stat-expanded-header">
                <div class="stat-expanded-header-left">
                    <span style="font-size:20px;">📖</span>
                    <span style="font-weight:700;font-size:14px;color:var(--text-1);">Bosquejo #${escHtml(themeKey)}${titulo ? ' — ' + escHtml(titulo) : ''}</span>
                </div>
                <div class="stat-expanded-nav">
                    <button onclick="goBackToExpanded()" title="Volver" style="width:auto;padding:0 12px;border-radius:var(--radius-sm);font-size:12px;font-weight:600;gap:4px;">← Volver</button>
                    <button onclick="closeStatExpanded()" title="Cerrar">✕</button>
                </div>
            </div>
            <div class="stat-expanded-body">
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
                    <span style="font-size:11px;padding:4px 10px;border-radius:8px;font-weight:700;background:var(--accent-dim);color:var(--accent);">${speakers.length} orador${speakers.length !== 1 ? 'es' : ''}</span>
                </div>
                <div class="stat-card-list">
                    <div style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">👥 Oradores con este bosquejo preparado</div>
                    ${spkRows || '<div class="stat-no-data">Ningún orador tiene este bosquejo preparado</div>'}
                </div>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    if (typeof G !== 'undefined') G.statOverlayIn(overlay, overlay.querySelector('.stat-expanded-box'));
}

function openBloqueoModal(num) {
    const key = num.toString();
    const title = themesMap[key] || `Bosquejo #${key}`;
    const existing = blockedThemes[key] || { fromMonth: '', reason: '' };
    const currentFromMonth = existing.fromMonth || '';

    document.getElementById('bloqueo-modal-body').innerHTML = `
        <div class="modal-role" style="color:var(--danger);">🔴 Bloquear Bosquejo</div>
        <div class="modal-name" style="font-size:18px;">#${key} — ${escHtml(title)}</div>
        <p style="font-size:13px;color:var(--text-2);margin-bottom:18px;">
            Selecciona <b>desde qué mes</b> este bosquejo queda <b>no disponible</b>.<br>
            Los meses <b>anteriores</b> a ese mes seguirán permitiendo seleccionarlo.
        </p>

        <div style="margin-bottom:16px;">
            <label style="font-size:12px;font-weight:700;color:var(--text-2);display:block;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.4px;">
                🗓️ Bloquear desde:
            </label>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
<select id="bloqueo-from-month" style="background:var(--bg-card-alt);border:1.5px solid var(--border-hi);padding:10px 14px;border-radius:var(--radius-sm);font-size:13px;
outline:none;min-width:160px;color:var(--text-1);">
                    <option value="TODOS" ${currentFromMonth === 'TODOS' ? 'selected' : ''}>Todos los meses</option>
                    ${MESES.map(m => `<option value="${m}" ${currentFromMonth === m ? 'selected' : ''}>${m} (y meses siguientes)</option>`).join('')}
                </select>
            </div>
        </div>

        <!-- Preview visual de qué meses quedan bloqueados -->
        <div id="bloqueo-preview" style="margin-bottom:16px;"></div>

        <div style="margin-bottom:16px;">
            <label style="font-size:12px;font-weight:600;color:var(--text-2);display:block;margin-bottom:6px;">Motivo (opcional)</label>
            <input type="text" id="bloqueo-reason" value="${escHtml(existing.reason || '')}" placeholder="ej: Bosquejo retirado, en revisión..." style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;
outline:none;box-sizing:border-box;">
        </div>

        <div style="display:flex;gap:10px;margin-top:20px;">
            <button class="btn-block btn-block-on" style="flex:1;padding:12px;" onclick="confirmBloqueo('${key}')">🔴 Confirmar Bloqueo</button>
            <button class="btn-block btn-block-edit" style="flex:none;padding:12px 18px;" onclick="closeBloqueoModal()">Cancelar</button>
        </div>
    `;
    document.getElementById('modal-bloqueo').classList.add('active');
    // Renderizar el preview inicial
    actualizarBloqueoPreview();
    document.getElementById('bloqueo-from-month').addEventListener('change', actualizarBloqueoPreview);
}

function actualizarBloqueoPreview() {
    const sel = document.getElementById('bloqueo-from-month');
    const preview = document.getElementById('bloqueo-preview');
    if (!sel || !preview) return;
    const fromMonth = sel.value;
    const fromIdx = MESES.indexOf(fromMonth);

    let html = '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
    MESES.forEach((m, i) => {
        const bloqueado = fromMonth === 'TODOS' || (fromIdx >= 0 && i >= fromIdx);
        html += `<span style="padding:4px 10px;border-radius:20px;font-size:11.5px;font-weight:700;
            background:${bloqueado ? 'var(--danger-dim)' : 'var(--bg-card-alt)'};
            color:${bloqueado ? 'var(--danger)' : 'var(--text-3)'};
            border:1px solid ${bloqueado ? 'rgba(255, 59, 48,0.3)' : 'var(--border)'};
            ">${bloqueado ? '🚫' : '✓'} ${m}</span>`;
    });
    html += '</div>';
    preview.innerHTML = html;
}

function confirmBloqueo(key) {
    const fromMonth = document.getElementById('bloqueo-from-month')?.value || '';
    const reason = document.getElementById('bloqueo-reason')?.value?.trim() || '';
    if (!fromMonth) {
        alert('Selecciona desde qué mes aplicar el bloqueo.');
        return;
    }
    blockedThemes[key] = { fromMonth, reason };
    saveBlockedThemes();
    closeBloqueoModal();
    renderBosquejosView();
    // Refrescar otras vistas si están activas
    const activeTab = document.querySelector('.tab-btn.active')?.dataset?.tab;
    if (activeTab === 'dashboard') renderCards();
}

function unblockTheme(key) {
    delete blockedThemes[key];
    saveBlockedThemes();
    renderBosquejosView();
    const activeTab = document.querySelector('.tab-btn.active')?.dataset?.tab;
    if (activeTab === 'dashboard') renderCards();
}

async function clearAllBlockedThemes() {
    if (!Object.keys(blockedThemes).length) { mostrarToast('No hay bosquejos bloqueados.', 'error'); return; }
    if (await showConfirm('Limpiar bloqueos', `¿Eliminar todos los bloqueos (${Object.keys(blockedThemes).length} bosquejos)?`)) {
        blockedThemes = {};
        saveBlockedThemes();
        renderBosquejosView();
        const activeTab = document.querySelector('.tab-btn.active')?.dataset?.tab;
        if (activeTab === 'dashboard') renderCards();
    }
}

function closeBloqueoModal() {
    document.getElementById('modal-bloqueo').classList.remove('active');
}

// ── BLOQUEO MASIVO (preselección) ──
function openBulkBloqueoModal() {
    const keys = Array.from(bsqSel);
    if (!keys.length) { mostrarToast('Selecciona al menos un bosquejo.', 'error'); return; }
    const sorted = keys.sort((a,b) => (parseInt(a,10)||0) - (parseInt(b,10)||0));
    const titles = sorted.map(k => `<span class="bsq-sel-chip">🔴 #${escHtml(k)}${themesMap[k] ? ' · ' + escHtml(themesMap[k].length > 34 ? themesMap[k].slice(0,34) + '…' : themesMap[k]) : ''}</span>`).join('');

    document.getElementById('bloqueo-modal-body').innerHTML = `
        <div class="modal-role" style="color:var(--danger);">🔴 Bloquear ${sorted.length} bosquejo${sorted.length !== 1 ? 's' : ''}</div>
        <p style="font-size:13px;color:var(--text-2);margin-bottom:18px;">
            Selecciona <b>desde qué mes</b> quedan <b>no disponibles</b> todos los bosquejos de la lista.<br>
            Los meses <b>anteriores</b> a ese mes seguirán permitiéndolos.
        </p>

        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;max-height:120px;overflow-y:auto;">${titles}</div>

        <div style="margin-bottom:16px;">
            <label style="font-size:12px;font-weight:700;color:var(--text-2);display:block;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.4px;">
                🗓️ Bloquear desde:
            </label>
            <select id="bloqueo-from-month" style="background:var(--bg-card-alt);border:1.5px solid var(--border-hi);padding:10px 14px;border-radius:var(--radius-sm);font-size:13px;
outline:none;min-width:160px;color:var(--text-1);width:100%;">
                <option value="TODOS">Todos los meses</option>
                ${MESES.map(m => `<option value="${m}">${m} (y meses siguientes)</option>`).join('')}
            </select>
        </div>

        <div id="bloqueo-preview" style="margin-bottom:16px;"></div>

        <div style="margin-bottom:16px;">
            <label style="font-size:12px;font-weight:600;color:var(--text-2);display:block;margin-bottom:6px;">Motivo (opcional)</label>
            <input type="text" id="bloqueo-reason" placeholder="ej: Bosquejo retirado, en revisión..." style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;
outline:none;box-sizing:border-box;">
        </div>

        <div style="display:flex;gap:10px;margin-top:20px;">
            <button class="btn-block btn-block-on" style="flex:1;padding:12px;" onclick="confirmBulkBloqueo()">🔴 Confirmar Bloqueo (${sorted.length})</button>
            <button class="btn-block btn-block-edit" style="flex:none;padding:12px 18px;" onclick="closeBloqueoModal()">Cancelar</button>
        </div>
    `;
    document.getElementById('modal-bloqueo').classList.add('active');
    actualizarBloqueoPreview();
    document.getElementById('bloqueo-from-month').addEventListener('change', actualizarBloqueoPreview);
}

function confirmBulkBloqueo() {
    const fromMonth = document.getElementById('bloqueo-from-month')?.value || '';
    const reason = document.getElementById('bloqueo-reason')?.value?.trim() || '';
    if (!fromMonth) {
        alert('Selecciona desde qué mes aplicar el bloqueo.');
        return;
    }
    const keys = Array.from(bsqSel);
    if (!keys.length) { mostrarToast('La selección está vacía.', 'error'); closeBloqueoModal(); return; }
    keys.forEach(k => { blockedThemes[k] = { fromMonth, reason }; });
    saveBlockedThemes();
    closeBloqueoModal();
    bsqSel.clear();
    renderBosquejosView();
    mostrarToast(`✓ ${keys.length} bosquejo${keys.length !== 1 ? 's' : ''} marcado${keys.length !== 1 ? 's' : ''} como no disponible${keys.length !== 1 ? 's' : ''}.`, 'success');
    const activeTab = document.querySelector('.tab-btn.active')?.dataset?.tab;
    if (activeTab === 'dashboard') renderCards();
}

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  saveBlockedThemes,
  isThemeBlockedForMonth,
  isThemeBlockedAtAll,
  toggleBsqSelMode,
  toggleBsqSel,
  removeBsqSel,
  selectVisibleBsq,
  clearBsqSel,
  renderBsqPreselectPanel,
  renderBosquejosView,
  openBsqTemaDetail,
  openBloqueoModal,
  actualizarBloqueoPreview,
  confirmBloqueo,
  unblockTheme,
  clearAllBlockedThemes,
  closeBloqueoModal,
  openBulkBloqueoModal,
  confirmBulkBloqueo,
});
