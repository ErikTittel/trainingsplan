// Plan: lädt plan.json, prüft das Format und bereitet es einheitlich auf.
// Ergebnis ist das Plan-Modell, mit dem der Rest der App arbeitet. Format: docs/datenformate.md, Teil A.
// Fehler werfen eine verständliche Meldung (Error.message), die die App anzeigt.

import { WEEKDAYS } from "./calendar.js";
import { LOG_FIELDS, isPlainObject } from "./log.js";

// Erlaubte Zeichen für Kennungen (Einheiten, Übungen, Phasen)
const ID_PATTERN = /^[a-z0-9-]+$/;

export async function loadPlan(url = "plan.json") {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`plan.json konnte nicht geladen werden (HTTP ${response.status}).`);
  return preparePlan(await response.json());
}

// Prüft den Inhalt von plan.json und gibt das Plan-Modell zurück:
// - phases: Phasen mit number (1, 2, …), firstWeek, lastWeek, deloadWeek und den Texten
// - totalWeeks: Länge des Plans in Wochen
// - workouts: nach Wochentag sortiert; jede Übung mit number ("1", "2", … in der Reihenfolge der
//   Einheit) und phasenabhängigen Werten als Objekt { <phasen-id>: Wert } (auch wenn plan.json
//   den Wert nur einmal angibt)
// - retiredExercises: entfernte Übungen (Liste, ggf. leer)
// - source: der unveränderte Inhalt von plan.json (für „Für KI kopieren“)
// Alle übrigen Inhalte (Titel, Sicherheitsregeln, Hinweise …) bleiben unverändert.
export function preparePlan(raw) {
  if (!isPlainObject(raw)) throw new Error("plan.json ist kein gültiger Plan.");
  checkOverviewTexts(raw);
  const phases = preparePhases(raw.periodization?.phases);
  const retiredExercises = prepareRetiredExercises(raw.retiredExercises);
  const workouts = prepareWorkouts(raw.workouts, phases, retiredExercises);
  return {
    ...raw,
    phases,
    totalWeeks: phases[phases.length - 1].lastWeek,
    workouts,
    retiredExercises,
    source: raw
  };
}

const isText = (value) => typeof value === "string";
const isTextList = (value) => Array.isArray(value) && value.every(isText);
const isObjectList = (value, keys) => Array.isArray(value)
  && value.every((item) => isPlainObject(item) && keys.every((key) => isText(item[key])));

// Übergreifende Planteile, die in „Plan & Progression“ angezeigt werden. Alle sind freiwillig;
// stehen sie in plan.json, müssen sie die erwartete Form haben.
const OVERVIEW_TEXTS = {
  basicIdea: isText,
  assumptions: isTextList,
  weeklySchedule: (value) => isObjectList(value, ["day", "content"]),
  weeklyScheduleNotes: isTextList,
  jumpAndSpeedProgression: (value) => isPlainObject(value) && (value.note === undefined || isText(value.note)),
  badDayTrafficLightRules: (value) => isObjectList(value, ["level", "condition", "action"]),
  missedTrainingAndSittingNotes: isTextList,
  metrics: (value) => isObjectList(value, ["metric", "start", "week6", "week12", "ifStalled"]),
  finalNote: isText
};

function checkOverviewTexts(raw) {
  for (const [key, isValid] of Object.entries(OVERVIEW_TEXTS)) {
    if (raw[key] !== undefined && !isValid(raw[key])) {
      throw new Error(`Die Angabe „${key}“ in plan.json hat nicht die erwartete Form (siehe docs/datenformate.md, Teil A).`);
    }
  }
}

