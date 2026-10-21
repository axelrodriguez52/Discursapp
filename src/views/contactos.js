/* ==========================================================================
   Contactos por congregacion
   Origen: DISCURSAPP .html, script principal (L5056-5176)
   ========================================================================== */
import { publishContactos } from '@/src/core/contactos-store.js';

// La vista vive en React (src/components/views/ContactosView.jsx). Esta funcion
// conserva el contrato global: calcula el snapshot con la misma logica del
// original y lo publica en el store; React se encarga del DOM.
function renderContactosView(searchOverride) {
    const search = (typeof searchOverride === 'string'
        ? searchOverride
        : document.getElementById('contactos-search')?.value || '').trim();
    const total = Object.keys(contactsMap).length;
    const entries = Object.entries(contactsMap)
        .filter(([key, data]) => !search || fuzzyMatch(search, data.displayName || key) || fuzzyMatch(search, data.encargado || ''))
        .sort((a, b) => (a[1].displayName || a[0]).localeCompare(b[1].displayName || b[0]))
        .map(([key, data]) => {
            const congName = data.displayName || Array.from(registeredCongs).find(c => normalizeStr(c) === key) || key;
            const speakerCount = globalSpeakers.filter(s => normalizeStr(s.congregacion) === key || fuzzyMatch(key, s.congregacion)).length;
            return {
                key,
                congName,
                encargado: data.encargado || '—',
                telefono: data.telefono == null ? '—' : String(data.telefono),
                speakerCount,
                photoSrc: speakerPhotos[getContactPhotoKey(key)] || '',
            };
        });
    publishContactos({ total, search, entries });
}

function buildContactModalHTML(congName, backButton) {
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

    return `
        ${backButton || ''}
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
}

function openContactModal(congName) {
    document.getElementById('modal-body').innerHTML = buildContactModalHTML(congName);
    const modal = document.getElementById('modal');
    modal.classList.add('active');
    const box = modal.querySelector('.modal-box');
    if (typeof G !== 'undefined' && typeof gsap !== 'undefined') { gsap.set(box, { clearProps: 'all' }); G.modalOpen(modal, box); }
}

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  renderContactosView,
  buildContactModalHTML,
  openContactModal,
});
