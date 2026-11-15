# Tasks: UX-Überarbeitung für die Bedienung im Studio

**Input**: Design documents from `specs/003-ux-studio-bedienung/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui.md, quickstart.md

Keine automatisierten Tests (Verfassung I); Prüfung nach quickstart.md und docs/pruefung.md.

## Phase 1: Setup

- [X] T001 Ausgangshöhen messen (Seitenlänge und `#exercise-list` ohne Einträge, 320/390 px, alle Einheiten × Phasen) mit Chrome headless als Vergleich für SC-006 (Skript im Scratchpad, nicht im Repository)

## Phase 2: Foundational

- [X] T002 Seitengerüst umbauen in index.html: Eyebrows „DEIN TRAININGSPLAN/DEINE EINHEIT/DEIN ABLAUF“, `.phase-label`, beide `.exercise-legend`-Absätze und Footer entfernen; `#workout-title` als `h2` mit `#today-label` in einer Zeile; `#workout-warmup` als `<details open>` mit `<summary>` und `<ol>`; Abschnitt „Übungen“ mit `h2` und `#exercise-count`; Infokarte „Kürzel & Bedienung“ (nach „Sicherheit zuerst“) mit `#power-legend`; Rückgängig-Leiste `#undo-bar` (Text + Knopf, `hidden`)
- [X] T003 Grundstil in style.css: Kopf (Titel klein/gedämpft, `#plan-subtitle` groß/fett), Mindestschrift 0,85 rem für alle sichtbaren Texte, Warmup-Text in `--text`, Abstände verringern, Footer-/Eyebrow-Regeln entfernen

## Phase 3: User Story 1 – Power mit einem Antippen (P1) 🎯 MVP

**Goal**: Power per Direkt-Knopf; ein Antippen speichert; „Letztes Mal“ immer im offenen Bereich.
**Independent Test**: quickstart 3 und 6.

- [X] T004 [US1] In js/ui-log-panel.js `makePowerStepper`/`showPower` durch `makePowerChoice` ersetzen: drei Knöpfe (Symbol über Wort aus `POWER_DISPLAY`), `aria-pressed`, Klasse `is-suggested` auf „ok“ ohne heutigen Eintrag; Antippen der gespeicherten Stufe tut nichts, sonst `power` setzen und `save()`; bei Ergebnis ≠ "saved" vorherige Stufe zurücksetzen; `save()` gibt das Ergebnis zurück
- [X] T005 [US1] In js/ui-log-panel.js Aufbau: Wertfelder untereinander, Power-Zeile mit Beschriftung „Power“ darunter, dann Kommentar, Status; Status ohne heutigen Eintrag „Noch nicht erfasst – Power wählen zum Speichern“
- [X] T006 [US1] In js/ui-log-panel.js `updateLogPanel`: „Letztes Mal“ immer zeigen, wenn `previous` existiert (Bedingung `today &&` entfernen); Power-Knöpfe aus `today?.power` aktualisieren
- [X] T007 [US1] In style.css Protokollbereich: Stepper-Knöpfe 52 × 50 px, Zahl 1,25 rem; `.power-choice` als dreispaltiges Raster, Knöpfe ≥ 56 px hoch, gewählt = Akzent gefüllt, `is-suggested` = gestrichelter Akzentrand; Fokusrahmen

## Phase 4: User Story 2 – Fortschritt und „Weiter →“ (P1)

**Goal**: erledigt/nächste markiert, Zähler „x / y“, Sprung zur nächsten offenen Übung, Speicher-Bestätigung.
**Independent Test**: quickstart 3 und 4.

- [X] T008 [US2] In js/ui-exercise.js `updateCardSummary`: Klasse `is-done` nach `today`; neue Funktion `flashSaved(card)` (Klasse `just-saved` neu starten)
- [X] T009 [US2] In js/ui-workout.js `renderProgress(cards-Zustand)`: Zähler „erfasst / gesamt“ mit `aria-label` „x von y Übungen heute erfasst“, `is-next` auf erste nicht erfasste Karte
- [X] T010 [US2] In js/ui-log-panel.js Knopf „Weiter →“ (`log-next`) ans Ende, ruft `actions.next()`
- [X] T011 [US2] In js/app.js: `showProgress()` nach `showWorkout`, Speichern und Löschen; `flashSaved` nach erfolgreichem Speichern; `nextExercise(workout, exercise)` – nächste nicht erfasste Übung nach der aktuellen, dann von vorn; öffnen und Karte in den Sichtbereich scrollen, sonst nur schließen
- [X] T012 [US2] In style.css: `.is-done` (Nummernfeld gefüllt, Akzentrand), `.is-next` (Ring per box-shadow, keine Höhenänderung), `@keyframes` für `.just-saved .log-state`, ohne Animation bei `prefers-reduced-motion`; `.log-next` volle Breite ≥ 50 px

## Phase 5: User Story 3 – Ruhige, lesbare Seite (P2)

**Goal**: Aufwärmen als Liste, Legende in Infokarte, Phasenleiste, Hierarchie in der Karte, Hinweis einklappbar.
**Independent Test**: quickstart 1, 2, 7, 9.

