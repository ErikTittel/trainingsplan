# Architektur

Technischer Aufbau der App und Anleitung für Erweiterungen. Verbindliche Regeln:
[Verfassung](../.specify/memory/constitution.md). Datenformate: [datenformate.md](datenformate.md).
Oberfläche und Verhalten: [SPEC.md](../SPEC.md).

## Überblick

Eine statische Seite ohne Build: Der Browser lädt `index.html`, `style.css` und die
JavaScript-Module unter `js/` direkt (ES-Module, `<script type="module">`). Inhalte kommen aus
`plan.json`, das Protokoll liegt im `localStorage`. Ein Service Worker (`sw.js`) hält alle
App-Dateien für den Offline-Betrieb vor. `plan-anleitung.md` (Regeln zum Bearbeiten des Plans)
liest die App nur für „Für KI kopieren“.

```text
index.html ── js/app.js  (Einstieg + Steuerung: Zustand, Aktionen)
                 │
     ┌───────────┼──────────────────────────────┐
     ▼           ▼                              ▼
 Oberfläche   Fachlogik (ohne DOM)                    Speicher
 ui-workout   plan.js        ◄── plan.json            log-storage.js ◄─► localStorage
 ui-exercise  calendar.js
 ui-log-panel log.js
 ui-info      format.js
 ui-backup    ai-package.js  ◄── plan-anleitung.md
 ui-ai
 dom.js
```

## Module

| Datei | Aufgabe | darf benutzen |
|---|---|---|
| `js/app.js` | Einstieg: Service Worker registrieren, Plan und Protokoll laden, Bildschirm wachhalten (Wake Lock). Hält den **Zustand** und die **Aktionen** (Woche weiter/zurück, Tag/Phase wählen, Protokollbereich öffnen, „Weiter“, Eintrag speichern/löschen/rückgängig, sichern, wiederherstellen, für KI kopieren, Anzeigezustand merken) und stößt das Neuzeichnen an. | alle |
| `js/plan.js` | `plan.json` laden, prüfen, zum Plan-Modell aufbereiten (Phasenwerte immer als Objekt, Einheiten nach Wochentag sortiert, Übungsnummern aus der Reihenfolge, `totalWeeks`, `retiredExercises`, unveränderter Inhalt als `source`) | calendar, log |
| `js/calendar.js` | Datum, Wochentage, Woche begrenzen (`clampWeek`), Startwert der Woche aus `startDate` (`initialWeek`), Phase und Entlastungswoche einer Woche, Trainingstag von heute/als Nächstes | – |
| `js/log.js` | Protokoll-Regeln: Format, Grenzwerte, Prüfung, eingestellte Woche (`currentWeek`: prüfen, Startwert, setzen), Einträge setzen/löschen/wiederherstellen, jüngster Eintrag, Migration, Import/Zusammenführen (inkl. Woche) | calendar |
| `js/log-storage.js` | einzige Stelle mit `localStorage`: Protokoll laden (inkl. Migration, Beiseitelegen defekter Stände) und speichern; Anzeigezustand laden/speichern | log |
| `js/ai-package.js` | KI-Paket: `plan-anleitung.md` laden (`loadGuide`), Text aus Anleitung, `plan.json`, Protokoll und Anweisungen bauen (`buildAiPackage`), Dateiname | – |
| `js/format.js` | Anzeigetexte: Tempo, Kürzel, Zahlen, Einträge, Woche/Phase, Power-Symbole | calendar, log |
| `js/dom.js` | `makeElement`, `makeButton` | – |
| `js/ui-workout.js` | Wochensteuerung im Kopf („Woche N von 12“, „−“/„+“, Phase darunter), Tag- und Phasenknöpfe, Kopf der Einheit, Aufwärmliste, Übungsliste mit Fortschritt („x / y“, nächste Übung), Power-Legende, Rückgängig-Leiste | dom, calendar, format |
| `js/ui-exercise.js` | Übungskarte (inkl. einklappbarem Hinweis), Protokoll-Zusammenfassung, erledigt-Zustand, Speicher-Bestätigung | dom, format, ui-log-panel |
| `js/ui-log-panel.js` | Protokollbereich: „Letztes Mal“, Zahlen-Stepper, Power-Knöpfe, Kommentar, Status, „Weiter →“ | dom, log, format |
| `js/ui-info.js` | „Sicherheit zuerst“, „Plan & Progression“ (vollständiger übergreifender Plan: Grundidee, Wochenverteilung, Phasen, Progression, Ampelregel, Kennzahlen …) | dom |
| `js/ui-backup.js` | „Protokoll sichern“: Stand, Datei teilen/herunterladen (`deliverFile`, auch für das KI-Paket), Datei wählen | – |
| `js/ui-ai.js` | „Mit KI optimieren“: Eingabefeld für Anweisungen, Knopf „Für KI kopieren“, Zwischenablage (`copyText`), Ergebnis | – |

