/* ==========================================================================
   SpeakerFormModal
   Origen: DISCURSAPP .html (L3290-3295)
   ========================================================================== */
export default function SpeakerFormModal() {
  return (
    <>
      <div className="modal-overlay" id="modal-speaker-form" onClick={(event) => { if(event.target===event.currentTarget)closeSpeakerForm() }}>{" "}<div className="modal-box" style={{ maxWidth: "640px" }}>{" "}<div className="modal-close" onClick={(event) => { closeSpeakerForm() }}>{"✕"}</div>{" "}<div id="speaker-form-body"></div>{" "}</div>{" "}</div>
    </>
  );
}
