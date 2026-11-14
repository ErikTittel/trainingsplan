# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt

Mobile Trainingsplan-PWA (iPhone, im Fitnessstudio genutzt) für einen 12-Wochen-Plan. Reines HTML/CSS/JavaScript – keine Frameworks, kein Build, keine Paketabhängigkeiten, keine CDN-Skripte, keine Tests. Verbindliche Regeln stehen in [.specify/memory/constitution.md](.specify/memory/constitution.md); sie hat Vorrang vor allem anderen. Produktentscheidungen zur Oberfläche: [SPEC.md](SPEC.md).

Sprache: Oberfläche, Inhalte, Commit-Nachrichten und Erklärungen an den Nutzer auf Deutsch; Erklärungen verständlich für Grundkenntnisse.

## Lokal starten

`fetch("plan.json")` funktioniert nicht über `file://` – immer über einen statischen Server öffnen, z. B.:

```
python -m http.server 8000
```

Prüfen vor dem Commit (manuell, es gibt keine automatisierten Tests): Hell- und Dark Mode, schmale Mobilbreite, vollständige Karteninhalte samt Legende, Phasenwechsel, ab 320 px ohne horizontales Scrollen, Wochenerkennung; bei Änderungen an `sw.js` zusätzlich Offline-Verhalten. Der Service Worker liefert cache-first aus – beim Testen ggf. DevTools „Update on reload“ nutzen oder Cache leeren.

## Architektur

- **`plan.json`** – einzige Quelle der Trainingsinhalte (Workouts, Übungen, Sicherheitsregeln, Periodisierung). `plan.md` und das PDF sind die menschenlesbare Vorlage; inhaltliche Änderungen in `plan.json` **und** `plan.md` konsistent nachziehen.
- **`app.js`** – lädt `plan.json`, validiert es und rendert alles per DOM (`makeElement`, kein `innerHTML`). Zustand: `selectedDay` (Mo/Do/Sa) und `selectedPhase` (`phase1`–`phase3`); jeder Klick rendert den betroffenen Bereich neu.
  - Die Plan-Struktur ist in Konstanten fest verdrahtet: `DAY_ORDER`/`DAY_NUMBERS` (nur Mo, Do, Sa – Lauf-/Recovery-Tage werden bewusst nicht gezeigt), `PHASES`, `TOTAL_WEEKS`, `DELOAD_WEEKS`. Ändert sich die Planstruktur, müssen diese mit `plan.json` übereinstimmen.
  - Pro Übung sind `phaseProgression` und `tempo` Objekte mit Schlüsseln `phase1`–`phase3` (Pflicht, sonst Ladefehler); `instructions` optional ebenfalls pro Phase. Tempo im Format `3-1-1` oder `2-1-X` (`TEMPO_PATTERN`) wird von `formatTempo` einzeilig als `↓3 · 1 · ↑1` angezeigt (Langform im `aria-label`); andere Werte (z. B. „explosiv“) nur als Text.
  - Pausen stehen in `plan.json` im Übungsnamen („…, Pause 90 s“); `splitRest` löst sie beim Rendern heraus und zeigt sie als eigene Kennzahl (`P 90 s`). `abbreviate` kürzt „/Seite“ zu „/S.“ – beides nur in der Anzeige.
  - Aktuelle Woche/Phase wird aus `plan.startDate` (JJJJ-MM-TT) berechnet; der Standard-Tag ist der heutige oder nächste Trainingstag.
  - Änderungen am Datenformat von `plan.json` im selben Commit in `app.js` (inkl. Validierung in `loadPlan`) berücksichtigen.
- **`index.html`** – statisches Gerüst mit festen IDs, die `app.js` in `elements` referenziert.
- **`style.css`** – Farben als Variablen in `:root`, Dark Mode über `prefers-color-scheme`. Touch-Flächen mind. 44 × 44 px.
- **`sw.js`** – cache-first mit `APP_SHELL`. **Jede Änderung an ausgelieferten Dateien erfordert ein Hochzählen von `CACHE_NAME`**; neue Dateien in `APP_SHELL` aufnehmen.
- Alle Pfade relativ halten (Deployment unter `/<repo-name>/`, z. B. GitHub Pages).

## UI-Grundsätze

- Hauptansicht = aktuelle Einheit; nichts hinzufügen, das sie überlädt oder Scrollen erzwingt.
- Übungskarten zeigen alle Angaben der gewählten Phase sofort und sind nicht aufklappbar. Fester Aufbau: Name → Kennzahlenzeile (Vorgabe, Tempo, RPE, Pause) → Zweck/Ablauf/Hinweis. Jede Angabe genau einmal, leere Angaben entfallen; Kürzel nur mit Legende unter „Übungen“.
- Sicherheitsregeln dürfen nie entfernt oder versteckt werden (kompakt im Bereich „Sicherheit zuerst“).

## Spec Kit

Neue Features laufen über `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`; jeder Plan enthält einen Verfassungs-Check. Bestehendes Projekt: Specs als Änderung am Ist-Zustand formulieren, die flache Dateistruktur beibehalten (keine `src/`/`tests/`-Ordner, kein Test-Framework), und das Hochzählen von `CACHE_NAME` als eigene Aufgabe einplanen.
