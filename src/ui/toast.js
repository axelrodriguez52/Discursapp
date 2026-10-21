/* ==========================================================================
   Loading, confirmacion y toasts
   Origen: DISCURSAPP .html, script principal (L8656-8701)
   ========================================================================== */
// ── LOADING OVERLAY ──
function showLoading(msg) {
    const el = document.getElementById('loading-overlay');
    const txt = document.getElementById('loading-text');
    if (txt) txt.textContent = msg || 'Cargando datos...';
    if (el) el.classList.add('active');
}

function hideLoading() {
    const el = document.getElementById('loading-overlay');
    if (el) el.classList.remove('active');
}

// ── CONFIRM MODAL (reemplaza confirm() nativo) ──
function showConfirm(title, msg, opts = {}) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.innerHTML = `<div class="confirm-box">
            <div class="confirm-title">${escHtml(title)}</div>
            <div class="confirm-msg">${escHtml(msg)}</div>
            <div class="confirm-actions">
                <button class="confirm-btn" id="confirm-cancel">${opts.cancelLabel || 'Cancelar'}</button>
                <button class="confirm-btn danger" id="confirm-ok">${opts.okLabel || 'Confirmar'}</button>
            </div>
        </div>`;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));
        overlay.querySelector('#confirm-cancel').onclick = () => { overlay.remove(); resolve(false); };
        overlay.querySelector('#confirm-ok').onclick = () => { overlay.remove(); resolve(true); };
        overlay.onclick = e => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
    });
}

// Toast de notificación
let toastTimer;

function mostrarToast(msg, tipo = 'success') {
    const t = document.getElementById('reg-toast');
    t.textContent = msg;
    t.className = `reg-toast ${tipo}`;
    clearTimeout(toastTimer);
    if (typeof G !== 'undefined') {
        G.toast(t);
    } else {
        t.classList.add('show');
        toastTimer = setTimeout(() => { t.classList.remove('show'); }, 4000);
    }
}

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  showLoading,
  hideLoading,
  showConfirm,
  toastTimer,
  mostrarToast,
});
