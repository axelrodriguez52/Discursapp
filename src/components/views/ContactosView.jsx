/* ==========================================================================
   ContactosView
   Vista React real: las tarjetas se renderizan con JSX desde un store externo
   que publica renderContactosView(). Se conservan ids, clases, textos y las
   funciones globales que usa el resto de la app.
   ========================================================================== */
'use client';

import { useSyncExternalStore } from 'react';
import {
  getContactosServerSnapshot,
  getContactosSnapshot,
  subscribeContactos,
} from '@/src/core/contactos-store.js';

function ContactoCard({ entry }) {
  const { key, congName, encargado, telefono, speakerCount, photoSrc } = entry;
  const photoTitle = photoSrc ? 'Cambiar foto' : 'Agregar foto del encargado';

  return (
    <div className="contact-card" style={{ cursor: 'pointer' }} onClick={() => window.openContactModal(congName)}>
      <div className="contact-cong-name">{congName}</div>
      <div className="contact-info">
        <div className="contact-row" style={{ alignItems: 'center' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {photoSrc ? (
              <img
                src={photoSrc}
                onClick={(event) => { event.stopPropagation(); window.openLightbox(photoSrc); }}
                style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--border)', flexShrink: 0, cursor: 'zoom-in' }}
                alt=""
              />
            ) : (
              <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-card-alt)', border: '1.5px solid var(--border-hi)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                👤
              </span>
            )}
            <button
              onClick={(event) => { event.stopPropagation(); window.triggerContactPhotoUpload(key, congName); }}
              title={photoTitle}
              style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', color: '#fff', border: '1.5px solid #fff', cursor: 'pointer', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {photoSrc ? '✏' : '+'}
            </button>
          </div>
          <div>
            <div className="contact-label">Encargado de Discursos</div>
            <div className="contact-value">{encargado}</div>
          </div>
        </div>
        <div className="contact-row">
          <span className="contact-icon">📞</span>
          <div>
            <div className="contact-label">Teléfono</div>
            <div className="contact-value" style={{ color: 'var(--accent)', fontWeight: 600 }}>{telefono}</div>
          </div>
        </div>
      </div>
      <div className="contact-footer">
        <button
          onClick={(event) => { event.stopPropagation(); window.exportarContactoPDF(congName); }}
          title="Exportar listado de oradores a PDF"
          style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-card-alt)', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}
          onMouseOver={(event) => { event.currentTarget.style.borderColor = 'var(--accent)'; event.currentTarget.style.color = 'var(--accent)'; }}
          onMouseOut={(event) => { event.currentTarget.style.borderColor = 'var(--border)'; event.currentTarget.style.color = 'var(--text-2)'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          PDF
        </button>
        🎤 {speakerCount} orador{speakerCount !== 1 ? 'es' : ''} registrado{speakerCount !== 1 ? 's' : ''}{' '}
        &nbsp;·&nbsp;{' '}
        <span style={{ color: 'var(--accent)' }}>Ver detalle →</span>
      </div>
    </div>
  );
}

export default function ContactosView() {
  const { ready, total, search, entries } = useSyncExternalStore(
    subscribeContactos,
    getContactosSnapshot,
    getContactosServerSnapshot
  );

  const subtitle = total
    ? `${total} encargado${total !== 1 ? 's' : ''} de discursos registrado${total !== 1 ? 's' : ''} en el circuito.`
    : 'Encargados de discursos y número de contacto por congregación.';

  function handleSearch() {
    if (typeof window !== 'undefined' && typeof window.debouncedRenderContactosView === 'function') {
      window.debouncedRenderContactosView();
    }
  }

  return (
    <>
      <section id="view-contactos" className="view-section">
        <div className="view-header">
          <div className="view-title">
            <h3>Contactos del Circuito</h3>
            <p id="contactos-subtitle">{subtitle}</p>
          </div>
          <div className="search-wrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              id="contactos-search"
              className="search-input"
              placeholder="Buscar congregación…"
              onInput={handleSearch}
            />
          </div>
        </div>
        <div className="contacts-grid" id="contactos-grid">
          {!ready ? (
            <div className="empty-state"><p>Carga el archivo Excel para visualizar los contactos.</p></div>
          ) : entries.length === 0 ? (
            <div className="empty-state">
              <p>
                {total === 0
                  ? 'Carga el archivo Excel con una hoja "Contactos" para ver los encargados.'
                  : `Sin coincidencias para "${search}".`}
              </p>
            </div>
          ) : (
            entries.map((entry) => <ContactoCard key={entry.key} entry={entry} />)
          )}
        </div>
      </section>
    </>
  );
}
