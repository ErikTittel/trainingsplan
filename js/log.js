// Trainingsprotokoll: Fachlogik – Format, Prüfung, Einträge, Migration, Sicherung.
// Rein rechnerisch – kein DOM, kein Speicherzugriff (der steht in log-storage.js).
// Format und Regeln: docs/datenformate.md, Teil B.

import { localDate, DATE_PATTERN } from "./calendar.js";

export const LOG_APP = "trainingsplan-log";
export const LOG_SCHEMA = 3;

// Werte, die eine Übung laut plan.json (log.fields) erfassen kann:
// weight = Gewicht, addedWeight = Zusatzlast zum Körpergewicht (gespeichert als weight),
// seconds = Zeit
export const LOG_FIELDS = ["weight", "addedWeight", "seconds"];

// Wahrgenommene Anstrengung ("Power"), in aufsteigender Reihenfolge; "ok" ist der Standard.
export const POWER_LEVELS = ["weak", "ok", "strong"];
export const DEFAULT_POWER = "ok";

// Gültige Werte eines Eintrags
export const LIMITS = {
  weight: { min: 0, max: 999 },
  seconds: { min: 1, max: 3600 },
  noteLength: 200
};

// Ein Training wird fortgesetzt, wenn es in den letzten 6 Stunden bearbeitet wurde
// (z. B. Training über Mitternacht).
const SESSION_RESUME_MS = 6 * 60 * 60 * 1000;

// Migrationsschritte: Schlüssel = Ausgangsversion, Wert = Funktion, die ein Dokument
// dieser Version in die nächste überführt. Vorhandene Daten werden nie verworfen.
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
  },
  // Ab Version 3 steht die vom Nutzer eingestellte Planwoche im Dokument (currentWeek). Ältere
  // Stände haben keine; den Startwert setzt die App beim nächsten Start (ensureCurrentWeek).
  2: (doc) => ({ ...doc, schema: 3, currentWeek: null })
};

export function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function emptyLog() {
  return { app: LOG_APP, schema: LOG_SCHEMA, updatedAt: null, lastExportAt: null, currentWeek: null, sessions: {} };
}

// Grobe Prüfung, ob ein Objekt ein Protokoll-Dokument (beliebiger Version) ist.
export function isLogDocument(doc) {
  return isPlainObject(doc)
    && doc.app === LOG_APP
    && Number.isInteger(doc.schema)
    && doc.schema >= 1
    && isPlainObject(doc.sessions);
}

// Bringt ein Dokument Schritt für Schritt auf die aktuelle Formatversion.
export function migrate(doc) {
  let current = doc;
  while (current.schema < LOG_SCHEMA) {
    const step = MIGRATIONS[current.schema];
    if (!step) throw new Error(`Für Protokoll-Version ${current.schema} gibt es keine Umwandlung.`);
    current = step(current);
  }
  return current;
}

// ---------------------------------------------------------------------------
// Aktuelle Woche (vom Nutzer eingestellt)
// ---------------------------------------------------------------------------

// Gültige Angabe { number, changedAt } – oder null. number: Ganzzahl ≥ 1;
// changedAt: Zeitstempel der letzten Änderung durch den Nutzer oder null (nur Startwert).
export function validCurrentWeek(value) {
  if (!isPlainObject(value)) return null;
  const { number, changedAt } = value;
  if (!Number.isInteger(number) || number < 1) return null;
  if (changedAt !== null && typeof changedAt !== "string") return null;
  return { number, changedAt };
}

// Der Nutzer stellt eine Woche ein.
export function setCurrentWeek(log, number) {
  log.currentWeek = { number, changedAt: new Date().toISOString() };
}

// Setzt den Startwert, wenn noch keine gültige Woche gespeichert ist. Gibt true zurück, wenn
// etwas gesetzt wurde. changedAt bleibt null, damit beim Wiederherstellen jede vom Nutzer
// eingestellte Woche Vorrang hat.
export function ensureCurrentWeek(log, startNumber) {
  if (validCurrentWeek(log.currentWeek)) return false;
  log.currentWeek = { number: startNumber, changedAt: null };
  return true;
}

// ---------------------------------------------------------------------------
// Trainings und Einträge
// ---------------------------------------------------------------------------

