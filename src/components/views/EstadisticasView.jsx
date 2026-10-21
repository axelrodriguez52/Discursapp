/* ==========================================================================
   EstadisticasView
   Origen: DISCURSAPP .html (L2786-2796)
   ========================================================================== */
export default function EstadisticasView() {
  return (
    <>
      <section id="view-estadisticas" className="view-section">{" "}<div className="view-header">{" "}<div className="view-title">{" "}<h3>{"Panel de Estadísticas"}</h3>{" "}<p>{"Resumen analítico del circuito. Haz clic en cualquier tarjeta para ampliar el detalle."}</p>{" "}</div>{" "}</div>{" "}<div id="stats-empty-state" className="empty-state" style={{ display: "none" }}><p>{"Carga el archivo Excel para visualizar las estadísticas."}</p></div>{" "}<div id="stats-summary-bar" style={{ display: "none" }}></div>{" "}<div className="stats-cards-grid" id="stats-cards-grid"></div>{" "}</section>
    </>
  );
}
