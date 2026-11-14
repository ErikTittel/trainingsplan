# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt

Mobile Trainingsplan-PWA (iPhone, im Fitnessstudio genutzt) für einen 12-Wochen-Plan, mit Trainingsprotokoll (pro Übung Gewicht bzw. Zeit, Power und Kommentar; nur auf dem Gerät gespeichert). Reines HTML/CSS/JavaScript – keine Frameworks, kein Build, keine Paketabhängigkeiten, keine CDN-Skripte, keine Tests. Verbindliche Regeln stehen in [.specify/memory/constitution.md](.specify/memory/constitution.md); sie hat Vorrang vor allem anderen. Produktentscheidungen zur Oberfläche: [SPEC.md](SPEC.md).

Sprache: Oberfläche, Inhalte, Commit-Nachrichten und Erklärungen an den Nutzer auf Deutsch; Erklärungen verständlich für Grundkenntnisse.

## Lokal starten

`fetch("plan.json")` funktioniert nicht über `file://` – immer über einen statischen Server öffnen, z. B.:

```
python -m http.server 8000
```

Prüfen vor dem Commit (manuell, es gibt keine automatisierten Tests): Hell- und Dark Mode, schmale Mobilbreite, vollständige Karteninhalte samt Legende, Phasenwechsel, ab 320 px ohne horizontales Scrollen, Wochenerkennung; bei Änderungen an `sw.js` zusätzlich Offline-Verhalten; bei Änderungen am Protokoll zusätzlich: Kartenhöhe ohne Einträge unverändert, Eintrag erfassen/ändern/löschen, Angaben hinter Name und Zweck, Werte bleiben nach Neuladen und App-Update, Anzeige „Zuletzt“, Erfassen offline, Sichern/Wiederherstellen, Start mit leerem Speicher (Szenarien in [specs/002-trainingsprotokoll/quickstart.md](specs/002-trainingsprotokoll/quickstart.md)). Protokoll ansehen/leeren: DevTools → Application → Local Storage → `trainingsplan.log.v1`. Der Service Worker liefert cache-first aus – beim Testen ggf. DevTools „Update on reload“ nutzen oder Cache leeren.

## Architektur

- **`plan.json`** – einzige Quelle der Trainingsinhalte (Workouts, Übungen, Sicherheitsregeln, Periodisierung); das Soll. Wird von der App nie geschrieben. `plan.md` und das PDF sind die menschenlesbare Vorlage; inhaltliche Änderungen in `plan.json` **und** `plan.md` konsistent nachziehen.
- **`app.js`** – lädt `plan.json`, validiert es und rendert alles per DOM (`makeElement`, kein `innerHTML`). Zustand: `selectedDay` (Mo/Do/Sa), `selectedPhase` (`phase1`–`phase3`) und für das Protokoll `openExerciseId` (höchstens ein offener Protokollbereich) – nur Anzeigezustand, wird nicht gespeichert; jeder Klick rendert den betroffenen Bereich neu.
  - Die Plan-Struktur ist in Konstanten fest verdrahtet: `DAY_ORDER`/`DAY_NUMBERS` (nur Mo, Do, Sa – Lauf-/Recovery-Tage werden bewusst nicht gezeigt), `PHASES`, `TOTAL_WEEKS`, `DELOAD_WEEKS`. Ändert sich die Planstruktur, müssen diese mit `plan.json` übereinstimmen.
  - Pro Übung sind `phaseProgression` und `tempo` Objekte mit Schlüsseln `phase1`–`phase3` (Pflicht, sonst Ladefehler); `instructions` optional ebenfalls pro Phase. Tempo im Format `3-1-1` oder `2-1-X` (`TEMPO_PATTERN`) wird von `formatTempo` einzeilig als `↓3 · 1 · ↑1` angezeigt (Langform im `aria-label`); andere Werte (z. B. „explosiv“) nur als Text.
  - Pausen stehen in `plan.json` im Übungsnamen („…, Pause 90 s“); `splitRest` löst sie beim Rendern heraus und zeigt sie als eigene Kennzahl (`P 90 s`). `abbreviate` kürzt „/Seite“ zu „/S.“ – beides nur in der Anzeige.
  - Jede Einheit braucht eine `id` (`e1`–`e3`), jede Übung eine `id` (nur `a–z`, `0–9`, `-`; im ganzen Plan eindeutig) und ein `log`-Objekt – sonst Ladefehler. **Eine vergebene `id` nie umbenennen oder wiederverwenden**: Daran hängt der Verlauf im Protokoll. `log.fields` listet die erfassten Werte: `weight` (Gewicht), `addedWeight` (Zusatzlast zum Körpergewicht, schließt `weight` aus), `seconds` (Zeit); leere Liste = nur Power und Kommentar. Optional `log.step` (Schrittweite der Gewichtsknöpfe, Standard 2,5).
  - Protokoll an der Karte: Das Nummernfeld ist der Schalter (`button.log-toggle`, Kennzeichen `+`/`✓`). `updateCardSummary` schreibt den jüngsten Eintrag hinter den Namen (`span.exercise-log`: Gewicht/Zeit + Power-Smiley) und den Kommentar hinter den Zweck (`span.exercise-note`) und aktualisiert den offenen Bereich **ohne Neuaufbau** (Fokus bleibt). `renderLogPanel` baut „Letztes Mal“ (nur wenn heute erfasst) → Felder laut `log.fields` (`makeStepper`) → Power-Knöpfe → Kommentar → Status/„Eintrag löschen“. Jede Änderung und jedes Antippen eines Smileys speichert den ganzen sichtbaren Stand über `setEntry` + `commitLog()`; Öffnen allein speichert nichts. Schlägt Speichern fehl, erscheint eine Meldung in `#log-message`.
  - Aktuelle Woche/Phase wird aus `plan.startDate` (JJJJ-MM-TT) berechnet; der Standard-Tag ist der heutige oder nächste Trainingstag.
  - Änderungen am Datenformat von `plan.json` im selben Commit in `app.js` (inkl. Validierung in `loadPlan`) berücksichtigen.
