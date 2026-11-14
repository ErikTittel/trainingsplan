# Data Model: Trainingsprotokoll

Stand: vereinfachte Fassung vom 2026-11-14 (Protokoll-Schema 2). Die erste Fassung (Schema 1,
einzelne Sätze) wird beim Laden und beim Import umgewandelt, siehe B5.

Zwei getrennte Datenbestände (Verfassung IV und VII):

| | **Plan (Soll)** | **Protokoll (Ist)** |
|---|---|---|
| Ort | `plan.json` im Repository | `localStorage` auf dem Gerät, Schlüssel `trainingsplan.log.v1` |
| Wer schreibt | Entwickler, per Commit | App, bei jeder Eingabe |
| Inhalt | Übungen, Vorgaben, IDs, Erfassungsfelder | Trainings mit je einem Eintrag pro Übung |
| Verbindung | – | verweist über `workoutId` und Übungs-`id` auf den Plan |

```text
plan.json                          Protokoll (localStorage)
─────────                          ────────────────────────
workout  (id: "e1")  ◄───────────  session.workoutId
  └─ exercise (id: "rdl")  ◄─────  session.entries["rdl"]
       └─ log: { fields }               └─ { weight, seconds, power, note }
          (welche Felder?)                 (was war heute anders?)
```

Sätze, Wiederholungen und RPE werden nicht erfasst – sie entsprechen dem Plan.

---

## Teil A – Felder in `plan.json`

### A1. Einheit

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | Text | ja | Stabile Kennung der Einheit: `e1`, `e2`, `e3`. |

### A2. Übung

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | Text | ja | Stabile Kennung, im ganzen Plan eindeutig. Nur `a–z`, `0–9`, `-`. Wird nie umbenannt oder wiederverwendet. |
| `log.fields` | Liste | ja | Welche Werte erfasst werden, siehe A3. Leere Liste = nur Power und Kommentar. |
| `log.step` | Zahl > 0 | nein | Schrittweite der −/+-Knöpfe für Gewicht bzw. Zusatzlast in kg (Standard 2,5). |

### A3. Erfassungsfelder (`log.fields`)

| Feld | Anzeige | Gespeichert als | Bedeutung |
|---|---|---|---|
| `weight` | „Gewicht (kg)“, hinter dem Namen `80 kg` | `weight` | Trainingsgewicht |
| `addedWeight` | „Zusatzlast (kg)“, hinter dem Namen `+5 kg` | `weight` | Zusatzlast zum Körpergewicht; leer = ohne |
| `seconds` | „Zeit (s)“, hinter dem Namen `40 s` | `seconds` | Haltezeit |

`weight` und `addedWeight` schließen sich aus. Power und Kommentar gibt es bei jeder Übung.
Einseitige Übungen haben keine Seitenangabe: Gewicht und Zeit gelten für beide Seiten.

### A4. Zuordnung der 24 Übungen

