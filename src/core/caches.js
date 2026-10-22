/* ==========================================================================
   Indices en memoria (oradores unicos, fotos, asignaciones por nombre)
   Origen: DISCURSAPP .html, script principal (L3518-3538)
   ========================================================================== */
// ── Cache para evitar recálculos en cada render ──
let _cachedUnique = [];

let _cachedPhotoKeys = {};

let _cachedAssignmentsByName = new Map();

let _cacheDirty = true;

// En la migración a módulos, otros archivos (sheets.js, excel.js, months.js)
// hacen `_cacheDirty = true`. Eso actualiza la copia publicada en window, no
// esta variable local del módulo. Comprobamos ambas para que la caché se
// reconstruya de verdad después de sincronizar Google Sheets o cargar Excel.
function _cacheNecesitaReconstruccion() {
    return _cacheDirty === true ||
        (typeof window !== 'undefined' && window._cacheDirty === true);
}

function rebuildCaches() {
    _cachedUnique = Array.from(new Map(globalSpeakers.map(s => [s.nombre + '|' + s.congregacion, s])).values());
    _cachedPhotoKeys = {};
    _cachedUnique.forEach(s => {
        _cachedPhotoKeys[s.nombre + '|' + s.congregacion] = 'sp_photo_' + btoa(unescape(encodeURIComponent(s.nombre + '|' + s.congregacion))).replace(/[^a-zA-Z0-9]/g,'').slice(0,40);
    });
    _cachedAssignmentsByName = new Map();
    allAssignments.forEach(a => {
        const key = normalizeStr(a.nombre);
        if (!_cachedAssignmentsByName.has(key)) _cachedAssignmentsByName.set(key, []);
        _cachedAssignmentsByName.get(key).push(a);
    });
    _cacheDirty = false;
    if (typeof window !== 'undefined') {
        window._cacheDirty = false;
        window._cachedUnique = _cachedUnique;
        window._cachedPhotoKeys = _cachedPhotoKeys;
        window._cachedAssignmentsByName = _cachedAssignmentsByName;
    }
}

function getUnique() { if (_cacheNecesitaReconstruccion()) rebuildCaches(); return _cachedUnique; }

function getPhotoKey(nombre, congregacion) { if (_cacheNecesitaReconstruccion()) rebuildCaches(); return _cachedPhotoKeys[nombre + '|' + congregacion] || ''; }

function getAssignmentsFor(nombre) { if (_cacheNecesitaReconstruccion()) rebuildCaches(); return _cachedAssignmentsByName.get(normalizeStr(nombre)) || []; }

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  _cachedUnique,
  _cachedPhotoKeys,
  _cachedAssignmentsByName,
  _cacheDirty,
  rebuildCaches,
  getUnique,
  getPhotoKey,
  getAssignmentsFor,
});
