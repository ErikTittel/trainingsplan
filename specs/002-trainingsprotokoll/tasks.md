---

description: "Aufgabenliste für Feature 002 – Trainingsprotokoll"
---

# Tasks: Trainingsprotokoll

**Input**: Design-Dokumente aus `specs/002-trainingsprotokoll/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/log-card.md](contracts/log-card.md),
[contracts/log-storage.md](contracts/log-storage.md), [quickstart.md](quickstart.md)

**Tests**: Keine automatisierten Tests (Verfassung I). Jede Story endet mit einer manuellen
Prüfaufgabe nach [quickstart.md](quickstart.md); `log.js` wird zusätzlich in der Browser-Konsole
geprüft.

**Organization**: Nach User Stories gruppiert. Fast alle Story-Aufgaben ändern `app.js` bzw.
`log.js` und laufen deshalb nacheinander; `[P]` steht nur dort, wo eine andere Datei betroffen ist
und nichts Offenes vorausgesetzt wird.

## Format: `[ID] [P?] [Story] Beschreibung`

- **[P]**: parallel möglich (andere Datei, keine offene Abhängigkeit)
- **[Story]**: US1–US5 aus [spec.md](spec.md)
- Alle Pfade relativ zum Repo-Root (flache Struktur, kein `src/`)

## Ist-Zustand (Bezugspunkte für die Aufgaben)

- `plan.json`: 3 Einheiten (`day`: Mo/Do/Sa) mit 7 + 8 + 9 = 24 Übungen. Die kombinierten
  Übungen sind bereits in 6a/6b aufgeteilt. Es gibt noch **keine** Felder `id` und `log`.
- `app.js` (klassisches Skript, `"use strict"`): Zustand `plan`, `selectedDay`, `selectedPhase`;
  `renderExercise(exercise)` baut `article.exercise-card` aus `span.exercise-number`
  (`aria-hidden`) und `div.exercise-body` (Titel, `div.metric-row`, Zweck, Ablauf, Hinweis);
  `renderWorkout()` ersetzt alle Karten in `#exercise-list`; `loadPlan()` validiert
  `phaseProgression`/`tempo` je Phase; Hilfen `makeElement`, `getCurrentWeek`, `phaseForWeek`,
  `DELOAD_WEEKS`, `workoutForDay`. Alles per DOM, kein `innerHTML`.
- `style.css`: `.exercise-card { display: flex; gap: 12px; padding: 13px 15px; }`,
  `.exercise-number` 38 × 38 px (teilt die Regel mit `.summary-icon`), Farben nur über Variablen
  (`--accent`, `--accent-soft`, `--accent-contrast`, `--muted`, `--line`, `--surface-raised`,
  `--warning`, `--warning-soft`), Dark Mode über `prefers-color-scheme`.
- `index.html`: `<script src="app.js" defer>`; Legende `p.exercise-legend`; zwei
  `details.info-card` in `section.notice-section`; `#load-error`.
- `sw.js`: `CACHE_NAME = "trainingsplan-v9"`, `APP_SHELL` ohne `log.js`.

## Festlegung zum Schalter (konkretisiert contracts/log-card.md)

Damit geschlossene Karten garantiert nicht höher oder schmaler werden (FR-001a, SC-002a), wird
die vom Vertrag vorgesehene Zusammenlegung **immer** angewendet: Das Nummernfeld selbst ist der
Schalter (`button.exercise-number`, sichtbar weiterhin 38 × 38 px, Touch-Fläche per Pseudo-Element
auf 44 × 44 px erweitert). Der Stand (`+`, `2/4`, `✓`) steht als kleines, absolut positioniertes
Kennzeichen direkt unter dem Nummernfeld und beeinflusst das Layout nicht.

---

## Phase 1: Setup

**Purpose**: Vergleichswerte für SC-002a festhalten, bevor sich etwas ändert.

- [X] T001 Lokalen Server starten (`python -m http.server 8000`), in den DevTools „Update on
  reload“ aktivieren. Für Mo, Do und Sa jeweils in Phase 1–3 bei 320 px und 390 px Breite in der
  Konsole `document.querySelector("#exercise-list").offsetHeight` ablesen (18 Werte) und als
  Tabelle „Ausgangswerte vor Umsetzung“ unter Szenario 24 in
  `specs/002-trainingsprotokoll/quickstart.md` eintragen.

---

## Phase 2: Foundational (blockiert alle Stories)

**Purpose**: IDs und Erfassungsart im Plan, Speichergrundlage in `log.js`, Einbindung.

- [X] T002 [P] In `plan.json` jeder Einheit `"id"` als erstes Feld geben (Mo → `"e1"`, Do →
  `"e2"`, Sa → `"e3"`) und jeder der 24 Übungen `"id"` (erstes Feld) und `"log"` (nach `"name"`)
  exakt nach der Tabelle A4 in `specs/002-trainingsprotokoll/data-model.md` (z. B.
  `"id": "klimmzug"`, `"log": { "type": "bodyweightReps", "step": 0.5 }`). Regeln aus dem
  Datenmodell: IDs „nur `a–z`, `0–9`, `-`“, „im ganzen Plan eindeutig“; `type` ist einer von
  `weightReps`, `bodyweightReps`, `duration`, `block`. Sonst nichts ändern; `plan.md` bleibt
  unberührt. Danach prüfen, dass die Datei gültiges JSON ist und 24 verschiedene IDs enthält.
