// Oberfläche: Auswahl von Trainingstag und Phase sowie Kopf und Liste der Einheit.

import { makeElement, makeButton } from "./dom.js";
import { WEEKDAYS, workoutOnDay } from "./calendar.js";
import { phaseLabel, phaseWeeks, powerLegend, shortWorkoutTitle } from "./format.js";

const elements = {
  dayNavigation: document.querySelector("#day-navigation"),
  phaseNavigation: document.querySelector("#phase-navigation"),
  today: document.querySelector("#today-label"),
  workoutTitle: document.querySelector("#workout-title"),
  warmup: document.querySelector("#workout-warmup"),
  exerciseCount: document.querySelector("#exercise-count"),
  exerciseList: document.querySelector("#exercise-list"),
  powerLegend: document.querySelector("#power-legend")
};

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

// Kopf der Einheit und Übungskarten (cards: fertig gebaute Kartenelemente).
export function renderWorkout(workout, workouts, cards, today = new Date()) {
  elements.workoutTitle.textContent = workout.title;
  elements.warmup.textContent = workout.warmup;
  elements.exerciseCount.textContent = String(workout.exercises.length);
  elements.exerciseList.replaceChildren(...cards);

  const todayWorkout = workoutOnDay(workouts, today);
  elements.today.textContent = todayWorkout === workout
    ? "Heute"
    : `${WEEKDAYS[workout.day].name}${todayWorkout ? "" : " · nächste Einheit"}`;
}

// Die Power-Symbole in der Legende kommen aus derselben Quelle wie die Anzeige auf den Karten.
export function renderLegend() {
  elements.powerLegend.textContent = powerLegend();
}

// Karte einer Übung in der aktuell angezeigten Liste (oder null)
export function findCard(exerciseId) {
  return elements.exerciseList.querySelector(`[data-exercise-id="${exerciseId}"]`);
}
