# Datenformate

Maßgebliche Beschreibung beider Datenbestände der App. Die Regeln dahinter stehen in der
[Verfassung](../.specify/memory/constitution.md) (Prinzipien IV und VII).

| | **Plan (Soll)** | **Protokoll (Ist)** |
|---|---|---|
| Ort | `plan.json` im Repository | `localStorage` auf dem Gerät |
| Wer schreibt | Entwickler, per Commit | App, bei jeder Eingabe |
| Inhalt | Phasen, Einheiten, Übungen, Hinweise | Trainings mit je einem Eintrag pro Übung |
| Code | [js/plan.js](../js/plan.js) (lesen, prüfen, aufbereiten) | [js/log.js](../js/log.js) (Regeln), [js/log-storage.js](../js/log-storage.js) (Speicher) |
| Verbindung | – | über `workoutId` und Übungs-`id` |

```text
plan.json                              Protokoll (localStorage)
─────────                              ────────────────────────
workouts[] (id: "e1")  ◄─────────────  session.workoutId
  └─ exercises[] (id: "rdl")  ◄──────  session.entries["rdl"]
       └─ log: { fields, step }             └─ { target, power, weight?, seconds?, note? }
          (was wird erfasst?)                  (was war heute?)
```

---

## Teil A – `plan.json`

`plan.json` ist die einzige Quelle der Trainingsinhalte und der Planstruktur. Die App liest sie
nur. [plan.md](../plan.md) ist die Lesefassung desselben Plans; inhaltliche Änderungen in beiden
Dateien nachziehen. Rein technische Felder (`id`, `log`, Wochenzahlen) stehen nur in `plan.json`.

### A1. Oberste Ebene

| Feld | Pflicht | Verwendet für |
|---|---|---|
| `title` | ja | Überschrift |
| `created` | ja | Stand des Plans (Text); derzeit nicht angezeigt |
| `startDate` | nein | `JJJJ-MM-TT`, geplanter Beginn von Woche 1 – nur Startwert der aktuellen Woche beim allerersten Start (daraus berechnete Woche, begrenzt auf den Plan; ohne Startdatum Woche 1). Danach stellt der Nutzer die Woche selbst ein (`currentWeek`, B2). |
| `safetyRules[]` | ja | „Sicherheit zuerst“: `title`, `text` (darf leer sein), `subItems[]` |
| `periodization.phases[]` | ja | Phasen, siehe A2 |
| `periodization.deloadNote`, `workoutGeneralNotes.breaks`, `workoutGeneralNotes.tempoNotation`, `phaseProgressionRules[]` | ja | „Plan & Progression“ |
| `workouts[]` | ja | Einheiten, siehe A3 |
| `basicIdea`, `assumptions`, `weeklySchedule`, `weeklyScheduleNotes`, `jumpAndSpeedProgression`, `badDayTrafficLightRules`, `missedTrainingAndSittingNotes`, `metrics`, `finalNote` | nein | derzeit nicht angezeigt; Teil des vollständigen Plans für spätere Funktionen |

### A2. Phase (`periodization.phases[]`)

Die Reihenfolge bestimmt die Nummer („Phase 1“, „Phase 2“ …). Die Wochen müssen lückenlos bei 1
beginnen; die letzte `lastWeek` ist die Planlänge.

| Feld | Pflicht | Beschreibung |
|---|---|---|
| `id` | ja | Schlüssel für phasenabhängige Werte der Übungen (`phase1` …). Nur `a–z`, `0–9`, `-`. Steht auch in gespeicherten Trainings – nicht umbenennen. |
| `name` | ja | z. B. „Fundament“; angezeigt als „1 Fundament“ |
| `firstWeek`, `lastWeek` | ja | Ganzzahlen; Phasenknopf zeigt „W1–4“ |
| `deloadWeek` | nein | Entlastungswoche innerhalb der Phase („Entlastungswoche“ im Kopf, „Entl.“ im Protokoll) |
| `weeks`, `volume`, `intensityAndTempo`, `kneeDepth`, `jumpAndSpeed` | ja | Texte für „Plan & Progression“ |

### A3. Einheit (`workouts[]`)