- [X] T003 In `app.js` in `loadPlan()` die Validierung nach data-model A6 ergänzen (vor dem
  ersten Rendern, im bestehenden `try`): Ladefehler mit deutscher Meldung, wenn einer Einheit
  oder Übung die `id` fehlt, sie nicht `/^[a-z0-9-]+$/` entspricht oder doppelt vorkommt
  (Einheiten und Übungen je für sich eindeutig); wenn `log` fehlt oder `log.type` nicht in
  einer neuen Konstante `LOG_TYPES = ["weightReps", "bodyweightReps", "duration", "block"]`
  enthalten ist; wenn `log.step` vorhanden, aber keine Zahl > 0 ist; wenn `log.firstSide`
  vorhanden, aber nicht `"L"` oder `"R"` ist. Meldungen im Stil der bestehenden
  („Die Kennung für … fehlt in plan.json.“). Abhängig von T002.
- [X] T004 [P] Neue Datei `log.js` anlegen (`"use strict"`, klassisches Skript, **kein** DOM-
  Zugriff, keine Abhängigkeit von `app.js`). Inhalt nach
  `specs/002-trainingsprotokoll/contracts/log-storage.md` und data-model B1/B6:
  Konstanten `LOG_KEY = "trainingsplan.log.v1"`, `LOG_BACKUP_KEY = "trainingsplan.log.backup"`,
  `LOG_BROKEN_KEY = "trainingsplan.log.defekt"`, `LOG_SCHEMA = 1`, `LOG_APP = "trainingsplan-log"`.
  `emptyLog()` liefert `{ app, schema: 1, updatedAt: null, lastExportAt: null, sessions: {} }`.
  `migrate(doc)` mit einer (noch leeren) Liste von Schritten `MIGRATIONS = {}` (Schlüssel = von-
  Version), die das Dokument schrittweise auf `LOG_SCHEMA` bringt.
  `loadLog()` gibt `{ log, status }` zurück mit `status` aus `"ok"`, `"leer"`, `"defekt"`,
  `"zu-neu"`, `"nicht-verfuegbar"`: `localStorage` nicht nutzbar (try/catch) → leeres Dokument,
  `"nicht-verfuegbar"`; kein Eintrag → `"leer"`; kein gültiges JSON oder `app`/`sessions` fehlen
  → Rohtext unter `LOG_BROKEN_KEY` ablegen, leeres Dokument, `"defekt"`; `schema > LOG_SCHEMA` →
  Dokument unverändert zurückgeben, `"zu-neu"` (die App darf dann nicht schreiben);
  `schema < LOG_SCHEMA` → Rohtext unter `LOG_BACKUP_KEY` sichern, migrieren, zurückschreiben.
  `saveLog(log)` setzt `log.updatedAt = new Date().toISOString()`, schreibt
  `JSON.stringify(log)` unter `LOG_KEY` und gibt `true`/`false` zurück (try/catch um `setItem`,
  nie werfen). Beim ersten erfolgreichen Speichern einmalig
  `navigator.storage?.persist?.()` aufrufen (Ergebnis ignorieren, Fehler abfangen; research R3).
- [X] T005 In `index.html` `<script src="log.js" defer></script>` **vor** dem `app.js`-Skript
  einfügen und direkt über `#exercise-list` ein `<p id="log-message" class="log-message"
  role="status" hidden></p>` ergänzen; in `sw.js` `"./log.js"` nach `"./app.js"` in `APP_SHELL`
  aufnehmen (`CACHE_NAME` wird erst in T027 hochgezählt). In `app.js` `logMessage:
  document.querySelector("#log-message")` in `elements` aufnehmen, eine Variable `let log;` und
  `let logWritable = true;` anlegen und in `loadPlan()` nach der Validierung
  `const loaded = loadLog(); log = loaded.log;` ausführen; bei Status `"zu-neu"` und
  `"nicht-verfuegbar"` `logWritable = false` setzen und über eine neue Funktion
  `showLogMessage(text)` (setzt Text, `hidden = false`; leerer Text blendet aus) melden:
  „Das Protokoll stammt aus einer neueren App-Version. Bitte die App aktualisieren – bis dahin
  wird nichts gespeichert.“ bzw. „Auf diesem Gerät kann gerade nichts gespeichert werden. Der
  Plan funktioniert weiter.“; bei `"defekt"`: „Das gespeicherte Protokoll war unlesbar und wurde
  beiseitegelegt.“ Abhängig von T004.

**Checkpoint**: Seite lädt wie bisher (keine sichtbare Änderung außer bei Fehlern); in der
Konsole liefert `loadLog()` ein leeres Dokument und `saveLog(emptyLog())` `true`.

---

## Phase 3: User Story 1 – Satz erfassen und mit dem letzten Training vergleichen (Priority: P1) 🎯 MVP

