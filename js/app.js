// Einstieg und Steuerung der App.
// Hält den Zustand, reagiert auf Aktionen der Oberfläche und stößt das Neuzeichnen an.
// Fachlogik steht in calendar.js, plan.js und log.js, der Speicherzugriff in log-storage.js,
// die Darstellung in den ui-*.js-Modulen. Überblick: docs/architektur.md.

import { loadPlan } from "./plan.js";
import { clampWeek, initialWeek, isDeloadWeek, localDate, nextWorkout, phaseForWeek } from "./calendar.js";
import {
  currentSession, emptyLog, ensureCurrentWeek, exportLog, lastEntry, markExported, mergeLog,
  parseImport, removeEntry, restoreEntry, setCurrentWeek, setEntry, validCurrentWeek, validateEntry
} from "./log.js";
import { loadLog, loadViewState, saveLog, saveViewState } from "./log-storage.js";
import { describeWeek, phaseLabel, weekButtonLabels } from "./format.js";
import {
  findCard, focusWeekButton, hideUndo, renderDayNavigation, renderLegend, renderPhaseNavigation,
  renderProgress, renderWeekControl, renderWorkout, setupWarmup, showUndo
} from "./ui-workout.js";
import { flashSaved, renderExerciseCard, updateCardSummary } from "./ui-exercise.js";
import { panelId, renderLogPanel } from "./ui-log-panel.js";
import { renderPlanDetails, renderSafetyRules } from "./ui-info.js";
import { deliverFile, renderBackup, setupBackup, showBackupResult } from "./ui-backup.js";
import { aiPackageFilename, buildAiPackage, loadGuide } from "./ai-package.js";
import { copyText, setupAiCopy, showAiResult } from "./ui-ai.js";

// So lange wird nach dem Löschen „Rückgängig“ angeboten (Millisekunden)
const UNDO_MS = 6000;
// Verzögerung, bevor die Scrollposition gespeichert wird (Millisekunden)
const SCROLL_SAVE_DELAY_MS = 300;

const elements = {
  title: document.querySelector("#plan-title"),
  subtitle: document.querySelector("#plan-subtitle"),
  logMessage: document.querySelector("#log-message"),
  error: document.querySelector("#load-error")
};

