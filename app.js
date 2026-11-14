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
// Erlaubte Felder für das Protokoll (Liste "log.fields" je Übung in plan.json):
// weight = Gewicht, addedWeight = Zusatzlast zum Körpergewicht, seconds = Zeit
const LOG_FIELDS = ["weight", "addedWeight", "seconds"];
const ID_PATTERN = /^[a-z0-9-]+$/;

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
  logMessage: document.querySelector("#log-message"),
  backupHint: document.querySelector("#backup-hint"),
  backupStatus: document.querySelector("#backup-status"),
  backupExport: document.querySelector("#backup-export"),
  backupImport: document.querySelector("#backup-import"),
  backupFile: document.querySelector("#backup-file"),
  backupResult: document.querySelector("#backup-result"),
  error: document.querySelector("#load-error")
};

let plan;
let selectedDay;
let selectedPhase = PHASES[0].id;
// Trainingsprotokoll (Daten kommen aus log.js)
let log = emptyLog();
let logWritable = true;
let logBlockedText = "";
// Anzeigezustand des Protokollbereichs – wird nicht gespeichert:
let openExerciseId = null; // ID der Übung, deren Protokollbereich offen ist (höchstens eine)

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
      openExerciseId = null;
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
// Das Nummernfeld ist zugleich der Schalter für den Protokollbereich darunter.
// Gibt es zur Übung schon einen Eintrag, stehen Gewicht/Zeit und Power hinter dem Namen und der
// Kommentar hinter dem Zweck (immer der jüngste Eintrag, heute oder vom letzten Training).
function renderExercise(exercise, workout) {
  const { title, rest } = splitRest(exercise.name);
  const tempo = formatTempo(exercise.tempo[selectedPhase]);
  const card = makeElement("article", "exercise-card");
  card.dataset.exerciseId = exercise.id;
  const isOpen = openExerciseId === exercise.id;
  const number = makeElement("button", "exercise-number log-toggle");
  number.type = "button";
  number.append(exercise.number, makeElement("span", "log-state"));
  number.setAttribute("aria-expanded", String(isOpen));
  number.setAttribute("aria-controls", `log-${exercise.id}`);
  number.addEventListener("click", () => {
    openExerciseId = isOpen ? null : exercise.id;
    renderWorkout();
    const toggle = document.querySelector(`[aria-controls="log-${exercise.id}"]`);
    if (toggle) toggle.focus({ preventScroll: true });
    const panel = document.getElementById(`log-${exercise.id}`);
    if (panel) panel.scrollIntoView({ block: "nearest" });
  });
  const body = makeElement("div", "exercise-body");
  const titleElement = makeElement("strong", "exercise-title", title);
  titleElement.append(makeElement("span", "exercise-log"));
  body.append(titleElement);

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

  const purpose = makeElement("p", "exercise-purpose", exercise.why || "");
  purpose.append(makeElement("span", "exercise-note"));
  body.append(purpose);

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
  if (isOpen) card.append(renderLogPanel(exercise, workout));
  updateCardSummary(card, exercise, workout, title);
  return card;
}

// ---------------------------------------------------------------------------
// Trainingsprotokoll: Anzeige und Eingabe (Daten und Speichern stehen in log.js)
// Erfasst wird pro Übung und Training: Gewicht bzw. Zeit, Power und Kommentar.
// ---------------------------------------------------------------------------

const POWER_OPTIONS = [
  { id: "weak", symbol: "😟", label: "schwach" },
  { id: "ok", symbol: "🙂", label: "ok" },
  { id: "strong", symbol: "😃", label: "stark" }
];

// Zahl in deutscher Schreibweise: 82.5 → "82,5"
function formatNumber(value) {
  return String(value).replace(".", ",");
}

// Angaben zum heutigen Training, die beim Anlegen gespeichert werden.
function sessionContext() {
  const week = getCurrentWeek(plan.startDate);
  return {
    date: localDate(),
    planStart: plan.startDate || null,
    week,
    phase: selectedPhase,
    deload: week !== null && DELOAD_WEEKS.includes(week)
  };
}

function todaySession(workout, create = false) {
  return currentSession(log, workout.id, sessionContext(), create);
}

// Zeigt eine Meldung über der Übungsliste. Leerer Text blendet sie aus.
function showLogMessage(text) {
  elements.logMessage.textContent = text;
  elements.logMessage.hidden = !text;
}

function ensureWritable() {
  if (logWritable) return true;
  showLogMessage(logBlockedText);
  return false;
}

