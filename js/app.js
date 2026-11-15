// Einstieg und Steuerung der App.
// Hält den Zustand, reagiert auf Aktionen der Oberfläche und stößt das Neuzeichnen an.
// Fachlogik steht in calendar.js, plan.js und log.js, der Speicherzugriff in log-storage.js,
// die Darstellung in den ui-*.js-Modulen. Überblick: docs/architektur.md.

import { loadPlan } from "./plan.js";
import { isDeloadWeek, localDate, nextWorkout, phaseForWeek, planWeek } from "./calendar.js";
import {
  currentSession, emptyLog, exportLog, lastEntry, markExported, mergeLog, parseImport,
  removeEntry, setEntry, validateEntry
} from "./log.js";
import { loadLog, saveLog } from "./log-storage.js";
import { describeWeek } from "./format.js";
import { findCard, renderDayNavigation, renderLegend, renderPhaseNavigation, renderWorkout } from "./ui-workout.js";
import { renderExerciseCard, updateCardSummary } from "./ui-exercise.js";
import { panelId, renderLogPanel } from "./ui-log-panel.js";
import { renderPlanDetails, renderSafetyRules } from "./ui-info.js";
import { deliverFile, renderBackup, setupBackup, showBackupResult } from "./ui-backup.js";

const elements = {
  title: document.querySelector("#plan-title"),
  subtitle: document.querySelector("#plan-subtitle"),
  logMessage: document.querySelector("#log-message"),
  error: document.querySelector("#load-error")
};

// Zustand der App. Gespeichert wird nur das Protokoll (state.log, über log-storage.js);
// alles andere ist Anzeigezustand und beginnt bei jedem Laden neu.
const state = {
  plan: null,            // Plan-Modell aus plan.js
  workoutId: null,       // gewählte Einheit
  phaseId: null,         // gewählte Phase (für Vorgabe, Tempo, Ablauf)
  openExerciseId: null,  // Übung mit offenem Protokollbereich – höchstens eine
  log: emptyLog(),       // Trainingsprotokoll
  logWritable: true,     // false, wenn das Protokoll nicht gespeichert werden darf/kann
  logBlockedText: ""     // Meldung, warum nicht gespeichert wird
};

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function start() {
  try {
    state.plan = await loadPlan();
    openLog();

    const { plan } = state;
    const week = planWeek(plan.startDate);
    elements.title.textContent = plan.title;
    elements.subtitle.textContent = describeWeek(plan, week);
    state.phaseId = week === null ? plan.phases[0].id : phaseForWeek(plan.phases, week).id;
    state.workoutId = nextWorkout(plan.workouts).id;

    showDayNavigation();
    showPhaseNavigation();
    showWorkout();
    renderSafetyRules(plan.safetyRules);
    renderPlanDetails(plan);
    setupBackup({ onExport: exportBackup, onImport: importBackup });
    renderBackup(state.log, state.logWritable);
  } catch (error) {
    elements.error.hidden = false;
    elements.error.textContent = `${error.message} Öffne die Seite über einen lokalen Webserver, damit der Browser plan.json laden kann.`;
    elements.subtitle.textContent = "Trainingsplan momentan nicht verfügbar";
  }
}

function openLog() {
  const { log, status } = loadLog();
  state.log = log;
  if (status === "zu-neu") {
    state.logWritable = false;
    state.logBlockedText = "Das Protokoll stammt aus einer neueren App-Version. Bitte die App aktualisieren – bis dahin wird nichts gespeichert.";
  } else if (status === "nicht-verfuegbar") {
    state.logWritable = false;
    state.logBlockedText = "Auf diesem Gerät kann gerade nichts gespeichert werden. Der Plan funktioniert weiter.";
  }
  if (!state.logWritable) showLogMessage(state.logBlockedText);
  if (status === "defekt") showLogMessage("Das gespeicherte Protokoll war unlesbar und wurde beiseitegelegt.");
}

// ---------------------------------------------------------------------------
// Anzeige
// ---------------------------------------------------------------------------

function currentWorkout() {
  return state.plan.workouts.find((workout) => workout.id === state.workoutId);
}

function showDayNavigation() {
  renderDayNavigation(state.plan.workouts, state.workoutId, (workoutId) => {
    state.workoutId = workoutId;
    state.openExerciseId = null;
    showDayNavigation();
    showWorkout();
  });
}

function showPhaseNavigation() {
  renderPhaseNavigation(state.plan.phases, state.phaseId, (phaseId) => {
    state.phaseId = phaseId;
    showPhaseNavigation();
    showWorkout();
  });
}

// Baut die gewählte Einheit mit allen Übungskarten neu auf.
function showWorkout() {
  const workout = currentWorkout();
  const cards = workout.exercises.map((exercise) => renderExerciseCard(exercise, {
    phaseId: state.phaseId,
    isOpen: state.openExerciseId === exercise.id,
    info: exerciseLog(workout, exercise),
    totalWeeks: state.plan.totalWeeks,
    onToggle: () => toggleExercise(exercise),
    renderPanel: () => renderLogPanel(exercise, exerciseLog(workout, exercise), {
      save: (raw) => saveEntry(workout, exercise, raw),
      remove: () => deleteEntry(workout, exercise),
      hasTodayEntry: () => Boolean(todaySession(workout)?.entries[exercise.id])
    })
  }));
  renderWorkout(workout, state.plan.workouts, cards);
}

