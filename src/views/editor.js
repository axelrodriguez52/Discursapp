/* ==========================================================================
   Editor de discursantes (CRUD en Sheets)
   Origen: DISCURSAPP .html, script principal (L4176-4434)
   ========================================================================== */
function poblarMatrizCongSelector() {
    const sel = document.getElementById('matriz-cong-selector');
    const guardado = localStorage.getItem(MATRIZ_KEY) || '';
    sel.innerHTML = '<option value="">— Sin seleccionar —</option>' +
        Array.from(registeredCongs).sort().map(c => `<option value="${escHtml(c)}">${escHtml(c)}</option>`).join('');
    if (guardado && registeredCongs.has(guardado)) {
        sel.value = guardado;
        matrizCong = guardado;
    } else {
        matrizCong = '';
    }
}

function onMatrizCongChange() {
    const sel = document.getElementById('matriz-cong-selector');
    matrizCong = sel.value || '';
    if (matrizCong) localStorage.setItem(MATRIZ_KEY, matrizCong);
    else localStorage.removeItem(MATRIZ_KEY);
    if (document.getElementById('view-editor').classList.contains('active')) renderEditorView();
}

// ── Vista principal: lista de discursantes de la congregación matriz ──
function renderEditorView() {
    const container = document.getElementById('editor-cards-container');
    const subtitle = document.getElementById('editor-subtitle');
    const btnAdd = document.getElementById('btn-add-speaker');
    const cloudWarn = document.getElementById('editor-cloud-warn');

    const token = gapi?.client?.getToken?.()?.access_token;
    cloudWarn.style.display = token ? 'none' : 'flex';

    if (!matrizCong) {
        subtitle.textContent = 'Selecciona una Congregación Matriz en el menú lateral para editar sus discursantes.';
        btnAdd.style.display = 'none';
        container.innerHTML = '<div class="empty-state"><p>Selecciona una Congregación Matriz para ver sus discursantes.</p></div>';
        return;
    }

    subtitle.textContent = `Discursantes de "${matrizCong}". Puedes agregar, editar o eliminar registros directamente en la hoja de Google Sheets.`;
    btnAdd.style.display = 'inline-flex';

    const speakers = Array.from(new Map(
        globalSpeakers
            .filter(s => normalizeStr(s.congregacion) === normalizeStr(matrizCong))
            .map(s => [s.nombre + '|' + s.congregacion, s])
    ).values()).sort((a,b) => (a._anchorRow||0) - (b._anchorRow||0));

    if (!speakers.length) {
        container.innerHTML = '<div class="empty-state"><p>No se encontraron discursantes para esta congregación. Usa "Agregar Discursante" para crear el primero.</p></div>';
        return;
    }

    container.innerHTML = speakers.map((s, idx) => {
        const realIdx = globalSpeakers.indexOf(s);
        const dispCount = Object.values(s.disponibilidad || {}).filter(v => v && v.toLowerCase().includes('disponible') && !v.toLowerCase().includes('no')).length;
        const temasHtml = (s.temas || []).length
            ? s.temas.map(n => `<span style="display:inline-block;background:var(--accent-dim);border:1px solid rgba(0,113,227,0.2);border-radius:4px;padding:2px 6px;font-size:11px;font-weight:600;color:var(--accent);margin:2px;">#${n} ${escHtml(themesMap[n] || '')}</span>`).join(' ')
            : '<span style="font-size:11px;color:var(--text-3);">Sin bosquejos</span>';
        return `<div class="editor-card">
            <div class="ec-role">${escHtml(s.rol)}</div>
            <div class="ec-name">${escHtml(s.nombre)}</div>
            <div class="ec-meta">📞 ${escHtml(s.telefono)}</div>
            ${s.email && s.email !== '—' ? `<div class="ec-meta">✉️ ${escHtml(s.email)}</div>` : ''}
            <div class="ec-meta" style="margin-top:6px;">📋 Bosquejos (${(s.temas || []).length}):</div>
            <div style="display:flex;flex-wrap:wrap;gap:2px;margin:4px 0 6px;">${temasHtml}</div>
            <div class="ec-meta">📅 ${dispCount} mes(es) disponible(s)</div>
            <div class="ec-actions">
                <button class="ec-btn primary" onclick="openSpeakerForm(${realIdx})">✏️ Editar</button>
            </div>
        </div>`;
    }).join('');

    if (typeof G !== 'undefined') {
        G.staggerCards(container, '.editor-card', 0.04);
    } else {
        const cards = container.querySelectorAll('.editor-card');
        cards.forEach((c, i) => { c.style.transitionDelay = (i * 40) + 'ms'; });
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const obs = new IntersectionObserver((entries) => {
                    entries.forEach(e => {
                        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
                    });
                }, { threshold: 0.05 });
                cards.forEach(c => obs.observe(c));
            });
        });
    }
}