| Feld | Pflicht | Beschreibung |
|---|---|---|
| `id` | ja | Stabile Kennung (`e1` …). Nie umbenennen oder wiederverwenden. |
| `day` | ja | `Mo`, `Di`, `Mi`, `Do`, `Fr`, `Sa` oder `So`; je Tag höchstens eine Einheit. Nur Tage mit einer Einheit erscheinen in der Tagesauswahl (Lauf-/Recovery-Tage stehen nicht in `workouts`). |
| `title` | ja | „Einheit 1 – Zug und Hüfte“; der Tagesknopf zeigt den Teil nach „Einheit N –“ |
| `warmup` | ja | Aufwärmen: `{ "duration": "9 Min", "steps": [...] }`. Ein Schritt ist ein Text oder eine Gruppe `{ "title": "5 Min Mobility", "items": ["Open Book 8/Seite", …] }`. Angezeigt als „Aufwärmen · 9 Min“ mit nummerierten Schritten, Gruppen mit Unterpunkten. |
| `exercises[]` | ja | Übungen in Anzeigereihenfolge, siehe A4 |

### A4. Übung (`exercises[]`)

Eine Übung = eine Karte; kombinierte Übungen („A + B“) werden als 6a/6b aufgeteilt.

| Feld | Pflicht | Phasenwert¹ | Beschreibung |
|---|---|---|---|
| `id` | ja | | Stabile Kennung, im ganzen Plan eindeutig, nur `a–z`, `0–9`, `-`. **Nie umbenennen oder wiederverwenden** – daran hängt das Protokoll. |
| `number` | ja | | „1“, „2a“ … (Nummernfeld) |
| `name` | ja | | Anzeigename |
| `rest` | nein | | Satzpause, z. B. „90 s“, „2 min“ → Kennzahl `P 90 s` |
| `phaseProgression` | ja | ja | Vorgabe (Sätze × Wdh., Last); „/Seite“ wird als „/S.“ angezeigt |
| `tempo` | nein | ja | `3-1-1`, `2-1-X` (3–4 Stellen) → `↓3 · 1 · ↑1`; andere Texte (z. B. „explosiv“) unverändert |
| `rpe` | nein | | z. B. „7 → 8“ |
| `why` | nein | | Zweck |
| `instructions` | nein | ja | Liste der Ablaufschritte (Blöcke) |
| `instructionsNote` | nein | | Hinweis unter den Ablaufschritten (eingeklappt einzeilig) |
| `log.fields` | ja | | Erfasste Werte, siehe A5; leere Liste = nur Power und Kommentar |
| `log.step` | nein | | Schrittweite der Gewichtsknöpfe in kg (Standard 2,5) |

¹ **Phasenwert:** entweder ein Wert für alle Phasen (`"tempo": "2-1-2"`) oder ein Objekt mit
einem Wert je Phasen-`id` (`"tempo": { "phase1": "3-1-1", "phase2": "3-0-1", "phase3": "2-1-X" }`).
`plan.js` macht daraus immer die Objektform.

### A5. Erfassungsfelder (`log.fields`)

| Feld | Eingabefeld | hinter dem Namen | gespeichert als |
|---|---|---|---|
| `weight` | „Gewicht (kg)“ | `80 kg` | `weight` |
| `addedWeight` | „Zusatzlast (kg)“, leer = ohne | `+5 kg` | `weight` |
| `seconds` | „Zeit (s)“ | `40 s` | `seconds` |

`weight` und `addedWeight` schließen sich aus. Power und Kommentar gibt es bei jeder Übung.
Einseitige Übungen haben keine Seitenangabe. Kurzhantel = Gewicht einer Hantel, Langhantel =
Gesamtgewicht.

### A6. Prüfung beim Laden

`plan.js` bricht mit einer verständlichen Meldung ab, wenn: keine Phasen oder Einheiten vorhanden
sind; Phasenwochen nicht lückenlos bei 1 beginnen oder eine Entlastungswoche außerhalb ihrer Phase
liegt; eine `id` fehlt, ungültig ist oder doppelt vorkommt; ein `day` ungültig ist oder doppelt
vorkommt; ein Name fehlt; `warmup` keine `duration` (Text) oder keine nichtleere `steps`-Liste hat
oder ein Schritt weder Text noch `{ title, items }` mit mindestens einem Punkt ist; `log.fields`
keine Liste ist, ein unbekanntes oder doppeltes Feld oder
`weight` und `addedWeight` zugleich enthält; `log.step` keine Zahl > 0 ist; ein Phasenwert für eine
Phase fehlt oder den falschen Typ hat.

---

## Teil B – Protokoll

### B1. Speicherorte (`localStorage`)

