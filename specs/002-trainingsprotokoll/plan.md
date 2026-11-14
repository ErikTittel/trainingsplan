# Implementation Plan: Trainingsprotokoll

**Branch**: `002-trainingsprotokoll` | **Date**: 2026-11-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-trainingsprotokoll/spec.md`

## Summary

Unter jeder Übung lässt sich ein Protokollbereich aufklappen (Nummernfeld antippen). Erfasst
werden pro Übung und Training nur Gewicht bzw. Zeit, Power (😟 schwach · 🙂 ok · 😃 stark) und ein
Kommentar; Sätze, Wiederholungen und RPE gelten als planmäßig. Der jüngste Eintrag steht ohne
Antippen direkt hinter dem Namen (Werte, Power) und hinter dem Zweck (Kommentar). Jede Karte
steht für genau eine Übung. (Vereinfachte Fassung vom 2026-11-14, siehe Abschnitt „Änderung“.)

Technisch bleibt die App eine rein statische Seite: Das Protokoll liegt als ein versioniertes
JSON-Dokument im `localStorage` des Geräts, wird bei jeder Eingabe sofort geschrieben und lässt
sich als Datei sichern und wiederherstellen. Kein Backend, kein Konto, keine Kosten; das
Deployment (GitHub Pages, `git push`) ändert sich nicht. `plan.json` erhält pro Übung eine
stabile `id` und eine Erfassungsbeschreibung `log`; die Daten- und Speicherlogik kommt in eine
neue Datei `log.js`.

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript (ES2020, klassische Skripte, kein Bundler)

**Primary Dependencies**: keine

**Storage**: `plan.json` (nur lesend, um `id` und `log` erweitert); **neu:** `localStorage`,
Schlüssel `trainingsplan.log.v1` (Protokoll, lesend und schreibend); Service-Worker-Cache nur
für App-Dateien

**Testing**: manuelle Prüfung nach [quickstart.md](quickstart.md) (keine Test-Toolchain gemäß
Verfassung I); `log.js` ist DOM-frei und in der Browser-Konsole prüfbar

**Target Platform**: iOS Safari (Home-Bildschirm-PWA), aktuelle Desktop-Browser

**Project Type**: statische Single-Page-PWA

**Performance Goals**: Satz erfassen in einem Antippen bzw. ≤ 10 s (SC-001); Speichern und
Neuzeichnen einer Karte ohne spürbare Verzögerung (Dokument < 100 KB pro Zyklus)

**Constraints**: offline-fähig, relative Pfade, kein horizontales Scrollen ab 320 px,
Touch-Flächen ≥ 44 px, keine Übertragung von Protokolldaten, 0 € Betriebskosten

**Scale/Scope**: 1 Nutzer, 1 Gerät; 3 Einheiten, 24 Übungen, ca. 36 Trainings und 1 200 Sätze
pro Zyklus. Betroffen: `plan.json`, `app.js`, `style.css`, `index.html`, `sw.js`, neu `log.js`;
Doku `CLAUDE.md`, `SPEC.md`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Geprüft gegen Verfassung **2.1.0** (neu: Prinzip VII; III und IV erweitert).

| Prinzip | Status | Anmerkung |
|---------|--------|-----------|
| I. Reines Web ohne Build | ✅ | Nur Browser-Bordmittel (`localStorage`, `Blob`, Datei-Auswahl, Teilen-Dialog); eine zusätzliche Datei `log.js`, die unverändert ausgeliefert wird. Keine SDKs, kein CDN (R1, R2) |
| II. Mobile-first & studiotauglich | ✅ | −/+-Knöpfe und „✓“ ≥ 44 px, Zifferntastatur, Umbruch der Eingabezeile ab 320 px, bestehende Farbvariablen; Vergleich nie nur über Farbe ([contracts/log-card.md](contracts/log-card.md)) |
| III. Alles auf einen Blick | ✅ | Planangaben bleiben unverändert und nicht aufklappbar. Protokoll im aufklappbaren Bereich darunter, beim Laden geschlossen; Schalter in der linken Spalte unter der Übungsnummer, daher geschlossen keine zusätzliche Höhe (R10, SC-002a). Geöffnet: „Zuletzt“ direkt über der Eingabe, vorbelegt, keine Pflichtfelder. Keine Verläufe/Diagramme in der Karte. Eine Karte = eine Übung (kombinierte Karten aufgeteilt). Sicherungsbereich als aufklappbare Infokarte außerhalb der Übungskarten. Neue Kürzel (L/R, ▲/▼, Entl.) in der Legende |
| IV. Plandaten getrennt von Darstellung und Protokoll | ✅ | `plan.json` erhält `id` (Einheit, Übung) und `log`; die Erfassungsart steht im Plan, nicht im Code. `plan.json` wird nie geschrieben. Formatänderung und Validierung in `loadPlan` im selben Commit. `plan.md` unberührt (rein technische Felder) |
| V. Offline & relativ | ✅ | `log.js` in `APP_SHELL`, `CACHE_NAME` v9 → v10, relativer Pfad `./log.js`. Speichern funktioniert ohne Netz |
| VI. Sicherheitshinweise sichtbar | ✅ | Nicht berührt |
| VII. Trainingsprotokoll | ✅ | Nur Gerätespeicher (R1–R2); Schreiben bei jeder Eingabe; Export/Import mit Zusammenführen (R4, data-model B8); `schema` + Migration + Sicherung des Altstands (B6); Verweise nur über IDs, verwaiste Einträge bleiben (B9); App läuft mit leerem/fehlendem Speicher, Schreibfehler werden gemeldet; eigener Schlüssel, vom Cache getrennt |
| Technische Rahmenbedingungen | ✅ | Kein Server, keine gehostete Datenbank, keine Anmeldung; keine automatische Übertragung |
| Entwicklungsablauf | ✅ | Alle Protokoll-Prüfpunkte der Verfassung sind in [quickstart.md](quickstart.md) abgedeckt (Szenarien 1–5, 11, 15–17, 20, 24) |

**Gate-Ergebnis**: Bestanden ohne Abweichungen.

**Zu beobachten** (keine Abweichung): Der Schalter in der linken Spalte darf bei kurzen Karten
(Name und Kennzahlen je einzeilig, kurzer Zweck) die Karte nicht höher machen. Bei der Umsetzung
an der kürzesten Karte bei 320 px und auf dem iPhone prüfen (quickstart, Szenario 24); notfalls
Schalter und Übungsnummer zu einer Fläche zusammenlegen.

**Re-Check nach Phase 1**: Bestanden. Datenmodell und Verträge enthalten keine Elemente, die
einen Server, eine Abhängigkeit oder einen Build-Schritt voraussetzen.

## Project Structure

### Documentation (this feature)

```text
specs/002-trainingsprotokoll/
├── plan.md                 # diese Datei
├── research.md             # technisches Setup, verworfene Alternativen (R1–R9)
├── data-model.md           # Plan-Erweiterung (Teil A) und Protokoll (Teil B)
├── quickstart.md           # manuelle Prüfszenarien
├── contracts/
│   ├── log-card.md         # Protokollbereich der Übungskarte, Sicherungsbereich
│   └── log-storage.md      # Speicherschlüssel, Sicherungsdatei, Funktionen in log.js
├── checklists/
│   └── requirements.md
└── tasks.md                # entsteht mit /speckit-tasks
```

### Source Code (repository root)

```text
index.html      # + <script src="log.js"> vor app.js; Infokarte „Protokoll sichern“; Legende erweitert
log.js          # NEU: Laden/Speichern/Migrieren, Trainings und Sätze, letztes Training,
                #      Vorbelegung, Export/Import – ohne DOM