function openSpeakerForm(idx) {
    if (!matrizCong) return;
    const token = gapi?.client?.getToken?.()?.access_token;
    if (!token) {
        mostrarToast('⚠️ Conecta Google Sheets antes de editar.', 'error');
        return;
    }

    const isNew = idx === null;
    const s = isNew ? null : globalSpeakers[idx];

    // Mapear los 8 posibles bosquejos: C/D (offsets 0-3) y E/F (offsets 0-3)
    // sp.temas solo contiene números de bosquejo (col C y E); reconstruimos slots vacíos si new.
    const temas = isNew ? ['','','','','','','','','','','','','','',''] : (s._temaSlots || []);
    editorFormState = {
        idx,
        temas: temas.concat(['','','','','','','','','','','','','','','']).slice(0,14),
        disponibilidad: isNew ? {} : Object.assign({}, s.disponibilidad)
    };

    const dispOptions = ['', 'Disponible', 'No Disponible'];
    const dispHtml = MESES.map(mes => {
        const current = (editorFormState.disponibilidad[mes] || '').toLowerCase();
        let normVal = '';
        if (current.includes('no')) normVal = 'No Disponible';
        else if (current.includes('disponible')) normVal = 'Disponible';
        return `<div class="disp-item">
            <span class="disp-mes">${mes}</span>
            <select class="form-select" style="max-width:150px;" id="disp-${mes}">
                ${dispOptions.map(o => `<option value="${o}" ${normVal===o?'selected':''}>${o || '— Sin dato —'}</option>`).join('')}
            </select>
        </div>`;
    }).join('');

    const temasHtml = editorFormState.temas.map((t, i) => {
        const label = i < 7 ? `Bosquejo (Col C, fila ${i+1})` : `Bosquejo (Col E, fila ${i-6})`;
        return `<div class="form-field" style="margin-bottom:0;">
            <label>${label}</label>
            <input type="number" min="1" max="999" class="form-input" id="tema-${i}" value="${t===null||t===undefined?'':t}" placeholder="N°">
        </div>`;
    }).join('');

    document.getElementById('speaker-form-body').innerHTML = `
        <div class="modal-role">${isNew ? 'Nuevo Discursante' : 'Editar Discursante'}</div>
        <div class="modal-name">${isNew ? matrizCong : escHtml(s.nombre)}</div>

        <div class="form-section-title">Datos del discursante</div>
        <div class="form-grid-2">
            <div class="form-field">
                <label>Nombre</label>
                <input type="text" class="form-input" id="sf-nombre" value="${isNew ? '' : escHtml(s.nombre)}" placeholder="Nombre completo">
            </div>
            <div class="form-field">
                <label>Rol</label>
                <input type="text" class="form-input" id="sf-rol" value="${isNew ? 'Anciano' : escHtml(s.rol)}" placeholder="Ej: Anciano, Siervo Ministerial">
            </div>
        </div>
        <div class="form-grid-2">
            <div class="form-field">
                <label>Contacto (Teléfono)</label>
                <input type="text" class="form-input" id="sf-telefono" value="${isNew ? '' : (s.telefono==='—'?'':escHtml(s.telefono))}" placeholder="809-000-0000">
            </div>
            <div class="form-field">
                <label>Email</label>
                <input type="text" class="form-input" id="sf-email" value="${isNew ? '' : (s.email==='—'?'':escHtml(s.email))}" placeholder="correo@ejemplo.com">
            </div>
        </div>
        <div class="form-field">
            <label>Notas Adicionales</label>
            <textarea class="form-textarea" id="sf-notas" placeholder="Observaciones, restricciones, etc.">${isNew ? '' : (s.notas==='—'?'':escHtml(s.notas))}</textarea>
        </div>

        <div class="form-section-title">Bosquejos asignados</div>
        <div class="form-grid-4">${temasHtml}</div>

        <div class="form-section-title">Disponibilidad por mes</div>
        <div class="disp-grid">${dispHtml}</div>

        <div style="display:flex;gap:12px;align-items:center;margin-top:20px;flex-wrap:wrap;">
            <button class="btn-registrar" id="btn-save-speaker" onclick="guardarDiscursante()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                ${isNew ? 'Crear Discursante' : 'Guardar Cambios'}
            </button>
            <button class="ec-btn" style="flex:none;padding:12px 20px;" onclick="closeSpeakerForm()">Cancelar</button>
        </div>
    `;
    document.getElementById('modal-speaker-form').classList.add('active');
}

