/* ==========================================================================
   Pestanas, sidebar, menu y tema claro/oscuro
   Origen: DISCURSAPP .html, script principal (L4051-4162)
   ========================================================================== */
function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark-mode');
    const btn = document.getElementById('dark-toggle');
    if (btn) btn.textContent = isDark ? '☀️' : '🌙';
    try { localStorage.setItem('discursapp_darkMode', isDark ? '1' : '0'); } catch(e) {}
}

function toggleMobileDrawer() {
    document.getElementById('mobile-file-drawer').classList.toggle('open');
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    sidebar.classList.toggle('open');
    backdrop.classList.toggle('open');
}

function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    sidebar.classList.remove('open');
    backdrop.classList.remove('open');
}

function toggleNavMenu() {
    const btn = document.getElementById('nav-menu-btn');
    const dropdown = document.getElementById('nav-dropdown');
    btn.classList.toggle('open');
    dropdown.classList.toggle('open');
}

function closeNavMenu() {
    document.getElementById('nav-menu-btn').classList.remove('open');
    document.getElementById('nav-dropdown').classList.remove('open');
}

function switchTab(target) {
    document.getElementById('mobile-file-drawer').classList.remove('open');
    closeNavMenu();
    closeSidebar();

    // Visitas redirige a Aguayo
    if (target === 'visitas') {
        target = 'aguayo';
    }

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === target));

    // Actualizar etiqueta visible en el botón del menú
    const activeBtn = document.querySelector(`.tab-btn[data-tab="${target}"]`);
    if (activeBtn) {
        document.getElementById('nav-active-label').textContent = activeBtn.dataset.label || activeBtn.textContent.trim();
        if (typeof G !== 'undefined' && typeof gsap !== 'undefined') G.buttonPulse(activeBtn);
    }

    const prev = document.querySelector('.view-section.active');
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    const next = document.getElementById('view-' + target);
    next.classList.add('active');
    
    if (prev && next && prev !== next && typeof G !== 'undefined' && typeof gsap !== 'undefined') {
        G.tabSwitch(prev, next);
    }

    if (target === 'estadisticas') renderEstadisticasDashboard();
    if (target === 'dashboard') { renderCards(); }
    if (target === 'months') {
        renderMonthView();
        renderDispCongView();
        const mesSel = document.getElementById('month-selector').value;
        document.getElementById('reg-mes').value = mesSel;
        if (globalSpeakers.length) poblarDiscursantesDelMes(mesSel);
        poblarCongsDestino();
        actualizarSteps();
    }
    if (target === 'aguayo')    renderAguayoView();
    if (target === 'contactos') renderContactosView();
    if (target === 'bosquejos') renderBosquejosView();
    if (target === 'editor')    renderEditorView();
    if (target === 'calendario') { poblarCalCongFilter(); renderCalendario(); }
}

// ── Puente con el resto de la app ───────────────────────────────────────────
// El script original era un unico ambito global. Se conserva ese contrato para
// no alterar el comportamiento; cada modulo publica solo lo que necesita.
Object.assign(window, {
  toggleDarkMode,
  toggleMobileDrawer,
  toggleSidebar,
  closeSidebar,
  toggleNavMenu,
  closeNavMenu,
  switchTab,
});
