/* ==========================================================================
   Modal de ficha de orador/contacto
   Origen: DISCURSAPP .html, script principal (L9409-9631)
   ========================================================================== */
// Helper compartido: construye el HTML del modal de un discursante
function buildSpeakerModalHTML(s, cong, backButton) {
    const isC16 = s.congregacion.trim().toLowerCase().includes('circuito') && s.congregacion.includes('16');
    const contact = contactsMap[normalizeStr(cong)] || { encargado: 'No registrado', telefono: '—', horario: '—' };
    const outs = allAssignments.filter(a => normalizeStr(a.nombre) === normalizeStr(s.nombre) && normalizeStr(a.origen) === normalizeStr(cong));
    const ins = isC16 ? allAssignments.filter(a => normalizeStr(a.destino) === normalizeStr(cong) && normalizeStr(a.nombre) === normalizeStr(s.nombre)) : [];
    const c16Badge = isC16 ? `<span class="badge-circ16" style="font-size:11px;padding:3px 9px;">★ Acceso Total — Circuito 16</span>` : '';
    const photoKey = 'sp_photo_' + btoa(unescape(encodeURIComponent(s.nombre + '|' + s.congregacion))).replace(/[^a-zA-Z0-9]/g,'').slice(0,40);
    const photoSrc = speakerPhotos[photoKey] || '';
    const photoHtml = `<div style="display:flex;align-items:center;gap:18px;margin-bottom:20px;">
        <div style="position:relative;flex-shrink:0;">
            ${photoSrc
                ? `<img src="${photoSrc}" alt="Foto de ${escHtml(s.nombre)}" class="modal-avatar-clickable" onclick="openLightbox('${escJs(photoSrc)}')" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid var(--border);" title="Clic para ampliar">`
                : `<div style="width:72px;height:72px;border-radius:50%;background:var(--bg-card-alt);border:2px dashed var(--border-hi);display:flex;align-items:center;justify-content:center;font-size:28px;">👤</div>`
            }
            <button onclick="triggerPhotoUpload('${photoKey}')" title="${photoSrc ? 'Cambiar foto' : 'Agregar foto'}"
                style="position:absolute;bottom:-2px;right:-2px;width:24px;height:24px;border-radius:50%;background:var(--accent);color:#fff;border:2px solid #fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;">
                ${photoSrc ? '✏️' : '+'}
            </button>
        </div>
        <div style="flex:1;min-width:0;">
            <div class="modal-role" style="margin-bottom:4px;">${escHtml(s.rol)} ${c16Badge}</div>
            <div class="modal-name" style="margin-bottom:0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">${escHtml(s.nombre)}
                <select class="speaker-rating-select" onchange="setSpeakerRating('${escJs(s.nombre)}','${escJs(s.congregacion)}',this.value);this.nextElementSibling.innerHTML=ratingBadgeHtml(this.value,true);" title="Calificación del orador">
                    ${RATING_OPTIONS.map(opt => `<option value="${opt.val}" ${getSpeakerRating(s.nombre, s.congregacion) === opt.val ? 'selected' : ''}>${opt.label}</option>`).join('')}
                </select>
                <span>${ratingBadgeHtml(getSpeakerRating(s.nombre, s.congregacion), false)}</span>
                ${absenceBadgeHtml(getAbsenceCount(s.nombre, s.congregacion))}
            </div>
            ${photoSrc ? `<button onclick="removePhoto('${photoKey}')" style="margin-top:6px;font-size:11px;color:var(--danger);background:none;border:none;cursor:pointer;padding:0;
">🗑 Eliminar foto</button>` : ''}
        </div>
    </div>`;
    return `
        ${backButton || ''}
        ${photoHtml}
        <div class="info-grid">
            <div class="info-box"><div class="box-label">Contacto</div>
                <div class="box-row"><span class="box-key">Tel:</span> ${s.telefono && s.telefono !== '—' ? `<a href="tel:${escHtml(s.telefono)}" style="color:var(--accent);font-weight:600;">${escHtml(s.telefono)}</a>` : '—'}</div>
                <div class="box-row"><span class="box-key">Origen:</span> ${escHtml(s.congregacion)}</div>
                ${s.email && s.email !== '—' ? `<div class="box-row"><span class="box-key">Email:</span> ${escHtml(s.email)}</div>` : ''}
            </div>
            <div class="info-box" style="cursor:pointer;transition:border-color 0.2s,box-shadow 0.2s;" onmouseover="this.style.borderColor='rgba(0, 113, 227,0.4)';this.style.boxShadow='0 2px 8px rgba(0, 113, 227,0.12)'" onmouseout="this.style.borderColor='';this.style.boxShadow=''" onclick="openContactModalFromSpeaker('${escJs(cong)}','${escJs(s.nombre)}','${escJs(s.congregacion)}')"><div class="box-label">Coordinación <span style="font-size:10px;color:var(--accent);margin-left:4px;">Ver más →</span></div>
                <div class="box-row"><b>${escHtml(contact.encargado)}</b></div>
                <div class="box-row"><span class="box-key">Tel:</span> ${contact.telefono && contact.telefono !== '—' ? `<a href="tel:${escHtml(contact.telefono)}" style="color:var(--accent);">${escHtml(contact.telefono)}</a>` : '—'}</div>
                ${isC16 && contact.horario && contact.horario !== '—' ? `<div class="box-row"><span class="box-key">Reunión:</span> ${escHtml(contact.horario)}</div>` : ''}
            </div>
        </div>
        <div class="info-box" style="margin-top:12px;"><div class="box-label">Salidas Registradas (${outs.length})</div>${outs.map(o=>{
            const isAbs = isAbsent(o);
            const absInfo = isAbs ? getAbsenceInfo(o) : null;
            const hasSust = isAbs && absInfo && absInfo.sustituto;
            const absStyle = isAbs ? (hasSust ? 'border-left:3px solid #16a34a;background:#f0fdf4;padding:8px 10px;border-radius:6px;margin-bottom:6px;overflow:hidden;' : 'border-left:3px solid #dc2626;background:#fef2f2;padding:8px 10px;border-radius:6px;margin-bottom:6px;overflow:hidden;') : '';
            const sustTemaLabel = (hasSust && absInfo.temaSust) ? ' · #' + absInfo.temaSust + ' ' + (themesMap[absInfo.temaSust] || '') : '';
            const absBadge = isAbs ? (hasSust ? '<div style="margin-top:4px;display:flex;flex-wrap:wrap;align-items:center;gap:4px;"><span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;padding:2px 7px;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:6px;font-weight:700;">🟢 Sust. ' + escHtml(absInfo.sustituto.split('|')[0]) + '</span>' + (absInfo.temaSust ? '<span style="font-size:10px;padding:2px 6px;background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;border-radius:6px;font-weight:600;">#' + escHtml(absInfo.temaSust) + ' ' + escHtml(themesMap[absInfo.temaSust] || '') + '</span>' : '') + '</div>' : '<div style="margin-top:4px;"><span class="absence-badge">🔴 Ausente</span></div>') : '';
            const absBtnLabel = isAbs ? (hasSust ? '🟢 Sustituido' : '🔴 Ausente') : '⭕ Ausencia';
            const absBtnCls = isAbs ? 'btn-absence active' : 'btn-absence';
            const absBtnHtml = `<button class="${absBtnCls}" onclick="event.stopPropagation();showAbsenceModal(JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(o))}')))" title="${isAbs ? 'Quitar ausencia' : 'Marcar ausencia'}" style="flex-shrink:0;">${absBtnLabel}</button>`;
            return `<div class="assignment-row" style="${absStyle}"><div style="flex:1;min-width:0;"><div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;"><b>Destino:</b> ${escHtml(o.destino)}<span class="badge badge-warn" style="flex-shrink:0;">${escHtml(o.fecha)}</span></div>${absBadge}<div style="margin-top:4px;"><span style="color:var(--accent);cursor:pointer;font-weight:600;text-decoration:none;font-size:13px;" onclick="event.stopPropagation();openContactModalFromSpeaker('${escJs(o.destino)}','${escJs(s.nombre)}','${escJs(s.congregacion)}')" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">#${o.temaNum}</span> <small style="color:var(--text-2);">${escHtml(themesMap[o.temaNum]||'')}</small></div></div>${absBtnHtml}</div>`;
        }).join('') || '<p style="font-style:italic;font-size:12px;">Ninguna salida asignada.</p>'}</div>
        ${isC16 ? `<div class="info-box" style="margin-top:12px;border-left:3px solid var(--accent);"><div class="box-label" style="color:var(--accent);">📊 Visitas al Circuito (${ins.length}) — Acceso Exclusivo</div>${ins.map(o=>`<div class="assignment-row"><div><b>Origen:</b> ${escHtml(o.origen)}<br><small>#${o.temaNum} ${escHtml(themesMap[o.temaNum]||'')}</small></div><div><span class="badge badge-warn">${escHtml(o.fecha)}</span></div></div>`).join('') || '<p style="font-style:italic;font-size:12px;">Sin visitas registradas.</p>'}</div>` : ''}
        ${s.notas && s.notas !== '—' ? `<div class="info-box" style="margin-top:12px;"><div class="box-label">Notas</div><p style="font-size:13px;color:var(--text-2);">${escHtml(s.notas)}</p></div>` : ''}
        <div class="info-box" style="margin-top:12px;"><div class="box-label">Temas que posee (${s.temas.length})</div><div style="display:flex;flex-direction:column;gap:4px;max-height:${isC16 ? '240px' : '120px'};overflow-y:auto;">${s.temas.map(t => {
            const bl = isThemeBlockedAtAll(t);
            const binfo = blockedThemes[t.toString()];
            const blLabel = bl ? (binfo?.fromMonth === 'TODOS' ? '(NO DISP. — todos los meses)' : `(No disp. desde ${binfo?.fromMonth || '?'})`) : '';
            return `<div class="theme-row ${bl ? 'blocked-row' : ''}"><span class="theme-num ${bl ? 'blocked-num' : ''}">#${t}${bl ? ' 🔴' : ''}</span><span class="theme-title-text" style="${bl ? 'color:#c0392b;' : ''}">${escHtml(themesMap[t]||'Catálogo no cargado')}${bl ? ` <b style="font-size:10px;">${escHtml(blLabel)}</b>` : ''}</span></div>`;
        }).join('')}</div></div>
        <div class="info-box" style="margin-top:12px;"><div class="box-label">Disponibilidad por Mes</div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">${MESES.map(mes => {
            const val = (s.disponibilidad[mes] || '').toLowerCase();
            let cls = 'vacio';
            if (val === 'disponible') cls = 'disponible';
            else if (val === 'asignado') cls = 'asignado';
            return `<span class="month-dot ${cls}" title="${mes}: ${val || 'sin registro'}" style="display:inline-flex;">${mes.substring(0,3)}</span>`;
        }).join('')}</div></div>
    `;
}

function openModal(name, cong) {
    let s = globalSpeakers.find(sp => sp.nombre === name && sp.congregacion === cong);
    if (!s) s = globalSpeakers.find(sp => normalizeStr(sp.nombre) === normalizeStr(name) && normalizeStr(sp.congregacion) === normalizeStr(cong));
    if (!s) return;
    const modal = document.getElementById('modal');
    const box = modal.querySelector('.modal-box');
    if (typeof gsap !== 'undefined') gsap.killTweensOf([modal, box]);
    document.getElementById('modal-body').innerHTML = buildSpeakerModalHTML(s, cong, null);
    const fromStats = document.querySelector('.stat-expanded-overlay');
    modal.style.zIndex = fromStats ? '1500' : '';
    modal.classList.add('active');
    if (typeof G !== 'undefined') G.modalOpen(modal, box);
}

function openModalFromContact(name, cong, congName) {
    let s = globalSpeakers.find(sp => sp.nombre === name && sp.congregacion === cong);
    if (!s) s = globalSpeakers.find(sp => normalizeStr(sp.nombre) === normalizeStr(name) && normalizeStr(sp.congregacion) === normalizeStr(cong));
    if (!s) return;
    const backButton = `<button onclick="openContactModal('${escJs(congName)}')" style="display:inline-flex;align-items:center;gap:6px;background:var(--bg-card-alt);border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 14px;font-size:12px;font-weight:600;color:var(--text-2);cursor:pointer;margin-bottom:18px;
