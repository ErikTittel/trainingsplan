"use strict";

const DAY_NAMES = {
  Mo: "Montag",
  Do: "Donnerstag",
  Sa: "Samstag"
};

const DAY_ORDER = ["Mo", "Do", "Sa"];
const DAY_NUMBERS = { Mo: 1, Do: 4, Sa: 6 };
const TEMPO_STEPS = ["Absenken", "Pause unten", "Anheben", "Pause oben"];
const PHASES = [
  { id: "phase1", label: "Phase 1", weeks: "W1–4" },
  { id: "phase2", label: "Phase 2", weeks: "W5–8" },
  { id: "phase3", label: "Phase 3", weeks: "W9–12" }
];

const elements = {
  title: document.querySelector("#plan-title"),
  subtitle: document.querySelector("#plan-subtitle"),
  navigation: document.querySelector("#day-navigation"),
  phaseNavigation: document.querySelector("#phase-navigation"),
  today: document.querySelector("#today-label"),
  workoutTitle: document.querySelector("#workout-title"),
  warmup: document.querySelector("#workout-warmup"),
  exerciseCount: document.querySelector("#exercise-count"),
  exerciseList: document.querySelector("#exercise-list"),
  safetyRules: document.querySelector("#safety-rules"),
  planDetails: document.querySelector("#plan-details"),
  error: document.querySelector("#load-error")
};

let plan;
let selectedDay;
let selectedPhase = PHASES[0].id;

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function getDefaultDay(today = new Date()) {
  const weekday = today.getDay();
  return DAY_ORDER.find((day) => DAY_NUMBERS[day] >= weekday) || "Mo";
}

function renderNavigation() {
  elements.navigation.replaceChildren();
  for (const day of DAY_ORDER) {
    const button = makeElement("button", "day-button");
    button.type = "button";
    button.setAttribute("aria-current", String(day === selectedDay));
    button.setAttribute("aria-label", `${DAY_NAMES[day]}: ${workoutForDay(day).title}`);
    button.append(
      makeElement("span", "", day),
      makeElement("strong", "", workoutForDay(day).title.replace(/^Einheit \d+\s*[–-]\s*/, ""))
    );
    button.addEventListener("click", () => {
      selectedDay = day;
      renderNavigation();
      renderWorkout();
    });
    elements.navigation.append(button);
  }
  elements.navigation.hidden = false;
}

function workoutForDay(day) {
  return plan.workouts.find((workout) => workout.day === day);
}

function renderPhaseNavigation() {
  elements.phaseNavigation.replaceChildren();
  for (const phase of PHASES) {
    const button = makeElement("button", "phase-button");
    button.type = "button";
    button.setAttribute("aria-pressed", String(phase.id === selectedPhase));
    button.setAttribute("aria-label", `${phase.label}, ${phase.weeks}`);
    button.append(
      makeElement("strong", "", phase.label),
      makeElement("small", "", phase.weeks)
    );
    button.addEventListener("click", () => {
      selectedPhase = phase.id;
      renderPhaseNavigation();
      renderWorkout();
    });
    elements.phaseNavigation.append(button);
  }
  elements.phaseNavigation.hidden = false;
}

function addChip(container, label, value) {
  if (!value) return;
  const chip = makeElement("div", "detail-chip");
  chip.append(makeElement("span", "", label), makeElement("strong", "", value));
  container.append(chip);
}

function addRhythm(container, tempo) {
  if (!tempo || !/^\d+(?:-\d+){2,3}$/.test(tempo)) return;
  const values = tempo.split("-");
  const rhythm = makeElement("div", "rhythm");
  rhythm.setAttribute("aria-label", `Tempo: ${values.join(", ")}`);
  values.forEach((value, index) => {
    const step = makeElement("div", "rhythm-step");
    step.append(
      makeElement("strong", "", value),
      makeElement("small", "", TEMPO_STEPS[index] || "Tempo")
    );
    rhythm.append(step);
    if (index < values.length - 1) rhythm.append(makeElement("span", "rhythm-arrow", "›"));
  });
  container.append(rhythm);
}

