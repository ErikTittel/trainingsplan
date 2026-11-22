# Tasks: Manuelle Wochensteuerung

**Input**: Design documents from `specs/004-manuelle-wochensteuerung/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui.md, quickstart.md

Keine automatisierten Tests (Verfassung I); Prüfung nach [quickstart.md](quickstart.md) und
docs/pruefung.md. Fachfunktionen lassen sich per `node --input-type=module -e "await import('./js/…')"`
prüfen; Prüfskripte nur im Scratchpad, nicht im Repository.

## Phase 1: Setup

- [X] T001 Ausgangsstand festhalten: aktuelle Kopfzeile („Woche 6 von 12 · Phase 2“ am 2026-11-22) und Seitenhöhe bei 320/390 px ohne Einträge notieren (Vergleich für FR-014/SC-005; Notiz/Skript nur im Scratchpad)

## Phase 2: Foundational (blockiert alle User Stories)

- [X] T002 [P] In js/calendar.js `clampWeek(week, totalWeeks)` (Ganzzahl auf 1…totalWeeks begrenzen; ungültig → 1) und `initialWeek(startDate, totalWeeks, today = new Date())` (= `clampWeek(planWeek(startDate, today), totalWeeks)`, ohne gültiges `startDate` 1) ergänzen; Kopfkommentar von `planWeek` anpassen („nur noch für den Startwert beim Umstieg“)
- [X] T003 [P] In js/log.js: `LOG_SCHEMA = 3`; `MIGRATIONS[2] = (doc) => ({ ...doc, schema: 3, currentWeek: null })` mit Kommentar; `emptyLog()` mit `currentWeek: null`; neue Funktion `validCurrentWeek(value)` → gibt `{ number, changedAt }` zurück, wenn „`number` Ganzzahl ≥ 1“ und „`changedAt` Text oder `null`“, sonst `null`; neue Funktion `setCurrentWeek(log, number)` setzt `log.currentWeek = { number, changedAt: new Date().toISOString() }`; neue Funktion `ensureCurrentWeek(log, startNumber)` setzt `{ number: startNumber, changedAt: null }`, wenn `validCurrentWeek(log.currentWeek)` null ist, und gibt zurück, ob etwas gesetzt wurde
- [X] T004 In js/log-storage.js prüfen, dass `loadLog` ein Schema-2-Dokument über `migrate()` auf Schema 3 bringt und vorher `trainingsplan.log.backup` schreibt (keine Codeänderung erwartet; nur Kommentar „…v1“ ggf. ergänzen); ein ungültiges `currentWeek` macht das Dokument nicht „defekt“ (`isLogDocument` bleibt unverändert)
- [X] T005 In js/app.js beim Start nach `openLog()`: `ensureCurrentWeek(state.log, initialWeek(plan.startDate, plan.totalWeeks))`; wenn gesetzt und `state.logWritable`, `saveLog(state.log)` (Fehler still ignorieren – Anzeige funktioniert trotzdem); neue Funktion `currentWeek()` = `clampWeek(validCurrentWeek(state.log.currentWeek)?.number ?? 1, state.plan.totalWeeks)`; alle Aufrufe von `planWeek(plan.startDate)` in js/app.js durch `currentWeek()` ersetzen; Startphase `state.phaseId = phaseForWeek(plan.phases, currentWeek()).id`

**Checkpoint**: App startet mit migriertem Protokoll, Kopf zeigt die übernommene Woche (am 2026-11-22: Woche 6), Trainings unverändert (quickstart 1).

## Phase 3: User Story 1 – Aktuelle Woche sehen und nächste Woche starten (P1) 🎯 MVP

**Goal**: „+“ im Kopf erhöht die Woche um eins; die Phase der neuen Woche ist gewählt; Woche bleibt über Neuladen und Tage.
**Independent Test**: quickstart 2.

- [X] T006 [P] [US1] In index.html den Kopf umbauen: `<div id="week-control" class="week-control">` mit `<button id="week-back" type="button" class="week-button" hidden>−</button>`, dem bestehenden `<p id="plan-subtitle" class="plan-subtitle" aria-live="polite">` und `<button id="week-forward" type="button" class="week-button" hidden>+</button>`
- [X] T007 [P] [US1] In js/format.js `describeWeek(plan, week)` vereinfachen: nur noch `Woche ${week} von ${plan.totalWeeks} · ${phaseLabel(…)}` plus ` · Entlastungswoche`; Zweige für `null`, `< 1` und `> totalWeeks` sowie `formatDateLong` entfernen (Import von `parseDate` nur entfernen, wenn unbenutzt); neue Funktion `weekButtonLabels(week, totalWeeks)` → `{ back: week > 1 ? "Zurück zu Woche N−1" : "Woche zurück", forward: week < totalWeeks ? "Woche N+1 starten" : "Woche weiter" }`
- [X] T008 [US1] In js/ui-workout.js `renderWeekControl({ text, canBack, canForward, backLabel, forwardLabel }, onChange)`: setzt Text von `#plan-subtitle`, zeigt beide Knöpfe, `disabled` und `aria-label` nach den Werten; Klick ruft `onChange(-1)` bzw. `onChange(+1)`; Ereignisse nur einmal binden (z. B. Rückruf in Modulvariable merken); kennt nur `#week-control`, `#week-back`, `#plan-subtitle`, `#week-forward`; Kopfkommentar/Dateiliste in js/ui-workout.js ergänzen
- [X] T009 [US1] In js/app.js `showWeek()` (ruft `renderWeekControl` mit `describeWeek(plan, currentWeek())`, `canBack = week > 1`, `canForward = week < totalWeeks`, Labels aus `weekButtonLabels`) und `changeWeek(delta)` nach contracts/ui.md: `ensureWritable()` sonst Abbruch; `next = clampWeek(currentWeek() + delta, total)`; gleich → nichts; `setCurrentWeek(state.log, next)`; `commitLog()` schlägt fehl → `showWeek()` und Abbruch; sonst `cancelUndo()`, `state.phaseId = phaseForWeek(plan.phases, next).id`, `showWeek()`, `showPhaseNavigation()`, `showWorkout()`, `saveView()`; Fokus bleibt auf dem angetippten Knopf (bzw. auf dem anderen, wenn er deaktiviert wurde); in `start()` `elements.subtitle.textContent = describeWeek(…)` durch `showWeek()` ersetzen
- [X] T010 [P] [US1] In style.css `.week-control` (Flex-Zeile, `align-items: center`, Abstand 8–10 px, Text mittig `flex: 1`, darf umbrechen, kein horizontales Scrollen bei 320 px) und `.week-button` (≥ 44 × 44 px, rund oder abgerundet, nur `:root`-Farbvariablen, Fokusrahmen sichtbar, `:disabled` gedämpft mit erkennbarem Unterschied in Hell und Dunkel, `[hidden]` blendet aus); `.plan-subtitle` Rand oben auf 0, falls nötig

