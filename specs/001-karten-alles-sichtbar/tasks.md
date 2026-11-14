---

description: "Aufgabenliste für Feature 001 – Übungskarten ohne Aufklappen"
---

# Tasks: Übungskarten ohne Aufklappen

**Input**: Design-Dokumente aus `specs/001-karten-alles-sichtbar/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/exercise-card.md](contracts/exercise-card.md),
[quickstart.md](quickstart.md)

**Tests**: Keine automatisierten Tests (Verfassung I). Jede Story endet mit einer manuellen
Prüfaufgabe nach [quickstart.md](quickstart.md).

**Organization**: Nach User Stories gruppiert. Die Phasen 3–5 ändern alle `app.js` und laufen
deshalb nacheinander; `[P]` steht nur dort, wo eine andere Datei betroffen ist.

## Format: `[ID] [P?] [Story] Beschreibung`

- **[P]**: parallel möglich (andere Datei, keine offene Abhängigkeit)
- **[Story]**: US1, US2, US3 aus [spec.md](spec.md)
- Alle Pfade relativ zum Repo-Root (flache Struktur, kein `src/`)

## Ist-Zustand (Bezugspunkte für die Aufgaben)

- `app.js`: `renderExercise(exercise)` baut heute `<details class="exercise-card">` mit
  `<summary>` (Nummer, Name, Progression, „Tempo … · RPE …“, Chevron) und einem
  `div.exercise-details` (Chips über `addChip`, `h3` „Ablauf“ + `ul.instruction-list`,
  `p.instruction-note`, `h3` „Bewegungsrhythmus“ + `addRhythm`, `h3` „Trainingsziel“ + `why`).
  `TEMPO_STEPS` und `TEMPO_PATTERN` sind oben als Konstanten definiert.
- `style.css`: `.exercise-card` teilt sich Regeln mit `.info-card` (Rahmen, Schatten, `summary`-
  Layout). Die Infokarten „Sicherheit zuerst“ und „Plan & Progression“ bleiben `<details>` und
  dürfen sich optisch nicht ändern.
- Daten (`plan.json`, unverändert): 5 Namen mit `, Pause …` (Mo 1, Mo 3, Do 3, Do 4, Sa 2);
  Tempo-Werte `3-0-1`, `2-1-X`, `2-0-2` usw. sowie Wörter `explosiv`, `statisch` und leer
  (Do 1); `rpe` leer bei Do 1; `instructions` + `instructionsNote` bei Do 1
  (Sprung-/Elastizitätsblock) und Sa 1 (Beschleunigungsblock); `/Seite` in Mo 4a, Do 4
  (Phase 1), Sa 5b.

---

## Phase 1: Setup

**Purpose**: Vergleichswert für SC-004 festhalten, bevor sich etwas ändert.

- [X] T001 Lokalen Server starten (`python -m http.server 8000`), Service Worker abmelden, bei
  390 px Breite Montag/Phase 1 öffnen und die Höhe von `#exercise-list` (alle Karten
  zugeklappt) in den DevTools ablesen; den Wert als Notiz unter Szenario 11 in
  `specs/001-karten-alles-sichtbar/quickstart.md` eintragen („Ausgangswert: … px“)

---

## Phase 2: Foundational (blockiert alle Stories)

**Purpose**: Statische Karten-Grundlage in CSS und die Pausen-Zerlegung in JS.