// Speichert das Protokoll. Schlägt das fehl, wird der gespeicherte Stand wieder geladen,
// damit Anzeige und Speicher nicht auseinanderlaufen.
function commitLog() {
  if (saveLog(log)) {
    showLogMessage("");
    renderBackup();
    return true;
  }
  log = loadLog().log;
  showLogMessage("Die Eingabe konnte nicht gespeichert werden. Bitte Speicherplatz prüfen und erneut versuchen.");
  return false;
}

function powerOption(id) {
  return POWER_OPTIONS.find((option) => option.id === id) ?? POWER_OPTIONS[1];
}

// Kurzform eines Eintrags hinter dem Übungsnamen, z. B. "80 kg 🙂", "+5 kg 😃", "40 s · 10 kg 🙂".
function formatEntry(entry, spec) {
  const parts = [];
  if (entry.seconds !== undefined) parts.push(`${entry.seconds} s`);
  if (entry.weight !== undefined) {
    const prefix = spec.fields.includes("addedWeight") ? "+" : "";
    parts.push(`${prefix}${formatNumber(entry.weight)} kg`);
  }
  const values = parts.join(" · ");
  const power = powerOption(entry.power);
  return {
    text: values ? `${values} ${power.symbol}` : power.symbol,
    spoken: [values.replace(" · ", ", ").replace("kg", "Kilogramm").replace(/(\d) s\b/, "$1 Sekunden"), `Power ${power.label}`]
      .filter(Boolean).join(", ")
  };
}

// Beschriftung eines Trainings: "W5 · 09.11." (+ "Entl." in einer Entlastungswoche)
function trainingDetail(session) {
  const [, month, day] = session.date.split("-");
  const parts = [];
  if (Number.isInteger(session.week) && session.week >= 1 && session.week <= TOTAL_WEEKS) {
    parts.push(`W${session.week}`);
  }
  parts.push(`${day}.${month}.`);
  if (session.deload) parts.push("Entl.");
  return parts.join(" · ");
}

// Aktualisiert die Protokollangaben einer Karte (hinter Name und Zweck, Kennzeichen am
// Nummernfeld, Zustand im offenen Bereich), ohne die Karte neu aufzubauen – so bleiben Fokus und
// Eingaben im Protokollbereich erhalten.
function updateCardSummary(card, exercise, workout, title = splitRest(exercise.name).title) {
  const session = todaySession(workout);
  const today = session?.entries[exercise.id] ?? null;
  const latest = today ? { session, entry: today } : lastEntry(log, exercise.id);

  const summary = card.querySelector(".exercise-log");
  const note = card.querySelector(".exercise-note");
  if (latest) {
    const formatted = formatEntry(latest.entry, exercise.log);
    summary.textContent = ` ${formatted.text}`;
    const when = today ? "heute" : `zuletzt ${trainingDetail(latest.session)}`;
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
  card.querySelector(".log-toggle").setAttribute(
    "aria-label",
    `Protokoll ${title}, ${today ? "heute erfasst" : "heute noch nicht erfasst"}`
  );

  const panel = card.querySelector(".log-panel");
  if (!panel) return;
  const power = today?.power ?? DEFAULT_POWER;
  for (const button of panel.querySelectorAll(".power-button")) {
    button.setAttribute("aria-pressed", String(button.dataset.power === power));
  }
  panel.querySelector(".log-status-text").textContent = today
    ? "✓ Heute erfasst"
    : "Noch nicht erfasst – Wert anpassen oder Power antippen.";
  panel.querySelector(".log-remove").hidden = !today;
  const previous = lastEntry(log, exercise.id, session?.id);
  const lastLine = panel.querySelector(".log-last");
  // Das letzte Training steht im Bereich nur, solange die Karte die heutigen Werte zeigt.
  if (today && previous) {
    const formatted = formatEntry(previous.entry, exercise.log);
    lastLine.textContent = `Letztes Mal (${trainingDetail(previous.session)}): ${formatted.text}`;
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
  const makeButton = (text, direction, label) => {
    const button = makeElement("button", "stepper-button", text);
    button.type = "button";
    button.setAttribute("aria-label", `${options.name} ${label}`);
    button.addEventListener("click", () => change(direction));
    return button;
  };
  input.addEventListener("change", () => options.onCommit());
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") input.blur();
  });
  controls.append(makeButton("−", -1, "verringern"), input, makeButton("+", 1, "erhöhen"));
  wrapper.append(controls);
  return { element: wrapper, input };
}