**Abhängigkeitsregeln**

- Fachlogik (`plan`, `calendar`, `log`, `format`, `ai-package`) kennt weder DOM noch `localStorage` – sie
  lässt sich in der Browser-Konsole oder mit Node prüfen (`import("./js/log.js")`).
- Nur `log-storage.js` greift auf `localStorage` zu.
- `ui-*.js` ändern keinen Zustand selbst; sie bekommen Daten und Rückruffunktionen
  (`onSelect`, `save`, `remove` …) von `app.js`. Jedes `ui-*`-Modul kennt nur seine eigenen
  Element-IDs aus `index.html`.
- Keine Trainingsinhalte und keine Planstruktur im Code: Phasen, Wochen, Entlastungswochen und
  Trainingstage kommen aus `plan.json`.

## Zustand und Ablauf

`app.js` hält ein Objekt `state`:

| Feld | Bedeutung | gespeichert? |
|---|---|---|
| `plan` | Plan-Modell aus `plan.js` | nein (kommt aus `plan.json`) |
| `workoutId`, `phaseId` | gewählte Einheit und Phase; Start: heutiger/nächster Trainingstag, Phase der eingestellten Woche; jeder Wochenwechsel wählt die Phase der neuen Woche | für denselben Tag¹ |
| `openExerciseId` | Übung mit offenem Protokollbereich (höchstens eine; Einheitenwechsel schließt) | für denselben Tag¹ |
| `warmupOpen` | Aufwärmblock offen (Einheitenwechsel öffnet) | für denselben Tag¹ |
| `guide` | Text von `plan-anleitung.md` (vorab geladen; `null` = noch nicht) | nein |
| `log`, `logWritable`, `logBlockedText` | Protokoll (samt eingestellter Woche `log.currentWeek`, gelesen über `currentWeek()`) und ob gespeichert werden darf | `log` ja |
| `undoTimer` | läuft, solange nach dem Löschen „Rückgängig“ angeboten wird | nein |

¹ Anzeigezustand unter `trainingsplan.view` (samt Scrollposition), siehe
[datenformate.md](datenformate.md) B1; `restoreView()` übernimmt ihn nur am selben Tag.

Ablauf einer Aktion: Oberfläche ruft Rückruf → `app.js` ändert `state` bzw. `state.log` →
speichert bei Protokolländerungen sofort (`commitLog`) → zeichnet neu. Zwei Arten des Neuzeichnens:

- `showWorkout()` baut die Einheit mit allen Karten neu (Woche/Tag/Phase wechseln, Bereich
  öffnen/schließen, Eintrag löschen, Wiederherstellen).
- `updateCardSummary()` aktualisiert nach dem Speichern nur die Angaben einer Karte, **ohne
  Neuaufbau** – so bleiben Fokus und Eingaben im offenen Bereich erhalten. Danach aktualisiert
  `showProgress()` Zähler und „nächste Übung“, `flashSaved()` zeigt die Bestätigung.

Schlägt Speichern fehl, lädt `commitLog` den gespeicherten Stand neu und zeigt eine Meldung in
`#log-message`.

## Service Worker und Updates

