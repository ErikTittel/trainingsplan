// Oberfläche: Übungskarte.
// Fester Aufbau: Name → Kennzahlenzeile (Vorgabe, Tempo, RPE, Pause) → Zweck, Ablauf, Hinweis.
// Leere Angaben werden weggelassen. Das Nummernfeld ist zugleich der Schalter für den
// Protokollbereich darunter; die ganze Kachel öffnet bzw. schließt ihn.
// Gibt es zur Übung schon einen Eintrag, stehen Gewicht/Zeit und Power hinter dem Namen und der
// Kommentar hinter dem Zweck (immer der jüngste Eintrag, heute oder vom letzten Training).

import { makeElement, makeButton } from "./dom.js";
import { abbreviate, formatEntry, formatTempo, trainingDetail } from "./format.js";
import { panelId, updateLogPanel } from "./ui-log-panel.js";

// options:
//   phaseId    – gewählte Phase
//   isOpen     – Protokollbereich offen?
//   info       – Protokollstand der Übung { today, latest, previous } (siehe app.js)
//   totalWeeks – Länge des Plans
//   onToggle   – Kachel angetippt
//   renderPanel – baut den Protokollbereich (nur bei isOpen)
export function renderExerciseCard(exercise, options) {
  const tempo = formatTempo(exercise.tempo[options.phaseId]);
  const card = makeElement("article", "exercise-card");
  card.dataset.exerciseId = exercise.id;
  const number = makeButton("exercise-number log-toggle");
  number.append(exercise.number, makeElement("span", "log-state"));
  number.setAttribute("aria-expanded", String(options.isOpen));
  number.setAttribute("aria-controls", panelId(exercise.id));
  // Antippen im offenen Bereich (Felder, Power, Kommentar), auf den Hinweis (klappt nur ihn auf)
  // und markierter Text lösen nichts aus.
  card.addEventListener("click", (event) => {
    if (event.target.closest(".log-panel, .instruction-note")) return;
    if (window.getSelection && window.getSelection().toString()) return;
    options.onToggle();
  });

  const body = makeElement("div", "exercise-body");
  const titleElement = makeElement("strong", "exercise-title", exercise.name);
  titleElement.append(makeElement("span", "exercise-log"));
  body.append(titleElement);

  const metrics = makeElement("div", "metric-row");
  metrics.append(
    makeElement("span", "metric metric-main", abbreviate(exercise.phaseProgression[options.phaseId]))
  );
  if (tempo.short) {
    const tempoMetric = makeElement("span", "metric", tempo.short);
    tempoMetric.setAttribute("aria-label", tempo.long);
    metrics.append(tempoMetric);
  }
  if (exercise.rpe) metrics.append(makeElement("span", "metric", `RPE ${exercise.rpe}`));
  if (exercise.rest) metrics.append(makeElement("span", "metric", `P ${exercise.rest}`));
  body.append(metrics);

  const purpose = makeElement("p", "exercise-purpose", exercise.why || "");
  purpose.append(makeElement("span", "exercise-note"));
  body.append(purpose);

  const instructions = exercise.instructions[options.phaseId];
  if (instructions.length) {
    const list = makeElement("ul", "instruction-list");
    for (const item of instructions) list.append(makeElement("li", "", item));
    body.append(list);
  }
  // Langer Hinweis: eingeklappt nur die erste Zeile, Antippen zeigt den ganzen Text
  // (Verfassung III, Ausnahme für Hinweistexte).
  if (exercise.instructionsNote) {
    const note = makeElement("details", "instruction-note");
    const summary = makeElement("summary");
    const text = makeElement("span", "instruction-note-text");
    text.append(makeElement("span", "instruction-note-label", "Hinweis"), exercise.instructionsNote);
    summary.append(text);
    note.append(summary);
    body.append(note);
  }

  card.append(number, body);
  if (options.isOpen) card.append(options.renderPanel());
  updateCardSummary(card, exercise, options.info, options.totalWeeks);
  return card;
}

// Aktualisiert die Protokollangaben einer Karte (hinter Name und Zweck, Kennzeichen am
// Nummernfeld, Zustand im offenen Bereich), ohne die Karte neu aufzubauen – so bleiben Fokus und
// Eingaben im Protokollbereich erhalten.
export function updateCardSummary(card, exercise, info, totalWeeks) {
  const { today, latest } = info;

  const summary = card.querySelector(".exercise-log");
  const note = card.querySelector(".exercise-note");
  if (latest) {
    const formatted = formatEntry(latest.entry, exercise.log);
    summary.textContent = ` ${formatted.text}`;
    const when = today ? "heute" : `zuletzt ${trainingDetail(latest.session, totalWeeks)}`;
    summary.setAttribute("aria-label", `Protokoll ${when}: ${formatted.spoken}`);
  } else {
    summary.textContent = "";
    summary.removeAttribute("aria-label");
  }
  summary.hidden = !latest;
  const noteText = latest?.entry.note ?? "";
  note.textContent = noteText ? ` „${noteText}“` : "";
  note.hidden = !noteText;
  const purpose = card.querySelector(".exercise-purpose");
  purpose.hidden = !exercise.why && !noteText;

  const state = card.querySelector(".log-state");
  state.textContent = today ? "✓" : "+";
  state.classList.toggle("log-state-done", Boolean(today));
  card.classList.toggle("is-done", Boolean(today));
  card.querySelector(".log-toggle").setAttribute(
    "aria-label",
    `Protokoll ${exercise.name}, ${today ? "heute erfasst" : "heute noch nicht erfasst"}`
  );

  const panel = card.querySelector(".log-panel");
  if (panel) updateLogPanel(panel, exercise, info, totalWeeks);
}

// Kurze sichtbare Bestätigung nach dem Speichern (✓ leuchtet auf); die Animation startet bei
// jedem Aufruf neu.
export function flashSaved(card) {
  card.classList.remove("just-saved");
  void card.offsetWidth; // erzwingt neues Layout, damit die Animation erneut startet
  card.classList.add("just-saved");
}