- [X] T002 [P] In `style.css` die Karten-Regeln von den Infokarten trennen:
  `.exercise-card` aus den Selektoren `.exercise-card > summary, .info-card > summary`,
  `.exercise-card[open]` und `@media (min-width: 600px) { .exercise-card > summary }` entfernen
  (nur den `.exercise-card`-Teil, `.info-card` bleibt unverändert); die gemeinsame Regel
  `.exercise-card, .info-card` (Rahmen, Radius, Hintergrund, Schatten) behalten. Neu anlegen:
  `.exercise-card` mit `display: flex; gap: 12px; padding: 13px 15px;` (keine `min-height`,
  kein `cursor: pointer`), `.exercise-body { min-width: 0; flex: 1; }`,
  `.exercise-title` (übernimmt Schrift von `.exercise-heading strong`: 0.97rem, line-height 1.28,
  fett), `.metric-row { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 5px; }`,
  `.metric` (0.85rem, `color: var(--accent)`, `font-weight: 750`, `white-space: nowrap`),
  `.metric-main` (Vorgabe: `color: var(--text)`, `font-weight: 850`, 0.95rem,
  `white-space: normal`, damit lange Vorgaben wie „Liegestütz 3×12–15; Rudern 3×10–12“
  umbrechen) und `.exercise-purpose` (0.82rem, `color: var(--muted)`, `margin-top: 6px`,
  line-height 1.35). Nur bestehende Farbvariablen verwenden (Dark Mode automatisch).
- [X] T003 [P] In `app.js` die Funktion `splitRest(name)` ergänzen (über `renderExercise`):
  wendet `/,\s*Pause\s+(.+)$/i` auf den Namen an und gibt `{ title, rest }` zurück – `title` ist
  der Name ohne Suffix (getrimmt), `rest` die Gruppe mit „Min“ → „min“ ersetzt
  (z. B. „2–2,5 Min“ → „2–2,5 min“); ohne Treffer `{ title: name, rest: "" }`
  (research R2, data-model `title`/`rest`).

**Checkpoint**: Grundlage steht – User Stories können beginnen.

---

## Phase 3: User Story 1 – Übung auf einen Blick erfassen (Priority: P1) 🎯 MVP

**Goal**: Jede Karte zeigt ohne Tippen Nummer, Name, Vorgabe, Tempo, RPE, Pause und Zweck – als
statisches Element ohne Aufklapp-Funktion.

**Independent Test**: Montag/Phase 1 öffnen: alle 7 Karten zeigen die Angaben ohne Antippen;
Tippen bewirkt nichts; „Hang Power Clean (ab Knie)“ zeigt `P 90 s` als eigene Angabe.

- [X] T004 [US1] `renderExercise(exercise)` in `app.js` neu aufbauen: Wurzel
  `makeElement("article", "exercise-card")` statt `details`; kein `summary`, kein Chevron,
  kein `tabindex`, kein Klick-Handler (contract Regel 1). Inhalt: `span.exercise-number`
  (aria-hidden, wie bisher) + `div.exercise-body` mit
  (1) `strong.exercise-title` = `splitRest(exercise.name).title`,
  (2) `div.metric-row` mit genau diesen Kennzahlen in fester Reihenfolge, jede als eigenes
  `span.metric`: Vorgabe (`span.metric.metric-main`, Text = `phaseProgression[selectedPhase]`),
  Tempo (Text = `tempo[selectedPhase]` vorerst unverändert), RPE (`"RPE " + exercise.rpe`),
  Pause (`"P " + rest`),
  (3) `p.exercise-purpose` = `exercise.why`.
  Regel aus data-model: „Leere Felder werden **nicht** gerendert (FR-008), auch nicht als
  ‚Nicht angegeben‘“ und „Jedes Feld wird genau einmal gerendert (FR-003)“ – leere Tempo-,
  RPE-, Pause- und Zweck-Werte erzeugen kein Element. Den bisherigen `div.exercise-details`
  samt `addChip`-Aufrufen, „Bewegungsrhythmus“ und „Trainingsziel“ entfernen. Die Blöcke
  `instructions`/`instructionsNote` vorerst unverändert als Liste und Absatz am Ende von
  `div.exercise-body` anhängen (ohne `h3` „Ablauf“), damit keine Information verloren geht.
