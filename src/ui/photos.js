/* ==========================================================================
   Fotos de perfil: subida, recorte y lightbox
   Origen: DISCURSAPP .html, script principal (L7266-7987)
   ========================================================================== */
// ── HELPERS DE FOTOS ──────────────────────────────────────────
function getSpeakerPhotoKey(nombre, congregacion) {
    return 'sp_photo_' + btoa(unescape(encodeURIComponent(nombre + '|' + congregacion))).replace(/[^a-zA-Z0-9]/g,'').slice(0,40);
}

function getContactPhotoKey(congKey) {
    return 'ct_photo_' + btoa(unescape(encodeURIComponent(congKey))).replace(/[^a-zA-Z0-9]/g,'').slice(0,40);
}

// Miniatura circular 28px para listados de discursantes
function getPhotoMini(nombre, congregacion) {
    const src = speakerPhotos[getSpeakerPhotoKey(nombre, congregacion)] || '';
    return src
        ? `<img src="${src}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1.5px solid var(--border);flex-shrink:0;vertical-align:middle;" alt="">`
        : `<span style="width:28px;height:28px;border-radius:50%;background:var(--bg-card-alt);border:1.5px solid var(--border-hi);display:inline-flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">👤</span>`;
}

function triggerContactPhotoUpload(congKey, congName) {
    triggerPhotoUpload(getContactPhotoKey(congKey), congName, '__contact__');
}