**Goal**: Unter jeder Übung lässt sich ein Protokollbereich aufklappen, der das letzte Training
zeigt und Sätze mit Gewicht × Wiederholungen vorbelegt erfasst und sofort speichert.

**Independent Test**: quickstart Szenarien 1–5, 24, 25 an einer `weightReps`-Übung
(„Rumänisches Kreuzheben“).

- [X] T006 [US1] In `log.js` die Trainings- und Satzlogik ergänzen (data-model B2–B4, B7):
  `localDate(date = new Date())` → `JJJJ-MM-TT` in Ortszeit.
  `currentSession(log, workoutId, context, create = false)`: liefert
  `log.sessions[context.date + "_" + workoutId]`; sonst das jüngste Training mit gleicher
  `workoutId`, dessen `updatedAt` „weniger als 6 Stunden zurückliegt“; sonst bei `create` ein
  neues `{ id, date, workoutId, planStart, week, phase, deload, updatedAt, entries: {} }` aus
  `context` (`{ date, planStart, week, phase, deload }`), andernfalls `null`.
  `validateSet(raw, spec)`: wandelt Texte mit Komma oder Punkt in Zahlen und gibt einen
  bereinigten Satz oder `null` zurück; Grenzen wörtlich aus dem Datenmodell: `reps` Ganzzahl
  1–999, `seconds` Ganzzahl 1–3600, `weight` Zahl 0–999 („`0`/leer wird weggelassen“), `rpe`
  1–10 in 0,5er-Schritten, `side` nur `"L"`/`"R"`; „Ein Satz braucht mindestens `reps` **oder**
  `seconds`“; „Nicht erfasste Felder werden weggelassen, nicht als `null` oder `0` gespeichert“.
  `addSet(log, session, exerciseId, set, target)`: legt `entries[exerciseId]` bei Bedarf mit
  `target` an, hängt den Satz an `sets`, setzt `session.updatedAt`.
  `hasData(entry)`: wahr, wenn mindestens ein Satz, `done`, `count` oder `note` vorhanden ist.
  `lastEntry(log, exerciseId, currentSessionId)`: unter allen Trainings außer dem aktuellen
  dasjenige mit dem spätesten `date`, dessen Eintrag „mindestens einen Satz, `done` oder
  `count` enthält“; Rückgabe `{ session, entry }` oder `null`.
  `prefill(todayEntry, last, side)`: „Letzter heute erfasster Satz derselben Seite; sonst der
  Satz gleicher Nummer (gleiche Seite) aus dem letzten Training; sonst leer“ – liefert nur
  `weight`, `reps`, `seconds` (kein `rpe`).
- [X] T007 [US1] In `app.js` den Aufklapp-Zustand einführen: `let openExerciseId = null;`.
  In `renderExercise` das Nummernfeld von `span` auf `button.exercise-number.log-toggle`
  (`type="button"`) umstellen: sichtbarer Text bleibt `exercise.number`; `aria-hidden` entfällt;
  `aria-expanded` = ob `openExerciseId === exercise.id`; `aria-controls` = `"log-" + exercise.id`;
  `aria-label` = „Protokoll <Titel>“ plus Stand (siehe T009). Klick: `openExerciseId` auf diese
  ID setzen bzw. auf `null`, wenn sie schon offen war, dann `renderWorkout()`; nach dem Öffnen
  den neuen Bereich mit `scrollIntoView({ block: "nearest" })` sichtbar machen, ohne ein Feld zu
  fokussieren (die Tastatur öffnet sich nicht von selbst). In `renderNavigation` beim Wechsel der
  Einheit `openExerciseId = null` setzen; beim Phasenwechsel bleibt der Wert erhalten
  (contracts/log-card.md „Auf- und Zuklappen“, FR-001b).
- [X] T008 [US1] In `app.js` eine Funktion `renderLogPanel(exercise, workout)` anlegen und in
  `renderExercise` nur dann als drittes Kind an die Karte hängen, wenn
  `openExerciseId === exercise.id` (`div.log-panel`, `id="log-<exercise.id>"`). Aufbau für
  `log.type === "weightReps"` nach contracts/log-card.md:
  Zeile A `div.log-row.log-last` nur wenn `lastEntry(...)` etwas liefert: Beschriftung
  „Zuletzt W<week> · TT.MM.“ (Woche weglassen, wenn `null` oder außerhalb 1–12; Zusatz „Entl.“
  bei `deload`), daneben die Sätze über eine neue Funktion `formatSets(sets, spec)`.
  Zeile B `div.log-row.log-today` nur wenn heute Sätze vorhanden sind: „Heute“ + `formatSets`.
  Zeile C `div.log-input`: zwei Zahlenfelder mit je einem −- und +-Knopf über eine Hilfsfunktion
  `makeStepper(label, value, step, inputmode)` – Gewicht (`inputmode="decimal"`, Einheit „kg“,
  Schritt `exercise.log.step ?? 2.5`, nie unter 0) und Wiederholungen (`inputmode="numeric"`,
  Einheit „Wdh“, Schritt 1, nie unter 1); vorbelegt über `prefill`; Knopf
  `button.log-confirm` „✓ Satz <n>“ (n = Zahl heutiger Sätze + 1), deaktiviert solange
  `validateSet` `null` liefert.
  `formatSets` für diesen Fall: Gewicht bei allen Sätzen gleich → `80 kg × 8 · 8 · 8 · 7`;
  Gewicht wechselt → `80×8 · 80×8 · 82,5×8`; Dezimalzahlen mit Komma. Zusätzlich ein
  ausgeschriebenes `aria-label` für die Zeilen A und B.
  „✓“: `currentSession(log, workout.id, context, true)` mit `context = { date: localDate(),
  planStart: plan.startDate || null, week: getCurrentWeek(plan.startDate), phase: selectedPhase,
  deload: DELOAD_WEEKS.includes(week) }`, dann `addSet(..., target =
  exercise.phaseProgression[selectedPhase])`, dann `saveLog(log)`. Bei `false` oder
  `logWritable === false`: Satz wieder aus dem Dokument entfernen, `showLogMessage("Der Satz
  konnte nicht gespeichert werden.")`, Eingabe stehen lassen (FR-022). Bei Erfolg
  `renderWorkout()` (Bereich bleibt offen, Eingabe ist neu vorbelegt).