- [X] T005 [US1] In `app.js` die nicht mehr genutzte Funktion `addChip` löschen.
- [X] T006 [US1] Manuelle Prüfung nach `specs/001-karten-alles-sichtbar/quickstart.md`
  Szenarien 1, 2, 3 und 8 (Montag/Phase 1 vollständig sichtbar, Tippen ohne Wirkung, Pause aus
  dem Namen gelöst, Phasenwechsel aktualisiert alle Kennzahlen); Infokarten „Sicherheit zuerst“
  und „Plan & Progression“ klappen weiterhin auf (Szenario 14).

**Checkpoint**: MVP – Karten statisch und vollständig, noch ohne Abkürzungen/Legende.

---

## Phase 4: User Story 2 – Kompakte, redundanzfreie Darstellung (Priority: P1)

**Goal**: Tempo einzeilig mit Pfeilen, kurze Abkürzungen (`/S.`, `min`, `P`), Legende unter
„Übungen“; alte Rhythmus-Darstellung entfällt.

**Independent Test**: Karte „Klimmzug“/Phase 1 zeigt `4×4–5`, `↓3 · 0 · ↑1`, `RPE 8` je genau
einmal; „Einbein-RDL“ zeigt `3×8/S.`; Legende erklärt ↓, ↑, X, P, /S., RPE.

- [X] T007 [US2] In `app.js` die Funktion `formatTempo(tempo)` ergänzen, Rückgabe
  `{ short, long }` (research R4, data-model `tempoShort`/`tempoLong`): leerer Wert →
  `{ short: "", long: "" }`; passt der Wert nicht zu `TEMPO_PATTERN` (z. B. „explosiv“,
  „statisch“) → `short` = `long` = Wert unverändert. Sonst Werte großschreiben, an „-“ teilen
  und `short` bilden als `↓{1} · {2} · ↑{3}` plus ` · {4}` bei vier Stellen (Beispiele:
  `3-1-1` → `↓3 · 1 · ↑1`, `2-1-X` → `↓2 · 1 · ↑X`, `2-0-2-1` → `↓2 · 0 · ↑2 · 1`). `long` aus
  `TEMPO_STEPS` bilden: je Stelle „{Schritt} {Wert} s“, bei „X“ „{Schritt} explosiv“, mit
  „, “ verbunden, Präfix „Tempo: “ (z. B. „Tempo: Absenken 3 s, Pause unten 1 s, Anheben 1 s“).
- [X] T008 [US2] In `app.js` die Funktion `abbreviate(text)` ergänzen: ersetzt „/Seite“ durch
  „/S.“ (alle Vorkommen). Nur Anzeige, `plan.json` bleibt unverändert (research R3).
- [X] T009 [US2] In `renderExercise` (`app.js`) die Kennzahlen umstellen: Vorgabe =
  `abbreviate(phaseProgression[selectedPhase])`; Tempo-Element bekommt `textContent` =
  `formatTempo(...).short` und `aria-label` = `.long` (contract Regel 4); RPE-Wert unverändert
  aus den Daten übernehmen. Danach `addRhythm` aus `app.js` löschen (`TEMPO_STEPS` und
  `TEMPO_PATTERN` bleiben, sie werden von `formatTempo` genutzt).
- [X] T010 [P] [US2] In `index.html` direkt nach `<nav id="phase-navigation" …></nav>` und vor
  `#exercise-list` die statische Legende einfügen:
  `<p class="exercise-legend">Tempo ↓ ab · Pause · ↑ auf (X = explosiv) · P = Satzpause ·
  /S. = pro Seite · RPE = Anstrengung 1–10</p>` (research R5; Legende muss sichtbar sein,
  ohne aufzuklappen).
- [X] T011 [P] [US2] In `style.css` `.exercise-legend` ergänzen (0.75rem, `color: var(--muted)`,
  line-height 1.35, `margin: 0 0 10px`) und die nicht mehr genutzten Regeln entfernen:
  `.exercise-heading`, `.exercise-heading strong`/`small` (nur den `.exercise-heading`-Teil
  gemeinsamer Selektoren; `.info-card summary strong/small` bleiben), `.exercise-quick-details`,
  `.exercise-details`, `.detail-grid`, `.detail-chip` (alle Varianten), `.rhythm`,
  `.rhythm-step` (alle Varianten), `.rhythm-arrow`. `summary`, `.chevron` und
  `details[open] > summary .chevron` bleiben für die Infokarten.
