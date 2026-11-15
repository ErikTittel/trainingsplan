// Oberfläche: aufklappbarer Protokollbereich einer Übungskarte.
// Aufbau: „Letztes Mal“ (sobald es ein früheres Training gibt) → Wertfelder untereinander →
// Power als drei Direkt-Knöpfe → Kommentar → Status und „Eintrag löschen“ → „Weiter →“.
// Die Felder sind mit dem heutigen bzw. dem letzten Eintrag vorbelegt. Jede Änderung speichert
// sofort den ganzen sichtbaren Stand; ein Antippen einer Power-Stufe speichert also auch
// unveränderte Werte. Öffnen allein speichert nichts.

import { makeElement, makeButton } from "./dom.js";
import { DEFAULT_POWER, LIMITS, POWER_LEVELS, isValidValue, parseNumber } from "./log.js";
import { POWER_DISPLAY, formatEntry, formatNumber, trainingDetail } from "./format.js";

// Standard-Schrittweite der Gewichtsknöpfe in kg (plan.json: log.step)
const DEFAULT_WEIGHT_STEP = 2.5;
// Zeitknöpfe: Schrittweite und Startwert beim ersten "+" in einem leeren Feld (Sekunden)
const SECONDS_STEP = 5;
const SECONDS_START = 30;

// ID des Protokollbereichs einer Übung (für aria-controls)
export function panelId(exerciseId) {
  return `log-${exerciseId}`;
}

// info:    Protokollstand der Übung { today, latest, previous } (siehe app.js)
// actions: save(raw)       → "saved" | "invalid" | "blocked" | "failed"
//          remove()        – heutigen Eintrag löschen (ohne Rückfrage, mit Rückgängig)
//          hasTodayEntry() – gibt es jetzt (nicht beim Öffnen) einen heutigen Eintrag?
//          next()          – Bereich schließen und nächste offene Übung öffnen
export function renderLogPanel(exercise, info, actions) {
  const spec = exercise.log;
  const panel = makeElement("div", "log-panel");
  panel.id = panelId(exercise.id);
  const { today } = info;
  const source = today ?? info.latest?.entry ?? {};

  const lastLine = makeElement("p", "log-last");
  lastLine.hidden = true;
  panel.append(lastLine);

  const inputs = {};
  // Power, mit der Wertänderungen gespeichert werden: heutige Stufe, sonst der Standard
  let power = today?.power ?? DEFAULT_POWER;
  const note = makeElement("input", "log-note-input");

  const save = () => {
    for (const input of Object.values(inputs)) input.removeAttribute("aria-invalid");
    const result = actions.save({
      weight: inputs.weight?.value,
      seconds: inputs.seconds?.value,
      power,
      note: note.value
    });
    if (result === "invalid") {
      for (const [field, input] of Object.entries(inputs)) {
        if (!isValidValue(field, parseNumber(input.value))) input.setAttribute("aria-invalid", "true");
      }
    }
    return result;
  };

  const numbers = makeElement("div", "log-numbers");
  if (spec.fields.includes("seconds")) {
    const stepper = makeStepper({
      label: "Zeit (s)", name: "Zeit in Sekunden", value: source.seconds,
      step: SECONDS_STEP, min: SECONDS_STEP, max: LIMITS.seconds.max, start: SECONDS_START, onCommit: save
    });
    inputs.seconds = stepper.input;
    numbers.append(stepper.element);
  }
  for (const field of ["weight", "addedWeight"]) {
    if (!spec.fields.includes(field)) continue;
    const step = spec.step ?? DEFAULT_WEIGHT_STEP;
    const added = field === "addedWeight";
    const stepper = makeStepper({
      label: added ? "Zusatzlast (kg)" : "Gewicht (kg)",
      name: added ? "Zusatzlast in Kilogramm" : "Gewicht in Kilogramm",
      value: source.weight, step, min: step, max: LIMITS.weight.max, start: step, inputmode: "decimal", onCommit: save
    });
    // Zusatzlast wird wie Gewicht gespeichert (data model: weight)
    inputs.weight = stepper.input;
    numbers.append(stepper.element);
  }
  if (numbers.children.length) panel.append(numbers);

  // Ein Antippen wählt die Stufe und speichert. Die bereits gespeicherte Stufe erneut antippen
  // ändert nichts. Scheitert das Speichern, gilt wieder die vorherige Stufe.
  panel.append(makePowerChoice(exercise.id, (level) => {
    if (actions.hasTodayEntry() && level === power) return;
    const previous = power;
    power = level;
    if (save() !== "saved") power = previous;
  }));

  note.type = "text";
  note.maxLength = LIMITS.noteLength;
  note.placeholder = "Kommentar (optional)";
  note.setAttribute("aria-label", "Kommentar zur Übung");
  note.value = today?.note ?? "";
  note.addEventListener("change", () => {
    // Ein leerer Kommentar allein legt keinen Eintrag an.
    if (!note.value.trim() && !actions.hasTodayEntry()) return;
    save();
  });
  note.addEventListener("keydown", (event) => {
    if (event.key === "Enter") note.blur();
  });
  panel.append(note);

  const status = makeElement("div", "log-status");
  status.append(makeElement("span", "log-status-text"));
  const remove = makeButton("log-remove", "Eintrag löschen");
  remove.addEventListener("click", () => actions.remove());
  status.append(remove);
  panel.append(status);

  const next = makeButton("log-next", "Weiter →");
  next.setAttribute("aria-label", "Weiter zur nächsten offenen Übung");
  next.addEventListener("click", () => actions.next());
  panel.append(next);
  return panel;
}