// Der aufklappbare Protokollbereich einer Übung: Gewicht/Zeit → Power → Kommentar.
// Die Felder sind mit dem heutigen bzw. dem letzten Eintrag vorbelegt. Jede Änderung speichert
// sofort den ganzen sichtbaren Stand; ein Antippen von Power übernimmt die Werte unverändert.
function renderLogPanel(exercise, workout) {
  const spec = exercise.log;
  const panel = makeElement("div", "log-panel");
  panel.id = `log-${exercise.id}`;
  const session = todaySession(workout);
  const today = session?.entries[exercise.id] ?? null;
  const source = today ?? lastEntry(log, exercise.id)?.entry ?? {};

  const lastLine = makeElement("p", "log-last");
  lastLine.hidden = true;
  panel.append(lastLine);

  const inputs = {};
  let power = today?.power ?? DEFAULT_POWER;
  const note = makeElement("input", "log-note-input");

  const save = () => {
    for (const input of Object.values(inputs)) input.removeAttribute("aria-invalid");
    if (!ensureWritable()) return;
    const raw = {
      weight: inputs.weight?.value,
      seconds: inputs.seconds?.value,
      power,
      note: note.value
    };
    const target = exercise.phaseProgression[selectedPhase];
    if (!setEntry(log, todaySession(workout, true), exercise.id, raw, target)) {
      for (const [field, input] of Object.entries(inputs)) {
        const value = parseNumber(input.value);
        const valid = value === undefined
          || (field === "seconds" ? Number.isInteger(value) && value >= 1 && value <= 3600 : value >= 0 && value <= 999);
        if (!valid) input.setAttribute("aria-invalid", "true");
      }
      showLogMessage("Bitte eine gültige Zahl eingeben.");
      return;
    }
    if (!commitLog()) return;
    const card = panel.closest(".exercise-card");
    if (card) updateCardSummary(card, exercise, workout);
  };

  const fields = makeElement("div", "log-input");
  if (spec.fields.includes("seconds")) {
    const stepper = makeStepper({
      label: "Zeit (s)", name: "Zeit in Sekunden", value: source.seconds,
      step: 5, min: 5, max: 3600, start: 30, onCommit: save
    });
    inputs.seconds = stepper.input;
    fields.append(stepper.element);
  }
  for (const field of ["weight", "addedWeight"]) {
    if (!spec.fields.includes(field)) continue;
    const step = spec.step ?? 2.5;
    const added = field === "addedWeight";
    const stepper = makeStepper({
      label: added ? "Zusatzlast (kg)" : "Gewicht (kg)",
      name: added ? "Zusatzlast in Kilogramm" : "Gewicht in Kilogramm",
      value: source.weight, step, min: step, max: 999, start: step, inputmode: "decimal", onCommit: save
    });
    inputs.weight = stepper.input;
    fields.append(stepper.element);
  }
  if (fields.children.length) panel.append(fields);

  const powerGroup = makeElement("div", "power-group");
  powerGroup.setAttribute("role", "group");
  powerGroup.setAttribute("aria-label", "Power (wahrgenommene Anstrengung)");
  powerGroup.append(makeElement("span", "power-label", "Power"));
  for (const option of POWER_OPTIONS) {
    const button = makeElement("button", "power-button");
    button.type = "button";
    button.dataset.power = option.id;
    button.setAttribute("aria-label", `Power ${option.label}`);
    button.append(
      makeElement("span", "power-symbol", option.symbol),
      makeElement("span", "power-text", option.label)
    );
    button.addEventListener("click", () => {
      power = option.id;
      save();
    });
    powerGroup.append(button);
  }
  panel.append(powerGroup);

  note.type = "text";
  note.maxLength = 200;
  note.placeholder = "Kommentar (optional)";
  note.setAttribute("aria-label", "Kommentar zur Übung");
  note.value = today?.note ?? "";
  note.addEventListener("change", () => {
    if (!today && !note.value.trim() && !todaySession(workout)?.entries[exercise.id]) return;
    save();
  });
  note.addEventListener("keydown", (event) => {
    if (event.key === "Enter") note.blur();
  });
  panel.append(note);

  const status = makeElement("div", "log-status");
  status.append(makeElement("span", "log-status-text"));
  const remove = makeElement("button", "log-remove", "Eintrag löschen");
  remove.type = "button";
  remove.addEventListener("click", () => {
    if (!ensureWritable()) return;
    if (!window.confirm("Heutigen Eintrag zu dieser Übung löschen?")) return;
    if (removeEntry(log, todaySession(workout), exercise.id) && commitLog()) {
      renderWorkout();
      const toggle = document.querySelector(`[aria-controls="log-${exercise.id}"]`);
      if (toggle) toggle.focus({ preventScroll: true });
    }
  });
  status.append(remove);
  panel.append(status);
  return panel;
}