| Schlüssel | Inhalt | geschrieben |
|---|---|---|
| `trainingsplan.log.v1` | Protokoll-Dokument (JSON) | bei jeder Eingabe und jedem Wochenwechsel; beim ersten Start mit dem Startwert der Woche |
| `trainingsplan.log.backup` | Stand vor der letzten Migration | bei Migration |
| `trainingsplan.log.defekt` | unlesbarer Stand | beim Laden, falls gefunden |
| `trainingsplan.view` | Anzeigezustand (kein Protokoll), siehe unten | bei Auswahl, Aufklappen, Scrollen, Verlassen der App |

Der Schlüsselname bleibt „…v1“; die Formatversion steht im Dokument (`schema`). Der Service
Worker berührt diese Schlüssel nie.

**Anzeigezustand** `trainingsplan.view`: `{ date, workoutId, phaseId, openExerciseId,
warmupOpen, scrollY }`. Wird nur übernommen, wenn `date` der heutige Tag ist; unbekannte IDs
werden ignoriert. Er gehört nicht zum Protokoll und nicht zur Sicherungsdatei; Lese- und
Schreibfehler werden still ignoriert.

### B2. Protokoll-Dokument (Schema 3)

| Feld | Typ | Beschreibung |
|---|---|---|
| `app` | Text | immer `"trainingsplan-log"` |
| `schema` | Ganzzahl | Formatversion, aktuell `3` (`LOG_SCHEMA`) |
| `updatedAt` | Zeitstempel | letzte Änderung (ISO 8601, UTC) |
| `lastExportAt` | Zeitstempel / `null` | letzte Sicherung |
| `currentWeek` | Objekt / `null` | vom Nutzer eingestellte Planwoche: `number` (Ganzzahl ≥ 1; für Anzeige und Protokoll auf 1 … letzte Planwoche begrenzt) und `changedAt` (Zeitstempel der letzten Änderung durch den Nutzer, `null` = nur Startwert). `null` nur direkt nach der Migration; ein ungültiger Wert gilt als `null` |
| `sessions` | Objekt | Trainings, Schlüssel = `session.id` |

### B3. Training (`session`)

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | Text | `<date>_<workoutId>`, z. B. `2026-11-16_e1` |
| `date` | Text | Kalendertag in Ortszeit, `JJJJ-MM-TT` |
| `workoutId` | Text | `id` der Einheit |
| `planStart` | Text / `null` | `startDate` zum Zeitpunkt des Trainings (nur informativ) |
| `week` | Ganzzahl / `null` | beim Anlegen eingestellte Woche (`null` nur in alten Trainings ohne Startdatum) |
| `phase` | Text | gewählte Phase beim ersten Eintrag |
| `deload` | Wahr/Falsch | die beim Anlegen eingestellte Woche ist eine Entlastungswoche |
| `updatedAt` | Zeitstempel | letzte Änderung; entscheidet beim Zusammenführen |
| `entries` | Objekt | Einträge, Schlüssel = Übungs-`id` |

### B4. Eintrag – genau einer pro Übung und Training

| Feld | Typ | Pflicht | Gültig |
|---|---|---|---|
| `target` | Text | ja | Vorgabe der Phase zum Zeitpunkt des Trainings (zur Einordnung) |
| `power` | Text | ja | `"weak"`, `"ok"`, `"strong"`; Standard `"ok"` |
| `weight` | Zahl (kg) | nein | 0 < Wert ≤ 999; Komma oder Punkt; 0 und leer werden weggelassen |
| `seconds` | Ganzzahl | nein | 1–3600 |
| `note` | Text | nein | höchstens 200 Zeichen; leer wird weggelassen |

Grenzwerte: `LIMITS` in `log.js`. Ein Eintrag entsteht bei der ersten Änderung im
Protokollbereich (auch beim Antippen einer Power-Stufe) und wird bei jeder weiteren vollständig
durch den sichtbaren Stand ersetzt. Ein Training ohne Einträge wird entfernt; „Rückgängig“ nach
dem Löschen legt es mit dem Eintrag wieder an (`restoreEntry`). Sätze, Wiederholungen, RPE und Seiten werden nicht erfasst.

```json
{
  "app": "trainingsplan-log",
  "schema": 3,
  "updatedAt": "2026-11-19T18:42:10.000Z",
  "lastExportAt": null,
  "currentWeek": { "number": 6, "changedAt": "2026-11-17T06:30:00.000Z" },
  "sessions": {
    "2026-11-19_e2": {
      "id": "2026-11-19_e2", "date": "2026-11-19", "workoutId": "e2",
      "planStart": "2026-10-12", "week": 6, "phase": "phase2", "deload": false,
      "updatedAt": "2026-11-19T18:42:10.000Z",
      "entries": {
        "sprungblock": { "target": "Beidbeinig · 50–80 Kontakte", "power": "strong" },
        "spanish-squat": { "target": "2×40 s", "seconds": 40, "weight": 10, "power": "ok" },
        "kniebeuge-box": { "target": "4×6–8", "weight": 70, "power": "weak", "note": "Box eine Stufe tiefer" }
      }
    }
  }
}
```