// Zustand der App. Dauerhaft gespeichert wird das Protokoll (state.log); der Anzeigezustand
// (Einheit, Phase, offene Übung, Aufwärmen, Scrollposition) wird nur für denselben Tag gemerkt.
const state = {
  plan: null,            // Plan-Modell aus plan.js
  workoutId: null,       // gewählte Einheit
  phaseId: null,         // gewählte Phase (für Vorgabe, Tempo, Ablauf)
  openExerciseId: null,  // Übung mit offenem Protokollbereich – höchstens eine
  warmupOpen: true,      // Aufwärmblock aufgeklappt?
  log: emptyLog(),       // Trainingsprotokoll
  guide: null,           // Text von plan-anleitung.md für „Für KI kopieren“ (null = noch nicht geladen)
  logWritable: true,     // false, wenn das Protokoll nicht gespeichert werden darf/kann
  logBlockedText: "",    // Meldung, warum nicht gespeichert wird
  undoTimer: null        // läuft, solange „Rückgängig“ angeboten wird
};

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function start() {
  try {
    state.plan = await loadPlan();
    const logStatus = openLog();

    const { plan } = state;
    // Erster Start nach dem Umstieg (oder leerer Speicher): Startwert aus dem Startdatum.
    // Ein unlesbarer Stand wird dabei nicht überschrieben – das passiert erst bei einer Eingabe.
    const weekAdded = ensureCurrentWeek(state.log, initialWeek(plan.startDate, plan.totalWeeks));
    if (weekAdded && state.logWritable && logStatus !== "defekt") {
      saveLog(state.log); // klappt das nicht, gilt der Startwert nur bis zum nächsten Start
    }
    elements.title.textContent = plan.title;
    showWeek();
    state.phaseId = phaseForWeek(plan.phases, currentWeek()).id;
    state.workoutId = nextWorkout(plan.workouts).id;
    const restored = restoreView();

    showDayNavigation();
    showPhaseNavigation();
    setupWarmup((open) => {
      state.warmupOpen = open;
      saveView();
    });
    showWorkout();
    renderSafetyRules(plan.safetyRules);
    renderPlanDetails(plan);
    setupBackup({ onExport: exportBackup, onImport: importBackup });
    renderBackup(state.log, state.logWritable);
    setupAiCopy({ onCopy: copyForAi });
    // Vorab laden, damit „Für KI kopieren“ ohne Warten in die Zwischenablage schreiben kann
    loadGuide().then((text) => { state.guide = text; }).catch(() => {});
    if (restored) requestAnimationFrame(() => window.scrollTo(0, restored.scrollY));
    setupViewSaving();
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
  return status;
}

// ---------------------------------------------------------------------------
// Anzeigezustand für denselben Tag (z. B. nachdem iOS die App beendet hat)
// ---------------------------------------------------------------------------

// Übernimmt den gemerkten Zustand, wenn er von heute ist und die IDs im Plan noch existieren.
// Gibt ihn zurück (für die Scrollposition) oder null.
function restoreView() {
  const view = loadViewState();
  if (!view || view.date !== localDate()) return null;
  const { plan } = state;
  const workout = plan.workouts.find((item) => item.id === view.workoutId);
  if (workout) {
    state.workoutId = workout.id;
    if (workout.exercises.some((exercise) => exercise.id === view.openExerciseId)) {
      state.openExerciseId = view.openExerciseId;
    }
  }
  if (plan.phases.some((phase) => phase.id === view.phaseId)) state.phaseId = view.phaseId;
  if (typeof view.warmupOpen === "boolean") state.warmupOpen = view.warmupOpen;
  history.scrollRestoration = "manual";
  return { scrollY: Number.isFinite(view.scrollY) ? view.scrollY : 0 };
}

function saveView() {
  if (!state.plan) return;
  saveViewState({
    date: localDate(),
    workoutId: state.workoutId,
    phaseId: state.phaseId,
    openExerciseId: state.openExerciseId,
    warmupOpen: state.warmupOpen,
    scrollY: Math.round(window.scrollY)
  });
}

function setupViewSaving() {
  let timer = null;
  window.addEventListener("scroll", () => {
    clearTimeout(timer);
    timer = setTimeout(saveView, SCROLL_SAVE_DELAY_MS);
  }, { passive: true });
  window.addEventListener("pagehide", saveView);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveView();
  });
}

// ---------------------------------------------------------------------------
// Bildschirm wachhalten, solange die App sichtbar ist (wo das Gerät es erlaubt)
// ---------------------------------------------------------------------------

let wakeLock = null;
let wakeLockPending = false;

async function keepScreenOn() {
  if (!navigator.wakeLock || document.visibilityState !== "visible") return;
  if (wakeLockPending || (wakeLock && !wakeLock.released)) return;
  wakeLockPending = true;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
  } catch (error) {
    // Nicht erlaubt (z. B. ohne Nutzeraktion oder im Stromsparmodus) – stillschweigend weiter.
  } finally {
    wakeLockPending = false;
  }
}

// ---------------------------------------------------------------------------
// Anzeige
// ---------------------------------------------------------------------------

// Vom Nutzer eingestellte Woche, begrenzt auf den Plan (der Plan kann kürzer geworden sein).
function currentWeek() {
  return clampWeek(validCurrentWeek(state.log.currentWeek)?.number ?? 1, state.plan.totalWeeks);
}

function currentWorkout() {
  return state.plan.workouts.find((workout) => workout.id === state.workoutId);
}