- [X] T009 [US1] In `app.js` den Stand am Schalter ergänzen: Funktion
  `logStatus(exercise, workout)` liefert `{ count, planned }` – `count` = Zahl der heutigen
  Sätze im aktuellen Training (`currentSession(..., false)`), `planned` = erste Zahl aus
  `/^(\d+)×/` der Vorgabe der gewählten Phase oder `null`. In `renderExercise` unter dem
  Nummernfeld ein `span.log-state` (im Button) anzeigen: `+` bei `count === 0`, sonst
  `count/planned` bzw. nur `count`. `aria-label` des Schalters entsprechend („…, 2 von 4 Sätzen
  erfasst“ / „…, noch nichts erfasst“).
- [X] T010 [P] [US1] In `style.css` (nur bestehende Farbvariablen):
  `.exercise-card { flex-wrap: wrap; position: relative; }`;
  `.log-toggle` – Button-Standardstile zurücksetzen (`border: 0; padding: 0; font: inherit;
  cursor: pointer; touch-action: manipulation;`), `position: relative`, sichtbare Größe bleibt
  38 × 38 px aus `.exercise-number`; `.log-toggle::after { content: ""; position: absolute;
  inset: -3px; }` für die 44-px-Touch-Fläche; `.log-toggle[aria-expanded="true"]` mit
  `background: var(--accent); color: var(--accent-contrast);`; sichtbarer `:focus-visible`-Rahmen;
  `.log-state { position: absolute; top: calc(100% + 4px); left: 50%; transform:
  translateX(-50%); font-size: 0.68rem; font-weight: 800; color: var(--muted);
  white-space: nowrap; }` (nimmt keinen Platz im Layout ein);
  `.log-panel { flex: 0 0 100%; margin-top: 10px; padding-top: 10px; border-top: 1px solid
  var(--line); display: grid; gap: 8px; }`;
  `.log-row { display: flex; gap: 10px; font-size: 0.88rem; line-height: 1.35; }` mit fester
  Breite für die Beschriftung (`.log-row > span:first-child { flex: 0 0 auto; color:
  var(--muted); }`), `.log-today` fett;
  `.log-input { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }`;
  `.stepper` als Flex-Zeile mit zwei Knöpfen `min-width: 44px; min-height: 44px` und einem
  `input` (`width: 4.5em; min-height: 44px; text-align: center; font-size: 1rem` – mindestens
  16 px, damit iOS nicht zoomt; Rahmen `var(--line)`, Hintergrund `var(--surface-raised)`,
  Farbe `var(--text)`); `.log-confirm { min-height: 44px; padding: 0 16px; border: 0;
  border-radius: 12px; background: var(--accent); color: var(--accent-contrast); font-weight:
  800; }` mit erkennbarem `:disabled`-Zustand; `.log-message` im Stil eines Hinweises
  (`background: var(--warning-soft); color: var(--warning); border-radius: 12px; padding: 10px
  12px; font-size: 0.85rem`). Bei 320 px darf `.log-input` umbrechen, kein horizontales Scrollen.
- [X] T011 [US1] Prüfen nach `specs/002-trainingsprotokoll/quickstart.md`, Szenarien 1–5, 24, 25
  und 26 (nur „Rumänisches Kreuzheben“ und eine weitere `weightReps`-Übung). Die Höhen aus T001
  müssen bei geschlossenen Bereichen exakt gleich sein; Abweichungen in `style.css` beheben,
  bevor es weitergeht. Hell- und Dark Mode, 320 px.

**Checkpoint**: MVP – Übungen mit Gewicht × Wiederholungen sind im Training protokollierbar.

---

## Phase 4: User Story 2 – Passende Eingabe je Art der Übung (Priority: P1)

**Goal**: Alle 24 Übungen sind mit zur Übung passenden Feldern protokollierbar.

**Independent Test**: quickstart Szenarien 6–10.

