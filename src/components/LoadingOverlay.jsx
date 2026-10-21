/* ==========================================================================
   LoadingOverlay
   Origen: DISCURSAPP .html (L2704-2707)
   ========================================================================== */
export default function LoadingOverlay() {
  return (
    <>
      <div className="loading-overlay" id="loading-overlay">{" "}<div className="loading-spinner"></div>{" "}<div className="loading-text" id="loading-text">{"Cargando datos..."}</div>{" "}</div>
    </>
  );
}