**Checkpoint**: Woche 4 → „+“ → „Woche 5 von 12 · Phase 2“, Phase 2 gewählt, Karten mit Phase-2-Werten; Neuladen behält Woche 5; in Woche 12 ist „+“ deaktiviert.

## Phase 4: User Story 2 – Zur vorherigen Woche zurückkehren (P1)

**Goal**: „−“ senkt die Woche um eins, die Phase folgt; Woche 1 ist die untere Grenze.
**Independent Test**: quickstart 3.

- [X] T011 [US2] In js/app.js/js/ui-workout.js prüfen und ggf. nachziehen, dass „−“ über dieselbe `changeWeek(-1)` läuft: Woche 5 → 4 wählt Phase 1, Woche 7 → 6 bleibt Phase 2, in Woche 1 ist „−“ `disabled` mit Label „Woche zurück“
- [X] T012 [US2] In js/app.js sicherstellen, dass ein Wochenwechsel immer die Phase der neuen Woche wählt, auch wenn vorher in der Phasenleiste eine andere Phase angesehen wurde (Spec, Edge Case „Gewählte Phase weicht von der Woche ab“), und dass offene Übung (`state.openExerciseId`) und `state.warmupOpen` erhalten bleiben

**Checkpoint**: „+“ gefolgt von „−“ stellt Woche und Phase vollständig wieder her.

## Phase 5: User Story 3 – Protokoll vermerkt die eingestellte Woche (P2)

**Goal**: Neue Trainings tragen die eingestellte Woche und deren Entlastung.
**Independent Test**: quickstart 4.

- [X] T013 [US3] In js/app.js `sessionContext()`: `week = currentWeek()` (nie mehr `null`), `deload = isDeloadWeek(plan.phases, week)`, `planStart` unverändert `plan.startDate || null`; bestehendes Verhalten von `currentSession` (Angaben beim Anlegen festhalten) unverändert lassen, damit ein bereits angelegtes Training seine Woche behält
- [X] T014 [P] [US3] In js/log.js den Kommentar von `currentSession` anpassen (`context.week` = eingestellte Woche) – keine Logikänderung

**Checkpoint**: Woche 6 einstellen, Power antippen → Training mit `week: 6`; danach Woche 7 → heutiges Training bleibt `week: 6`.

## Phase 6: User Story 4 – Woche bei Sicherung und Wiederherstellung (P3)

**Goal**: Woche ist in der Sicherung; beim Import gewinnt die zuletzt vom Nutzer eingestellte Woche.
**Independent Test**: quickstart 5.

- [X] T015 [US4] In js/log.js `parseImport`: nach `migrate()` `doc.currentWeek = validCurrentWeek(doc.currentWeek)` (ungültig → `null`, Datei wird trotzdem übernommen); `exportLog` unverändert (Woche ist Teil des Dokuments)
- [X] T016 [US4] In js/log.js `mergeLog`: Woche nach research.md R3 übernehmen – `incoming = validCurrentWeek(imported.currentWeek)`; übernehmen, wenn `incoming?.changedAt` gesetzt ist und (`validCurrentWeek(log.currentWeek)?.changedAt` fehlt/`null` oder älter ist); Ergebnis um `weekTaken: number | null` ergänzen; Funktionskommentar ergänzen
- [X] T017 [US4] In js/app.js `importBackup`: nach erfolgreichem `commitLog()` bei `result.weekTaken` `state.phaseId = phaseForWeek(…, currentWeek()).id`, `showWeek()`, `showPhaseNavigation()`; Meldung um „ · Woche N übernommen.“ ergänzen

