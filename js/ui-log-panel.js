// Oberfläche: aufklappbarer Protokollbereich einer Übungskarte.
// Aufbau: „Letztes Mal“ (nur wenn heute erfasst) → eine Zeile mit Gewicht/Zeit links und Power
// rechts → Kommentar → Status und „Eintrag löschen“.
// Die Felder sind mit dem heutigen bzw. dem letzten Eintrag vorbelegt. Jede Änderung speichert
// sofort den ganzen sichtbaren Stand; Öffnen allein speichert nichts.

import { makeElement, makeButton } from "./dom.js";
import { DEFAULT_POWER, LIMITS, POWER_LEVELS, isValidValue, parseNumber } from "./log.js";
import { formatEntry, formatNumber, powerDisplay, trainingDetail } from "./format.js";

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
//          remove()        – heutigen Eintrag löschen (mit Rückfrage)
//          hasTodayEntry() – gibt es jetzt (nicht beim Öffnen) einen heutigen Eintrag?
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
    if (result !== "invalid") return;
    for (const [field, input] of Object.entries(inputs)) {
      if (!isValidValue(field, parseNumber(input.value))) input.setAttribute("aria-invalid", "true");
    }
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

  const powerStepper = makePowerStepper(power, (next) => {
    power = next;
    save();
  });

  const row = makeElement("div", "log-row");
  if (numbers.children.length) {
    row.append(numbers);
  } else {
    row.classList.add("log-row-power-only");
  }
  row.append(powerStepper);
  panel.append(row);

  note.type = "text";
  note.maxLength = LIMITS.noteLength;
  note.placeholder = "Kommentar (optional)";
  note.setAttribute("aria-label", "Kommentar zur Übung");
  note.value = today?.note ?? "";
  note.addEventListener("change", () => {
    // Ein leerer Kommentar allein legt keinen Eintrag an.
    if (!today && !note.value.trim() && !actions.hasTodayEntry()) return;
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
  return panel;
}

// Aktualisiert Power, Status, „Eintrag löschen“ und „Letztes Mal“ ohne Neuaufbau.
export function updateLogPanel(panel, exercise, info, totalWeeks) {
  const { today, previous } = info;
  showPower(panel.querySelector(".power-stepper"), today?.power ?? DEFAULT_POWER);
  panel.querySelector(".log-status-text").textContent = today
    ? "✓ Heute erfasst"
    : "Noch nicht erfasst – Wert oder Power anpassen.";
  panel.querySelector(".log-remove").hidden = !today;
  const lastLine = panel.querySelector(".log-last");
  // Das letzte Training steht im Bereich nur, solange die Karte die heutigen Werte zeigt.
  if (today && previous) {
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

// Power als −/+-Stepper: schwach ↔ ok ↔ stark. onChange(neue Stufe) bei jedem Wechsel.
function makePowerStepper(initial, onChange) {
  let power = initial;
  const stepper = makeElement("div", "stepper power-stepper");
  stepper.setAttribute("role", "group");
  stepper.setAttribute("aria-label", "Power (wahrgenommene Anstrengung)");
  const controls = makeElement("div", "stepper-controls");
  const minus = makeButton("stepper-button power-minus", "−");
  const plus = makeButton("stepper-button power-plus", "+");
  minus.setAttribute("aria-label", "Power verringern");
  plus.setAttribute("aria-label", "Power erhöhen");
  const shift = (direction) => {
    const next = POWER_LEVELS[POWER_LEVELS.indexOf(power) + direction];
    if (!next) return;
    power = next;
    showPower(stepper, power);
    onChange(power);
  };
  minus.addEventListener("click", () => shift(-1));
  plus.addEventListener("click", () => shift(1));
  controls.append(minus, makeElement("span", "power-value"), plus);
  stepper.append(makeElement("span", "stepper-label"), controls);
  showPower(stepper, power);
  return stepper;
}

// Zeigt die Power im Stepper an: Beschriftung „Power: ok“, Symbol in der Mitte, −/+ am Rand
// gesperrt, wenn es nach dieser Seite nicht weitergeht.
function showPower(stepper, power) {
  const index = POWER_LEVELS.indexOf(power);
  stepper.querySelector(".stepper-label").textContent = `Power: ${powerDisplay(power).label}`;
  stepper.querySelector(".power-value").textContent = powerDisplay(power).symbol;
  stepper.querySelector(".power-minus").disabled = index <= 0;
  stepper.querySelector(".power-plus").disabled = index >= POWER_LEVELS.length - 1;
}
