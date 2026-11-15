// Anzeigeformate: macht aus Plan- und Protokollwerten kurze Texte für die Oberfläche.
// Rein rechnerisch – kein DOM. Alle Kürzel, die hier entstehen, erklärt die Legende in index.html.

import { DEFAULT_POWER, POWER_LEVELS } from "./log.js";
import { parseDate, isDeloadWeek, phaseForWeek } from "./calendar.js";

// Darstellung der Power-Stufen (Reihenfolge und Standard: POWER_LEVELS/DEFAULT_POWER in log.js)
export const POWER_DISPLAY = {
  weak: { symbol: "🥵", label: "schwach" },
  ok: { symbol: "🙂", label: "ok" },
  strong: { symbol: "💪", label: "stark" }
};

// Bewegungsphasen der Tempo-Schreibweise "3-1-1-0"
const TEMPO_STEPS = ["Absenken", "Pause unten", "Anheben", "Pause oben"];
// Tempo wie "3-1-1" oder "2-1-X" (X = explosiv), 3 oder 4 Stellen
const TEMPO_PATTERN = /^[\dX]+(?:-[\dX]+){2,3}$/i;

export function powerDisplay(power) {
  return POWER_DISPLAY[power] ?? POWER_DISPLAY[DEFAULT_POWER];
}

// Legendentext: "🥵 schwach · 🙂 ok · 💪 stark"
export function powerLegend() {
  return POWER_LEVELS.map((level) => `${POWER_DISPLAY[level].symbol} ${POWER_DISPLAY[level].label}`).join(" · ");
}

// Zahl in deutscher Schreibweise: 82.5 → "82,5"
export function formatNumber(value) {
  return String(value).replace(".", ",");
}

// "2026-10-12" → "12. Oktober 2026"
export function formatDateLong(text) {
  const date = parseDate(text);
  return date ? date.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }) : text;
}

export function phaseLabel(phase) {
  return `Phase ${phase.number}`;
}

// Wochenbereich einer Phase, z. B. "W1–4"
export function phaseWeeks(phase) {
  return `W${phase.firstWeek}–${phase.lastWeek}`;
}

// Untertitel im Kopf: aktuelle Woche und Phase oder Hinweis vor bzw. nach dem Plan.
export function describeWeek(plan, week) {
  if (week === null) return `${plan.totalWeeks} Wochen · ${plan.created}`;
  if (week < 1) return `Start am ${formatDateLong(plan.startDate)}`;
  if (week > plan.totalWeeks) return `Plan abgeschlossen · ${plan.totalWeeks} von ${plan.totalWeeks} Wochen`;
  const deload = isDeloadWeek(plan.phases, week) ? " · Entlastungswoche" : "";
  return `Woche ${week} von ${plan.totalWeeks} · ${phaseLabel(phaseForWeek(plan.phases, week))}${deload}`;
}

// "Einheit 1 – Zug und Hüfte" → "Zug und Hüfte" (für die Tagesknöpfe)
export function shortWorkoutTitle(title) {
  return title.replace(/^Einheit \d+\s*[–-]\s*/, "");
}

// Kürzt wiederkehrende Begriffe nur für die Anzeige (plan.json bleibt unverändert).
export function abbreviate(text) {
  return text.replace(/\/Seite/g, "/S.");
}

// Macht aus "3-1-1" die Kurzform "↓3 · 1 · ↑1" und eine Langform für Screenreader.
// Wörter wie "explosiv" bleiben unverändert.
export function formatTempo(tempo) {
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

// Kurzform eines Protokolleintrags, z. B. "80 kg 🙂", "+5 kg 💪", "40 s · 10 kg 🙂".
// logSpec = log-Angabe der Übung aus plan.json. Ergebnis: { text, spoken } (spoken für Screenreader).
export function formatEntry(entry, logSpec) {
  const parts = [];
  if (entry.seconds !== undefined) parts.push(`${entry.seconds} s`);
  if (entry.weight !== undefined) {
    const prefix = logSpec.fields.includes("addedWeight") ? "+" : "";
    parts.push(`${prefix}${formatNumber(entry.weight)} kg`);
  }
  const values = parts.join(" · ");
  const power = powerDisplay(entry.power);
  return {
    text: values ? `${values} ${power.symbol}` : power.symbol,
    spoken: [values.replace(" · ", ", ").replace("kg", "Kilogramm").replace(/(\d) s\b/, "$1 Sekunden"), `Power ${power.label}`]
      .filter(Boolean).join(", ")
  };
}

// Beschriftung eines Trainings: "W5 · 09.11." (+ "Entl." in einer Entlastungswoche).
// Die Woche entfällt, wenn das Training außerhalb des Plans lag.
export function trainingDetail(session, totalWeeks) {
  const [, month, day] = session.date.split("-");
  const parts = [];
  if (Number.isInteger(session.week) && session.week >= 1 && session.week <= totalWeeks) {
    parts.push(`W${session.week}`);
  }
  parts.push(`${day}.${month}.`);
  if (session.deload) parts.push("Entl.");
  return parts.join(" · ");
}