- [X] T012 [US2] Manuelle Prüfung nach `specs/001-karten-alles-sichtbar/quickstart.md`
  Szenarien 4, 6, 7 und 13 (Tempo einzeilig, `/S.`, Legende, alle 5 Pausen-Karten inkl.
  „2–2,5 min“ und „90 s nach beiden Seiten“); im Screenreader bzw. DevTools-Accessibility-Baum
  das `aria-label` der Tempo-Angabe prüfen.

**Checkpoint**: US1 + US2 erfüllt – kompakte Karten mit Legende.

---

## Phase 5: User Story 3 – Blöcke mit Ablaufliste vollständig sehen (Priority: P2)

**Goal**: Sprung-/Elastizitätsblock (Do 1) und Beschleunigungsblock (Sa 1) zeigen alle
Ablaufschritte der Phase und den Hinweis dauerhaft, kompakt unter dem Zweck.

**Independent Test**: Donnerstag/Phase 2 → Sprungblock: 7 Schritte + Progressionshinweis
sichtbar, keine Tempo-/RPE-Platzhalter; Samstag → Beschleunigungsblock analog.

- [X] T013 [US3] In `renderExercise` (`app.js`) den Ablauf final ordnen (research R6, contract
  „Aufbau“): nach `p.exercise-purpose` folgt `ul.instruction-list` mit
  `instructions[selectedPhase]` (nur wenn vorhanden und nicht leer), danach
  `p.instruction-note` mit `instructionsNote` (nur wenn vorhanden); keine Zwischenüberschrift.
- [X] T014 [P] [US3] In `style.css` die Ablauf-Stile an die Karte anpassen: `.instruction-list`
  kompakter (`gap: 3px`, `margin-top: 8px`, 0.85rem, line-height 1.35) und den Selektor
  `.exercise-details .instruction-note` durch `.exercise-card .instruction-note` ersetzen
  (`margin-top: 8px`, 0.78rem, `color: var(--muted)`, line-height 1.35).
- [X] T015 [US3] Manuelle Prüfung nach `specs/001-karten-alles-sichtbar/quickstart.md`
  Szenario 5 für Donnerstag (Sprungblock) in allen drei Phasen und zusätzlich Samstag
  (Beschleunigungsblock).

**Checkpoint**: Alle User Stories erfüllt.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Auslieferung (Cache), Dokumentation gemäß Verfassung 2.0.0, Gesamtprüfung.

- [X] T016 [P] In `sw.js` `CACHE_NAME` von `"trainingsplan-v7"` auf `"trainingsplan-v8"`
  hochzählen (Verfassung V; keine neuen Dateien in `APP_SHELL`).
- [X] T017 [P] `CLAUDE.md` an Verfassung 2.0.0 anpassen: im Abschnitt „UI-Grundsätze“ den Punkt
  „Geschlossene Übungskarte …“ ersetzen durch: Übungskarten zeigen alle Angaben der Phase
  sofort und sind nicht aufklappbar; fester Aufbau Name → Kennzahlenzeile (Vorgabe, Tempo,
  RPE, Pause) → Zweck/Ablauf/Hinweis; jede Angabe genau einmal; Kürzel nur mit Legende unter
  „Übungen“. In „Lokal starten“ den Prüfpunkt „Auf-/Zuklappen der Karten“ ersetzen durch
  „vollständige Karteninhalte samt Legende, Phasenwechsel, ab 320 px ohne horizontales
  Scrollen“. Im Architektur-Abschnitt zu `app.js` erwähnen, dass Pausen per `splitRest` aus dem
  Namen gelesen werden und die Tempo-Anzeige aus `formatTempo` stammt (statt Rhythmus-Anzeige).
