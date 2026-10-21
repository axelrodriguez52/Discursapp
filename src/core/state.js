/* ==========================================================================
   Estado global de la app
   Origen: DISCURSAPP .html, script principal (L3497-10379)
   ========================================================================== */
window.tokenClient = undefined;

window.tokenClientWrite = undefined;

window.hasWriteToken = false;

window.gapiIniciado = false;

window.gisiIniciado = false;

window.globalSpeakers = [];
window.contactsMap = {};
window.themesMap = {};
window.registeredCongs = new Set();
window.destinationCongs = new Set();
window.allAssignments = [];
window.db = undefined;

window.matrizCong = '';

window.MATRIZ_KEY = 'circ16_matriz_cong';

window.sheetIdMap = {};

 // nombreHoja -> sheetId numérico (gid)
        // blockedThemes: { "42": { fromMonth: "Agosto", reason: "" }, ... }
        // fromMonth: mes a partir del cual (inclusive) el bosquejo queda bloqueado.
        // Meses ANTERIORES a fromMonth siguen disponibles.
        // "TODOS" como valor especial de fromMonth = bloqueado en todos los meses.
window.blockedThemes = {};

        // ── Locks para operaciones concurrentes ──
window._isSyncing = false;

window._isSaving = false;

        // Plantilla del recordatorio respaldada en IndexedDB (declarada antes de su primer uso)
window.recPlantillaDesdeIDB = '';

        // ══════════════════════════════════════════════
        //  BOSQUEJOS — Estado, persistencia y render
        // ══════════════════════════════════════════════
window.MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

        // ══════════════════════════════════════════════════════════════
        //  EDITOR DE DISCURSANTES — Congregación Matriz
        // ══════════════════════════════════════════════════════════════
        // Tamaño fijo de cada bloque de discursante (en filas)
window.BLOCK_SIZE = 14;

        // ── Formulario: abrir (nuevo o edición) ──
window.editorFormState = { idx: null, temas: [null,null,null,null,null,null,null,null,null,null,null,null,null,null], disponibilidad: {} };

        // ── PRESELECCIÓN MÚLTIPLE DE BOSQUEJOS (bloqueo masivo) ──
window.bsqSelMode = false;

window.bsqSel = new Set();

window.bsqVisibleKeys = [];

        // ── GENERIC COVER FLOW ENGINE ──
window.gfState = {};

        // ══════════════════════════════════════════════════════════════
        //  REGISTRO DE ASIGNACIONES — Wizard de 5 pasos + escritura Sheets
        // ══════════════════════════════════════════════════════════════
window.regState = { mes: '', discursante: null, tema: '', cong: '', fecha: '' };

window.preseleccion = [];

 // Cola de oradores para registro masivo
window.preselectBatchRunning = false;

        // ══════════════════════════════════════════════════════════════
        //  FOTOS DE PERFIL DE ORADORES — Almacenamiento local en base64
        // ══════════════════════════════════════════════════════════════
window.speakerPhotos = {};

        // ══════════════════════════════════════════════════════════════
        //  CALIFICACIÓN DE ORADORES — almacenamiento local
        // ══════════════════════════════════════════════════════════════
window.RATING_OPTIONS = [
            { val: 'A+', label: 'A+ Excelente',    color: '#16a34a' },
            { val: 'A',  label: 'A Muy bueno',     color: '#22c55e' },
            { val: 'A-', label: 'A- Bueno',         color: '#86efac' },
            { val: 'B+', label: 'B+ Encima del promedio', color: '#0ea5e9' },
            { val: 'B',  label: 'B Promedio',       color: '#38bdf8' },
            { val: 'B-', label: 'B- Aceptable',     color: '#a78bfa' },
            { val: 'C+', label: 'C+ Regular',       color: '#f97316' },
            { val: 'C',  label: 'C Mejorable',      color: '#fb923c' },
            { val: 'C-', label: 'C- Deficiente',    color: '#fde047' },
            { val: 'NR', label: 'No recomendado',   color: '#dc2626' },
            { val: 'ND', label: 'No disponible',    color: '#6b7280' }
        ];

window.speakerRatings = {};

        // ══════════════════════════════════════════════════════════════
        //  AUSENCIAS DE ORADORES — almacenamiento local
        // ══════════════════════════════════════════════════════════════
window.ABSENCES_KEY = 'discursapp_speaker_absences';

window.speakerAbsences = {};

try {
    const savedA = localStorage.getItem(ABSENCES_KEY);
    if (savedA) speakerAbsences = JSON.parse(savedA);
} catch(e) { speakerAbsences = {}; }

        //  RECORTADOR DE IMAGEN — estado interno
        // ══════════════════════════════════════════════════════════════
window._crop = {
            img: null,          // HTMLImageElement original
            photoKey: '',
            nombre: '',
            congregacion: '',
            scale: 1,           // zoom actual
            minScale: 1,
            maxScale: 5,
            ox: 0, oy: 0,       // offset del centro de la imagen en el canvas (px del canvas)
            dragging: false,
            lastX: 0, lastY: 0,
            canvasSize: 0,      // tamaño cuadrado del canvas en px (CSS)
        };

        // ── RECORDATORIO DE DISCURSO (mensaje estándar editable) ──
window._recLista = [];
window._recSel = null;

        // ── PLANTILLA PREDETERMINADA DEL RECORDATORIO ──
        // La plantilla usa variables {hermano} {nombre} {tema} {fecha} {hora}
        // {congregacion} {origen} {encargado}. Sin plantilla guardada se usa esta,
        // que reproduce exactamente el mensaje original.
window.REC_PLANTILLA_DEFAULT = `Estimado hermano {hermano}

Esto es para recordarte que vas a presentar el siguiente discurso:

Tema: {tema}

Fecha: {fecha}
Hora: {hora}

Congregación: {congregacion}

Enviar imágenes y canción unos días antes de la fecha del discurso.

Gracias por tu ayuda.

Con amor cristiano,
{encargado}`;

window.REC_PLANTILLA_KEY = 'discursapp_recordatorio_plantilla';

        // ── Batch render: agrupar múltiples renders en un solo frame ──
window._pendingRenders = new Set();

window._rafId = null;

        // ── Ordenar tabla Aguayo ──────────────────────────────────────
window.aguayoSort = { col: 'fecha', dir: 1 };

        // ── Undo de registro (ventana de 5 s) ─────────────────────────
window.lastRegistro = null;

window.undoTimer = null;

        // ══════════════════════════════════════════════════════════════
        //  CALENDARIO DE ASIGNACIONES — Motor completo
        // ══════════════════════════════════════════════════════════════
        // --- Estado del calendario ---
window.calView = 'mes';

      // 'mes' | 'semana'
window.calYear = new Date().getFullYear();

window.calMonth = new Date().getMonth();

   // 0-based
window.calWeekStart = null;

       // Date del lunes de la semana actual
window.eventoEditId = null;

       // ID del evento en edición
        // Eventos especiales guardados en localStorage
        // Formato: [{ id, tipo, nombre, fechaInicio, fechaFin, bloquea, notas }]
window.EVENTOS_KEY = 'discursapp_eventos_especiales';

window.ASIGNACIONES_KEY = 'discursapp_asignaciones_local';

        // Detectar conflictos: mismo discursante con dos salidas en el mismo domingo / semana
window._conflictosCache = null;