### B5. Abgeleitete Werte (berechnet, nicht gespeichert)

| Wert | Berechnung |
|---|---|
| Aktuelle Woche | `currentWeek.number`, begrenzt auf 1 … letzte Planwoche; Phase und Entlastung dazu aus `plan.json`. Fehlt `currentWeek` beim Start, setzt die App `{ number: <Startwert aus startDate>, changedAt: null }` (A1) |
| Aktuelles Training | `sessions[heute_workoutId]`; sonst das jüngste Training derselben Einheit, das vor weniger als 6 Stunden geändert wurde (Training über Mitternacht); sonst wird es beim ersten Eintrag angelegt |
| Jüngster Eintrag (hinter Name/Zweck) | heutiger Eintrag, sonst der des Trainings mit dem spätesten `date` |
| Letztes Mal (im offenen Bereich) | jüngster Eintrag ohne das aktuelle Training; gezeigt, sobald es ihn gibt |
| Fortschritt | Zahl der Übungen der Einheit mit Eintrag im aktuellen Training; „nächste Übung“ = erste ohne Eintrag |
| Vorbelegung | Werte des heutigen, sonst des jüngsten Eintrags; Power heutige, sonst `ok`; Kommentar nur vom heutigen Eintrag |

### B6. Versionen und Migration

- `schema` steigt, sobald alte Daten sonst nicht mehr richtig gelesen würden. Dann `LOG_SCHEMA`
  erhöhen **und** in `MIGRATIONS` (`log.js`) einen Schritt von der alten zur neuen Version
  ergänzen. Vorhandene Daten werden nie verworfen.
- Beim Laden und beim Import wird schrittweise auf die aktuelle Version gebracht; vor einer
  Umwandlung im Speicher wird der alte Stand unter `trainingsplan.log.backup` abgelegt.
- Schritt 1 → 2: pro Eintrag höchstes `weight` und längste `seconds` der Sätze, `note` bleibt,
  `power` = `"ok"`; Wiederholungen, RPE, Seiten, `done`, `count` entfallen.
- Schritt 2 → 3: `currentWeek: null` ergänzen, Trainings unverändert; den Startwert setzt die App
  beim nächsten Start (B5).
- Ein Dokument mit höherem `schema`, als die App kennt, wird nicht verändert; die App meldet das
  und speichert nichts. Unlesbare Stände werden unter `trainingsplan.log.defekt` beiseitegelegt.

### B7. Sicherungsdatei

- Name `trainingsprotokoll-JJJJ-MM-TT.json`, Typ `application/json`, Inhalt = Protokoll-Dokument
  (eingerückt).
- Gültig, wenn JSON, `app` stimmt, `schema` Ganzzahl ≥ 1 und jedes Training `id`, `date`
  (`JJJJ-MM-TT`), `workoutId`, `updatedAt` und `entries` hat. Sonst Ablehnung ohne Änderung am
  Speicher. Höheres `schema` → Hinweis, die App zu aktualisieren.
- Zusammenführen pro ganzem Training: fehlt es auf dem Gerät → übernehmen; Datei-Stand neuer
  (`updatedAt`) → ersetzen; sonst bleibt der Gerätestand.
- Woche (`currentWeek`): übernommen, wenn sie in der Datei vom Nutzer eingestellt wurde
  (`changedAt` gesetzt) und auf dem Gerät nur ein Startwert steht (`changedAt: null`) oder die
  Gerätewoche älter ist. Fehlt sie in der Datei (Schema 2) oder ist sie ungültig, bleibt die
  Gerätewoche; die Trainings werden trotzdem übernommen.

### B8. Planänderungen

Name, Nummer oder Reihenfolge ändern: keine Wirkung (die `id` bleibt). Plan kürzer als die
eingestellte Woche: gespeicherte Zahl bleibt, angezeigt und vermerkt wird die letzte Planwoche. Geänderte `log.fields`:
alte Einträge bleiben, angezeigt wird, was sie enthalten. Entfernte Übung: Einträge bleiben im
Speicher und in der Sicherung.