- **`log.js`** – Daten- und Speicherlogik des Protokolls, ohne DOM (in der Konsole prüfbar); wird vor `app.js` geladen. `app.js` greift nie direkt auf `localStorage` zu, sondern nur über diese Funktionen (`loadLog`, `saveLog`, `currentSession`, `validateEntry`, `setEntry`, `removeEntry`, `lastEntry`, `exportLog`, `parseImport`, `mergeLog`).
  - Speicherort: `localStorage`, Schlüssel `trainingsplan.log.v1` – ein JSON-Dokument mit `schema`, `sessions` (Schlüssel `JJJJ-MM-TT_<workoutId>`) → `entries` (Schlüssel = Übungs-`id`), genau ein Eintrag pro Übung und Training: `{ target, power, weight?, seconds?, note? }` mit `power` = `weak`/`ok`/`strong` (Schema 2). Sätze, Wiederholungen, RPE und Seiten werden bewusst nicht erfasst. Format: [specs/002-trainingsprotokoll/data-model.md](specs/002-trainingsprotokoll/data-model.md).
  - Formatänderungen: `LOG_SCHEMA` erhöhen **und** einen Schritt in `MIGRATIONS` ergänzen (vorhanden: 1 → 2, Sätze → ein Eintrag); vorhandene Daten werden nie verworfen. Erfasste Werte gehören nie ins Repository.
- **`index.html`** – statisches Gerüst mit festen IDs, die `app.js` in `elements` referenziert.
- **`style.css`** – Farben als Variablen in `:root`, Dark Mode über `prefers-color-scheme`. Touch-Flächen mind. 44 × 44 px.
- **`sw.js`** – cache-first mit `APP_SHELL`. **Jede Änderung an ausgelieferten Dateien erfordert ein Hochzählen von `CACHE_NAME`**; neue Dateien in `APP_SHELL` aufnehmen. Der Cache enthält nur App-Dateien; das Protokoll im `localStorage` bleibt davon unberührt.
- Alle Pfade relativ halten (Deployment unter `/<repo-name>/`, z. B. GitHub Pages).

## UI-Grundsätze

- Hauptansicht = aktuelle Einheit; nichts hinzufügen, das sie überlädt oder Scrollen erzwingt.
- Übungskarten zeigen alle Planangaben der gewählten Phase sofort; die Planangaben sind nicht aufklappbar. Fester Aufbau: Name → Kennzahlenzeile (Vorgabe, Tempo, RPE, Pause) → Zweck/Ablauf/Hinweis. Jede Angabe genau einmal, leere Angaben entfallen; Kürzel nur mit Legende unter „Übungen“.
- Sicherheitsregeln dürfen nie entfernt oder versteckt werden (kompakt im Bereich „Sicherheit zuerst“).
- Eine Karte = eine Übung; keine kombinierten Einträge („A + B“) in `plan.json`, stattdessen 6a/6b.
- Protokoll: aufklappbarer Bereich unter den Planangaben, beim Laden geschlossen, höchstens einer offen. Geschlossen zeigt die Karte nur den jüngsten Eintrag (Werte + Power hinter dem Namen, Kommentar hinter dem Zweck); ohne Eintrag ist sie so hoch wie ohne Protokoll (deshalb ist das Nummernfeld der Schalter und das Kennzeichen absolut positioniert). Erfasst werden nur Gewicht bzw. Zeit, Power, Kommentar – keine Sätze/Wiederholungen/RPE/Seiten, keine Pflichtfelder, kein Speichern-Knopf. Verläufe/Diagramme gehören nicht in die Karte.

## Spec Kit

Neue Features laufen über `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`; jeder Plan enthält einen Verfassungs-Check. Bestehendes Projekt: Specs als Änderung am Ist-Zustand formulieren, die flache Dateistruktur beibehalten (keine `src/`/`tests/`-Ordner, kein Test-Framework), und das Hochzählen von `CACHE_NAME` als eigene Aufgabe einplanen.