transition:background 0.15s;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='var(--bg-card-alt)'">← Volver a ${escHtml(congName)}</button>`;
    const modal = document.getElementById('modal');
    const box = modal.querySelector('.modal-box');
    if (typeof gsap !== 'undefined') gsap.killTweensOf([modal, box]);
    document.getElementById('modal-body').innerHTML = buildSpeakerModalHTML(s, cong, backButton);
    const fromStats = document.querySelector('.stat-expanded-overlay');
    modal.style.zIndex = fromStats ? '1500' : '';
    modal.classList.add('active');
    if (typeof G !== 'undefined' && typeof gsap !== 'undefined') { gsap.set(box, { clearProps: 'all' }); G.modalOpen(modal, box); }
}

function openContactModalFromSpeaker(congName, speakerName, speakerCong) {
    const modal = document.getElementById('modal');
    const box = modal.querySelector('.modal-box');
    if (typeof gsap !== 'undefined') gsap.killTweensOf([modal, box]);
    const key = normalizeStr(congName);
    const data = contactsMap[key] || { encargado: 'No registrado', telefono: '—', horario: '—' };
    const speakers = Array.from(new Map(globalSpeakers.map(s => [s.nombre + s.congregacion, s])).values())
        .filter(s => normalizeStr(s.congregacion) === key || fuzzyMatch(key, s.congregacion));
    const hasTel = data.telefono && data.telefono.toString().trim() !== '—' && data.telefono.toString().trim() !== '';
    const hasHorario = data.horario && data.horario.toString().trim() !== '—' && data.horario.toString().trim() !== '';

    const ctPhotoKey = getContactPhotoKey(key);
    const ctPhotoSrc = speakerPhotos[ctPhotoKey] || '';
    const ctPhotoHtml = `<div style="display:flex;align-items:center;gap:16px;margin-bottom:18px;">
        <div style="position:relative;flex-shrink:0;">
            ${ctPhotoSrc
                ? `<img src="${ctPhotoSrc}" class="modal-avatar-clickable" onclick="openLightbox('${escJs(ctPhotoSrc)}')" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid var(--border);" title="Clic para ampliar">`
                : `<div style="width:64px;height:64px;border-radius:50%;background:var(--bg-card-alt);border:2px dashed var(--border-hi);display:flex;align-items:center;justify-content:center;font-size:26px;">👤</div>`}
            <button onclick="triggerContactPhotoUpload('${escJs(key)}','${escJs(congName)}')" title="${ctPhotoSrc ? 'Cambiar foto' : 'Agregar foto del encargado'}"
                style="position:absolute;bottom:-2px;right:-2px;width:24px;height:24px;border-radius:50%;background:var(--accent);color:#fff;border:2px solid #fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;">
                ${ctPhotoSrc ? '✏' : '+'}
            </button>
        </div>
        <div style="flex:1;min-width:0;">
            <div class="modal-role" style="margin-bottom:2px;">Encargado de Discursos</div>
            <div class="modal-name" style="font-size:17px;margin-bottom:0;">${escHtml(data.encargado)}</div>
            ${ctPhotoSrc ? `<button onclick="removePhoto('${ctPhotoKey}')" style="margin-top:5px;font-size:11px;color:var(--danger);background:none;border:none;cursor:pointer;padding:0;
">🗑 Eliminar foto</button>` : ''}
        </div>
    </div>`;

    const backButton = `<button onclick="openModal('${escJs(speakerName)}','${escJs(speakerCong)}')" style="display:inline-flex;align-items:center;gap:6px;background:var(--bg-card-alt);border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 14px;font-size:12px;font-weight:600;color:var(--text-2);cursor:pointer;margin-bottom:18px;
