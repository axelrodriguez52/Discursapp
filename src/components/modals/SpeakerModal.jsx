/* ==========================================================================
   SpeakerModal
   Origen: DISCURSAPP .html (L3350-3352)
   ========================================================================== */
export default function SpeakerModal() {
  return (
    <>
      <div className="modal-overlay" id="modal" onClick={(event) => { handleModalClick(event) }}>{" "}<div className="modal-box"><div className="modal-close" onClick={(event) => { closeModal() }}>{"✕"}</div><div id="modal-body"></div></div>{" "}</div>
    </>
  );
}