- [X] T012 [US2] In `app.js` `renderLogPanel` und `formatSets` für `bodyweightReps` und
  `duration` erweitern (contracts/log-card.md „Eingabezeile je Erfassungsart“):
  `bodyweightReps` – zuerst Wiederholungen (± 1), dann Zusatzlast (kg, ± `step`, darf leer
  sein, Platzhalter „+ kg“); `duration` – Sekunden (± 5, Einheit „s“), Zusatzlast-Feld nur,
  wenn der vorbelegte Satz ein `weight` hat. Schreibweise: nur Wiederholungen `7 · 6 · 6 · 5`;
  mit Zusatzlast `+5 kg × 5 · 5 · 4`; Dauer `40 s · 40 s`.
- [X] T013 [US2] In `app.js` einseitige Übungen (`log.perSide === true`) umsetzen: vor den
  Feldern ein Umschalter L / R (zwei Knöpfe ≥ 44 px, `aria-pressed`); die aktive Seite ist ein
  neuer Anzeigezustand `let openSide = null;`, der beim Öffnen eines Bereichs auf
  `log.firstSide ?? "L"` gesetzt wird und nach jedem „✓“ auf die andere Seite springt; der Satz
  wird mit `side` gespeichert; Vorbelegung je Seite (`prefill(..., side)`). `formatSets` zeigt
  zwei Zeilen `L 8 · 8 · 8` und `R 8 · 7 · 8`, Gewicht davor, wenn es bei allen Sätzen gleich
  ist. Regel aus dem Datenmodell: „Der n-te `L`-Satz und der n-te `R`-Satz bilden in der
  Anzeige zusammen ‚Satz n‘. Ein Extrasatz links ist einfach ein weiterer `L`-Satz ohne
  Gegenstück.“ Die Satznummer am „✓“-Knopf und `logStatus` zählen je Seite (Stand = kleinere
  der beiden Zahlen).
- [X] T014 [US2] In `log.js` `setEntryFields(log, session, exerciseId, fields, target)` ergänzen
  (setzt `done`, `count`, `note`; `count` Ganzzahl ≥ 0; leere Werte werden entfernt; räumt den
  Eintrag weg, wenn `hasData` falsch ist, und das Training, wenn es keine Einträge mehr hat).
  In `app.js` `renderLogPanel` für `log.type === "block"`: keine Satzliste; Zeile A
  `✓ erledigt · 60 Kontakte` aus dem letzten Training; ein Schalter „erledigt“ (Knopf ≥ 44 px,
  `aria-pressed`), bei vorhandenem `log.countLabel` ein Zahlenfeld mit dieser Beschriftung
  (vorbelegt mit dem Zählwert des letzten Trainings, gespeichert erst bei Änderung oder
  „erledigt“). Jede Änderung wird sofort gespeichert. `logStatus` liefert für Blöcke `✓` bei
  `done`, sonst `+`.
- [X] T015 [P] [US2] In `style.css` den Seiten-Umschalter (`.side-switch` mit zwei Knöpfen,
  aktiver Knopf `background: var(--accent-soft); color: var(--accent)`), die zweizeilige
  L/R-Darstellung und den „erledigt“-Schalter gestalten; alles ≥ 44 px, Umbruch bei 320 px.
- [X] T016 [US2] Prüfen nach quickstart, Szenarien 6–10, und einmal alle 24 Karten in allen drei
  Einheiten öffnen: Jede zeigt genau die Felder ihrer Erfassungsart (SC-003).

**Checkpoint**: Der ganze Plan ist protokollierbar.

---

## Phase 5: User Story 3 – Eingaben korrigieren, ergänzen und löschen (Priority: P2)

**Goal**: Erfasste Sätze lassen sich ändern und löschen; RPE pro Satz und Notiz pro Übung sind
möglich und erscheinen beim nächsten Training unter „Zuletzt“.

**Independent Test**: quickstart Szenarien 11–13.

- [X] T017 [US3] In `log.js` `updateSet(log, session, exerciseId, index, set)` und
  `removeSet(log, session, exerciseId, index)` ergänzen; `removeSet` gibt den entfernten Satz
  zurück und räumt leere Einträge und Trainings auf (data-model B3: „Ein Übungsprotokoll
  existiert nur, wenn es etwas enthält“). Zusätzlich `insertSet(..., index, set)` für
  „Rückgängig“.
- [X] T018 [US3] In `app.js` die heutigen Sätze in Zeile B einzeln antippbar machen (je Satz ein
  `button.log-set`, ≥ 44 px hoch): Antippen lädt den Satz in die Eingabezeile
  (Anzeigezustand `let editingIndex = null;`), der Bestätigungsknopf heißt dann „Ändern“,
  daneben erscheinen „Löschen“ und „Abbrechen“. „Ändern“ → `updateSet` + `saveLog`; „Löschen“ →
  `removeSet` + `saveLog`, danach zeigt `#log-message` für 6 Sekunden „Satz gelöscht.“ mit einem
  Knopf „Rückgängig“ (`insertSet` an alter Stelle + `saveLog`). Sätze der Zeile A bleiben nicht
  antippbar. `editingIndex` wird beim Schließen des Bereichs und beim Wechsel der Übung
  zurückgesetzt.
