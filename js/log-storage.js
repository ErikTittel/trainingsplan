// Trainingsprotokoll und Anzeigezustand im Speicher des Browsers (localStorage).
// Einzige Stelle der App, die auf localStorage zugreift. Wechselt der Speicherort (z. B.
// IndexedDB), ändert sich nur diese Datei.

import { emptyLog, isLogDocument, migrate, LOG_SCHEMA } from "./log.js";

// Schlüssel im localStorage. Der Name "…v1" bleibt trotz neuerer Formatversion stehen:
// Die Version steht im Dokument selbst (schema).
const LOG_KEY = "trainingsplan.log.v1";
const LOG_BACKUP_KEY = "trainingsplan.log.backup"; // Stand vor der letzten Migration
const LOG_BROKEN_KEY = "trainingsplan.log.defekt"; // unlesbarer Stand
// Anzeigezustand (gewählte Einheit/Phase, offene Übung, Scrollposition) – getrennt vom
// Protokoll, nicht Teil der Sicherung. Fehler beim Lesen oder Schreiben werden still ignoriert.
const VIEW_KEY = "trainingsplan.view";

let persistRequested = false;

// Liest das Protokoll. Ergebnis: { log, status } mit status
//   "ok"               – vorhandenes Protokoll geladen
//   "leer"             – noch nichts gespeichert
//   "defekt"           – unlesbarer Stand wurde beiseitegelegt, es geht leer weiter
//   "zu-neu"           – Stand stammt aus einer neueren App-Version; nicht schreiben!
//   "nicht-verfuegbar" – der Browser erlaubt kein Speichern
export function loadLog() {
  let raw;
  try {
    raw = localStorage.getItem(LOG_KEY);
  } catch (error) {
    return { log: emptyLog(), status: "nicht-verfuegbar" };
  }
  if (raw === null) return { log: emptyLog(), status: "leer" };

  let doc = null;
  try {
    doc = JSON.parse(raw);
  } catch (error) {
    doc = null;
  }
  if (!isLogDocument(doc)) {
    try {
      localStorage.setItem(LOG_BROKEN_KEY, raw);
    } catch (error) {
      // Kein Platz für die Kopie – der unlesbare Stand bleibt trotzdem unter LOG_KEY stehen,
      // bis das nächste Speichern ihn ersetzt.
    }
    return { log: emptyLog(), status: "defekt" };
  }
  if (doc.schema > LOG_SCHEMA) return { log: emptyLog(), status: "zu-neu" };
  if (doc.schema < LOG_SCHEMA) {
    try {
      // Alten Stand vor der Umwandlung sichern.
      localStorage.setItem(LOG_BACKUP_KEY, raw);
      doc = migrate(doc);
      localStorage.setItem(LOG_KEY, JSON.stringify(doc));
    } catch (error) {
      return { log: emptyLog(), status: "zu-neu" };
    }
  }
  return { log: doc, status: "ok" };
}

// Schreibt das ganze Protokoll und setzt updatedAt. Gibt true zurück, wenn es geklappt hat.
export function saveLog(log) {
  log.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  } catch (error) {
    return false;
  }
  requestPersistence();
  return true;
}

// Liest den gespeicherten Anzeigezustand – ein Objekt oder null (fehlt, unlesbar, kein Speicher).
// Ob er noch gilt (gleicher Tag, gültige IDs), prüft app.js.
export function loadViewState() {
  try {
    const view = JSON.parse(localStorage.getItem(VIEW_KEY));
    return view !== null && typeof view === "object" && !Array.isArray(view) ? view : null;
  } catch (error) {
    return null;
  }
}

export function saveViewState(view) {
  try {
    localStorage.setItem(VIEW_KEY, JSON.stringify(view));
  } catch (error) {
    // Komfortfunktion – ohne Speicher geht es ohne Wiederherstellung weiter.
  }
}

function requestPersistence() {
  if (!persistRequested) {
    persistRequested = true;
    // Bittet den Browser, die Daten bei knappem Speicher nicht zu räumen (ohne Garantie).
    try {
      const request = navigator.storage?.persist?.();
      if (request?.catch) request.catch(() => {});
    } catch (error) {
      // Nicht unterstützt – kein Problem.
    }
  }
}
