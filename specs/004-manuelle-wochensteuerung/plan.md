# Implementation Plan: Manuelle Wochensteuerung

**Branch**: `004-manuelle-wochensteuerung` | **Date**: 2026-11-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-manuelle-wochensteuerung/spec.md`

## Summary

Die aktuelle Planwoche wird nicht mehr aus `startDate` und dem heutigen Datum berechnet, sondern
vom Nutzer im Kopf mit „−“/„+“ geführt. Die Phase folgt der Woche (Phasengrenzen aus
`plan.json`). Die Woche wird im Protokoll-Dokument gespeichert (`currentWeek`, Schema 2 → 3 mit
Migration) und ist damit sofort gesichert, Teil der Sicherungsdatei und bei Updates geschützt.
Beim Umstieg wird einmalig die bisher berechnete Woche übernommen. Umsetzung im bestehenden
Modulaufbau, ohne neue Dateien; `plan.json` bleibt im Format unverändert.

## Technical Context

**Language/Version**: HTML, CSS, JavaScript (ES-Module, direkt vom Browser geladen)

**Primary Dependencies**: keine

**Storage**: `localStorage` über `js/log-storage.js`; Protokoll-Dokument Schema 3 mit neuem Feld
`currentWeek` ([data-model.md](data-model.md)); Anzeigezustand `trainingsplan.view` unverändert

**Testing**: manuell nach `docs/pruefung.md` und [quickstart.md](quickstart.md); Fachfunktionen
per `import()` in Node/Konsole; ggf. Prüfskript nur im Scratchpad

**Target Platform**: Safari auf iOS (Home-Bildschirm-App), Desktop-Browser zur Entwicklung

**Project Type**: statische PWA

**Performance Goals**: Wochenwechsel ohne spürbare Verzögerung (ein Neuzeichnen der Einheit wie
beim Phasenwechsel)

**Constraints**: offline, relative Pfade, Touch ≥ 44 px, 320 px ohne horizontales Scrollen,
Hell/Dunkel, WCAG AA; vorhandene Protokolldaten nie verwerfen

**Scale/Scope**: 12 Wochen, 3 Phasen, 3 Einheiten; 1 Nutzer

Offene Punkte: keine – Entscheidungen in [research.md](research.md) (R1–R8).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* Verfassung 2.4.0.

| Prinzip | Prüfung | Ergebnis |
|---|---|---|
| I Reines Web | keine Bibliothek, kein Build, keine neue Datei | ✅ |
| II Mobile-first | „−“/„+“ je ≥ 44 × 44 px, AA-Kontrast auch deaktiviert, Dark Mode über `:root`-Variablen, 320 px ohne Querscrollen | ✅ |
| III Fokus/Karte | Hauptansicht zeigt weiter die Einheit der aktuellen Woche (jetzt: eingestellte Woche); Steuerung in der vorhandenen Kopfzeile, keine zusätzliche Zeile; Karten unverändert; Wochenwechsel = ein Antippen | ✅ |
| IV Plandaten | Phasengrenzen, Entlastungswochen, Planlänge weiter nur aus `plan.json`; Code enthält nur ±1 und die Grenzen 1…`totalWeeks` aus dem Plan; `plan.json` unverändert und nie von der App geschrieben; IDs unverändert | ✅ |
| V Offline | keine neuen Dateien; `CACHE_NAME` hochzählen (eigene Aufgabe) | ✅ |
| VI Sicherheit | Infokarten unverändert in Reihenfolge; „Sicherheit zuerst“ bleibt | ✅ |
| VII Protokoll | Woche gehört zum Fortschritt des Nutzers und liegt nur auf dem Gerät; sofort gespeichert über `commitLog`, Meldung bei Fehler; `LOG_SCHEMA` 2 → 3 mit Migrationsschritt, Backup vor Umwandlung; in Sicherung enthalten; ältere Sicherungen lesbar; Trainings unverändert | ✅ |
| Code-Aufbau | `localStorage` nur in `log-storage.js` (unverändert genutzt); Fachlogik ohne DOM (`clampWeek`, `initialWeek` in `calendar.js`; `setCurrentWeek`, Migration, Merge in `log.js`; Texte in `format.js`); UI per `makeElement`/vorhandene Elemente, kein `innerHTML` | ✅ |
| Entwicklungsablauf | Prüfung „Wochenerkennung“ in `docs/pruefung.md` wird zu „Wochensteuerung“; Wortlaut der Verfassung („Phasenwechsel und Wochenerkennung“) bleibt sinngemäß gültig – keine Verfassungsänderung nötig | ✅ |

Nach Phase 1 erneut geprüft: keine Abweichung. Hinweis: Eine spätere PATCH-Klarstellung der
Verfassung („Wochenerkennung“ → „Wochensteuerung“) ist möglich, aber nicht Voraussetzung.

## Project Structure

### Documentation (this feature)

```text
specs/004-manuelle-wochensteuerung/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ui.md
├── checklists/requirements.md
└── tasks.md            (/speckit-tasks)
```

### Source Code (repository root)

```text
index.html          Kopf: #week-control mit #week-back, #plan-subtitle (aria-live), #week-forward;
                    „Kürzel & Bedienung“: Hinweis zu −/+
style.css           .week-control (eine Zeile, Text mittig umbrechend), Knöpfe inkl. :disabled
js/calendar.js      clampWeek(week, totalWeeks), initialWeek(startDate, totalWeeks, today)
js/log.js           LOG_SCHEMA 3, MIGRATIONS[2], emptyLog mit currentWeek, setCurrentWeek,
                    Prüfung von currentWeek (ungültig → null), mergeLog übernimmt die Woche (R3)
js/log-storage.js   keine Änderung erwartet (Migration läuft über migrate())
js/format.js        describeWeek(plan, week) ohne „Start am“/„abgeschlossen“/created;
                    Labels für −/+; formatDateLong entfällt
js/ui-workout.js    renderWeekControl(...)
js/ui-info.js       Satz zur manuellen Woche in „Plan & Progression“
js/app.js           Startwert setzen, currentWeek(), changeWeek(delta), sessionContext aus der
                    eingestellten Woche, Importmeldung um die Woche ergänzen
sw.js               CACHE_NAME hochzählen
SPEC.md, docs/architektur.md, docs/datenformate.md, docs/pruefung.md, specs/README.md   nachziehen
```

`plan.json`, `plan.md`, `js/plan.js`: keine Änderung (Format und Inhalte bleiben).

**Structure Decision**: bestehende Struktur, keine neuen Dateien.

## Complexity Tracking

Keine Verstöße.
