/* ==========================================================================
   Store externo de la vista Contactos
   Puente entre el codigo imperativo (renderContactosView) y el componente
   React. El snapshot es inmutable y estable entre publicaciones, como exige
   useSyncExternalStore.
   ========================================================================== */

const EMPTY_SNAPSHOT = Object.freeze({
  version: 0,
  ready: false,
  total: 0,
  search: '',
  entries: Object.freeze([]),
});

let snapshot = EMPTY_SNAPSHOT;
const listeners = new Set();

export function getContactosSnapshot() {
  return snapshot;
}

// Snapshot fijo para SSR e hidratacion: garantiza que el primer render del
// cliente coincida con el HTML exportado aunque el store ya se haya publicado.
export function getContactosServerSnapshot() {
  return EMPTY_SNAPSHOT;
}

export function subscribeContactos(listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function publishContactos({ total, search, entries }) {
  snapshot = {
    version: snapshot.version + 1,
    ready: true,
    total,
    search,
    entries,
  };
  listeners.forEach((listener) => listener());
}