// Findet das aktuelle Training der Einheit. context = { date, planStart, week, phase, deload };
// week ist die vom Nutzer eingestellte Woche. Mit create = true wird das Training angelegt, falls
// es noch keines gibt – Woche, Phase und Entlastung bleiben danach so, wie sie beim Anlegen waren.
export function currentSession(log, workoutId, context, create = false) {
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
export function parseNumber(value) {
  if (typeof value === "number") return value;
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim().replace(",", ".");
  if (text === "") return undefined;
  return /^\d+(\.\d+)?$/.test(text) ? Number(text) : NaN;
}

// Prüft einen Zahlenwert ("weight" oder "seconds"). Leer (undefined) ist gültig.
export function isValidValue(field, value) {
  if (value === undefined) return true;
  const { min, max } = LIMITS[field];
  if (field === "seconds" && !Number.isInteger(value)) return false;
  return value >= min && value <= max;
}

// Prüft die Eingaben einer Übung und gibt die bereinigten Werte zurück – oder null, wenn ein
// Wert ungültig ist. Leere Felder sind erlaubt und werden weggelassen.
//   weight:  Zahl 0–999 kg (0 und leer werden weggelassen)
//   seconds: Ganzzahl 1–3600
//   power:   "weak" | "ok" | "strong" (sonst "ok")
//   note:    Text, höchstens 200 Zeichen (leer wird weggelassen)
export function validateEntry(raw) {
  const values = {};
  const weight = parseNumber(raw.weight);
  if (!isValidValue("weight", weight)) return null;
  if (weight > 0) values.weight = weight;
  const seconds = parseNumber(raw.seconds);
  if (!isValidValue("seconds", seconds)) return null;
  if (seconds !== undefined) values.seconds = seconds;
  values.power = POWER_LEVELS.includes(raw.power) ? raw.power : DEFAULT_POWER;
  const note = String(raw.note ?? "").trim().slice(0, LIMITS.noteLength);
  if (note) values.note = note;
  return values;
}

// Schreibt den Eintrag einer Übung im Training: ersetzt Gewicht, Zeit, Power und Kommentar
// vollständig durch die übergebenen Werte. Gibt false zurück, wenn ein Wert ungültig ist.
export function setEntry(log, session, exerciseId, raw, target) {
  const values = validateEntry(raw);
  if (!values) return false;
  log.sessions[session.id] = session;
  session.entries[exerciseId] = { target: target ?? "", ...values };
  session.updatedAt = new Date().toISOString();
  return true;
}

// Löscht den Eintrag einer Übung; ein Training ohne Einträge wird ebenfalls entfernt.
export function removeEntry(log, session, exerciseId) {
  if (!session?.entries[exerciseId]) return false;
  delete session.entries[exerciseId];
  session.updatedAt = new Date().toISOString();
  if (Object.keys(session.entries).length === 0) delete log.sessions[session.id];
  return true;
}

// Stellt einen gelöschten Eintrag wieder her („Rückgängig“). Wurde das Training beim Löschen
// entfernt, weil es leer war, wird es wieder angelegt.
export function restoreEntry(log, session, exerciseId, entry) {
  log.sessions[session.id] = session;
  session.entries[exerciseId] = entry;
  session.updatedAt = new Date().toISOString();
}

// Jüngster Eintrag zu einer Übung – optional ohne ein bestimmtes Training (z. B. das heutige).
// Ergebnis: { session, entry } oder null.
export function lastEntry(log, exerciseId, excludeSessionId = null) {
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

// ---------------------------------------------------------------------------
// Sicherung (Export/Import)
// ---------------------------------------------------------------------------

// Inhalt der Sicherungsdatei.
export function exportLog(log) {
  return {
    filename: `trainingsprotokoll-${localDate()}.json`,
    text: JSON.stringify(log, null, 2)
  };
}

export function markExported(log) {
  log.lastExportAt = new Date().toISOString();
}

// Prüft den Text einer Sicherungsdatei. Ergebnis: { doc } oder { error }.
export function parseImport(text) {
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
      && DATE_PATTERN.test(session.date ?? "")
      && typeof session.workoutId === "string"
      && typeof session.updatedAt === "string"
      && isPlainObject(session.entries);
    if (!valid) return { error: "Die Sicherung enthält ein unvollständiges Training und wurde nicht übernommen." };
  }
  let migrated;
  try {
    migrated = migrate(doc);
  } catch (error) {
    return { error: error.message };
  }
  // Eine unbrauchbare Wochenangabe verhindert die Wiederherstellung der Trainings nicht.
  migrated.currentWeek = validCurrentWeek(migrated.currentWeek);
  return { doc: migrated };
}

// Führt eine Sicherung mit dem Protokoll auf dem Gerät zusammen – immer ganze Trainings:
// fehlt eines auf dem Gerät, wird es übernommen; gibt es dasselbe auf beiden Seiten,
// gewinnt der zuletzt geänderte Stand.
// Die eingestellte Woche wird übernommen, wenn sie in der Sicherung vom Nutzer eingestellt wurde
// (changedAt gesetzt) und auf dem Gerät nur ein Startwert steht oder die Gerätewoche älter ist.
// Ergebnis: { added, updated, unchanged, weekTaken } – weekTaken = übernommene Woche oder null.
export function mergeLog(log, imported) {
  const result = { added: 0, updated: 0, unchanged: 0, weekTaken: null };
  const incoming = validCurrentWeek(imported.currentWeek);
  const local = validCurrentWeek(log.currentWeek);
  if (incoming?.changedAt && (!local?.changedAt || incoming.changedAt > local.changedAt)) {
    log.currentWeek = incoming;
    result.weekTaken = incoming.number;
  }
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