**Checkpoint**: Sicherung mit Woche 8 auf leerem Gerät → Woche 8; ältere Sicherung gegen neuere Gerätewoche → Gerätewoche bleibt; Schema-2-Sicherung → Trainings übernommen, Woche unverändert.

## Phase 7: Polish & Querschnitt

- [X] T018 [P] In index.html Infokarte „Kürzel & Bedienung“ → Bedienung: Punkt „**−** / **+** neben der Woche: zur vorherigen Woche zurück bzw. nächste Woche starten – wenn die Leistung es erlaubt. Die Phase folgt der Woche.“
- [X] T019 [P] In js/ui-info.js `renderPlanDetails`: am Anfang einen kurzen Satz „Die Woche zählst du selbst weiter (+ im Kopf), sobald du für die nächste bereit bist.“ (per `makeElement`)
- [X] T020 In sw.js `CACHE_NAME` von `trainingsplan-v14` auf `trainingsplan-v15` hochzählen (keine neuen Dateien in `APP_SHELL`)
- [X] T021 [P] SPEC.md nachziehen: Kopf mit „−“/„+“, keine Texte „Start am …“/„Plan abgeschlossen“, Woche vom Nutzer geführt und dauerhaft, Phase folgt dem Wochenwechsel, Verhalten an den Grenzen, Wiederherstellen am selben Tag/nächsten Tag
- [X] T022 [P] docs/datenformate.md nachziehen: A1 `startDate` (nur Startwert beim Umstieg), `created` (wird nicht angezeigt); B1/B2 Schema 3 und `currentWeek` laut data-model.md; B3 `week`/`deload`/`planStart`; B5 abgeleitete Werte; B6 Schritt 2 → 3; B7 Woche in der Sicherung und Zusammenführen
- [X] T023 [P] docs/architektur.md nachziehen: Modultabelle (`calendar.js`: `clampWeek`/`initialWeek`; `log.js`: aktuelle Woche; `ui-workout.js`: Wochensteuerung; `app.js`: Aktion Woche wechseln), Zustandstabelle (Woche in `state.log.currentWeek`, Phase beim Start = Phase der eingestellten Woche), „wo ändere ich was?“ ggf. ergänzen
- [X] T024 [P] docs/pruefung.md: „Wochenerkennung“ durch Wochensteuerung ersetzen (Wechsel ±1, Phasengrenzen 4↔5/8↔9, Grenzen 1/12, Erhalt nach Neuladen, Migration Schema 2 → 3, Woche in Sicherung)
- [X] T025 [P] specs/README.md: Zeile für 004-manuelle-wochensteuerung ergänzen; spec.md Status auf „Umgesetzt (Datum, archiviert)“ mit Archiv-Hinweis wie bei 003
- [X] T026 Gesamtprüfung nach quickstart.md 1–8 und docs/pruefung.md (Hell/Dunkel, 320 px, offline, Sichern/Wiederherstellen); Ergebnis kurz im Commit/der Rückmeldung festhalten

## Dependencies & Execution Order

- Phase 1 → Phase 2 → User Stories.
- T002 und T003 parallel; T004 nach T003; T005 nach T002 und T003.
- US1 (T006–T010) nach Phase 2; T006, T007, T010 parallel; T008 nach T006; T009 nach T007 und T008.
- US2 (T011–T012) nach US1 (nutzt `changeWeek` und `renderWeekControl`).
- US3 (T013–T014) nur nach Phase 2 – unabhängig von US1/US2.
- US4 (T015–T017) nur nach Phase 2; T017 braucht `showWeek()` aus T009.
- Polish nach allen Stories; T020 vor T026; Doku-Aufgaben T021–T025 parallel.

## Parallel Example

```text
Phase 2:  T002 (js/calendar.js)  ∥  T003 (js/log.js)
US1:      T006 (index.html)  ∥  T007 (js/format.js)  ∥  T010 (style.css)
Polish:   T018 ∥ T019 ∥ T021 ∥ T022 ∥ T023 ∥ T024 ∥ T025
```

## Implementation Strategy

- **MVP**: Phase 1–3 (Foundational + US1) – Woche sichtbar, „+“ mit Phasenwechsel, dauerhaft
  gespeichert. Danach US2 (gleiches Muster, schnell) und US3 (eine Zeile in `sessionContext`).
- US4 zuletzt; bis dahin ist die Woche bereits in der Sicherungsdatei enthalten, nur das
  Zusammenführen fehlt.
- Ein Commit für das ganze Feature (Code + Doku + `CACHE_NAME`), wie in CLAUDE.md verlangt.
