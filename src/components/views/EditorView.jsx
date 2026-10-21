/* ==========================================================================
   EditorView
   Origen: DISCURSAPP .html (L2798-2817)
   ========================================================================== */
export default function EditorView() {
  return (
    <>
      <section id="view-editor" className="view-section">{" "}<div className="view-header">{" "}<div className="view-title">{" "}<h3>{"Editar Discursantes"}</h3>{" "}<p id="editor-subtitle">{"Selecciona una Congregación Matriz en el menú lateral para editar sus discursantes."}</p>{" "}</div>{" "}<div className="view-toolbar" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>{" "}<button className="btn-print" id="btn-add-speaker" onClick={(event) => { openSpeakerForm(null) }} style={{ display: "none" }}>{" "}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>{"\n                        Agregar Discursante\n                    "}</button>{" "}</div>{" "}</div>{" "}<div id="editor-cloud-warn" className="editor-warn-banner" style={{ display: "none" }}>{"\n                ⚠️ Conéctate a Google Sheets para poder editar y guardar los cambios.\n            "}</div>{" "}<div id="editor-cards-container" className="editor-cards-grid">{" "}<div className="empty-state"><p>{"Selecciona una Congregación Matriz para ver sus discursantes."}</p></div>{" "}</div>{" "}</section>
    </>
  );
}
