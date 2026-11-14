# Implementation Plan: Übungskarten ohne Aufklappen

**Branch**: `001-karten-alles-sichtbar` | **Date**: 2026-11-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-karten-alles-sichtbar/spec.md`

## Summary

Die aufklappbaren Übungskarten (`<details>`) werden durch statische Karten ersetzt, die alle
Angaben der gewählten Phase sofort zeigen: Titel, eine Kennzahlenzeile (Vorgabe · Tempo ·
RPE · Pause), den Zweck sowie bei Blöcken die Ablaufschritte und den Hinweis. Doppelte
Angaben entfallen. Kurze Abkürzungen (↓/↑ im Tempo, `P`, `/S.`) halten die Karte kompakt
und werden in einer einzeiligen Legende erklärt. `plan.json` bleibt unverändert; Pausen
werden beim Rendern aus dem Namen gelesen.

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript (ES2020, ohne Module-Bundler)

**Primary Dependencies**: keine

**Storage**: `plan.json` (nur lesend, unverändert); Service-Worker-Cache

**Testing**: manuelle Prüfung nach [quickstart.md](quickstart.md) (keine Test-Toolchain gemäß
Verfassung I)

**Target Platform**: iOS Safari (Home-Bildschirm-PWA), aktuelle Desktop-Browser

**Project Type**: statische Single-Page-PWA

**Performance Goals**: Ablesen einer Karte in < 3 s (SC-002); Rendern ohne spürbare
Verzögerung (22 Übungen)

**Constraints**: offline-fähig, relative Pfade, kein horizontales Scrollen ab 320 px,
Seitenhöhe +≤ 50 % (SC-004)

**Scale/Scope**: 3 Einheiten, 22 Übungen, 3 Phasen; betroffen sind `app.js`, `style.css`,
`index.html` und `sw.js` (ausgeliefert) sowie `CLAUDE.md` und `SPEC.md` (Doku)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Geprüft gegen Verfassung **2.0.0** (Prinzip III neu: „alles auf einen Blick“).

| Prinzip | Status | Anmerkung |
|---------|--------|-----------|
| I. Reines Web ohne Build | ✅ | Nur Änderungen an HTML, CSS und JS, keine neuen Abhängigkeiten |
| II. Mobile-first & studiotauglich | ✅ | Keine Touch-Interaktion mehr nötig; Umbruch ab 320 px; bestehende Farbvariablen (Dark Mode) |
| III. Alles auf einen Blick | ✅ | Karten als statisches `<article>` ohne Aufklappen/Chevron (R1); fester Aufbau Name → Kennzahlenzeile (Vorgabe, Tempo, RPE, Pause) → Zusatztexte (Vertrag); jede Angabe genau einmal, leere Angaben entfallen (data-model); alle Kürzel in der Legende (R3–R5); Infokarten „Sicherheit“/„Plan-Details“ bleiben aufklappbar (ausdrücklich erlaubt) |
| IV. Plandaten getrennt | ✅ | `plan.json` unverändert; keine Trainingsinhalte im Code. Die Abkürzungen sind reine Darstellungsregeln |
| V. Offline & relativ | ✅ | `CACHE_NAME` in `sw.js` wird hochgezählt (v7 → v8); keine neuen Dateien |
| VI. Sicherheitshinweise sichtbar | ✅ | Nicht betroffen; der Progressionshinweis im Sprungblock wird sogar dauerhaft sichtbar |
| Entwicklungsablauf | ✅ | Neue Prüfpunkte (vollständige Karteninhalte samt Legende, Phasenwechsel, 320 px) sind in [quickstart.md](quickstart.md) abgedeckt |

**Gate-Ergebnis**: Bestanden ohne Abweichungen. Die frühere Abweichung von Prinzip III ist
durch die Verfassungsänderung 1.0.0 → 2.0.0 aufgelöst.

**Folgeaufgaben aus dem Sync Impact Report der Verfassung** (Teil dieses Features):
- `CLAUDE.md`: „UI-Grundsätze“ (geschlossene Karte/`<details>`) und Prüfliste „Lokal starten“
  („Auf-/Zuklappen der Karten“) an Prinzip III 2.0.0 anpassen.
- `SPEC.md`: Abschnitt 3 „Interaktion“ (expandierbare Karten) und Abschnitt 5 „Detailniveau“
  auf dauerhaft sichtbare Karten mit Legende umstellen; die „schematische Darstellung“ bleibt
  als künftige Idee vermerkt (nicht Teil dieses Features).

**Re-Check nach Phase 1**: Bestanden. Das Design ([contracts/exercise-card.md](contracts/exercise-card.md))
entspricht Prinzip III 2.0.0 Punkt für Punkt.

## Project Structure

### Documentation (this feature)

```text
specs/001-karten-alles-sichtbar/
├── plan.md              # Diese Datei
├── research.md          # Phase 0: Entscheidungen R1–R7
├── data-model.md        # Phase 1: CardView (abgeleitet, plan.json unverändert)
├── quickstart.md        # Phase 1: manuelle Prüfszenarien
├── contracts/
│   └── exercise-card.md # Phase 1: UI-Vertrag der Karte + Legende
├── checklists/
│   └── requirements.md  # Spec-Qualitätscheck
└── tasks.md             # Phase 2 (/speckit-tasks – noch nicht erstellt)
```

### Source Code (repository root)

```text
index.html   # Legende unter Überschrift „Übungen“ ergänzen
app.js       # renderExercise(): <article> statt <details>; Hilfsfunktionen
             #   splitRest(), abbreviate(), formatTempo(); addRhythm()/addChip() entfernen
style.css    # .exercise-card ohne [open]/summary/chevron; neue .metric-row/.metric;
             #   .rhythm*, .detail-grid, .detail-chip, .exercise-details h3 entfernen
sw.js        # CACHE_NAME trainingsplan-v7 → v8
plan.json    # unverändert
CLAUDE.md    # UI-Grundsätze + Prüfliste an Verfassung 2.0.0 anpassen (nicht ausgeliefert)
SPEC.md      # Abschnitte 3 und 5 an dauerhaft sichtbare Karten anpassen (nicht ausgeliefert)
```

**Structure Decision**: Die bestehende flache Struktur bleibt. Alle Änderungen bleiben in den
vier vorhandenen Auslieferungsdateien. `.chevron` und `summary` bleiben im CSS erhalten, weil
die Infokarten (Sicherheitsregeln, Plan-Details) weiterhin `<details>` nutzen.

## Complexity Tracking

Keine Verstöße gegen Verfassung 2.0.0 – nichts zu begründen.

*Historie*: Gegen Verfassung 1.0.0 war die Aufhebung von „Details erst im geöffneten Zustand“
eine Abweichung (Begründung: ausdrücklicher Nutzerwunsch; „alle Karten standardmäßig offen“
hätte Redundanz und Toggle nicht beseitigt). Sie wurde per Verfassungsänderung 2.0.0 aufgelöst.
