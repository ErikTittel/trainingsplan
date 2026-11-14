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
  { id: "phase1", label: "Phase 1", weeks: "W1–4", firstWeek: 1 },
  { id: "phase2", label: "Phase 2", weeks: "W5–8", firstWeek: 5 },
  { id: "phase3", label: "Phase 3", weeks: "W9–12", firstWeek: 9 }
];
const TOTAL_WEEKS = 12;
const DELOAD_WEEKS = [4, 8, 12];
// Tempo wie "3-1-1" oder "2-1-X" (X = explosiv), 3 oder 4 Stellen
const TEMPO_PATTERN = /^[\dX]+(?:-[\dX]+){2,3}$/i;

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

// Berechnet die aktuelle Planwoche aus plan.startDate (Format JJJJ-MM-TT).
// Ergebnis: Zahl (kann < 1 oder > 12 sein) oder null, wenn kein Startdatum gesetzt ist.
function getCurrentWeek(startDate, today = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDate || "");
  if (!match) return null;
  const start = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((now - start) / 86400000);
  return Math.floor(days / 7) + 1;
}

function phaseForWeek(week) {
  const clamped = Math.min(Math.max(week, 1), TOTAL_WEEKS);
  return [...PHASES].reverse().find((phase) => clamped >= phase.firstWeek);
}

function describeWeek(week) {
  if (week === null) return `12 Wochen · ${plan.created}`;
  if (week < 1) return `Start am ${plan.created}`;
  if (week > TOTAL_WEEKS) return "Plan abgeschlossen · 12 von 12 Wochen";
  const phase = phaseForWeek(week);
  const deload = DELOAD_WEEKS.includes(week) ? " · Entlastungswoche" : "";
  return `Woche ${week} von ${TOTAL_WEEKS} · ${phase.label}${deload}`;
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

// Trennt eine Pausenangabe wie ", Pause 90 s" vom Übungsnamen ab.
// "Kniebeuge, Pause 2–2,5 Min" → { title: "Kniebeuge", rest: "2–2,5 min" }
function splitRest(name) {
  const match = /,\s*Pause\s+(.+)$/i.exec(name);
  if (!match) return { title: name, rest: "" };
  return {
    title: name.slice(0, match.index).trim(),
    rest: match[1].trim().replace(/Min/g, "min")
  };
}

// Kürzt wiederkehrende Begriffe nur für die Anzeige (plan.json bleibt unverändert).
function abbreviate(text) {
  return text.replace(/\/Seite/g, "/S.");
}

// Macht aus "3-1-1" die Kurzform "↓3 · 1 · ↑1" und eine Langform für Screenreader.
// Wörter wie "explosiv" bleiben unverändert.
function formatTempo(tempo) {
  if (!tempo) return { short: "", long: "" };
  if (!TEMPO_PATTERN.test(tempo)) return { short: tempo, long: tempo };
  const values = tempo.toUpperCase().split("-");
  let short = `↓${values[0]} · ${values[1]} · ↑${values[2]}`;
  if (values.length > 3) short += ` · ${values[3]}`;
  const steps = values.map((value, index) => {
    const stepName = TEMPO_STEPS[index];
    return value === "X" ? `${stepName} explosiv` : `${stepName} ${value} s`;
  });
  return { short, long: `Tempo: ${steps.join(", ")}` };
}

// Fester Aufbau: Name → Kennzahlenzeile (Vorgabe, Tempo, RPE, Pause) → Zweck, Ablauf, Hinweis.
// Leere Angaben werden weggelassen.
function renderExercise(exercise) {
  const { title, rest } = splitRest(exercise.name);
  const tempo = formatTempo(exercise.tempo[selectedPhase]);
  const card = makeElement("article", "exercise-card");
  const number = makeElement("span", "exercise-number", exercise.number);
  number.setAttribute("aria-hidden", "true");
  const body = makeElement("div", "exercise-body");
  body.append(makeElement("strong", "exercise-title", title));

  const metrics = makeElement("div", "metric-row");
  metrics.append(
    makeElement("span", "metric metric-main", abbreviate(exercise.phaseProgression[selectedPhase]))
  );
  if (tempo.short) {
    const tempoMetric = makeElement("span", "metric", tempo.short);
    tempoMetric.setAttribute("aria-label", tempo.long);
    metrics.append(tempoMetric);
  }
  if (exercise.rpe) metrics.append(makeElement("span", "metric", `RPE ${exercise.rpe}`));
  if (rest) metrics.append(makeElement("span", "metric", `P ${rest}`));
  body.append(metrics);

  if (exercise.why) body.append(makeElement("p", "exercise-purpose", exercise.why));

  const instructions = exercise.instructions?.[selectedPhase];
  if (instructions?.length) {
    const list = makeElement("ul", "instruction-list");
    for (const item of instructions) list.append(makeElement("li", "", item));
    body.append(list);
  }
  if (exercise.instructionsNote) {
    body.append(makeElement("p", "instruction-note", exercise.instructionsNote));
  }

  card.append(number, body);
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
    const currentWeek = getCurrentWeek(plan.startDate);
    elements.subtitle.textContent = describeWeek(currentWeek);
    if (currentWeek !== null) selectedPhase = phaseForWeek(currentWeek).id;
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