// Entfernte Übungen: [{ id, name, retired? }]. Ihre IDs sind gesperrt, damit sie nie für eine
// andere Übung wiederverwendet werden (das Protokoll hängt an der ID).
function prepareRetiredExercises(list) {
  if (list === undefined) return [];
  if (!Array.isArray(list)) throw new Error("Die entfernten Übungen (retiredExercises) in plan.json müssen eine Liste sein.");
  const ids = new Set();
  for (const exercise of list) {
    if (!isPlainObject(exercise) || !ID_PATTERN.test(exercise.id ?? "") || !isText(exercise.name) || !exercise.name) {
      throw new Error("Ein Eintrag in retiredExercises (plan.json) braucht eine gültige id und einen name.");
    }
    if (exercise.retired !== undefined && !isText(exercise.retired)) {
      throw new Error(`Das Datum (retired) der entfernten Übung „${exercise.id}“ muss ein Text sein.`);
    }
    if (ids.has(exercise.id)) throw new Error(`Die Kennung „${exercise.id}“ steht in retiredExercises doppelt.`);
    ids.add(exercise.id);
  }
  return list;
}

function preparePhases(list) {
  if (!Array.isArray(list) || !list.length) {
    throw new Error("plan.json enthält keine Phasen (periodization.phases).");
  }
  let expectedFirstWeek = 1;
  return list.map((phase, index) => {
    const number = index + 1;
    if (!ID_PATTERN.test(phase.id ?? "")) {
      throw new Error(`Die Kennung (id) von Phase ${number} fehlt in plan.json oder ist ungültig.`);
    }
    const weeksValid = Number.isInteger(phase.firstWeek)
      && Number.isInteger(phase.lastWeek)
      && phase.firstWeek === expectedFirstWeek
      && phase.lastWeek >= phase.firstWeek;
    if (!weeksValid) {
      throw new Error(`Die Wochen von Phase ${number} in plan.json sind ungültig: Die Phasen müssen lückenlos bei Woche 1 beginnen.`);
    }
    const deloadValid = phase.deloadWeek === undefined
      || (Number.isInteger(phase.deloadWeek) && phase.deloadWeek >= phase.firstWeek && phase.deloadWeek <= phase.lastWeek);
    if (!deloadValid) {
      throw new Error(`Die Entlastungswoche (deloadWeek) von Phase ${number} liegt in plan.json nicht innerhalb der Phase.`);
    }
    expectedFirstWeek = phase.lastWeek + 1;
    return { ...phase, number };
  });
}

function prepareWorkouts(list, phases, retiredExercises) {
  if (!Array.isArray(list) || !list.length) {
    throw new Error("plan.json enthält keine Trainingseinheiten.");
  }
  const workoutIds = new Set();
  const days = new Set();
  const exerciseIds = new Set();
  const retiredIds = new Set(retiredExercises.map((exercise) => exercise.id));
  const workouts = list.map((workout) => {
    if (!ID_PATTERN.test(workout.id ?? "")) {
      throw new Error(`Die Kennung (id) für ${workout.title} fehlt in plan.json oder ist ungültig.`);
    }
    if (workoutIds.has(workout.id)) throw new Error(`Die Kennung „${workout.id}“ ist in plan.json doppelt vergeben.`);
    workoutIds.add(workout.id);
    if (!WEEKDAYS[workout.day]) {
      throw new Error(`Der Trainingstag (day) für ${workout.title} fehlt in plan.json oder ist ungültig (Mo, Di, Mi, Do, Fr, Sa, So).`);
    }
    if (days.has(workout.day)) throw new Error(`Für ${workout.day} ist in plan.json mehr als eine Einheit eingetragen.`);
    days.add(workout.day);
    if (!isValidWarmup(workout.warmup)) {
      throw new Error(`Das Aufwärmen (warmup) für ${workout.title} ist ungültig: erwartet { duration, steps } mit mindestens einem Schritt.`);
    }
    if (!Array.isArray(workout.exercises)) {
      throw new Error(`Die Übungen (exercises) für ${workout.title} fehlen in plan.json.`);
    }
    const exercises = workout.exercises.map((exercise, index) => ({
      ...prepareExercise(exercise, phases, exerciseIds, retiredIds),
      // Die Nummer ergibt sich aus der Reihenfolge – Verschieben braucht kein Umnummerieren.
      number: String(index + 1)
    }));
    return { ...workout, exercises };
  });
  // Montag zuerst, Sonntag zuletzt
  const order = (workout) => (WEEKDAYS[workout.day].number + 6) % 7;
  return workouts.sort((a, b) => order(a) - order(b));
}

