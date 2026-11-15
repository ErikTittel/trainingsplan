# Implementation Plan: UX-Überarbeitung für die Bedienung im Studio

**Branch**: `003-ux-studio-bedienung` | **Date**: 2026-11-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-ux-studio-bedienung/spec.md`

## Summary

Die Hauptansicht wird ruhiger (keine Eyebrows, Legende in eine Infokarte, kompakte Phasenleiste,
Aufwärmen als gegliederte Liste) und das Erfassen schneller (Power als drei Direkt-Knöpfe, die
sofort speichern; Fortschritt „3 / 8“, erledigte und nächste Übung markiert; „Weiter →“;
größere Bedienelemente; Speicher-Bestätigung; Löschen mit Rückgängig; „Letztes Mal“ immer im
offenen Bereich). Dazu: Bildschirm wachhalten und Anzeigezustand am selben Tag wiederherstellen.
Umsetzung im bestehenden Modulaufbau (`js/`), ohne neue Dateien; einzige Formatänderung ist
`warmup` in `plan.json`.

## Technical Context

**Language/Version**: HTML, CSS, JavaScript (ES-Module, direkt vom Browser geladen)

**Primary Dependencies**: keine

**Storage**: `localStorage` über `js/log-storage.js` – Protokoll unverändert (Schema 2); neu ein
getrennter Schlüssel für den Anzeigezustand

**Testing**: manuell nach `docs/pruefung.md`; zusätzlich Prüfskript mit Chrome headless über das
DevTools-Protokoll (nur lokal im Scratchpad, nicht im Repository)

**Target Platform**: Safari auf iOS (Home-Bildschirm-App), Desktop-Browser zur Entwicklung

**Project Type**: statische PWA

**Performance Goals**: Reaktion auf Antippen ohne spürbare Verzögerung; kein Neuaufbau beim
Speichern (Fokus bleibt)

**Constraints**: offline, relative Pfade, Touch ≥ 44 px (Protokollbereich ≥ 48 px), 320 px ohne
horizontales Scrollen, Hell/Dunkel, WCAG AA

**Scale/Scope**: 3 Einheiten, ~25 Übungen; 1 Nutzer

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* Verfassung 2.4.0.

| Prinzip | Prüfung | Ergebnis |
|---|---|---|
| I Reines Web | keine Bibliothek, kein Build; Wake Lock ist Browser-API | ✅ |
| II Mobile-first | Touch ≥ 44 px (Protokoll ≥ 48 px), Mindestschrift 0,85 rem, AA-Kontrast, Dark Mode über Variablen | ✅ |
| III Fokus/Karte | Planangaben sichtbar; nur Hinweistext einklappbar mit sichtbarem Anfang (2.4.0); Legende in Infokarte derselben Seite (2.4.0); „Letztes Mal“ im offenen Bereich immer (2.4.0); Wiederherstellen nur am selben Tag (2.4.0); erledigt/nächste ändern die Kartenhöhe nicht; Erfassen mit einem Antippen | ✅ |
| IV Plandaten | Aufwärmschritte in `plan.json` und `plan.md`; Prüfung in `plan.js`; `datenformate.md` im selben Commit; IDs unverändert | ✅ |
| V Offline | keine neuen Dateien; `CACHE_NAME` hochzählen | ✅ |
| VI Sicherheit | „Sicherheit zuerst“ bleibt erste Infokarte | ✅ |
| VII Protokoll | Format unverändert; Rückgängig stellt den Eintrag wieder her und speichert; Anzeigezustand getrennter Schlüssel, nicht in der Sicherung, Fehler still ignoriert | ✅ |
| Code-Aufbau | Speicherzugriff nur in `log-storage.js`; Fachlogik ohne DOM (`restoreEntry` in `log.js`); UI über `makeElement` | ✅ |

Nach Phase 1 erneut geprüft: keine Abweichung.

## Project Structure

### Documentation (this feature)

```text
specs/003-ux-studio-bedienung/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ui.md
└── tasks.md
```

### Source Code (repository root)

```text
index.html          Kopf/Abschnitte ohne Eyebrows, Aufwärmen als <details>, Legende als Infokarte, Rückgängig-Leiste
style.css           Schriftgrößen, Phasenleiste, Kartenzustände, Power-Knöpfe, größere Stepper, Animation
plan.json, plan.md  warmup → { duration, steps }
js/plan.js          Prüfung warmup
js/log.js           restoreEntry
js/log-storage.js   loadViewState / saveViewState
js/ui-workout.js    Aufwärmliste, Fortschritt, Rückgängig-Leiste, Legende
js/ui-exercise.js   Hinweis einklappbar, erledigt-Zustand, Speicher-Bestätigung
js/ui-log-panel.js  Power-Knöpfe, „Letztes Mal“ immer, „Weiter →“, Status
js/app.js           Weiter, Rückgängig, Wake Lock, Anzeigezustand
sw.js               CACHE_NAME
SPEC.md, docs/*     nachziehen
```

**Structure Decision**: bestehende Struktur, keine neuen Dateien.

## Complexity Tracking

Keine Verstöße.
