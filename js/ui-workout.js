// Oberfläche: Wochensteuerung im Kopf, Auswahl von Trainingstag und Phase, Kopf der Einheit mit
// Aufwärmen, Übungsliste mit Fortschritt, Power-Legende und Rückgängig-Leiste.

import { makeElement, makeButton } from "./dom.js";
import { WEEKDAYS, workoutOnDay } from "./calendar.js";
import { phaseLabel, phaseWeeks, powerLegend, shortWorkoutTitle } from "./format.js";

const elements = {
  weekBack: document.querySelector("#week-back"),
  weekText: document.querySelector("#plan-subtitle"),
  weekPhase: document.querySelector("#week-phase"),
  weekForward: document.querySelector("#week-forward"),
  dayNavigation: document.querySelector("#day-navigation"),
  phaseNavigation: document.querySelector("#phase-navigation"),
  today: document.querySelector("#today-label"),
  workoutTitle: document.querySelector("#workout-title"),
  warmup: document.querySelector("#workout-warmup"),
  warmupHeading: document.querySelector("#warmup-heading"),
  warmupSteps: document.querySelector("#warmup-steps"),
  exerciseCount: document.querySelector("#exercise-count"),
  exerciseList: document.querySelector("#exercise-list"),
  powerLegend: document.querySelector("#power-legend"),
  undoBar: document.querySelector("#undo-bar"),
  undoText: document.querySelector("#undo-text"),
  undoButton: document.querySelector("#undo-button")
};

// Rückruf für „−“/„+“; die Knöpfe stehen fest in index.html, die Ereignisse werden nur einmal gebunden.
let onWeekChange = null;

// Kopf: Woche groß, daneben „−“ (Woche zurück) und „+“ (nächste Woche), darunter die Phase.
// view = { week, phase, canBack, canForward, backLabel, forwardLabel }; onChange(-1 | +1).
export function renderWeekControl(view, onChange) {
  if (!onWeekChange) {
    elements.weekBack.addEventListener("click", () => onWeekChange(-1));
    elements.weekForward.addEventListener("click", () => onWeekChange(1));
  }
  onWeekChange = onChange;
  elements.weekText.textContent = view.week;
  elements.weekPhase.textContent = view.phase;
  elements.weekPhase.hidden = false;
  setWeekButton(elements.weekBack, view.canBack, view.backLabel);
  setWeekButton(elements.weekForward, view.canForward, view.forwardLabel);
}

function setWeekButton(button, enabled, label) {
  button.disabled = !enabled;
  button.setAttribute("aria-label", label);
  button.hidden = false;
}

// Gibt den Fokus an einen bedienbaren Wochenknopf (nach dem Wechsel, falls einer deaktiviert wurde).
export function focusWeekButton(direction) {
  const preferred = direction < 0 ? elements.weekBack : elements.weekForward;
  const other = direction < 0 ? elements.weekForward : elements.weekBack;
  (preferred.disabled ? other : preferred).focus({ preventScroll: true });
}

// Ein Knopf je Einheit (nur Krafttrainingstage – andere Tage stehen nicht in workouts).
export function renderDayNavigation(workouts, selectedWorkoutId, onSelect) {
  elements.dayNavigation.replaceChildren(...workouts.map((workout) => {
    const button = makeButton("day-button");
    button.setAttribute("aria-current", String(workout.id === selectedWorkoutId));
    button.setAttribute("aria-label", `${WEEKDAYS[workout.day].name}: ${workout.title}`);
    button.append(
      makeElement("span", "", workout.day),
      makeElement("strong", "", shortWorkoutTitle(workout.title))
    );
    button.addEventListener("click", () => onSelect(workout.id));
    return button;
  }));
  elements.dayNavigation.hidden = false;
}

// Phasenleiste: eine Zeile „Phase 1  W1–4“ je Phase.
export function renderPhaseNavigation(phases, selectedPhaseId, onSelect) {
  elements.phaseNavigation.replaceChildren(...phases.map((phase) => {
    const button = makeButton("phase-button");
    button.setAttribute("aria-pressed", String(phase.id === selectedPhaseId));
    button.setAttribute("aria-label", `${phaseLabel(phase)}, ${phaseWeeks(phase)}`);
    button.append(
      makeElement("strong", "", phaseLabel(phase)),
      makeElement("small", "", phaseWeeks(phase))
    );
    button.addEventListener("click", () => onSelect(phase.id));
    return button;
  }));
  elements.phaseNavigation.hidden = false;
}

// Meldet Auf- und Zuklappen des Aufwärmblocks (onToggle(offen?)).
export function setupWarmup(onToggle) {
  elements.warmup.addEventListener("toggle", () => onToggle(elements.warmup.open));
}

// Kopf der Einheit, Aufwärmen und Übungskarten (cards: fertig gebaute Kartenelemente).
// warmupOpen: Aufwärmblock geöffnet?
export function renderWorkout(workout, workouts, cards, warmupOpen, today = new Date()) {
  elements.workoutTitle.textContent = workout.title;
  renderWarmup(workout.warmup, warmupOpen);
  elements.exerciseList.replaceChildren(...cards);

  const todayWorkout = workoutOnDay(workouts, today);
  elements.today.textContent = todayWorkout === workout
    ? "Heute"
    : `${WEEKDAYS[workout.day].name}${todayWorkout ? "" : " · nächste Einheit"}`;
}

// Aufwärmen als nummerierte Liste; Gruppen ({ title, items }) mit Unterpunkten.
function renderWarmup(warmup, open) {
  elements.warmupHeading.textContent = `Aufwärmen · ${warmup.duration}`;
  elements.warmupSteps.replaceChildren(...warmup.steps.map((step) => {
    if (typeof step === "string") return makeElement("li", "", step);
    const item = makeElement("li");
    const list = makeElement("ul");
    for (const text of step.items) list.append(makeElement("li", "", text));
    item.append(makeElement("strong", "", step.title), list);
    return item;
  }));
  elements.warmup.open = open;
  elements.warmup.hidden = false;
}

// Fortschritt der Einheit: Zähler „erfasst / gesamt“ und Markierung der nächsten offenen Übung.
export function renderProgress(doneCount, total, nextExerciseId) {
  elements.exerciseCount.textContent = `${doneCount} / ${total}`;
  elements.exerciseCount.setAttribute("aria-label", `${doneCount} von ${total} Übungen heute erfasst`);
  for (const card of elements.exerciseList.querySelectorAll(".exercise-card")) {
    card.classList.toggle("is-next", card.dataset.exerciseId === nextExerciseId);
  }
}

// Die Power-Symbole in der Legende kommen aus derselben Quelle wie die Anzeige auf den Karten.
export function renderLegend() {
  elements.powerLegend.textContent = powerLegend();
}

// Karte einer Übung in der aktuell angezeigten Liste (oder null)
export function findCard(exerciseId) {
  return elements.exerciseList.querySelector(`[data-exercise-id="${exerciseId}"]`);
}

// Rückgängig-Leiste: Text und Knopf; onUndo wird beim Antippen aufgerufen.
export function showUndo(text, onUndo) {
  elements.undoText.textContent = text;
  elements.undoButton.onclick = onUndo;
  elements.undoBar.hidden = false;
}

export function hideUndo() {
  elements.undoBar.hidden = true;
  elements.undoButton.onclick = null;
}