app.js          # Validierung von id/log in loadPlan; Zustand openExerciseId; Schalter und
                #      aufklappbarer Protokollbereich in renderExercise; Eingabe-Ereignisse;
                #      Sicherungsbereich
style.css       # Schalter, Protokollbereich, Protokollzeilen, Eingabezeile, Umschalter L/R
plan.json       # + workout.id, exercise.id, exercise.log (24 Übungen, siehe data-model A4);
                #   kombinierte Übungen sind bereits in 6a/6b aufgeteilt
sw.js           # APP_SHELL + "./log.js"; CACHE_NAME "trainingsplan-v10"
CLAUDE.md       # Architektur: log.js, Datenformat, Prüfpunkte
SPEC.md         # Abschnitt „Trainingsprotokoll“ (bereits ergänzt)
```

**Structure Decision**: Flache Struktur bleibt (keine `src/`-/`tests/`-Ordner). Eine neue Datei
`log.js` trennt Daten/Speicher von Darstellung (`app.js`), siehe research R8.

## Technisches Setup auf einen Blick

```text
        Repository (öffentlich)                    iPhone
┌──────────────────────────────┐      ┌────────────────────────────────────┐
│ index.html  style.css        │      │  Home-Bildschirm-App               │
│ app.js      log.js           │ ───► │  ┌──────────────┐  ┌─────────────┐ │
│ plan.json   sw.js            │ Git- │  │ Cache (sw.js)│  │ localStorage│ │
│                              │ Hub  │  │ App-Dateien  │  │ Protokoll   │ │
│ keine Trainingsdaten         │ Pages│  └──────────────┘  └──────┬──────┘ │
└──────────────────────────────┘      │                           │        │
                                      │        „Sichern“ / „Wiederherstellen“
                                      │                           ▼        │
                                      │   trainingsprotokoll-JJJJ-MM-TT.json
                                      │   (Dateien/iCloud, AirDrop, Mail)  │
                                      └────────────────────────────────────┘