// Aktualisiert Power, Status, „Eintrag löschen“ und „Letztes Mal“ ohne Neuaufbau.
export function updateLogPanel(panel, exercise, info, totalWeeks) {
  const { today, previous } = info;
  showPower(panel.querySelector(".power-choice"), today?.power ?? null);
  panel.querySelector(".log-status-text").textContent = today
    ? "✓ Heute erfasst"
    : "Noch nicht erfasst – Power wählen zum Speichern";
  panel.querySelector(".log-remove").hidden = !today;
  // „Letztes Mal“ steht im offenen Bereich, sobald es ein früheres Training gibt
  // (Verfassung III: Ausnahme von „jede Angabe genau einmal“).
  const lastLine = panel.querySelector(".log-last");
  if (previous) {
    const formatted = formatEntry(previous.entry, exercise.log);
    lastLine.textContent = `Letztes Mal (${trainingDetail(previous.session, totalWeeks)}): ${formatted.text}`;
    if (previous.entry.note) lastLine.textContent += ` · „${previous.entry.note}“`;
    lastLine.hidden = false;
  } else {
    lastLine.hidden = true;
  }
}

// Zahlenfeld mit −/+-Knöpfen. Gibt { element, input } zurück.
// options: label (sichtbar), name (für Screenreader), value, step, min, max, start (Wert beim
// ersten "+" in einem leeren Feld), inputmode, onCommit.
function makeStepper(options) {
  const wrapper = makeElement("div", "stepper");
  wrapper.append(makeElement("span", "stepper-label", options.label));
  const controls = makeElement("div", "stepper-controls");
  const input = makeElement("input", "stepper-input");
  input.type = "text";
  input.inputMode = options.inputmode ?? "numeric";
  input.autocomplete = "off";
  input.setAttribute("aria-label", options.name);
  input.value = options.value === undefined || options.value === null ? "" : formatNumber(options.value);

  const change = (direction) => {
    const current = parseNumber(input.value);
    let next;
    if (current === undefined || Number.isNaN(current)) {
      if (direction < 0) return;
      next = options.start ?? options.min;
    } else {
      next = Math.round((current + direction * options.step) * 100) / 100;
    }
    if (next > options.max) next = options.max;
    input.value = next < options.min ? "" : formatNumber(next);
    options.onCommit();
  };
  const makeStepButton = (text, direction, label) => {
    const button = makeButton("stepper-button", text);
    button.setAttribute("aria-label", `${options.name} ${label}`);
    button.addEventListener("click", () => change(direction));
    return button;
  };
  input.addEventListener("change", () => options.onCommit());
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") input.blur();
  });
  controls.append(makeStepButton("−", -1, "verringern"), input, makeStepButton("+", 1, "erhöhen"));
  wrapper.append(controls);
  return { element: wrapper, input };
}

// Power als drei Direkt-Knöpfe (schwach · ok · stark). onChoose(stufe) bei jedem Antippen.
function makePowerChoice(exerciseId, onChoose) {
  const wrapper = makeElement("div", "power");
  const label = makeElement("span", "power-label", "Power");
  label.id = `power-label-${exerciseId}`;
  const choice = makeElement("div", "power-choice");
  choice.setAttribute("role", "group");
  choice.setAttribute("aria-labelledby", label.id);
  for (const level of POWER_LEVELS) {
    const display = POWER_DISPLAY[level];
    const button = makeButton("power-button");
    button.dataset.power = level;
    button.setAttribute("aria-label", `Power ${display.label}`);
    button.append(
      makeElement("span", "power-symbol", display.symbol),
      makeElement("span", "power-word", display.label)
    );
    button.addEventListener("click", () => onChoose(level));
    choice.append(button);
  }
  wrapper.append(label, choice);
  return wrapper;
}

// Zeigt die gespeicherte Stufe als gewählt (aria-pressed). Ohne heutigen Eintrag (saved = null)
// ist keine Stufe gewählt, der Standard „ok“ ist als Vorschlag markiert.
function showPower(choice, saved) {
  for (const button of choice.querySelectorAll(".power-button")) {
    const level = button.dataset.power;
    button.setAttribute("aria-pressed", String(level === saved));
    button.classList.toggle("is-suggested", saved === null && level === DEFAULT_POWER);
  }
}