- [X] T019 [US3] In `app.js` Zeile D ergänzen: ein RPE-Feld mit −/+ (Schritt 0,5, Bereich 1–10,
  leer erlaubt) für den nächsten bzw. bearbeiteten Satz – wird nach jedem „✓“ wieder geleert;
  ein Textfeld „Notiz“ (`maxlength="200"`, „max. 200 Zeichen“), das bei `change` über
  `setEntryFields` sofort speichert. `formatSets` hängt ein erfasstes RPE in Klammern an
  (`7 (9)`); Zeile A zeigt die Notiz des letzten Trainings in Anführungszeichen darunter. Gleiche
  Felder (ohne RPE) auch im Block-Bereich aus T014.
- [X] T020 [P] [US3] In `style.css` `.log-set` (ruhig, ohne Rahmen, mit sichtbarem
  `:focus-visible` und Markierung des gerade bearbeiteten Satzes), die Knöpfe „Löschen“
  (`color: var(--warning)`), „Abbrechen“, „Rückgängig“ und die Zeile D (kleiner, `var(--muted)`,
  Felder trotzdem ≥ 44 px hoch) gestalten.
- [X] T021 [US3] Prüfen nach quickstart, Szenarien 11–13.

---

## Phase 6: User Story 4 – Protokoll sichern und wiederherstellen (Priority: P2)

**Goal**: Das gesamte Protokoll lässt sich als Datei sichern und wieder einlesen.

**Independent Test**: quickstart Szenarien 15–17 und 21.

- [X] T022 [US4] In `log.js` ergänzen (contracts/log-storage.md „Sicherungsdatei“, data-model B8):
  `exportLog(log)` → `{ filename: "trainingsprotokoll-JJJJ-MM-TT.json", text }` mit eingerücktem
  JSON (`JSON.stringify(log, null, 2)`); `markExported(log)` setzt `lastExportAt`.
  `parseImport(text)` → `{ doc }` oder `{ error }` mit deutscher Meldung: gültig nur, wenn JSON,
  `app === "trainingsplan-log"`, `schema` Ganzzahl ≥ 1, `sessions` ein Objekt, dessen Einträge
  `id`, `date`, `workoutId`, `updatedAt` und `entries` besitzen; `schema` kleiner → `migrate`;
  `schema` größer → Fehler „Die Datei stammt aus einer neueren App-Version.“
  `mergeLog(log, imported)` → `{ added, updated, unchanged }`: „Auf dem Gerät nicht vorhanden →
  übernehmen. Vorhanden und `updatedAt` der Datei neuer → Stand der Datei ersetzt das ganze
  Training. Sonst → Stand des Geräts bleibt.“ Es wird immer das ganze Training übernommen.
- [X] T023 [US4] In `index.html` in `section.notice-section` eine dritte `details.info-card`
  nach „Plan & Progression“ ergänzen (gleicher `summary`-Aufbau: `span.summary-icon` mit „⤓“,
  `<strong>Protokoll sichern</strong>`, `<small id="backup-hint">`, `span.chevron`), darin
  `div#backup-panel.info-content` mit `p#backup-status`, Knopf `#backup-export` „Sichern“, Knopf
  `#backup-import` „Wiederherstellen“, verstecktem `<input id="backup-file" type="file"
  accept="application/json,.json" hidden>`, `p#backup-result` (`role="status"`) und dem Hinweis
  „Die Daten liegen nur auf diesem Gerät. Vor dem Entfernen der App sichern.“
- [X] T024 [US4] In `app.js` die neuen Elemente in `elements` aufnehmen und
  `renderBackup()` anlegen (Aufruf nach dem Laden und nach jedem Speichern): `#backup-status`
  = „<n> Trainings gespeichert · zuletzt gesichert am TT.MM.JJJJ“ bzw. „noch nie gesichert“;
  `#backup-hint` = „Sicherung empfohlen“, wenn es Trainings gibt, die neuer sind als
  `lastExportAt`, und die letzte Sicherung mehr als 14 Tage zurückliegt oder fehlt, sonst
  „Sichern und Wiederherstellen“. „Sichern“: Datei aus `exportLog` als `File` erzeugen; wenn
  `navigator.canShare?.({ files: [file] })`, `navigator.share({ files: [file] })`, sonst
  Download über einen temporären `<a download>` mit `URL.createObjectURL`; bei Erfolg
  `markExported` + `saveLog` (ein abgebrochener Teilen-Dialog zählt nicht als Sicherung).
  „Wiederherstellen“: Klick öffnet `#backup-file`; Datei mit `file.text()` lesen →
  `parseImport` → bei Fehler Meldung in `#backup-result`, Speicher unverändert; sonst `mergeLog`
  + `saveLog` + `renderWorkout()` und Meldung „x neu, y aktualisiert, z unverändert“. Bei
  `logWritable === false` ist „Wiederherstellen“ deaktiviert. Die beiden Knöpfe in `style.css`
  ≥ 44 px gestalten (gleicher Stil wie `.log-confirm` bzw. als Umriss-Variante).
