/* ==========================================================================
   Utilidades puras (fechas, texto, comparaciones, debounce)
   Origen: DISCURSAPP .html, script principal (L4673-9651)
   ========================================================================== */
// ══════════════════════════════════════════════════════════════
//  SUGERENCIAS DE BOSQUEJOS Y DISCURSANTES
// ══════════════════════════════════════════════════════════════

// Convierte el string de fecha legible a objeto Date para comparar
function parseFechaStr(str) {
    if (!str || str === '—') return null;
    // Intentar parsear con el locale es-ES que usa la app
    const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const lower = str.toLowerCase();
    let month = -1, day = 0, year = new Date().getFullYear();
    MESES_ES.forEach((m, i) => { if (lower.includes(m)) { month = i; const rest = lower.split(m); const nums = (rest[0] + rest[1]).match(/\d+/g) || []; if (nums.length >= 1) day = parseInt(nums[0]); if (nums.length >= 2) year = parseInt(nums[nums.length - 1]); }});
    if (month === -1) { const d = new Date(str); return isNaN(d) ? null : d; }
    const d = new Date(year, month, day || 1);
    return isNaN(d.getTime()) ? null : d;
}

function daysSince(dateStr) {
    const d = parseFechaStr(dateStr);
    if (!d) return null;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
}

// NORMALIZACIÓN PARA BÚSQUEDA FUZZY (quita acentos, minúsculas, espacios extra)
function normalizeStr(s) {
    if (!s) return '';
    return s.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function sanitizeSheetName(name) {
    if (!name) return '';
    return name.toString().replace(/'/g, "''");
}

// ── HELPERS DE DATOS SEGUROS ────────────────────────────────────
// Convierte cualquier valor a string limpio. Nunca lanza excepción.
function safeStr(v, fallback) {
    if (fallback === undefined) fallback = '—';
    if (v === null || v === undefined) return fallback;
    if (v instanceof Date) {
        try { return v.toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).replace(/\./g,''); }
        catch(e) { return fallback; }
    }
    const s = v.toString().trim();
    return s === '' ? fallback : s;
}

// Convierte a entero positivo válido. Devuelve null si no es un número de bosquejo válido.
function safeTemaNum(v) {
    if (v === null || v === undefined || v === '') return null;
    const s = v.toString().trim();
    // Rechazar fórmulas de error, texto, valores negativos, cero
    if (/^[#\-]|^[a-zA-Z]/.test(s)) return null;
    // Solo aceptar si el string completo es un entero puro (no "1e3", no "42.5")
    if (!/^\d+$/.test(s)) return null;
    const n = parseInt(s, 10);
    return (n > 0 && n <= 999) ? n.toString() : null;
}

// Convierte un número de serie de Excel/Sheets o Date a string de fecha legible.
function safeExcelDate(v, mesLabel) {
    if (!v && v !== 0) return '—';
    if (v instanceof Date) {
        try { return v.toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).replace(/\./g,''); }
        catch(e) { return '—'; }
    }
    // Número de serie de Excel (entero > 1000 indica fecha post-1902)
    const n = typeof v === 'number' ? v : parseFloat(v);
    if (!isNaN(n) && n > 1000) {
        try {
            const base = new Date(1899, 11, 30);
            const d = new Date(base.getTime() + Math.round(n) * 86400000);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).replace(/\./g,'');
            }
        } catch(e) {}
    }
    // Si es string con formato de fecha legible
    if (typeof v === 'string') {
        const s = v.trim();
        if (s && s !== '—' && s.toLowerCase() !== 'fecha') {
            // Si ya tiene un año de 4 dígitos, devolverlo tal cual
            if (/\d{4}/.test(s)) return s;
            // Si trae mes pero no año, agregar el año actual
            const tieneMes = MESES.some(m => normalizeStr(s).includes(normalizeStr(m)));
            if (tieneMes) return `${s} de ${new Date().getFullYear()}`;
            // Si solo trae día (ej. "sábado 26"), completar con mesLabel y año actual
            if (mesLabel && MESES.some(m => normalizeStr(m) === normalizeStr(mesLabel))) {
                return `${s} de ${mesLabel} de ${new Date().getFullYear()}`;
            }
            return s;
        }
    }
    return '—';
}