`sw.js` liefert cache-first aus `APP_SHELL` aus. **Jede Änderung an einer ausgelieferten Datei
erfordert ein Hochzählen von `CACHE_NAME`**, neue Dateien kommen in `APP_SHELL`. Ausnahme: die
Inhalte in `NETWORK_FIRST` (`plan.json`, `plan-anleitung.md`) holt der Service Worker bei Netz
immer frisch (höchstens `NETWORK_TIMEOUT_MS` = 4 s Wartezeit, sonst und offline aus dem Cache) –
Planänderungen brauchen deshalb kein Hochzählen. Ändert sich das **Format** von `plan.json`, ändert
sich auch Code, und `CACHE_NAME` muss hoch. Der Cache enthält
nur App-Dateien; das Protokoll im `localStorage` bleibt bei Updates unberührt. `sw.js` muss im
Wurzelverzeichnis liegen (Geltungsbereich `./`).

## Konventionen

- Alle Pfade relativ (Deployment unter `/<repo-name>/`, z. B. GitHub Pages).
- Oberfläche nur per DOM (`makeElement`), nie `innerHTML`.
- Farben nur über die Variablen in `:root` (`style.css`), Dark Mode über
  `prefers-color-scheme`; Touch-Flächen mindestens 44 × 44 px; `[hidden]` blendet immer aus.
- Bezeichner im Code englisch, Kommentare und Oberfläche deutsch.
- Keine Frameworks, keine Paketabhängigkeiten, keine Tests-Toolchain (Verfassung I); geprüft
  wird manuell nach [pruefung.md](pruefung.md).

## Erweiterungen – wo ändere ich was?

| Vorhaben | Änderungen |
|---|---|
| Übung hinzufügen, entfernen, ändern, verschieben; Aufwärmen ändern | nur `plan.json` nach [plan-anleitung.md](../plan-anleitung.md) (neue `id` für neue Übungen, entfernte in `retiredExercises`); kein `CACHE_NAME` |
| Phasen oder Wochen ändern, anderer Trainingstag | nur `plan.json` (Phasen in `periodization.phases`, Tag in `workouts[].day`); Phasen-`id`s nicht umbenennen; kein `CACHE_NAME`. Die eingestellte Woche des Nutzers bleibt; liegt sie hinter dem Planende, gilt die letzte Woche |
| Plan mit KI optimieren | In der App „Für KI kopieren“ und in einen KI-Chat einfügen – oder Sicherungsdatei nach `daten/` (ignoriert von Git) legen und einen Agenten im Repository mit [plan-anleitung.md](../plan-anleitung.md) arbeiten lassen. Ergebnis: neue `plan.json` per Commit |
| Bearbeitungsregeln oder Auftrag an die KI ändern | nur `plan-anleitung.md` |
| Neues Feld in `plan.json` | Prüfung und Aufbereitung in `plan.js`, Anzeige im passenden `ui-*.js`, [datenformate.md](datenformate.md) Teil A – alles im selben Commit |
| Neuer Erfassungswert (z. B. Distanz) | `LOG_FIELDS`, `LIMITS`, `validateEntry` in `log.js`; Stepper in `ui-log-panel.js`; `formatEntry` in `format.js`; ggf. `LOG_SCHEMA` + Migration; Legende; Doku |
| Protokollformat ändern | `LOG_SCHEMA` erhöhen und Schritt in `MIGRATIONS` ergänzen; [datenformate.md](datenformate.md) B6 |
| Anderer Speicher (z. B. IndexedDB) | nur `log-storage.js` (gleiche Funktionen `loadLog`, `saveLog`) |
| Neue Infokarte | Gerüst in `index.html`, Darstellung in `ui-info.js` (oder neues `ui-*.js`), Aufruf in `app.js` |
| Neue Ansicht (z. B. Verlauf) | neues `ui-*.js`; Auswertung als reine Funktion in `log.js`; nicht in die Übungskarte (Verfassung III) |
| Neue Datei | in `APP_SHELL` aufnehmen, `CACHE_NAME` hochzählen |
| Neues Kürzel/Symbol | Infokarte „Kürzel & Bedienung“ in `index.html` bzw. Quelle in `format.js` (Power-Symbole: `POWER_DISPLAY`) |
