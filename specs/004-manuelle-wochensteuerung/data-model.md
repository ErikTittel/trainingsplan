# Data Model: Manuelle Wochensteuerung

Änderung an [docs/datenformate.md](../../docs/datenformate.md) Teil B. `plan.json` (Teil A)
bleibt im Format unverändert.

## Protokoll-Dokument – Schema 3

Neues Feld auf oberster Ebene:

| Feld | Typ | Beschreibung |
|---|---|---|
| `schema` | Ganzzahl | jetzt `3` (`LOG_SCHEMA`) |
| `currentWeek` | Objekt / `null` | eingestellte Planwoche, siehe unten; `null` nur unmittelbar nach der Migration, bevor die App den Startwert setzt |

`currentWeek`:

| Feld | Typ | Gültig | Beschreibung |
|---|---|---|---|
| `number` | Ganzzahl | ≥ 1 | eingestellte Woche; für Anzeige und Protokoll auf 1…`totalWeeks` begrenzt |
| `changedAt` | Zeitstempel / `null` | ISO 8601 (UTC) | letzte Änderung durch den Nutzer; `null` = Startwert, nie vom Nutzer gesetzt |

```json
{
  "app": "trainingsplan-log",
  "schema": 3,
  "updatedAt": "2026-11-22T17:05:00.000Z",
  "lastExportAt": null,
  "currentWeek": { "number": 5, "changedAt": "2026-11-22T17:04:58.000Z" },
  "sessions": { "…": "unverändert (B3/B4)" }
}
```

Ein ungültiger Wert (kein Objekt, `number` keine Ganzzahl ≥ 1, `changedAt` weder Text noch
`null`) wird beim Laden und Import wie `null` behandelt; das Dokument bleibt sonst gültig.

## Migration 2 → 3

`MIGRATIONS[2] = (doc) => ({ ...doc, schema: 3, currentWeek: null })` – Trainings bleiben
unverändert. Vor der Umwandlung im Speicher legt `log-storage.js` wie bisher den alten Stand
unter `trainingsplan.log.backup` ab.

## Zustandsübergänge von `currentWeek`

```text
null ──(App-Start)──► { number: Startwert, changedAt: null }
                        │
                        ├─(„+“, number < total)──► { number + 1, changedAt: jetzt }
                        ├─(„−“, number > 1)──────► { number − 1, changedAt: jetzt }
                        └─(Import, Datei-Woche mit changedAt neuer bzw. Gerät ohne changedAt)
                                                 ──► Woche aus der Datei
```

Startwert (`initialWeek`): `clampWeek(planWeek(startDate), totalWeeks)`; ohne gültiges
`startDate` 1.

## Abgeleitete Werte (B5, neu bzw. geändert)

| Wert | Berechnung |
|---|---|
| Aktuelle Woche | `clampWeek(currentWeek.number, totalWeeks)` |
| Phase der Woche | `phaseForWeek(phases, aktuelle Woche)` – vorgewählt beim Start (außer Wiederherstellung am selben Tag) und nach jedem Wochenwechsel |
| Entlastung | `isDeloadWeek(phases, aktuelle Woche)` |

## Training (B3) – Bedeutung angepasst, Format gleich

| Feld | neu |
|---|---|
| `week` | eingestellte Woche beim Anlegen des Trainings (statt Kalenderwoche); immer 1…`totalWeeks` |
| `deload` | Entlastung der eingestellten Woche |
| `planStart` | wie bisher `startDate` beim Anlegen; nur noch informativ |

## Sicherungsdatei (B7)

- Enthält `currentWeek` (Teil des Dokuments).
- Dateien mit Schema 2 (ohne Woche) bleiben einlesbar; sie werden migriert, `currentWeek: null`
  ändert die Woche auf dem Gerät nicht.
- Zusammenführen der Woche: siehe [research.md](research.md) R3.