// Verifica si un valor de celda está efectivamente vacío (null, undefined, '', solo espacios, '—')
function celdaVacia(v) {
    if (v === null || v === undefined) return true;
    const s = v.toString().trim();
    return s === '' || s === '—';
}

// ── FIN HELPERS ─────────────────────────────────────────────────

// SIMILITUD FUZZY: retorna true si haystack contiene todos los tokens de needle
function fuzzyMatch(needle, haystack) {
    const n = normalizeStr(needle);
    const h = normalizeStr(haystack);
    if (!n) return true;
    // Primero intento substring directo
    if (h.includes(n)) return true;
    // Luego por tokens: cada palabra del needle debe aparecer en haystack
    const tokens = n.split(' ').filter(Boolean);
    return tokens.every(t => h.includes(t));
}

// Decodifica entidades HTML en strings que vienen de atributos onclick (ej: O&#39;Neil → O'Neil)
function decodeHtmlEntities(s) {
    if (!s) return s;
    const el = document.createElement('div');
    el.textContent = s;
    return el.textContent;
}

// Convierte fecha JS (año, mes 1-12, día) a número de serie de Excel/Sheets
function fechaToExcelSerial(y, m, d) {
    // Base: 1 enero 1900 = 1 (con bug de 1900 como bisiesto compatibilidad Excel)
    const base = new Date(1899, 11, 30); // 30 dic 1899
    const fecha = new Date(y, m - 1, d);
    return Math.round((fecha - base) / 86400000);
}

function parseStringToDate(s) {
    if (!s || s === '—') return new Date(0);
    const ms = {
        enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,
        julio:6,agosto:7,septiembre:8,octubre:9,noviembre:10,diciembre:11
    };

    const txt = s.toLowerCase()
        .replace(/,/g,' ')
        .replace(/domingo|lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado/g,'')
        .trim();

    const m = txt.match(/(\d{1,2})\s+de?\s*([a-záéíóú]+)\s+(\d{4})|(\d{1,2})\s+([a-záéíóú]+)\s+(\d{4})/i);

    if (m) {
        const dia = parseInt(m[1] || m[4], 10);
        const mesTxt = (m[2] || m[5] || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        const anio = parseInt(m[3] || m[6], 10);

        if (!isNaN(dia) && ms[mesTxt] !== undefined && !isNaN(anio)) {
            return new Date(anio, ms[mesTxt], dia);
        }
    }

    // Fallback: sin año, ej. "26 de septiembre" — usar el año actual
    const m2 = txt.match(/(\d{1,2})\s+de?\s*([a-záéíóú]+)/i);
    if (m2) {
        const dia = parseInt(m2[1], 10);
        const mesTxt = (m2[2] || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        if (!isNaN(dia) && ms[mesTxt] !== undefined) {
            return new Date(new Date().getFullYear(), ms[mesTxt], dia);
        }
    }

    const fallback = new Date(s);
    return isNaN(fallback.getTime()) ? new Date(0) : fallback;
}

function escHtml(s) { if(s==null) return '—'; return s.toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

function escJs(s) { if(s==null) return ''; return s.toString().replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/`/g,'\\`').replace(/\$/g,'\\$').replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029'); }

// ══════════════════════════════════════════════════════════════
//  MEJORAS v2 — Debounce · Sort · CSV · Undo · Progreso
// ══════════════════════════════════════════════════════════════

// ── Debounce genérico ──────────────────────────────────────────
function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  parseFechaStr,
  daysSince,
  normalizeStr,
  sanitizeSheetName,
  safeStr,
  safeTemaNum,
  safeExcelDate,
  celdaVacia,
  fuzzyMatch,
  decodeHtmlEntities,
  fechaToExcelSerial,
  parseStringToDate,
  escHtml,
  escJs,
  debounce,
});