- [X] T013 [P] [US3] plan.json: `warmup` je Einheit in `{ "duration": "9 Min", "steps": [...] }` umwandeln; Schritt = Text oder `{ "title", "items": [...] }`; Inhalte wörtlich aus dem bisherigen Text
- [X] T014 [P] [US3] plan.md: Aufwärmen der drei Einheiten als nummerierte Liste mit Unterpunkten (gleiche Gliederung wie plan.json)
- [X] T015 [US3] js/plan.js: `warmup` prüfen – „`duration` Pflicht, Text“, „`steps` Liste, ≥ 1“, Schritt Text oder `{ title: Text, items: [Text, …] (≥ 1) }`; sonst Fehler „Das Aufwärmen (warmup) für … ist ungültig.“
- [X] T016 [US3] js/ui-workout.js: Aufwärmen als `<ol>` rendern (Gruppen mit `<strong>` + `<ul>`), Überschrift „Aufwärmen · {duration}“, beim Einheitenwechsel öffnen; `onWarmupToggle`-Rückruf
- [X] T017 [US3] js/ui-workout.js Phasenknöpfe einzeilig („Phase 1“ + „W1–4“ nebeneinander)
- [X] T018 [US3] js/ui-exercise.js: `instructionsNote` als `<details class="instruction-note">` mit `<summary>` („Hinweis“ + Text, geschlossen einzeilig); Klicks in `.instruction-note` öffnen nicht den Protokollbereich
- [X] T019 [US3] style.css: Phasenleiste (eine Zeile, ≥ 44 px), Aufwärm-`details`, Karten-Hierarchie (Titel 1,02 rem, Vorgabe 1 rem fett, Zweck 0,85 rem gedämpft), `.instruction-note` mit `line-clamp: 1` geschlossen, Legenden-Infokarte

## Phase 6: User Story 4 – Komfort (P3)

**Goal**: Bildschirm wach, Rückgängig statt Dialog, Anzeigezustand am selben Tag.
**Independent Test**: quickstart 5 und 8.

- [X] T020 [P] [US4] js/log.js `restoreEntry(log, session, exerciseId, entry)`
- [X] T021 [P] [US4] js/log-storage.js `loadViewState()`/`saveViewState(view)` unter `trainingsplan.view`, Fehler still ignorieren
- [X] T022 [US4] js/ui-workout.js `showUndo(text, onUndo)`/`hideUndo()` für `#undo-bar`
- [X] T023 [US4] js/app.js: `deleteEntry` ohne `confirm`, Rückgängig 6 s; verfällt beim Speichern und beim Wechsel von Einheit/Phase
- [X] T024 [US4] js/app.js: Wake Lock beim Start, nach `visibilitychange` und beim ersten Antippen ohne aktive Sperre
- [X] T025 [US4] js/app.js: Anzeigezustand – laden beim Start (nur gleiches `date`, gültige IDs: `workoutId`, `phaseId`, `openExerciseId` der Einheit, `warmupOpen`, `scrollY`), speichern bei Auswahl/Aufklappen/Aufwärmen, Scrollen (verzögert 300 ms), `pagehide` und `visibilitychange`
- [X] T026 [US4] style.css `#undo-bar` unten fixiert (Safe Area), Knopf ≥ 44 px

## Phase 7: Polish

- [X] T027 sw.js `CACHE_NAME` hochzählen (v13 → v14)
- [X] T028 [P] SPEC.md: Aufbau, Übungskarte, Protokollbereich, Löschen, Anzeigezustand, Wachhalten nachziehen
- [X] T029 [P] docs/datenformate.md: A3 `warmup`, A6 Prüfung, B1 Schlüssel `trainingsplan.view`, B5 „Letztes Mal“
- [X] T030 [P] docs/architektur.md: Modultabelle, Zustand (`undo`, gespeicherter Anzeigezustand), „wo ändere ich was?“ (Legende jetzt in Infokarte)
- [X] T031 [P] docs/pruefung.md: A4 Legende, B3/B4/B8/B9/B6 an neues Verhalten, neue Punkte (Weiter, Rückgängig, Anzeigezustand, Wake Lock), Referenzhöhen B2 neu
- [X] T032 Prüfung im Browser (Chrome headless, 320/390 px, hell/dunkel) nach quickstart.md; Höhen mit T001 vergleichen
- [X] T033 specs/003-ux-studio-bedienung/spec.md Status auf „Umgesetzt“, Archivhinweis; specs/README.md ergänzen

## Dependencies

- Phase 2 vor allen Stories. US1 → US2 (Weiter-Knopf im neuen Panel-Aufbau). US3 und US4 unabhängig
  von US1/US2 außer gemeinsamen Dateien (app.js, style.css – nacheinander bearbeiten).
- Parallel: T013/T014, T020/T021, T028–T031.

## Implementation Strategy

MVP = Phase 1–3 (Power mit einem Antippen). Danach US2, US3, US4, Polish; Prüfung T032 am Ende.