function closeSpeakerForm() {
    document.getElementById('modal-speaker-form').classList.remove('active');
}

// ── Recolectar valores del formulario ──
function leerFormularioDiscursante() {
    const nombre = document.getElementById('sf-nombre').value.trim();
    const rol = document.getElementById('sf-rol').value.trim() || 'Anciano';
    const telefono = document.getElementById('sf-telefono').value.trim();
    const email = document.getElementById('sf-email').value.trim();
    const notas = document.getElementById('sf-notas').value.trim();

    const temas = [];
    for (let i = 0; i < 14; i++) {
        const v = document.getElementById(`tema-${i}`).value.trim();
        temas.push(v === '' ? '' : v);
    }

    const disponibilidad = {};
    MESES.forEach(mes => {
        const v = document.getElementById(`disp-${mes}`).value;
        if (v) disponibilidad[mes] = v;
    });

    return { nombre, rol, telefono, email, notas, temas, disponibilidad };
}

// ── Guardar (crear o actualizar) ──
async function guardarDiscursante() {
    if (_isSaving) return;
    const btn = document.getElementById('btn-save-speaker');
    const datos = leerFormularioDiscursante();

    if (!datos.nombre) {
        mostrarToast('⚠️ El nombre es obligatorio.', 'error');
        return;
    }

    const token = gapi?.client?.getToken?.()?.access_token;
    if (!token) { mostrarToast('⚠️ Conecta Google Sheets antes de guardar.', 'error'); return; }
    if (!hasWriteToken) {
        mostrarToast('🔑 Solicitando permiso de escritura…', 'success');
        solicitarTokenEscritura(() => guardarDiscursante());
        return;
    }

    _isSaving = true;

    btn.disabled = true;
    btn.classList.add('loading');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 1s linear infinite"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Guardando…`;

    try {
        const isNew = editorFormState.idx === null;
        if (isNew) {
            await crearBloqueDiscursante(matrizCong, datos);
            mostrarToast(`✓ Discursante "${datos.nombre}" agregado a ${matrizCong}.`, 'success');
        } else {
            const sp = globalSpeakers[editorFormState.idx];
            await actualizarBloqueDiscursante(sp, datos);
            mostrarToast(`✓ Cambios guardados para "${datos.nombre}".`, 'success');
        }

        closeSpeakerForm();
        await cargarDesdeGoogleSheets();
        renderEditorView();
    } catch (err) {
        console.error('Error al guardar discursante:', err);
        mostrarToast('❌ Error al guardar: ' + (err.result?.error?.message || err.message || 'Verifica la conexión.'), 'error');
    } finally {
        _isSaving = false;
        btn.disabled = false;
        btn.classList.remove('loading');
        btn.innerHTML = originalHtml;
    }
}

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  poblarMatrizCongSelector,
  onMatrizCongChange,
  renderEditorView,
  openSpeakerForm,
  closeSpeakerForm,
  leerFormularioDiscursante,
  guardarDiscursante,
});
