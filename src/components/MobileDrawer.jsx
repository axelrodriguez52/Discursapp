/* ==========================================================================
   MobileDrawer
   Origen: DISCURSAPP .html (L2768-2781)
   ========================================================================== */
export default function MobileDrawer() {
  return (
    <>
      <div className="mobile-drawer" id="mobile-file-drawer">{" "}<button id="btn-google-login-mob" className="btn-google" disabled={true} onClick={(event) => { solicitarAccesoGoogle() }} style={{ marginBottom: "8px" }}>{"\n                🔑 Conectar Google Sheets\n            "}</button>{" "}<div className="upload-zone" onClick={(event) => { document.getElementById('file-input').click() }}>{" "}<div className="upload-icon">{"📊"}</div>{" "}<div className="upload-text"><p>{"Subir Excel Maestro"}</p><span className="xlsx-status-text">{"Excel (.xlsx)"}</span></div>{" "}</div>{" "}<div className="upload-zone" onClick={(event) => { document.getElementById('pdf-input').click() }}>{" "}<div className="upload-icon">{"📋"}</div>{" "}<div className="upload-text"><p>{"Vincular Catálogo Bosquejos"}</p><span className="pdf-status-text">{"Catálogo PDF"}</span></div>{" "}</div>{" "}<button className="btn-danger" onClick={(event) => { clearStorage() }} style={{ marginTop: "4px" }}>{"🗑️ Borrar base de datos"}</button>{" "}</div>
    </>
  );
}