// Kopf mit Woche, Phase und den Knöpfen „−“/„+“.
function showWeek() {
  const { plan } = state;
  const week = currentWeek();
  const labels = weekButtonLabels(week, plan.totalWeeks);
  renderWeekControl({
    ...describeWeek(plan, week),
    canBack: week > 1,
    canForward: week < plan.totalWeeks,
    backLabel: labels.back,
    forwardLabel: labels.forward
  }, changeWeek);
}

// „−“/„+“: Woche um eins zurück bzw. weiter. Die Phase der neuen Woche wird gewählt; offene Übung
// und Aufwärmen bleiben wie beim Phasenwechsel. Kann nicht gespeichert werden, bleibt alles beim Alten.
function changeWeek(delta) {
  if (!ensureWritable()) return;
  const { plan } = state;
  const next = clampWeek(currentWeek() + delta, plan.totalWeeks);
  if (next === currentWeek()) return;
  setCurrentWeek(state.log, next);
  if (!commitLog()) {
    showWeek();
    return;
  }
  cancelUndo();
  state.phaseId = phaseForWeek(plan.phases, next).id;
  showWeek();
  showPhaseNavigation();
  showWorkout();
  focusWeekButton(delta);
  saveView();
}

function showDayNavigation() {
  renderDayNavigation(state.plan.workouts, state.workoutId, (workoutId) => {
    cancelUndo();
    state.workoutId = workoutId;
    state.openExerciseId = null;
    state.warmupOpen = true;
    showDayNavigation();
    showWorkout();
    saveView();
  });
}

function showPhaseNavigation() {
  renderPhaseNavigation(state.plan.phases, state.phaseId, (phaseId) => {
    cancelUndo();
    state.phaseId = phaseId;
    showPhaseNavigation();
    showWorkout();
    saveView();
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
      hasTodayEntry: () => Boolean(todaySession(workout)?.entries[exercise.id]),
      next: () => openNextExercise(workout, exercise)
    })
  }));
  renderWorkout(workout, state.plan.workouts, cards, state.warmupOpen);
  showProgress(workout);
}

// Zähler „erfasst / gesamt“ und Markierung der ersten noch offenen Übung.
function showProgress(workout) {
  const entries = todaySession(workout)?.entries ?? {};
  const done = workout.exercises.filter((exercise) => entries[exercise.id]);
  const next = workout.exercises.find((exercise) => !entries[exercise.id]);
  renderProgress(done.length, workout.exercises.length, next?.id ?? null);
}

// Öffnet bzw. schließt den Protokollbereich einer Übung (höchstens einer ist offen).
function toggleExercise(exercise) {
  state.openExerciseId = state.openExerciseId === exercise.id ? null : exercise.id;
  showWorkout();
  focusToggle(exercise);
  const panel = document.getElementById(panelId(exercise.id));
  if (panel) panel.scrollIntoView({ block: "nearest" });
  saveView();
}

