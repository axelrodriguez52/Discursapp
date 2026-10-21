/* ==========================================================================
   DiaDetalleModal
   Origen: DISCURSAPP .html (L3145-3155)
   ========================================================================== */
export default function DiaDetalleModal() {
  return (
    <>
      <div id="modal-dia-detalle" onClick={(event) => { if(event.target===event.currentTarget)closeDiaDetalle() }}>{" "}<div className="mdd-box" style={{ position: "relative" }}>{" "}<div className="mdd-header">{" "}<div className="mdd-date-label" id="mdd-label">{"📅 Detalle del día"}</div>{" "}<div className="mdd-date" id="mdd-date">{"—"}</div>{" "}<div className="mdd-summary" id="mdd-summary"></div>{" "}<button className="mdd-close" onClick={(event) => { closeDiaDetalle() }}>{"✕"}</button>{" "}</div>{" "}<div className="mdd-body" id="mdd-body"></div>{" "}</div>{" "}</div>
    </>
  );
}