- [X] T025 [US4] Prüfen nach quickstart, Szenarien 15–17, 20 und 21.

---

## Phase 7: User Story 5 – Überblick über die heutige Einheit (Priority: P3)

**Goal**: Erledigte Übungen sind auch geschlossen erkennbar; im offenen Bereich ist der
Vergleich zum letzten Training ohne Rechnen ablesbar.

**Independent Test**: quickstart Szenario 14.

- [X] T026 [US5] In `app.js`: `logStatus` um `done` erweitern (data-model B7 „Übung erledigt“:
  „Zahl der heutigen Sätze (bei `perSide` je Seite) ≥ Satzzahl aus der Vorgabe, sofern sie mit
  `<Zahl>×` beginnt; bei `block`: `done`. Lässt sich keine Satzzahl lesen, gilt: mindestens ein
  Satz.“) und dann `✓` statt `2/4` zeigen (Klasse `log-state-done`, `color: var(--accent)` in
  `style.css`). Neue Funktion `compareSet(today, previous)` → `1`, `0`, `-1` („zuerst `weight`,
  bei Gleichstand `reps` bzw. `seconds`“, fehlendes Gewicht zählt als 0; ohne Gegenstück kein
  Zeichen); `formatSets` bzw. die Satz-Knöpfe der Zeile B hängen `▲` bzw. `▼` an und setzen
  Klassen `log-up`/`log-down` (`color: var(--accent)` bzw. `var(--warning)` in `style.css` – nie
  Farbe allein), dazu im `aria-label` „mehr als zuletzt“/„weniger als zuletzt“.

---

## Phase 8: Polish & Cross-Cutting

- [X] T027 In `index.html` die Legende `p.exercise-legend` um die neuen Kürzel ergänzen:
  „Nummernfeld antippen = Protokoll · 2/4 = erfasste/geplante Sätze · L/R = links/rechts ·
  ▲▼ = mehr/weniger als zuletzt · (9) = RPE des Satzes · Entl. = Entlastungswoche“; in `sw.js`
  `CACHE_NAME` auf `"trainingsplan-v10"` hochzählen und prüfen, dass `"./log.js"` in
  `APP_SHELL` steht.
- [X] T028 [P] `CLAUDE.md` aktualisieren: Abschnitt „Trainingsprotokoll (geplant …)“ in einen
  Architektur-Eintrag **`log.js`** umschreiben (Aufgaben, Speicherschlüssel, `schema`/Migration,
  „`app.js` greift nie direkt auf `localStorage` zu“); bei `plan.json`/`app.js` die Pflichtfelder
  `id` und `log` samt Validierung und den Zustand `openExerciseId` nennen; Prüfliste „Lokal
  starten“ um die Protokoll-Prüfpunkte der Verfassung ergänzen; „(sobald umgesetzt)“ streichen.
  In `SPEC.md` in Abschnitt 7 „(geplant, noch nicht umgesetzt)“ entfernen.
- [X] T029 Gesamtprüfung nach `specs/002-trainingsprotokoll/quickstart.md`: alle Szenarien 1–26
  in Hell- und Dark Mode und bei 320 px; Offline-Verhalten nach dem Hochzählen von
  `CACHE_NAME` (Szenarien 4 und 20); Seitenhöhen gegen T001 (Szenario 24).
- [ ] T030 Abschnitt „Auf dem iPhone“ der quickstart auf dem echten Gerät durchgehen (Daten
  überleben App-Neustart, iPhone-Neustart und App-Update; Teilen-Dialog und Wiederherstellen
  funktionieren) und das Ergebnis mit Datum unter research R3 in
  `specs/002-trainingsprotokoll/research.md` festhalten.
- [X] T031 Vor dem Commit den Sync-Impact-Kommentar am Anfang von
  `.specify/memory/constitution.md` entfernen. Commits auf Deutsch, Verfassung als eigener
  Commit („Verfassung 2.1.0: Trainingsprotokoll (Prinzip VII)“).

---

## Stand der Umsetzung (2026-11-14)

- T001–T029 und T031 sind umgesetzt. Geprüft wurde automatisiert in Headless-Chrome
  (97 Einzelprüfungen zu den quickstart-Szenarien 1–3, 5–22, 24, 25; Kartenhöhen und
  Textbreiten aller 18 Kombinationen aus Einheit, Phase und Breite 320/390 px identisch zu T001;
  Service-Worker-Cache v10 mit `log.js`) sowie per Screenshot in Hell- und Dark Mode.
- Abweichungen von den Aufgabentexten: Der Stand am Schalter zählt bei einseitigen Übungen die
  Seite mit den meisten Sätzen (erledigt ist die Übung erst, wenn beide Seiten die geplante
  Satzzahl haben). Das Kennzeichen „✓“ und der Vergleich ▲/▼ (T026) sowie Legende und
  `CACHE_NAME` (T027) wurden zusammen mit den früheren Phasen umgesetzt.