// Aufwärmen: { duration: Text, steps: [Schritt, …] } mit mindestens einem Schritt.
// Schritt = Text oder Gruppe { title: Text, items: [Text, …] } mit mindestens einem Punkt.
function isValidWarmup(warmup) {
  const isText = (value) => typeof value === "string" && value !== "";
  const isStep = (step) => isText(step)
    || (isPlainObject(step) && isText(step.title)
      && Array.isArray(step.items) && step.items.length > 0 && step.items.every(isText));
  return isPlainObject(warmup)
    && isText(warmup.duration)
    && Array.isArray(warmup.steps) && warmup.steps.length > 0
    && warmup.steps.every(isStep);
}

function prepareExercise(exercise, phases, exerciseIds, retiredIds) {
  if (!ID_PATTERN.test(exercise.id ?? "")) {
    throw new Error(`Die Kennung (id) für ${exercise.name} fehlt in plan.json oder ist ungültig.`);
  }
  if (exerciseIds.has(exercise.id)) throw new Error(`Die Kennung „${exercise.id}“ ist in plan.json doppelt vergeben.`);
  if (retiredIds.has(exercise.id)) {
    throw new Error(`Die Kennung „${exercise.id}“ gehört zu einer entfernten Übung (retiredExercises) und darf nicht wiederverwendet werden.`);
  }
  exerciseIds.add(exercise.id);
  if (typeof exercise.name !== "string" || !exercise.name) {
    throw new Error(`Der Name der Übung „${exercise.id}“ fehlt in plan.json.`);
  }

  const fields = exercise.log?.fields;
  const validFields = Array.isArray(fields)
    && fields.every((field) => LOG_FIELDS.includes(field))
    && new Set(fields).size === fields.length
    && !(fields.includes("weight") && fields.includes("addedWeight"));
  if (!validFields) {
    throw new Error(`Die Erfassungsfelder (log.fields) für ${exercise.name} fehlen in plan.json oder sind ungültig.`);
  }
  if (exercise.log.step !== undefined && !(typeof exercise.log.step === "number" && exercise.log.step > 0)) {
    throw new Error(`Die Schrittweite (log.step) für ${exercise.name} in plan.json muss eine Zahl größer 0 sein.`);
  }
  for (const key of ["rest", "rpe", "why", "instructionsNote"]) {
    if (exercise[key] !== undefined && typeof exercise[key] !== "string") {
      throw new Error(`Die Angabe „${key}“ für ${exercise.name} in plan.json muss ein Text sein.`);
    }
  }

  return {
    ...exercise,
    phaseProgression: byPhase(exercise.phaseProgression, phases, isText,
      (phase) => `Die Progression für ${exercise.name} in Phase ${phase.number} fehlt in plan.json.`),
    tempo: byPhase(exercise.tempo ?? "", phases, isText,
      (phase) => `Das Tempo für ${exercise.name} in Phase ${phase.number} fehlt in plan.json.`),
    instructions: byPhase(exercise.instructions ?? [], phases, (value) => value === undefined || isTextList(value),
      (phase) => `Die Ablaufschritte (instructions) für ${exercise.name} in Phase ${phase.number} sind ungültig.`)
  };
}

// Phasenabhängiger Wert: entweder ein Wert für alle Phasen oder ein Objekt mit einem Wert je
// Phasen-id. Ergebnis ist immer ein Objekt { <phasen-id>: Wert }; fehlende Ablaufschritte
// einer Phase werden zur leeren Liste.
function byPhase(value, phases, isValid, message) {
  const result = {};
  for (const phase of phases) {
    const phaseValue = isPlainObject(value) ? value[phase.id] : value;
    if (!isValid(phaseValue)) throw new Error(message(phase));
    result[phase.id] = phaseValue ?? [];
  }
  return result;
}