transition:background 0.15s;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='var(--bg-card-alt)'">← Volver a ${escHtml(speakerName)}</button>`;

    document.getElementById('modal-body').innerHTML = `
        ${backButton}
        <div class="modal-role" style="display:none;">Congregación</div>
        <div class="modal-name" style="margin-bottom:14px;">${escHtml(congName)}</div>
        ${ctPhotoHtml}
        <div class="info-grid">
            <div class="info-box">
                <div class="box-label">Teléfono de Contacto</div>
                <div class="box-row" style="font-size:16px;font-weight:700;color:var(--text-1);">
                    ${hasTel ? `📞 ${escHtml(data.telefono)}` : '<span style="color:var(--text-3);">—</span>'}
                </div>
            </div>
            <div class="info-box">
                <div class="box-label">Día de Reunión</div>
                <div class="box-row" style="font-size:15px;font-weight:600;">${hasHorario ? escHtml(data.horario.toString().split(/\s+/)[0]) : '<span style="color:var(--text-3);">—</span>'}</div>
            </div>
            <div class="info-box">
                <div class="box-label">Hora de Reunión</div>
                <div class="box-row" style="font-size:15px;font-weight:600;">${hasHorario ? escHtml(data.horario.toString().split(/\s+/).slice(1).join(' ') || data.horario.toString()) : '<span style="color:var(--text-3);">—</span>'}</div>
            </div>
        </div>
        <div class="info-box" style="margin-top:12px;">
            <div class="box-label">Oradores de esta congregación (${speakers.length})</div>
            ${speakers.length ? `<div style="display:flex;flex-direction:column;gap:6px;margin-top:8px;">
                ${speakers.map(s => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--bg-card-alt);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;" onclick="openModalFromContact('${escJs(s.nombre)}','${escJs(s.congregacion)}','${escJs(congName)}')">
                    <div style="display:flex;align-items:center;gap:8px;">${getPhotoMini(s.nombre,s.congregacion)}<span style="font-size:13px;font-weight:600;">${escHtml(s.nombre)}</span>${ratingBadgeHtml(getSpeakerRating(s.nombre, s.congregacion), true)} <span style="font-size:11px;color:var(--text-2);">${escHtml(s.rol)}</span></div>
                    <span style="font-size:11px;color:var(--accent);">${s.temas.length} temas →</span>
                </div>`).join('')}
            </div>` : '<p style="font-style:italic;font-size:12px;color:var(--text-3);">Sin oradores registrados.</p>'}
        </div>
    `;
    document.getElementById('modal').classList.add('active');
    const _m3 = document.getElementById('modal');
    const _b3 = _m3.querySelector('.modal-box');
    if (typeof G !== 'undefined' && typeof gsap !== 'undefined') { gsap.set(_b3, { clearProps: 'all' }); G.modalOpen(_m3, _b3); }
}

function handleModalClick(e) { if (e.target.classList.contains('modal-overlay')) closeModal(); }

function closeModal() {
    const m = document.getElementById('modal');
    const box = m.querySelector('.modal-box');
    const finish = () => { m.style.zIndex = ''; m.classList.remove('active'); if (typeof gsap !== 'undefined') { gsap.set(box, { clearProps: 'all' }); } };
    if (typeof G !== 'undefined' && box) G.modalClose(m, box, finish);
    else finish();
}

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  buildSpeakerModalHTML,
  openModal,
  openModalFromContact,
  openContactModalFromSpeaker,
  handleModalClick,
  closeModal,
});
