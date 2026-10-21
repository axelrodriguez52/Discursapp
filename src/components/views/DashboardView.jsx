/* ==========================================================================
   DashboardView
   Origen: DISCURSAPP .html (L2819-2844)
   ========================================================================== */
export default function DashboardView() {
  return (
    <>
      <section id="view-dashboard" className="view-section active">{" "}<div className="view-header">{" "}<div className="view-title">{" "}<h3>{"Oradores del Circuito"}</h3>{" "}<p>{"Busca por nombre o número/título de bosquejo."}</p>{" "}</div>{" "}<div className="view-toolbar" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>{" "}<div className="search-wrap">{" "}<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>{" "}<input type="text" id="search-input" className="search-input" placeholder="Buscar orador, rol o tema…" />{" "}</div>{" "}<span id="search-counter" style={{ fontSize: "11.5px", color: "var(--text-3)", fontWeight: "500", whiteSpace: "nowrap", display: "none" }}></span>{" "}<select id="rol-filter" className="filter-select" onChange={(event) => { renderCards() }} style={{ minWidth: "170px" }}>{" "}<option value="">{"— Todos los roles —"}</option>{" "}</select>{" "}<select id="cong-filter" className="filter-select" onChange={(event) => { renderCards() }} style={{ minWidth: "170px" }}>{" "}<option value="">{"— Todas las congregaciones —"}</option>{" "}</select>{" "}</div>{" "}</div>{" "}<div id="rol-summary-bar" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 18px", marginBottom: "20px", fontSize: "13px", display: "none", gap: "24px", flexWrap: "wrap", alignItems: "center", boxShadow: "var(--shadow-sm)", animation: "fadeSlideIn 0.35s ease" }}></div>{" "}<div className="cards-grid" id="cards-container">{" "}<div className="empty-state"><p>{"Conéctate a Google Sheets o carga un archivo Excel para visualizar los datos."}</p></div>{" "}</div>{" "}</section>
    </>
  );
}
