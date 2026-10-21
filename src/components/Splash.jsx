/* ==========================================================================
   Splash
   Origen: DISCURSAPP .html (L2629-2653)
   ========================================================================== */
export default function Splash() {
  return (
    <>
      <div id="app-splash" aria-hidden="true">{" "}<div className="sp-glow"></div>{" "}<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">{" "}<defs><linearGradient id="spGrad" x1="0" y1="0" x2="1" y2="1">{" "}<stop offset="0" stopColor="#38bdf8"></stop><stop offset="1" stopColor="#0071e3"></stop></linearGradient></defs>{" "}<rect className="sp-tile" width="48" height="48" rx="13" fill="url(#spGrad)"></rect>{" "}<g transform="translate(3.5 5.5)">{" "}<g className="sp-bub">{" "}<rect x="4" y="8" width="26" height="20" rx="4" fill="white" opacity="0.95"></rect>{" "}<path d="M10 28 L10 34 L18 28" fill="white" opacity="0.95"></path>{" "}</g>{" "}<line className="sp-l1" x1="10" y1="15" x2="24" y2="15" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"></line>{" "}<line className="sp-l2" x1="10" y1="20" x2="20" y2="20" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"></line>{" "}<circle className="sp-ring" cx="30" cy="10" r="7"></circle>{" "}<g className="sp-badge">{" "}<circle cx="30" cy="10" r="7" fill="white" stroke="#0071e3" strokeWidth="1.5"></circle>{" "}<line x1="30" y1="6.5" x2="30" y2="13.5" stroke="#0071e3" strokeWidth="2" strokeLinecap="round"></line>{" "}<line x1="26.5" y1="10" x2="33.5" y2="10" stroke="#0071e3" strokeWidth="2" strokeLinecap="round"></line>{" "}</g>{" "}</g>{" "}</svg>{" "}<div className="sp-word"><b>{"Discurs"}</b><i>{"App"}</i></div>{" "}<div className="sp-tag">{"Gestión de Discursos · Circuito 16"}</div>{" "}<div className="sp-bar"></div>{" "}</div>
    </>
  );
}
