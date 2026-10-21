/* ==========================================================================
   Cropper
   Origen: DISCURSAPP .html (L3355-3374)
   ========================================================================== */
export default function Cropper() {
  return (
    <>
      <div id="cropper-overlay" onClick={(event) => { if(event.target===event.currentTarget)closeCropper() }}>{" "}<div id="cropper-box">{" "}<div className="cropper-title"><span>{"✂️"}</span>{" Recortar foto de perfil"}</div>{" "}<div id="cropper-stage">{" "}<canvas id="cropper-canvas"></canvas>{" "}<div id="cropper-mask"></div>{" "}<div id="cropper-ring"></div>{" "}</div>{" "}<p className="cropper-hint">{"🖱️ Arrastra para mover · 🔍 Rueda para zoom"}</p>{" "}<div className="cropper-zoom-bar">{" "}<label>{"Zoom"}</label>{" "}<input type="range" id="cropper-zoom" min="1" max="5" step="0.01" defaultValue="1" />{" "}<span className="cropper-zoom-val" id="cropper-zoom-val">{"1×"}</span>{" "}</div>{" "}<div className="cropper-actions">{" "}<button className="btn-crop-cancel" onClick={(event) => { closeCropper() }}>{"Cancelar"}</button>{" "}<button className="btn-crop-confirm" onClick={(event) => { confirmCrop() }}>{"✓ Usar esta foto"}</button>{" "}</div>{" "}</div>{" "}</div>
    </>
  );
}
