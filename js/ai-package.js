// KI-Paket: fasst Anleitung, Trainingsplan, Leistungsdaten und zusätzliche Anweisungen zu einem
// Text zusammen, den der Nutzer in einen KI-Chat einfügt („Für KI kopieren“).
// Fachlogik ohne DOM. Inhalt und Aufbau: docs/datenformate.md, Teil C.

// Anleitung für Menschen und KI-Agenten (einzige Quelle der Bearbeitungsregeln)
export const GUIDE_URL = "plan-anleitung.md";

// Lädt die Anleitung als Text. Wirft eine verständliche Meldung, wenn das nicht klappt.
export async function loadGuide(url = GUIDE_URL) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} konnte nicht geladen werden (HTTP ${response.status}).`);
  return response.text();
}

// Baut den Text des KI-Pakets (Markdown).
// - guide: Text der Anleitung (plan-anleitung.md)
// - planSource: unveränderter Inhalt von plan.json
// - log: Protokoll-Dokument
// - instructions: zusätzliche Anweisungen des Nutzers (darf leer sein)
// - context: { date: "JJJJ-MM-TT", week: Zahl, totalWeeks: Zahl, phaseName: Text, deload: Wahr/Falsch }
export function buildAiPackage({ guide, planSource, log, instructions, context }) {
  const sessions = Object.values(log.sessions)
    .sort((a, b) => a.date.localeCompare(b.date) || a.workoutId.localeCompare(b.workoutId));
  const performance = { currentWeek: log.currentWeek, sessions };
  const deloadText = context.deload ? ", Entlastungswoche" : "";
  const extra = instructions.trim() || "keine";
  const count = `${sessions.length} ${sessions.length === 1 ? "Training" : "Trainings"}`;
  return [
    "# Trainingsplan optimieren",
    "",
    `Stand: ${context.date} · aktuelle Woche ${context.week} von ${context.totalWeeks} (${context.phaseName}${deloadText}) · ${count} im Protokoll.`,
    "",
    "## Zusätzliche Anweisungen des Trainierenden",
    "",
    extra,
    "",
    // Überschriften der Anleitung eine Ebene tiefer, damit die Gliederung stimmt
    guide.trim().replace(/^(#+) /gm, "#$1 "),
    "",
    "## Aktueller Trainingsplan (plan.json)",
    "",
    "```json",
    JSON.stringify(planSource, null, 2),
    "```",
    "",
    "## Leistungsdaten (Trainingsprotokoll)",
    "",
    "Einträge je Training, Schlüssel = Übungs-id. Übungen, die nicht mehr im Plan stehen, findest du unter `retiredExercises` in plan.json.",
    "",
    "```json",
    JSON.stringify(performance, null, 2),
    "```",
    ""
  ].join("\n");
}

export function aiPackageFilename(date) {
  return `ki-paket-${date}.md`;
}