| Einheit | Nr. | `id` | `log` |
|---|---|---|---|
| e1 | 1 | `hang-power-clean` | `{ "fields": ["weight"] }` |
| e1 | 2a | `klimmzug` | `{ "fields": ["addedWeight"], "step": 0.5 }` |
| e1 | 2b | `face-pull` | `{ "fields": ["weight"] }` |
| e1 | 3 | `rdl` | `{ "fields": ["weight"] }` |
| e1 | 4a | `einbein-rdl` | `{ "fields": ["weight"], "step": 1 }` |
| e1 | 4b | `wadenheben-sitzend` | `{ "fields": ["weight"] }` |
| e1 | 5 | `latzug` | `{ "fields": ["weight"] }` |
| e2 | 1 | `sprungblock` | `{ "fields": [] }` |
| e2 | 2 | `spanish-squat` | `{ "fields": ["seconds", "weight"] }` |
| e2 | 3 | `kniebeuge-box` | `{ "fields": ["weight"] }` |
| e2 | 4 | `shrimp-squat` | `{ "fields": ["weight"], "step": 1 }` |
| e2 | 5a | `beinbeuger` | `{ "fields": ["weight"] }` |
| e2 | 5b | `wadenheben-einbein` | `{ "fields": ["addedWeight"], "step": 1 }` |
| e2 | 6a | `liegestuetz` | `{ "fields": ["addedWeight"], "step": 1 }` |
| e2 | 6b | `ringrudern` | `{ "fields": ["addedWeight"], "step": 1 }` |
| e3 | 1 | `beschleunigungsblock` | `{ "fields": [] }` |
| e3 | 2 | `schraegbank` | `{ "fields": ["weight"], "step": 1 }` |
| e3 | 3 | `rudern-brustgestuetzt` | `{ "fields": ["weight"] }` |
| e3 | 4a | `druecken-stehend` | `{ "fields": ["weight"] }` |
| e3 | 4b | `seitheben-reverse-fly` | `{ "fields": ["weight"], "step": 1 }` |
| e3 | 5a | `hip-thrust` | `{ "fields": ["weight"] }` |
| e3 | 5b | `copenhagen-plank` | `{ "fields": ["seconds"] }` |
| e3 | 6a | `seil-pushdown` | `{ "fields": ["weight"] }` |
| e3 | 6b | `hammer-curl` | `{ "fields": ["weight"], "step": 1 }` |

### A5. Validierung beim Laden (`loadPlan` in `app.js`)

Ladefehler mit verständlicher Meldung, wenn einer Einheit oder Übung die `id` fehlt, sie ungültig
ist oder doppelt vorkommt; wenn `log.fields` keine Liste ist, ein unbekanntes Feld enthält, ein
Feld doppelt enthält oder `weight` und `addedWeight` zugleich; wenn `log.step` vorhanden, aber
keine Zahl > 0 ist.

---

## Teil B – Protokoll (Schema 2)

### B1. Protokoll-Dokument

| Feld | Typ | Beschreibung |
|---|---|---|
| `app` | Text | Immer `"trainingsplan-log"`. |
| `schema` | Ganzzahl | Formatversion, aktuell `2`. |
| `updatedAt` | Zeitstempel | Letzte Änderung (ISO 8601, UTC). |
| `lastExportAt` | Zeitstempel / `null` | Letzte Sicherung. |
| `sessions` | Objekt | Alle Trainings, Schlüssel = `session.id`. |

### B2. Training (`session`) – unverändert

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | Text | `<date>_<workoutId>`, z. B. `2026-11-16_e1`. |
| `date` | Text | Kalendertag in Ortszeit, `JJJJ-MM-TT`. |
| `workoutId` | Text | `e1`–`e3`. |
| `planStart` | Text / `null` | `plan.startDate` zum Zeitpunkt des Trainings. |
| `week` | Ganzzahl / `null` | Planwoche zum Zeitpunkt des Trainings. |
| `phase` | Text | Gewählte Phase beim ersten Eintrag. |
| `deload` | Wahr/Falsch | Entlastungswoche (W4, W8, W12). |
| `updatedAt` | Zeitstempel | Letzte Änderung; entscheidet beim Import. |
| `entries` | Objekt | Einträge, Schlüssel = Übungs-`id`. |

### B3. Eintrag (`entry`) – genau einer pro Übung und Training

| Feld | Typ | Pflicht | Gültig |
|---|---|---|---|
| `target` | Text | ja | Planvorgabe zum Zeitpunkt des Trainings (nur zur Einordnung) |
| `power` | Text | ja | `"weak"`, `"ok"` oder `"strong"`; Standard `"ok"` |
| `weight` | Zahl (kg) | nein | 0 < Wert ≤ 999; 0 und leer werden weggelassen |
| `seconds` | Ganzzahl | nein | 1–3600 |
| `note` | Text | nein | höchstens 200 Zeichen; leer wird weggelassen |

Ein Eintrag entsteht bei der ersten Änderung im Protokollbereich (Wert, Power oder Kommentar)
und wird bei jeder weiteren Änderung vollständig durch den sichtbaren Stand ersetzt. Ein Training
ohne Einträge wird entfernt.

