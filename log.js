"use strict";

// Trainingsprotokoll: reine Daten- und Speicherlogik, ohne Zugriff auf die Seite (DOM).
// Format und Regeln: specs/002-trainingsprotokoll/data-model.md, Teil B.
// app.js ruft nur diese Funktionen auf und greift nie direkt auf localStorage zu.

const LOG_KEY = "trainingsplan.log.v1";
const LOG_BACKUP_KEY = "trainingsplan.log.backup";
const LOG_BROKEN_KEY = "trainingsplan.log.defekt";
const LOG_APP = "trainingsplan-log";
const LOG_SCHEMA = 2;
// Wahrgenommene Anstrengung ("Power"); "ok" ist der Standardwert.
const POWER_LEVELS = ["weak", "ok", "strong"];
const DEFAULT_POWER = "ok";
// Ein Training wird fortgesetzt, wenn es in den letzten 6 Stunden bearbeitet wurde
// (z. B. Training über Mitternacht).
const SESSION_RESUME_MS = 6 * 60 * 60 * 1000;

// Migrationsschritte: Schlüssel = Ausgangsversion, Wert = Funktion, die ein Dokument
// dieser Version in die nächste überführt.
const MIGRATIONS = {
  // Version 1 speicherte einzelne Sätze (Wiederholungen, Seiten, RPE). Ab Version 2 gibt es pro
  // Übung und Training nur noch Gewicht bzw. Zeit, Power und Kommentar. Übernommen wird das
  // höchste Gewicht und die längste Zeit der Sätze; Power ist "ok".
  1: (doc) => {
    const sessions = {};
    for (const [id, session] of Object.entries(doc.sessions)) {
      const entries = {};
      for (const [exerciseId, old] of Object.entries(session.entries ?? {})) {
        const entry = { target: old.target ?? "", power: DEFAULT_POWER };
        const sets = Array.isArray(old.sets) ? old.sets : [];
        const weights = sets.map((set) => set.weight).filter((value) => typeof value === "number" && value > 0);
        const seconds = sets.map((set) => set.seconds).filter((value) => Number.isInteger(value) && value > 0);
        if (weights.length) entry.weight = Math.max(...weights);
        if (seconds.length) entry.seconds = Math.max(...seconds);
        if (old.note) entry.note = old.note;
        entries[exerciseId] = entry;
      }
      if (Object.keys(entries).length) sessions[id] = { ...session, entries };
    }
    return { ...doc, schema: 2, sessions };
  }
};

let persistRequested = false;