- [X] T018 [P] `SPEC.md` anpassen: Abschnitt 3 „Interaktion“ auf dauerhaft sichtbare Karten
  umschreiben (Name; Kennzahlenzeile Sätze/Wdh., Tempo, RPE, Pause; Zweck; bei Blöcken
  Ablauf und Hinweis; Legende für Abkürzungen); „schematische Darstellung der Übung“ als
  künftige Idee kennzeichnen. Abschnitt 5 „Detailniveau“ um „alle Angaben ohne Antippen
  sichtbar, kompakt durch Abkürzungen“ ergänzen.
- [X] T019 Gesamtprüfung nach `specs/001-karten-alles-sichtbar/quickstart.md`: Szenarien 9
  (Dark Mode), 10 (320 px, kein horizontales Scrollen), 11 (Höhe `#exercise-list` Montag/
  Phase 1 ≤ 1,5 × Ausgangswert aus T001), 12 (offline nach Cache-Wechsel), 14 und 15; bei
  Überschreitung von SC-004 Abstände/Schriftgrößen in `style.css` nachschärfen.

---

## Dependencies & Execution Order

### Phasen

- **Setup (T001)**: zuerst, weil der Ausgangswert vor jeder Änderung gemessen werden muss.
- **Foundational (T002, T003)**: nach T001; blockiert alle Stories.
- **US1 (T004–T006)**: nach Phase 2.
- **US2 (T007–T012)**: nach US1 (gleiche Funktion `renderExercise` in `app.js`).
- **US3 (T013–T015)**: nach US1; technisch unabhängig von US2, wegen `app.js` aber nicht
  gleichzeitig mit T007–T009 bearbeiten.
- **Polish (T016–T019)**: T016–T018 jederzeit nach Phase 2; T019 zuletzt.

### Innerhalb der Stories

- T004 → T005 → T006
- T007, T008 → T009 → T012; T010 und T011 parallel zu T007–T009
- T013 → T015; T014 parallel zu T013

### Parallel Opportunities

- T002 (`style.css`) ∥ T003 (`app.js`)
- T010 (`index.html`) ∥ T011 (`style.css`) ∥ T007–T009 (`app.js`)
- T014 (`style.css`) ∥ T013 (`app.js`)
- T016 (`sw.js`) ∥ T017 (`CLAUDE.md`) ∥ T018 (`SPEC.md`)

## Parallel Example: User Story 2

```text
Gleichzeitig:
  T009 Kennzahlen in renderExercise umstellen (app.js)
  T010 Legende einfügen (index.html)
  T011 Legenden-Stil + Altlasten entfernen (style.css)
```

## Implementation Strategy

### MVP (nur US1)

1. T001 → T002/T003 → T004–T006
2. Ergebnis: Karten sind statisch und vollständig – der Kernwunsch ist erfüllt.
3. Vor einer Auslieferung trotzdem T016 (Cache-Version), sonst sehen Nutzer die alte Version.

### Inkrementell

1. MVP (US1) → prüfen
2. US2 (Kompaktheit + Legende) → prüfen; erst jetzt ist FR-005/FR-007 erfüllt
3. US3 (Ablaufblöcke) → prüfen
4. Polish (Cache, CLAUDE.md, SPEC.md, Gesamtprüfung) → ein Commit auf Deutsch, z. B.
   „Übungskarten ohne Aufklappen, kompakte Kennzahlen und Legende“

## Notes

- `plan.json` und `plan.md` werden in diesem Feature nicht geändert.
- Kein `innerHTML` – alles über `makeElement` (bestehende Konvention).
- Touch-Flächen: Karten sind nicht mehr interaktiv, die 44 × 44 px-Regel betrifft nur
  Tag-/Phasen-Buttons und Infokarten (unverändert).