### B4. Beispiel

```json
{
  "app": "trainingsplan-log",
  "schema": 2,
  "updatedAt": "2026-11-19T18:42:10.000Z",
  "lastExportAt": null,
  "sessions": {
    "2026-11-19_e2": {
      "id": "2026-11-19_e2",
      "date": "2026-11-19",
      "workoutId": "e2",
      "planStart": "2026-10-12",
      "week": 6,
      "phase": "phase2",
      "deload": false,
      "updatedAt": "2026-11-19T18:42:10.000Z",
      "entries": {
        "sprungblock": { "target": "Beidbeinig · 50–80 Kontakte", "power": "strong" },
        "spanish-squat": { "target": "2×40 s", "seconds": 40, "weight": 10, "power": "ok" },
        "kniebeuge-box": { "target": "4×6–8", "weight": 70, "power": "weak", "note": "Box eine Stufe tiefer" },
        "liegestuetz": { "target": "3×10–12 + 5 kg", "weight": 5, "power": "ok" }
      }
    }
  }
}
```

### B5. Versionierung und Migration

- `schema` steigt bei jeder Änderung, die alte Daten unlesbar machen würde. `log.js` enthält für
  jeden Schritt eine Umwandlung (`MIGRATIONS`); beim Laden und beim Import wird schrittweise auf
  die aktuelle Version gebracht. Vor einer Umwandlung wird der alte Stand unter
  `trainingsplan.log.backup` abgelegt.
- **Schritt 1 → 2** (erste Fassung → vereinfachte Fassung): Pro Eintrag wird das höchste
  `weight` und die längste `seconds` der Sätze übernommen, `note` bleibt, `power` wird `"ok"`;
  Wiederholungen, RPE, Seiten, `done` und `count` entfallen. Einträge ohne Werte (z. B. Blöcke)
  bleiben als Eintrag mit Power ok erhalten.
- Ein Dokument mit höherer `schema`-Nummer als die App kennt wird nicht verändert; die App meldet
  das und speichert nichts. Unlesbare Stände werden unter `trainingsplan.log.defekt` abgelegt.

### B6. Abgeleitete Werte (berechnet, nicht gespeichert)

| Wert | Berechnung |
|---|---|
| **Aktuelles Training** | `sessions[heute + "_" + workoutId]`; sonst das jüngste Training derselben Einheit, das weniger als 6 Stunden zurückliegt; sonst wird es beim ersten Eintrag angelegt. |
| **Jüngster Eintrag** (hinter Name/Zweck) | Heutiger Eintrag, sonst der Eintrag des Trainings mit dem spätesten `date`. |
| **Letztes Mal** (im geöffneten Bereich) | Jüngster Eintrag ohne das aktuelle Training; nur angezeigt, wenn heute schon erfasst ist. |
| **Vorbelegung** | Werte des heutigen Eintrags, sonst des jüngsten früheren; Power = heutige, sonst `ok`; Kommentar nur vom heutigen Eintrag. |
| **Kennzeichen am Nummernfeld** | `✓`, wenn das aktuelle Training einen Eintrag zur Übung hat, sonst `+`. |

### B7. Zusammenführen beim Import – unverändert

Pro Training: fehlt es auf dem Gerät → übernehmen; Datei-Stand neuer (`updatedAt`) → ersetzen;
sonst → Gerätestand bleibt. Immer ganze Trainings.

### B8. Planänderungen

Umbenennen, Umnummerieren, Verschieben: keine Wirkung (`id` bleibt). Geänderte `log.fields`:
alte Einträge bleiben; angezeigt wird, was sie enthalten. Entfernte Übung: Einträge bleiben im
Speicher und in der Sicherung.

### B9. Zustand der Oberfläche (nicht gespeichert)

`openExerciseId` in `app.js`: höchstens eine offene Übung; nach Laden und Einheitenwechsel `null`.

### B10. Größe

Ein Eintrag ≈ 60–120 Zeichen, ein Training ≈ 0,5–1 KB, ein Zyklus (36 Trainings) ≈ 20–40 KB.
