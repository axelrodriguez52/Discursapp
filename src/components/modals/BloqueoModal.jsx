/* ==========================================================================
   BloqueoModal
   Origen: DISCURSAPP .html (L3283-3288)
   ========================================================================== */
export default function BloqueoModal() {
  return (
    <>
      <div className="modal-overlay" id="modal-bloqueo" onClick={(event) => { if(event.target===event.currentTarget)closeBloqueoModal() }}>{" "}<div className="modal-box" style={{ maxWidth: "480px" }}>{" "}<div className="modal-close" onClick={(event) => { closeBloqueoModal() }}>{"✕"}</div>{" "}<div id="bloqueo-modal-body"></div>{" "}</div>{" "}</div>
    </>
  );
}