function triggerPhotoUpload(photoKey, nombre, congregacion) {
    // Derive nombre/congregacion from globalSpeakers if not provided or if they may contain unsafe chars
    if (!nombre || !congregacion) {
        const sp = globalSpeakers && globalSpeakers.find(s => getSpeakerPhotoKey(s.nombre, s.congregacion) === photoKey);
        if (sp) { nombre = sp.nombre; congregacion = sp.congregacion; }
    } else {
        nombre = decodeHtmlEntities(nombre);
        congregacion = decodeHtmlEntities(congregacion);
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 8 * 1024 * 1024) {
            mostrarToast('⚠️ La imagen no debe superar 8 MB.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(evt) {
            const img = new Image();
            img.onload = function() {
                _crop.img = img;
                _crop.photoKey = photoKey;
                _crop.nombre = nombre;
                _crop.congregacion = congregacion;
                openCropper(img);
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function openCropper(img) {
    const stage = document.getElementById('cropper-stage');
    const canvas = document.getElementById('cropper-canvas');
    const size = stage.clientWidth || 360;
    _crop.canvasSize = size;
    canvas.width  = size;
    canvas.height = size;

    // Calcular escala mínima para que la imagen llene el círculo (84%)
    const circleD = size * 0.84;
    const minS = Math.max(circleD / img.width, circleD / img.height);
    _crop.minScale = minS;
    _crop.scale = minS;
    _crop.ox = size / 2;
    _crop.oy = size / 2;

    const zoomEl = document.getElementById('cropper-zoom');
    zoomEl.min  = minS;
    zoomEl.max  = minS * _crop.maxScale;
    zoomEl.step = minS * 0.005;
    zoomEl.value = minS;
    document.getElementById('cropper-zoom-val').textContent = '1×';

    drawCrop();
    document.getElementById('cropper-overlay').classList.add('active');
    bindCropperEvents();
}

function closeCropper() {
    document.getElementById('cropper-overlay').classList.remove('active');
    unbindCropperEvents();
}

function drawCrop() {
    const canvas = document.getElementById('cropper-canvas');
    const ctx = canvas.getContext('2d');
    const { img, scale, ox, oy, canvasSize } = _crop;
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    const w = img.width  * scale;
    const h = img.height * scale;
    ctx.drawImage(img, ox - w / 2, oy - h / 2, w, h);
}

function clampOffset() {
    const { img, scale, canvasSize } = _crop;
    const halfW = img.width  * scale / 2;
    const halfH = img.height * scale / 2;
    const circleR = canvasSize * 0.42;
    const cx = canvasSize / 2, cy = canvasSize / 2;
    _crop.ox = Math.min(Math.max(_crop.ox, cx - halfW + circleR), cx + halfW - circleR);
    _crop.oy = Math.min(Math.max(_crop.oy, cy - halfH + circleR), cy + halfH - circleR);
}

// ── Eventos mouse / touch ──
function _onCropMouseDown(e) {
    e.preventDefault();
    _crop.dragging = true;
    const pt = e.touches ? e.touches[0] : e;
    _crop.lastX = pt.clientX;
    _crop.lastY = pt.clientY;
}

function _onCropMouseMove(e) {
    if (!_crop.dragging) return;
    e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    const dx = pt.clientX - _crop.lastX;
    const dy = pt.clientY - _crop.lastY;
    _crop.lastX = pt.clientX;
    _crop.lastY = pt.clientY;
    // Escalar el movimiento CSS → canvas px
    const canvas = document.getElementById('cropper-canvas');
    const ratio = canvas.width / canvas.getBoundingClientRect().width;
    _crop.ox += dx * ratio;
    _crop.oy += dy * ratio;
    clampOffset();
    drawCrop();
}

function _onCropMouseUp() { _crop.dragging = false; }

function _onCropWheel(e) {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const zoomEl = document.getElementById('cropper-zoom');
    const newScale = Math.min(Math.max(_crop.scale + delta * _crop.scale, _crop.minScale), _crop.minScale * _crop.maxScale);
    _crop.scale = newScale;
    zoomEl.value = newScale;
    const ratio = (newScale - _crop.minScale) / (_crop.minScale * (_crop.maxScale - 1));
    document.getElementById('cropper-zoom-val').textContent = (1 + ratio * (_crop.maxScale - 1)).toFixed(1) + '×';
    clampOffset();
    drawCrop();
}

function _onZoomInput(e) {
    _crop.scale = parseFloat(e.target.value);
    const ratio = (_crop.scale - _crop.minScale) / (_crop.minScale * (_crop.maxScale - 1));
    document.getElementById('cropper-zoom-val').textContent = (1 + ratio * (_crop.maxScale - 1)).toFixed(1) + '×';
    clampOffset();
    drawCrop();
}

// Pinch-to-zoom (touch)
let _pinchDist0 = 0, _scale0 = 1;

function _onTouchStart(e) {
    if (e.touches.length === 2) {
        _pinchDist0 = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        _scale0 = _crop.scale;
    } else {
        _onCropMouseDown(e);
    }
}

function _onTouchMove(e) {
    if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        const newScale = Math.min(Math.max(_scale0 * (dist / _pinchDist0), _crop.minScale), _crop.minScale * _crop.maxScale);
        _crop.scale = newScale;
        const zoomEl = document.getElementById('cropper-zoom');
        zoomEl.value = newScale;
        const ratio = (newScale - _crop.minScale) / (_crop.minScale * (_crop.maxScale - 1));
        document.getElementById('cropper-zoom-val').textContent = (1 + ratio * (_crop.maxScale - 1)).toFixed(1) + '×';
        clampOffset();
        drawCrop();
    } else {
        _onCropMouseMove(e);
    }
}

function bindCropperEvents() {
    const stage = document.getElementById('cropper-stage');
    stage.addEventListener('mousedown',  _onCropMouseDown);
    stage.addEventListener('mousemove',  _onCropMouseMove);
    stage.addEventListener('mouseup',    _onCropMouseUp);
    stage.addEventListener('mouseleave', _onCropMouseUp);
    stage.addEventListener('wheel',      _onCropWheel, { passive: false });
    stage.addEventListener('touchstart', _onTouchStart, { passive: false });
    stage.addEventListener('touchmove',  _onTouchMove,  { passive: false });
    stage.addEventListener('touchend',   _onCropMouseUp);
    document.getElementById('cropper-zoom').addEventListener('input', _onZoomInput);
}

function unbindCropperEvents() {
    const stage = document.getElementById('cropper-stage');
    stage.removeEventListener('mousedown',  _onCropMouseDown);
    stage.removeEventListener('mousemove',  _onCropMouseMove);
    stage.removeEventListener('mouseup',    _onCropMouseUp);
    stage.removeEventListener('mouseleave', _onCropMouseUp);
    stage.removeEventListener('wheel',      _onCropWheel);
    stage.removeEventListener('touchstart', _onTouchStart);
    stage.removeEventListener('touchmove',  _onTouchMove);
    stage.removeEventListener('touchend',   _onCropMouseUp);
    document.getElementById('cropper-zoom').removeEventListener('input', _onZoomInput);
}

function confirmCrop() {
    const { img, scale, ox, oy, canvasSize, photoKey, nombre } = _crop;
    // Exportar el círculo recortado a un canvas cuadrado de 320px
    const OUT = 320;
    const out = document.createElement('canvas');
    out.width = out.height = OUT;
    const ctx = out.getContext('2d');
    // Clip circular
    ctx.beginPath();
    ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2);
    ctx.clip();
    // Calcular la región del canvas original que ocupa el círculo
    const circleR_canvas = canvasSize * 0.42;
    const cx = canvasSize / 2, cy = canvasSize / 2;
    // Coordenadas en la imagen original
    const imgX = (cx - circleR_canvas - (ox - img.width  * scale / 2)) / scale;
    const imgY = (cy - circleR_canvas - (oy - img.height * scale / 2)) / scale;
    const imgSize = (circleR_canvas * 2) / scale;
    ctx.drawImage(img, imgX, imgY, imgSize, imgSize, 0, 0, OUT, OUT);
    speakerPhotos[photoKey] = out.toDataURL('image/jpeg', 0.88);
    // Guardar solo esta foto en IDB (granular, más rápido)
    if (db) {
        try {
            db.transaction(["photos"], "readwrite")
              .objectStore("photos")
              .put(speakerPhotos[photoKey], photoKey);
        } catch(e) { console.warn('Error guardando foto en IDB:', e); }
    }
    // Sincronizar con la clave vinculada (discursante ↔ encargado de contacto)
    syncLinkedPhoto(photoKey, speakerPhotos[photoKey]);
    closeCropper();
    batchRender(renderCards, renderMonthView, renderDispCongView, renderAguayoView, renderVisitasView, renderEstadisticasDashboard, renderContactosView);
    // Si el modal del orador está abierto, refrescarlo
    const modalActive = document.getElementById('modal').classList.contains('active');
    if (modalActive) {
        // Verificar si es modal de discursante
        const sp = globalSpeakers.find(s => getSpeakerPhotoKey(s.nombre, s.congregacion) === photoKey);
        if (sp) { openModal(sp.nombre, sp.congregacion); }
        else {
            // Verificar si es modal de contacto
            const ctKey = Object.keys(contactsMap).find(k => getContactPhotoKey(k) === photoKey);
            if (ctKey) openContactModal(contactsMap[ctKey].displayName || ctKey);
        }
    }
    mostrarToast(`✓ Foto de ${nombre} guardada.`, 'success');
}

// ══════════════════════════════════════════════════════════════
//  LIGHTBOX — Ampliar foto al clic
// ══════════════════════════════════════════════════════════════
function openLightbox(src) {
    const lb = document.getElementById('photo-lightbox');
    const img = document.getElementById('photo-lightbox-img');
    img.src = src;
    lb.classList.add('active');
}

function closeLightbox() {
    document.getElementById('photo-lightbox').classList.remove('active');
}

async function removePhoto(photoKey, nombre) {
    if (!nombre) {
        const sp = globalSpeakers && globalSpeakers.find(s => getSpeakerPhotoKey(s.nombre, s.congregacion) === photoKey);
        nombre = sp ? sp.nombre : (Object.keys(contactsMap || {}).find(k => getContactPhotoKey(k) === photoKey) || 'este orador');
    } else {
        nombre = decodeHtmlEntities(nombre);
    }
    if (!speakerPhotos[photoKey]) return;
    if (!(await showConfirm('Eliminar foto', `¿Eliminar la foto de perfil de ${nombre}?`))) return;
    delete speakerPhotos[photoKey];
    // Eliminar solo esta entrada en IDB
    if (db) {
        try {
            db.transaction(["photos"], "readwrite")
              .objectStore("photos")
              .delete(photoKey);
        } catch(e) { console.warn('Error eliminando foto de IDB:', e); }
    }
    // Sincronizar eliminación con la clave vinculada
    syncLinkedPhoto(photoKey, null);
    batchRender(renderCards, renderMonthView, renderDispCongView, renderAguayoView, renderVisitasView, renderEstadisticasDashboard, renderContactosView);
    const modalActive = document.getElementById('modal').classList.contains('active');
    if (modalActive) {
        const sp = globalSpeakers.find(s => getSpeakerPhotoKey(s.nombre, s.congregacion) === photoKey);
        if (sp) { openModal(sp.nombre, sp.congregacion); }
        else {
            const ctKey = Object.keys(contactsMap).find(k => getContactPhotoKey(k) === photoKey);
            if (ctKey) openContactModal(contactsMap[ctKey].displayName || ctKey);
        }
    }
    mostrarToast(`Foto de ${nombre} eliminada.`, 'success');
}

// ══════════════════════════════════════════════════════════════
//  SINCRONIZACIÓN FOTO DISCURSANTE ↔ ENCARGADO DE CONTACTO
// ══════════════════════════════════════════════════════════════
// Dado un photoKey recién guardado (o eliminado), propaga la foto
// a la clave vinculada (sp_photo ↔ ct_photo) si el encargado de
// la congregación coincide con el discursante, o viceversa.
function syncLinkedPhoto(photoKey, photoData /* null = eliminar */) {
    const isSpeaker = photoKey.startsWith('sp_photo_');
    const isContact = photoKey.startsWith('ct_photo_');
    if (!isSpeaker && !isContact) return;

    const _saveOrDelete = (linkedKey) => {
        if (photoData !== null) {
            speakerPhotos[linkedKey] = photoData;
        } else {
            delete speakerPhotos[linkedKey];
        }
        if (db) {
            try {
                const tx = db.transaction(["photos"], "readwrite");
                const store = tx.objectStore("photos");
                if (photoData !== null) store.put(photoData, linkedKey);
                else store.delete(linkedKey);
            } catch(e) { console.warn('Error sincronizando foto vinculada:', e); }
        }
    };

    if (isSpeaker) {
        // Buscar si este discursante es encargado en alguna congregación
        const sp = globalSpeakers.find(s => getSpeakerPhotoKey(s.nombre, s.congregacion) === photoKey);
        if (!sp) return;
        const nNombre = normalizeStr(sp.nombre);
        const nCong   = normalizeStr(sp.congregacion);
        // Buscar en contactsMap la(s) congregación(es) donde este orador es encargado
        // y pertenece a la misma congregación
        for (const [congKey, data] of Object.entries(contactsMap)) {
            const nEnc  = normalizeStr(data.encargado || '');
            const sameN = nEnc && (nEnc === nNombre || nEnc.includes(nNombre) || nNombre.includes(nEnc));
            const sameCong = congKey === nCong;
            if (sameN && sameCong) {
                _saveOrDelete(getContactPhotoKey(congKey));
            }
        }
    }

    if (isContact) {
        // Buscar qué congregación es y cuál es su encargado
        const congKey = Object.keys(contactsMap).find(k => getContactPhotoKey(k) === photoKey);
        if (!congKey) return;
        const data = contactsMap[congKey];
        const nEnc  = normalizeStr(data.encargado || '');
        if (!nEnc) return;
        // Buscar discursante cuyo nombre coincida y pertenezca a esa congregación
        const sp = globalSpeakers.find(s =>
            normalizeStr(s.congregacion) === congKey &&
            (normalizeStr(s.nombre) === nEnc ||
             normalizeStr(s.nombre).includes(nEnc) ||
             nEnc.includes(normalizeStr(s.nombre)))
        );
        if (sp) _saveOrDelete(getSpeakerPhotoKey(sp.nombre, sp.congregacion));
    }
}

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  getSpeakerPhotoKey,
  getContactPhotoKey,
  getPhotoMini,
  triggerContactPhotoUpload,
  triggerPhotoUpload,
  openCropper,
  closeCropper,
  drawCrop,
  clampOffset,
  _onCropMouseDown,
  _onCropMouseMove,
  _onCropMouseUp,
  _onCropWheel,
  _onZoomInput,
  _pinchDist0,
  _scale0,
  _onTouchStart,
  _onTouchMove,
  bindCropperEvents,
  unbindCropperEvents,
  confirmCrop,
  openLightbox,
  closeLightbox,
  removePhoto,
  syncLinkedPhoto,
});
