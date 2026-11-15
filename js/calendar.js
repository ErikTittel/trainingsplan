// Kalender: Datum, Wochentage, Planwoche, Phase und Trainingstag.
// Rein rechnerisch – kein DOM, kein Speicher. Die Planstruktur (Phasen, Wochen,
// Entlastungswochen, Trainingstage) kommt aus plan.json, nicht aus diesem Code.

const DAY_MS = 24 * 60 * 60 * 1000;

// Wochentage, wie sie in plan.json (workouts[].day) stehen. number = Date.getDay().
export const WEEKDAYS = {
  Mo: { number: 1, name: "Montag" },
  Di: { number: 2, name: "Dienstag" },
  Mi: { number: 3, name: "Mittwoch" },
  Do: { number: 4, name: "Donnerstag" },
  Fr: { number: 5, name: "Freitag" },
  Sa: { number: 6, name: "Samstag" },
  So: { number: 0, name: "Sonntag" }
};

// Kalendertag im Format JJJJ-MM-TT
export const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// Datum in Ortszeit als JJJJ-MM-TT.
export function localDate(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// Macht aus "2026-10-12" ein Datum (Ortszeit, Mitternacht). Ungültig → null.
export function parseDate(text) {
  const match = DATE_PATTERN.exec(text || "");
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

// Planwoche aus dem Startdatum (JJJJ-MM-TT). Woche 1 beginnt am Starttag.
// Ergebnis: Zahl (kann < 1 oder größer als der Plan sein) oder null ohne gültiges Startdatum.
export function planWeek(startDate, today = new Date()) {
  const start = parseDate(startDate);
  if (!start) return null;
  const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((todayDay - startDay) / DAY_MS);
  return Math.floor(days / 7) + 1;
}

// Phase zu einer Woche; Wochen vor bzw. nach dem Plan zählen zur ersten bzw. letzten Phase.
export function phaseForWeek(phases, week) {
  const lastWeek = phases[phases.length - 1].lastWeek;
  const clamped = Math.min(Math.max(week, 1), lastWeek);
  return phases.find((phase) => clamped >= phase.firstWeek && clamped <= phase.lastWeek);
}

export function isDeloadWeek(phases, week) {
  return phases.some((phase) => phase.deloadWeek === week);
}

// Einheit, die heute auf dem Plan steht – oder null an Tagen ohne Krafttraining.
export function workoutOnDay(workouts, today = new Date()) {
  return workouts.find((workout) => WEEKDAYS[workout.day].number === today.getDay()) ?? null;
}

// Einheit von heute oder, an Tagen ohne Krafttraining, vom nächsten Trainingstag.
export function nextWorkout(workouts, today = new Date()) {
  const daysUntil = (workout) => (WEEKDAYS[workout.day].number - today.getDay() + 7) % 7;
  return workouts.reduce((best, workout) => (daysUntil(workout) < daysUntil(best) ? workout : best));
}