function renderExercise(exercise) {
  const progression = exercise.phaseProgression[selectedPhase];
  const tempo = exercise.tempo[selectedPhase];
  const card = makeElement("details", "exercise-card");
  const summary = makeElement("summary");
  const number = makeElement("span", "exercise-number", exercise.number);
  number.setAttribute("aria-hidden", "true");
  const heading = makeElement("span", "exercise-heading");
  heading.append(makeElement("strong", "", exercise.name));
  heading.append(makeElement("small", "", progression));
  const quickDetails = [tempo && `Tempo ${tempo}`, exercise.rpe && `RPE ${exercise.rpe}`]
    .filter(Boolean)
    .join(" · ");
  if (quickDetails) heading.append(makeElement("small", "exercise-quick-details", quickDetails));
  const chevron = makeElement("span", "chevron");
  chevron.setAttribute("aria-hidden", "true");
  summary.append(number, heading, chevron);

  const details = makeElement("div", "exercise-details");
  const grid = makeElement("div", "detail-grid");
  addChip(grid, "Satz-/Wdh.-Progression", progression);
  addChip(grid, "Tempo", tempo || "Nicht angegeben");
  addChip(grid, "RPE", exercise.rpe || "Nicht angegeben");
  details.append(grid);

  if (tempo && /^\d+(?:-\d+){2,3}$/.test(tempo)) {
    details.append(makeElement("h3", "", "Bewegungsrhythmus"));
    addRhythm(details, tempo);
  }
  if (exercise.why) {
    details.append(makeElement("h3", "", "Trainingsziel"));
    details.append(makeElement("p", "", exercise.why));
  }

  card.append(summary, details);
  return card;
}

function renderWorkout() {
  const workout = workoutForDay(selectedDay);
  if (!workout) throw new Error(`Für ${selectedDay} wurde keine Einheit gefunden.`);

  elements.workoutTitle.textContent = workout.title;
  elements.warmup.textContent = workout.warmup;
  elements.exerciseCount.textContent = String(workout.exercises.length);
  elements.exerciseList.replaceChildren(...workout.exercises.map(renderExercise));

  const today = new Date();
  const todayDay = DAY_ORDER.find((day) => DAY_NUMBERS[day] === today.getDay());
  elements.today.textContent = todayDay === selectedDay
    ? "Heute"
    : `${DAY_NAMES[selectedDay]}${todayDay ? "" : " · nächste Einheit"}`;
}

function renderSafetyRules() {
  elements.safetyRules.replaceChildren();
  for (const rule of plan.safetyRules) {
    const section = makeElement("section", "rule");
    section.append(makeElement("h3", "", rule.title));
    if (rule.text) section.append(makeElement("p", "", rule.text));
    if (rule.subItems.length) {
      const list = makeElement("ul");
      for (const item of rule.subItems) list.append(makeElement("li", "", item));
      section.append(list);
    }
    elements.safetyRules.append(section);
  }
}

function renderPlanDetails() {
  elements.planDetails.replaceChildren();
  const phases = plan.periodization.phases;
  for (const phase of phases) {
    const section = makeElement("section", "rule");
    section.append(
      makeElement("h3", "", `${phase.phase} · ${phase.weeks}`),
      makeElement("p", "", `${phase.volume} Sätze · ${phase.intensityAndTempo}. Knietiefe: ${phase.kneeDepth}.`),
      makeElement("p", "", phase.jumpAndSpeed)
    );
    elements.planDetails.append(section);
  }

  const notes = [
    plan.periodization.deloadNote,
    plan.workoutGeneralNotes.breaks,
    plan.workoutGeneralNotes.tempoNotation,
    ...plan.phaseProgressionRules
  ];
  const list = makeElement("ul");
  for (const note of notes) list.append(makeElement("li", "", note));
  elements.planDetails.append(list);
}

async function loadPlan() {
  try {
    const response = await fetch("plan.json");
    if (!response.ok) throw new Error(`plan.json konnte nicht geladen werden (HTTP ${response.status}).`);
    plan = await response.json();

    if (!Array.isArray(plan.workouts) || !plan.workouts.length) {
      throw new Error("plan.json enthält keine Trainingseinheiten.");
    }
    for (const day of DAY_ORDER) {
      if (!workoutForDay(day)) throw new Error(`Die Trainingseinheit für ${day} fehlt in plan.json.`);
    }
    for (const workout of plan.workouts) {
      for (const exercise of workout.exercises) {
        for (const phase of PHASES) {
          if (typeof exercise.phaseProgression?.[phase.id] !== "string") {
            throw new Error(`Die Progression für ${exercise.name} in ${phase.label} fehlt in plan.json.`);
          }
          if (typeof exercise.tempo?.[phase.id] !== "string") {
            throw new Error(`Das Tempo für ${exercise.name} in ${phase.label} fehlt in plan.json.`);
          }
        }
      }
    }

    elements.title.textContent = plan.title;
    elements.subtitle.textContent = `12 Wochen · ${plan.created}`;
    selectedDay = getDefaultDay();
    renderNavigation();
    renderPhaseNavigation();
    renderWorkout();
    renderSafetyRules();
    renderPlanDetails();
  } catch (error) {
    elements.error.hidden = false;
    elements.error.textContent = `${error.message} Öffne die Seite über einen lokalen Webserver, damit der Browser plan.json laden kann.`;
    elements.subtitle.textContent = "Trainingsplan momentan nicht verfügbar";
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch((error) => {
    console.error("Service Worker konnte nicht registriert werden.", error);
  });
}

loadPlan();