function emptyLog() {
  return { app: LOG_APP, schema: LOG_SCHEMA, updatedAt: null, lastExportAt: null, sessions: {} };
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isLogDocument(doc) {
  return isPlainObject(doc)
    && doc.app === LOG_APP
    && Number.isInteger(doc.schema)
    && doc.schema >= 1
    && isPlainObject(doc.sessions);
}

// Bringt ein Dokument Schritt für Schritt auf die aktuelle Formatversion.
function migrate(doc) {
  let current = doc;
  while (current.schema < LOG_SCHEMA) {
    const step = MIGRATIONS[current.schema];
    if (!step) throw new Error(`Für Protokoll-Version ${current.schema} gibt es keine Umwandlung.`);
    current = step(current);
  }
  return current;
}

// Liest das Protokoll. status:
//   "ok"               – vorhandenes Protokoll geladen
//   "leer"             – noch nichts gespeichert
//   "defekt"           – unlesbarer Stand wurde beiseitegelegt, es geht leer weiter
//   "zu-neu"           – Stand stammt aus einer neueren App-Version; nicht schreiben!
//   "nicht-verfuegbar" – der Browser erlaubt kein Speichern
function loadLog() {
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

// Schreibt das ganze Protokoll. Gibt true zurück, wenn es geklappt hat.
function saveLog(log) {
  log.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  } catch (error) {
    return false;
  }
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
  return true;
}

// Heutiges Datum in Ortszeit als JJJJ-MM-TT.
function localDate(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// Findet das aktuelle Training der Einheit. context = { date, planStart, week, phase, deload }.
// Mit create = true wird es angelegt, falls es noch keines gibt.
function currentSession(log, workoutId, context, create = false) {
  const id = `${context.date}_${workoutId}`;
  if (log.sessions[id]) return log.sessions[id];

  const now = Date.now();
  let recent = null;
  for (const session of Object.values(log.sessions)) {
    if (session.workoutId !== workoutId) continue;
    const age = now - Date.parse(session.updatedAt);
    if (!(age >= 0 && age < SESSION_RESUME_MS)) continue;
    if (!recent || session.updatedAt > recent.updatedAt) recent = session;
  }
  if (recent) return recent;
  if (!create) return null;

  const session = {
    id,
    date: context.date,
    workoutId,
    planStart: context.planStart ?? null,
    week: context.week ?? null,
    phase: context.phase,
    deload: Boolean(context.deload),
    updatedAt: new Date().toISOString(),
    entries: {}
  };
  log.sessions[id] = session;
  return session;
}

// Macht aus einer Eingabe ("12,5", "12.5", 12.5, "") eine Zahl.
// Leere Eingabe → undefined, Unsinn → NaN.
function parseNumber(value) {
  if (typeof value === "number") return value;
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim().replace(",", ".");
  if (text === "") return undefined;
  return /^\d+(\.\d+)?$/.test(text) ? Number(text) : NaN;
}

// Prüft die Eingaben einer Übung und gibt die bereinigten Werte zurück – oder null, wenn ein
// Wert ungültig ist. Leere Felder sind erlaubt und werden weggelassen.
//   weight:  Zahl 0–999 kg (0 und leer werden weggelassen)
//   seconds: Ganzzahl 1–3600
//   power:   "weak" | "ok" | "strong"
//   note:    Text, höchstens 200 Zeichen (leer wird weggelassen)
function validateEntry(raw) {
  const values = {};
  const weight = parseNumber(raw.weight);
  if (weight !== undefined) {
    if (!(weight >= 0 && weight <= 999)) return null;
    if (weight > 0) values.weight = weight;
  }
  const seconds = parseNumber(raw.seconds);
  if (seconds !== undefined) {
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 3600) return null;
    values.seconds = seconds;
  }
  values.power = POWER_LEVELS.includes(raw.power) ? raw.power : DEFAULT_POWER;
  const note = String(raw.note ?? "").trim().slice(0, 200);
  if (note) values.note = note;
  return values;
}

// Schreibt den Eintrag einer Übung im Training: ersetzt Gewicht, Zeit, Power und Kommentar
// vollständig durch die übergebenen Werte. Gibt false zurück, wenn ein Wert ungültig ist.
function setEntry(log, session, exerciseId, raw, target) {
  const values = validateEntry(raw);
  if (!values) return false;
  log.sessions[session.id] = session;
  session.entries[exerciseId] = { target: target ?? "", ...values };
  session.updatedAt = new Date().toISOString();
  return true;
}

// Löscht den Eintrag einer Übung; ein Training ohne Einträge wird ebenfalls entfernt.
function removeEntry(log, session, exerciseId) {
  if (!session?.entries[exerciseId]) return false;
  delete session.entries[exerciseId];
  session.updatedAt = new Date().toISOString();
  if (Object.keys(session.entries).length === 0) delete log.sessions[session.id];
  return true;
}

// Jüngster Eintrag zu einer Übung – optional ohne ein bestimmtes Training (z. B. das heutige).
// Ergebnis: { session, entry } oder null.
function lastEntry(log, exerciseId, excludeSessionId = null) {
  let best = null;
  for (const session of Object.values(log.sessions)) {
    if (session.id === excludeSessionId) continue;
    const entry = session.entries?.[exerciseId];
    if (!entry) continue;
    if (!best
      || session.date > best.session.date
      || (session.date === best.session.date && session.updatedAt > best.session.updatedAt)) {
      best = { session, entry };
    }
  }
  return best;
}

// Inhalt der Sicherungsdatei.
function exportLog(log) {
  return {
    filename: `trainingsprotokoll-${localDate()}.json`,
    text: JSON.stringify(log, null, 2)
  };
}

function markExported(log) {
  log.lastExportAt = new Date().toISOString();
}

// Prüft den Text einer Sicherungsdatei. Ergebnis: { doc } oder { error }.
function parseImport(text) {
  let doc;
  try {
    doc = JSON.parse(text);
  } catch (error) {
    return { error: "Die Datei ist keine gültige Sicherung (kein JSON)." };
  }
  if (!isLogDocument(doc)) {
    return { error: "Die Datei ist keine Sicherung des Trainingsprotokolls." };
  }
  if (doc.schema > LOG_SCHEMA) {
    return { error: "Die Datei stammt aus einer neueren App-Version. Bitte zuerst die App aktualisieren." };
  }
  for (const session of Object.values(doc.sessions)) {
    const valid = isPlainObject(session)
      && typeof session.id === "string"
      && /^\d{4}-\d{2}-\d{2}$/.test(session.date ?? "")
      && typeof session.workoutId === "string"
      && typeof session.updatedAt === "string"
      && isPlainObject(session.entries);
    if (!valid) return { error: "Die Sicherung enthält ein unvollständiges Training und wurde nicht übernommen." };
  }
  try {
    return { doc: migrate(doc) };
  } catch (error) {
    return { error: error.message };
  }
}

// Führt eine Sicherung mit dem Protokoll auf dem Gerät zusammen – immer ganze Trainings:
// fehlt eines auf dem Gerät, wird es übernommen; gibt es dasselbe auf beiden Seiten,
// gewinnt der zuletzt geänderte Stand.
function mergeLog(log, imported) {
  const result = { added: 0, updated: 0, unchanged: 0 };
  for (const session of Object.values(imported.sessions)) {
    const existing = log.sessions[session.id];
    if (!existing) {
      log.sessions[session.id] = session;
      result.added += 1;
    } else if (session.updatedAt > existing.updatedAt) {
      log.sessions[session.id] = session;
      result.updated += 1;
    } else {
      result.unchanged += 1;
    }
  }
  return result;
}