// Sicherungsbereich: Stand anzeigen.
function renderBackup() {
  const sessions = Object.values(log.sessions);
  const count = sessions.length;
  const exported = log.lastExportAt ? new Date(log.lastExportAt) : null;
  const exportedText = exported
    ? `zuletzt gesichert am ${exported.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}`
    : "noch nie gesichert";
  elements.backupStatus.textContent = `${count} ${count === 1 ? "Training" : "Trainings"} gespeichert · ${exportedText}`;

  const newer = sessions.some((session) => !log.lastExportAt || session.updatedAt > log.lastExportAt);
  const old = !exported || Date.now() - exported.getTime() > 14 * 86400000;
  elements.backupHint.textContent = newer && old ? "Sicherung empfohlen" : "Sichern und Wiederherstellen";
  elements.backupExport.disabled = count === 0;
  elements.backupImport.disabled = !logWritable;
}

// Sichern: Datei über den Teilen-Dialog weitergeben oder, wo es den nicht gibt, herunterladen.
async function exportBackup() {
  const { filename, text } = exportLog(log);
  let saved = false;
  try {
    const file = new File([text], filename, { type: "application/json" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });
      saved = true;
    }
  } catch (error) {
    if (error.name === "AbortError") {
      elements.backupResult.textContent = "Sicherung abgebrochen.";
      return;
    }
  }
  if (!saved) {
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const link = makeElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  markExported(log);
  if (logWritable) saveLog(log);
  renderBackup();
  elements.backupResult.textContent = `Sicherung „${filename}“ erstellt.`;
}

// Wiederherstellen: Datei prüfen und mit dem Protokoll auf dem Gerät zusammenführen.
async function importBackup(file) {
  let text;
  try {
    text = await file.text();
  } catch (error) {
    elements.backupResult.textContent = "Die Datei konnte nicht gelesen werden.";
    return;
  }
  const parsed = parseImport(text);
  if (parsed.error) {
    elements.backupResult.textContent = `${parsed.error} Das Protokoll auf diesem Gerät ist unverändert.`;
    return;
  }
  if (!ensureWritable()) return;
  const result = mergeLog(log, parsed.doc);
  if (!commitLog()) {
    elements.backupResult.textContent = "Die Sicherung konnte nicht gespeichert werden.";
    return;
  }
  renderWorkout();
  elements.backupResult.textContent =
    `Wiederhergestellt: ${result.added} neu, ${result.updated} aktualisiert, ${result.unchanged} unverändert.`;
}

function setupBackup() {
  elements.backupExport.addEventListener("click", exportBackup);
  elements.backupImport.addEventListener("click", () => elements.backupFile.click());
  elements.backupFile.addEventListener("change", () => {
    const file = elements.backupFile.files[0];
    elements.backupFile.value = "";
    if (file) importBackup(file);
  });
}

function renderWorkout() {
  const workout = workoutForDay(selectedDay);
  if (!workout) throw new Error(`Für ${selectedDay} wurde keine Einheit gefunden.`);

  elements.workoutTitle.textContent = workout.title;
  elements.warmup.textContent = workout.warmup;
  elements.exerciseCount.textContent = String(workout.exercises.length);
  elements.exerciseList.replaceChildren(
    ...workout.exercises.map((exercise) => renderExercise(exercise, workout))
  );

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
    const workoutIds = new Set();
    const exerciseIds = new Set();
    for (const workout of plan.workouts) {
      if (!ID_PATTERN.test(workout.id ?? "")) {
        throw new Error(`Die Kennung (id) für ${workout.title} fehlt in plan.json oder ist ungültig.`);
      }
      if (workoutIds.has(workout.id)) throw new Error(`Die Kennung „${workout.id}“ ist in plan.json doppelt vergeben.`);
      workoutIds.add(workout.id);
      for (const exercise of workout.exercises) {
        if (!ID_PATTERN.test(exercise.id ?? "")) {
          throw new Error(`Die Kennung (id) für ${exercise.name} fehlt in plan.json oder ist ungültig.`);
        }
        if (exerciseIds.has(exercise.id)) throw new Error(`Die Kennung „${exercise.id}“ ist in plan.json doppelt vergeben.`);
        exerciseIds.add(exercise.id);
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

    const loaded = loadLog();
    log = loaded.log;
    if (loaded.status === "zu-neu") {
      logWritable = false;
      logBlockedText = "Das Protokoll stammt aus einer neueren App-Version. Bitte die App aktualisieren – bis dahin wird nichts gespeichert.";
    } else if (loaded.status === "nicht-verfuegbar") {
      logWritable = false;
      logBlockedText = "Auf diesem Gerät kann gerade nichts gespeichert werden. Der Plan funktioniert weiter.";
    }
    if (!logWritable) showLogMessage(logBlockedText);
    if (loaded.status === "defekt") {
      showLogMessage("Das gespeicherte Protokoll war unlesbar und wurde beiseitegelegt.");
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
    setupBackup();
    renderBackup();
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
