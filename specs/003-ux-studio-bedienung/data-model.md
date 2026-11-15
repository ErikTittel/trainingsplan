# Data Model: UX-Überarbeitung

## Aufwärmen (`plan.json` → `workouts[].warmup`) – geändert

| Feld | Pflicht | Typ | Beschreibung |
|---|---|---|---|
| `duration` | ja | Text | z. B. „9 Min“ → Überschrift „Aufwärmen · 9 Min“ |
| `steps` | ja | Liste, ≥ 1 | Schritt = Text **oder** `{ "title": Text, "items": [Text, …] }` (≥ 1 Item) |

Prüfung in `plan.js`: sonst Ladefehler „Das Aufwärmen (warmup) für … ist ungültig.“

## Anzeigezustand (`localStorage` → `trainingsplan.view`) – neu

| Feld | Typ | Bedeutung |
|---|---|---|
| `date` | `JJJJ-MM-TT` | Tag, an dem der Zustand galt; nur bei gleichem Tag wiederhergestellt |
| `workoutId` | Text | gewählte Einheit |
| `phaseId` | Text | gewählte Phase |
| `openExerciseId` | Text / `null` | offene Übung (muss zur Einheit gehören) |
| `warmupOpen` | Wahr/Falsch | Aufwärmblock offen |
| `scrollY` | Zahl | Scrollposition |

Kein Teil des Protokolls und der Sicherungsdatei; unbekannte/ungültige Werte werden ignoriert.

## Protokoll – unverändert

Neue Fachfunktion `restoreEntry(log, session, exerciseId, entry)`: legt das Training wieder an,
falls entfernt, setzt den Eintrag, aktualisiert `updatedAt`.

## Rückgängig-Zustand (nur im Speicher, `app.js`)

`{ workoutId, exerciseId, session, entry, timer }` – verfällt nach 6 s, beim Speichern, beim
Wechsel von Einheit oder Phase.
