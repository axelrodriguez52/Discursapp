/* ==========================================================================
   TopNav
   Origen: DISCURSAPP .html (L2710-2726)
   ========================================================================== */
export default function TopNav() {
  return (
    <>
      <header className="top-nav">{" "}<div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "0" }}>{" "}<button className="sidebar-toggle" id="sidebar-toggle" onClick={(event) => { toggleSidebar() }}>{" "}<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>{" "}</button>{" "}<button className="nav-menu-btn" id="nav-menu-btn" onClick={(event) => { toggleNavMenu() }}>{" "}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>{" "}<span className="nav-active-label" id="nav-active-label">{"Todos los Oradores"}</span>{" "}<span className="nav-menu-arrow">{"▼"}</span>{" "}</button>{" "}</div>{" "}<div style={{ display: "flex", gap: "8px", alignItems: "center" }}>{" "}<button className="dark-toggle" id="dark-toggle" onClick={(event) => { toggleDarkMode() }} title="Cambiar tema">{"🌙"}</button>{" "}<div className="mobile-actions-toggle" onClick={(event) => { toggleMobileDrawer() }}>{"⚙️ Menú"}</div>{" "}<div className="nav-status" id="memory-badge">{"Memoria Local Activa"}</div>{" "}</div>{" "}</header>
    </>
  );
}