- **Offen: T030** – Prüfung auf dem echten iPhone (Safari, Home-Bildschirm-App, Teilen-Dialog).
  Sie braucht ein Deployment über HTTPS und kann nur am Gerät erfolgen.

## Dependencies & Execution Order

- **Phase 1 → 2 → 3** strikt nacheinander. T002 und T004 sind parallel möglich; T003 braucht
  T002, T005 braucht T004.
- **US1 (Phase 3)** ist Voraussetzung für alle weiteren Stories (Bereich, Schalter, Satzlogik).
- **US2 (Phase 4)** baut auf US1 auf. **US3**, **US4** und **US5** bauen jeweils nur auf US1/US2
  auf und sind untereinander unabhängig; empfohlene Reihenfolge nach Priorität: US3 → US4 → US5.
- **Phase 8** nach allen gewünschten Stories. T030 braucht ein Deployment (oder den lokalen
  Server im selben WLAN über HTTPS – ohne HTTPS läuft der Service Worker auf dem iPhone nicht).

### Parallel-Möglichkeiten

- Phase 2: T002 (`plan.json`) ∥ T004 (`log.js`).
- Je Story die CSS-Aufgabe (T010, T015, T020) parallel zur `app.js`-Aufgabe derselben Story.
- T028 (Doku) parallel zu T027.

## Implementation Strategy

1. **MVP**: Phasen 1–3 (T001–T011). Danach sind alle Übungen mit Gewicht × Wiederholungen
   protokollierbar; das lässt sich bereits im Training nutzen.
2. **Vollständiger Plan**: Phase 4 (T012–T016) – alle 24 Übungen.
3. **Absicherung**: Phase 5 und 6 (Korrigieren, Sichern). Vor dem ersten längeren Einsatz
   empfohlen, weil die Daten sonst nur ungesichert auf dem Gerät liegen.
4. **Komfort**: Phase 7, dann Phase 8.

Nach jeder Phase ist die App lauffähig und kann committet werden (`CACHE_NAME` bei jedem
Deployment hochzählen, nicht erst in T027).

---

## Phase 9: Vereinfachte Erfassung (Änderung vom 2026-11-14)

**Goal**: Erfasst werden nur Gewicht bzw. Zeit, Power (schwach/ok/stark) und Kommentar; der
jüngste Eintrag steht hinter Name und Zweck (spec.md „Änderung“, research R11).

**Independent Test**: quickstart Szenarien 1–25 in der neuen Fassung.

- [X] T032 In `plan.json` `log` jeder Übung durch `{ "fields": [...] }` nach data-model A4
  ersetzen (`step` behalten, wo Gewicht erfasst wird); Spanish Squat `["seconds", "weight"]`.
- [X] T033 [P] `log.js` auf Schema 2 umstellen: `LOG_SCHEMA = 2`, `POWER_LEVELS`,
  `DEFAULT_POWER = "ok"`, Migration `MIGRATIONS[1]` (höchstes Gewicht, längste Zeit, Kommentar,
  Power ok), `validateEntry`, `setEntry`, `removeEntry`, `lastEntry(log, id, excludeSessionId)`;
  Satz-Funktionen entfernen.
- [X] T034 In `app.js` `loadPlan` auf `log.fields` prüfen (`LOG_FIELDS`), `renderExercise` um
  `span.exercise-log` (hinter dem Namen) und `span.exercise-note` (hinter dem Zweck) ergänzen,
  `updateCardSummary` (aktualisiert Angaben, Kennzeichen, Power-Auswahl, Status und
  „Letztes Mal“ ohne Neuaufbau) und `renderLogPanel` neu (Felder laut `log.fields`, Power,
  Kommentar, Status, „Eintrag löschen“ mit Rückfrage); Satz-, Seiten- und Vergleichslogik sowie
  `openSide`/`editingIndex` entfernen.
- [X] T035 [P] `style.css`: Regeln für Satzliste, Seiten-Umschalter, „Heute“, ▲/▼ entfernen;
  `.exercise-log`, `.exercise-note`, `.power-group`/`.power-button`, `.log-last`, `.log-status`,
  `.log-remove`, `.stepper-input[aria-invalid]` ergänzen.
- [X] T036 `index.html`: Legende auf ✓, Smileys und Entl. umstellen; `sw.js`: `CACHE_NAME`
  `trainingsplan-v11`.
- [X] T037 Verfassung 2.2.0 (Prinzip III, VII, Entwicklungsablauf), spec.md, data-model.md,
  contracts, quickstart.md, research R11, plan.md, SPEC.md, CLAUDE.md angleichen.
- [X] T038 Prüfen: 68 automatisierte Prüfungen in Headless-Chrome (Szenarien 1–22, 25 inkl.
  Migration, Import, Speicherfehler, Planfehler, 320 px mit allen 24 Bereichen), Höhenvergleich
  mit leerem Protokoll (identisch zu T001), Service-Worker-Cache v11 mit `log.js`, Screenshots
  in Hell- und Dark Mode.
- [ ] T039 iPhone-Prüfung wie T030, zusätzlich: Smileys werden farbig dargestellt, Zifferntastatur
  erscheint, Speichern beim Verlassen eines Felds funktioniert.
