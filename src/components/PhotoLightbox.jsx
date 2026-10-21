/* ==========================================================================
   PhotoLightbox
   Origen: DISCURSAPP .html (L3377-3380)
   ========================================================================== */
export default function PhotoLightbox() {
  return (
    <>
      <div id="photo-lightbox" onClick={(event) => { closeLightbox() }}>{" "}<button id="photo-lightbox-close" onClick={(event) => { closeLightbox() }}>{"✕"}</button>{" "}<img id="photo-lightbox-img" alt="Foto ampliada" />{" "}</div>
    </>
  );
}