```

- **Deployment**: unverändert – statische Dateien, `git push`, GitHub Pages. Keine Konten,
  Schlüssel, Umgebungsvariablen oder Dienste.
- **Kosten**: 0 €.
- **Datenfluss**: Der Plan kommt vom Hosting, das Protokoll entsteht und bleibt auf dem Gerät.
  Beide treffen sich nur im Browser über die Übungs-IDs.
- **Restrisiko**: Gerät verloren oder App vom Home-Bildschirm entfernt, ohne vorher zu sichern
  (research R3). Abgefedert durch Export und den Hinweis auf die letzte Sicherung.

## Reihenfolge der Umsetzung (Vorschlag für `/speckit-tasks`)

1. **Plan-Daten**: `id` und `log` in `plan.json`, Validierung in `loadPlan` – noch ohne
   sichtbare Änderung.
2. **`log.js`**: Speicherlogik vollständig, in der Konsole geprüft.
3. **US1 + US2 (P1)**: Schalter und aufklappbarer Protokollbereich für `weightReps`, danach die
   übrigen Arten, `perSide`, `block`.
4. **US3 (P2)**: Ändern, Löschen/Rückgängig, RPE, Notiz.
5. **US4 (P2)**: Sicherungsbereich mit Export/Import.
6. **US5 (P3)**: Stand am Schalter (`2/4`, ✓), ▲/▼.
7. **Abschluss**: Legende, `sw.js` (`APP_SHELL`, `CACHE_NAME`), `CLAUDE.md`, Prüfung nach
   quickstart inkl. iPhone.

Nach Schritt 3 ist die App bereits im Training nutzbar (MVP).

## Complexity Tracking

Keine Abweichungen von der Verfassung – Tabelle entfällt.

## Änderung 2026-11-14: Vereinfachte Erfassung

**Anlass**: Vorgabe des Nutzers (siehe [spec.md](spec.md), „Änderung“).

**Was sich ändert**

- `plan.json`: `log.type`/`perSide`/`firstSide`/`countLabel` ersetzt durch `log.fields`
  (`weight`, `addedWeight`, `seconds`; leer bei Blöcken), `step` bleibt. Spanish Squat erhält
  `["seconds", "weight"]`. Validierung in `loadPlan` angepasst.
- `log.js`: Protokoll-Schema 2 – ein Eintrag pro Übung und Training (`weight`, `seconds`,
  `power`, `note`, `target`); Migration 1 → 2; Funktionen `validateEntry`, `setEntry`,
  `removeEntry`, `lastEntry` statt Satz-Funktionen.
- `app.js`: jüngster Eintrag hinter Name und Zweck (`updateCardSummary`, aktualisiert ohne
  Neuaufbau), Kennzeichen `+`/`✓`; Bereich mit Feldern laut `log.fields`, Power-Knöpfen,
  Kommentar, Status und „Eintrag löschen“; „Letztes Mal“ nur, wenn heute erfasst ist. Entfallen:
  Satzliste, „Heute“-Zeile, Seiten-Umschalter, RPE, ▲/▼, „Rückgängig“.
- `style.css`, `index.html` (Legende), `sw.js` (`CACHE_NAME` v11).

**Verfassungs-Check (2.2.0)**: Bestanden. Prinzip III wurde für diese Änderung präzisiert
(Karten mit Eintrag zeigen den jüngsten Eintrag kompakt hinter Name und Zweck; ohne Eintrag
unverändert). I, II, IV–VII unverändert erfüllt; Daten der ersten Fassung werden migriert (VII).