// „Weiter →“: schließt den Bereich und öffnet die nächste noch nicht erfasste Übung – erst nach
// der aktuellen, dann von vorn. Gibt es keine mehr, wird nur geschlossen.
function openNextExercise(workout, exercise) {
  const entries = todaySession(workout)?.entries ?? {};
  const list = workout.exercises;
  const index = list.indexOf(exercise);
  const next = [...list.slice(index + 1), ...list.slice(0, index)]
    .find((candidate) => !entries[candidate.id]);
  state.openExerciseId = next?.id ?? null;
  showWorkout();
  const target = next ?? exercise;
  const card = findCard(target.id);
  if (card) card.scrollIntoView({ block: next ? "start" : "nearest" });
  focusToggle(target);
  saveView();
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
  const week = currentWeek();
  return {
    date: localDate(),
    planStart: plan.startDate || null,
    week,
    phase: state.phaseId,
    deload: isDeloadWeek(plan.phases, week)
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
  cancelUndo();
  const card = findCard(exercise.id);
  if (card) {
    updateCardSummary(card, exercise, exerciseLog(workout, exercise), state.plan.totalWeeks);
    flashSaved(card);
  }
  showProgress(workout);
  return "saved";
}

// Löscht den heutigen Eintrag ohne Rückfrage und bietet einige Sekunden „Rückgängig“ an.
function deleteEntry(workout, exercise) {
  if (!ensureWritable()) return;
  const session = todaySession(workout);
  const entry = session?.entries[exercise.id];
  if (!entry || !removeEntry(state.log, session, exercise.id) || !commitLog()) return;
  showWorkout();
  focusToggle(exercise);
  offerUndo(() => {
    if (!ensureWritable()) return;
    restoreEntry(state.log, session, exercise.id, entry);
    if (!commitLog()) return;
    if (state.workoutId !== workout.id) return;
    showWorkout();
    const card = findCard(exercise.id);
    if (card) flashSaved(card);
  });
}

function offerUndo(onUndo) {
  cancelUndo();
  state.undoTimer = setTimeout(cancelUndo, UNDO_MS);
  showUndo("Eintrag gelöscht", () => {
    cancelUndo();
    onUndo();
  });
}

// „Rückgängig“ verfällt: nach Ablauf, beim nächsten Speichern, beim Wechsel von Einheit/Phase.
function cancelUndo() {
  clearTimeout(state.undoTimer);
  state.undoTimer = null;
  hideUndo();
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
  cancelUndo();
  const result = mergeLog(state.log, parsed.doc);
  if (!commitLog()) {
    showBackupResult("Die Sicherung konnte nicht gespeichert werden.");
    return;
  }
  let weekText = "";
  if (result.weekTaken !== null) {
    // Die Woche aus der Sicherung gilt jetzt – samt ihrer Phase.
    state.phaseId = phaseForWeek(state.plan.phases, currentWeek()).id;
    showWeek();
    showPhaseNavigation();
    weekText = ` Woche ${currentWeek()} übernommen.`;
  }
  showWorkout();
  saveView();
  showBackupResult(`Wiederhergestellt: ${result.added} neu, ${result.updated} aktualisiert, ${result.unchanged} unverändert.${weekText}`);
}

// ---------------------------------------------------------------------------
// Für KI kopieren
// ---------------------------------------------------------------------------

// Baut das KI-Paket und legt es in die Zwischenablage; geht das nicht, wird es als Datei
// weitergegeben. Die Daten verlassen das Gerät nur durch diese ausdrückliche Aktion.
async function copyForAi(instructions) {
  if (state.guide === null) {
    try {
      state.guide = await loadGuide();
    } catch (error) {
      showAiResult(`${error.message} Bitte mit Netz erneut versuchen.`);
      return;
    }
  }
  const { plan } = state;
  const week = currentWeek();
  const phase = phaseForWeek(plan.phases, week);
  const date = localDate();
  const text = buildAiPackage({
    guide: state.guide,
    planSource: plan.source,
    log: state.log,
    instructions,
    context: {
      date,
      week,
      totalWeeks: plan.totalWeeks,
      phaseName: `${phaseLabel(phase)} ${phase.name}`,
      deload: isDeloadWeek(plan.phases, week)
    }
  });
  if (await copyText(text)) {
    showAiResult("Kopiert. Jetzt in einen KI-Chat einfügen und absenden.");
    return;
  }
  const filename = aiPackageFilename(date);
  if (await deliverFile(filename, text, "text/markdown") === "aborted") {
    showAiResult("Abgebrochen.");
    return;
  }
  showAiResult(`Die Zwischenablage ist nicht verfügbar – stattdessen „${filename}“ erstellt. Die Datei in einen KI-Chat hochladen.`);
}

// ---------------------------------------------------------------------------

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch((error) => {
    console.error("Service Worker konnte nicht registriert werden.", error);
  });
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") keepScreenOn();
});
// Manche Browser erlauben das Wachhalten erst nach einer Nutzeraktion.
document.addEventListener("pointerdown", keepScreenOn, { passive: true });

renderLegend();
keepScreenOn();
start();