// Öffnet bzw. schließt den Protokollbereich einer Übung (höchstens einer ist offen).
function toggleExercise(exercise) {
  state.openExerciseId = state.openExerciseId === exercise.id ? null : exercise.id;
  showWorkout();
  focusToggle(exercise);
  const panel = document.getElementById(panelId(exercise.id));
  if (panel) panel.scrollIntoView({ block: "nearest" });
}

function focusToggle(exercise) {
  const toggle = document.querySelector(`[aria-controls="${panelId(exercise.id)}"]`);
  if (toggle) toggle.focus({ preventScroll: true });
}

// Zeigt eine Meldung über der Übungsliste. Leerer Text blendet sie aus.
function showLogMessage(text) {
  elements.logMessage.textContent = text;
  elements.logMessage.hidden = !text;
}

// ---------------------------------------------------------------------------
// Protokoll
// ---------------------------------------------------------------------------

// Angaben zum heutigen Training, die beim Anlegen gespeichert werden.
function sessionContext() {
  const { plan } = state;
  const week = planWeek(plan.startDate);
  return {
    date: localDate(),
    planStart: plan.startDate || null,
    week,
    phase: state.phaseId,
    deload: week !== null && isDeloadWeek(plan.phases, week)
  };
}

function todaySession(workout, create = false) {
  return currentSession(state.log, workout.id, sessionContext(), create);
}

// Protokollstand einer Übung für die Anzeige:
//   today    – Eintrag im aktuellen Training (oder null)
//   latest   – jüngster Eintrag { session, entry }: heute, sonst letztes Training (oder null)
//   previous – jüngster Eintrag vor dem aktuellen Training (für „Letztes Mal“)
function exerciseLog(workout, exercise) {
  const session = todaySession(workout);
  const today = session?.entries[exercise.id] ?? null;
  return {
    today,
    latest: today ? { session, entry: today } : lastEntry(state.log, exercise.id),
    previous: lastEntry(state.log, exercise.id, session?.id)
  };
}

function ensureWritable() {
  if (state.logWritable) return true;
  showLogMessage(state.logBlockedText);
  return false;
}

// Speichert das Protokoll. Schlägt das fehl, wird der gespeicherte Stand wieder geladen,
// damit Anzeige und Speicher nicht auseinanderlaufen.
function commitLog() {
  if (saveLog(state.log)) {
    showLogMessage("");
    renderBackup(state.log, state.logWritable);
    return true;
  }
  state.log = loadLog().log;
  showLogMessage("Die Eingabe konnte nicht gespeichert werden. Bitte Speicherplatz prüfen und erneut versuchen.");
  return false;
}

// Speichert den sichtbaren Stand des Protokollbereichs als heutigen Eintrag der Übung.
// Ergebnis: "saved" | "invalid" | "blocked" | "failed"
function saveEntry(workout, exercise, raw) {
  if (!ensureWritable()) return "blocked";
  if (!validateEntry(raw)) {
    showLogMessage("Bitte eine gültige Zahl eingeben.");
    return "invalid";
  }
  const target = exercise.phaseProgression[state.phaseId];
  setEntry(state.log, todaySession(workout, true), exercise.id, raw, target);
  if (!commitLog()) return "failed";
  const card = findCard(exercise.id);
  if (card) updateCardSummary(card, exercise, exerciseLog(workout, exercise), state.plan.totalWeeks);
  return "saved";
}

function deleteEntry(workout, exercise) {
  if (!ensureWritable()) return;
  if (!window.confirm("Heutigen Eintrag zu dieser Übung löschen?")) return;
  if (removeEntry(state.log, todaySession(workout), exercise.id) && commitLog()) {
    showWorkout();
    focusToggle(exercise);
  }
}

// ---------------------------------------------------------------------------
// Sichern und Wiederherstellen
// ---------------------------------------------------------------------------

async function exportBackup() {
  const { filename, text } = exportLog(state.log);
  if (await deliverFile(filename, text) === "aborted") {
    showBackupResult("Sicherung abgebrochen.");
    return;
  }
  markExported(state.log);
  if (state.logWritable) saveLog(state.log);
  renderBackup(state.log, state.logWritable);
  showBackupResult(`Sicherung „${filename}“ erstellt.`);
}

// Datei prüfen und mit dem Protokoll auf dem Gerät zusammenführen.
async function importBackup(file) {
  let text;
  try {
    text = await file.text();
  } catch (error) {
    showBackupResult("Die Datei konnte nicht gelesen werden.");
    return;
  }
  const parsed = parseImport(text);
  if (parsed.error) {
    showBackupResult(`${parsed.error} Das Protokoll auf diesem Gerät ist unverändert.`);
    return;
  }
  if (!ensureWritable()) return;
  const result = mergeLog(state.log, parsed.doc);
  if (!commitLog()) {
    showBackupResult("Die Sicherung konnte nicht gespeichert werden.");
    return;
  }
  showWorkout();
  showBackupResult(`Wiederhergestellt: ${result.added} neu, ${result.updated} aktualisiert, ${result.unchanged} unverändert.`);
}

// ---------------------------------------------------------------------------

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch((error) => {
    console.error("Service Worker konnte nicht registriert werden.", error);
  });
}

renderLegend();
start();
