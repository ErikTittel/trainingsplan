# Vertrag: Speicher, Sicherungsdatei und `log.js`

Stand: Schema 2 (vereinfachte Fassung vom 2026-11-14).

Format der Daten: [../data-model.md](../data-model.md), Teil B.

## Speicherorte im Browser (`localStorage`)

| Schlüssel | Inhalt | Geschrieben von |
|---|---|---|
| `trainingsplan.log.v1` | Protokoll-Dokument (JSON-Text) | jede Eingabe |
| `trainingsplan.log.backup` | Stand vor der letzten Migration | Migration |
| `trainingsplan.log.defekt` | unlesbarer Stand, falls einer gefunden wurde | Laden |

Der Service Worker und `CACHE_NAME` fassen diese Schlüssel nie an.

## Sicherungsdatei

- Name: `trainingsprotokoll-JJJJ-MM-TT.json`, Typ `application/json`, UTF-8.
- Inhalt: das Protokoll-Dokument unverändert (eingerückt, damit es lesbar ist).
- Eine Datei ist gültig, wenn sie JSON ist, `app === "trainingsplan-log"`, `schema` eine
  Ganzzahl ≥ 1 und `sessions` ein Objekt ist, dessen Einträge `id`, `date`, `workoutId`,
  `updatedAt` und `entries` besitzen. Alles andere wird mit Fehlermeldung abgelehnt, ohne den
  Speicher zu verändern.
- `schema` kleiner als aktuell → erst migrieren, dann zusammenführen. `schema` größer als
  aktuell → ablehnen mit Hinweis, die App zu aktualisieren.

## Funktionen in `log.js` (ohne DOM, in der Konsole prüfbar)

| Funktion | Aufgabe |
|---|---|
| `loadLog()` | Liest, prüft und migriert das Dokument (Schema 1 → 2, data-model B5); liefert ein leeres Dokument, wenn nichts gespeichert ist. Status `ok`, `leer`, `defekt`, `zu-neu`, `nicht-verfuegbar`. |
| `saveLog(log)` | Setzt `updatedAt`, schreibt das Dokument. Gibt zurück, ob das Schreiben gelungen ist. |
| `currentSession(log, workoutId, context, create)` | Findet das aktuelle Training (data-model B6); legt es bei `create = true` an. |
| `validateEntry(raw)` | Prüft Gewicht, Zeit, Power, Kommentar (data-model B3); wandelt „12,5“ in 12.5. `null` bei ungültigen Werten. |
| `setEntry(log, session, exerciseId, raw, target)` | Ersetzt den Eintrag der Übung vollständig durch die geprüften Werte; `false` bei ungültigen Werten. |
| `removeEntry(log, session, exerciseId)` | Löscht den Eintrag; ein leeres Training wird entfernt. |
| `lastEntry(log, exerciseId, excludeSessionId)` | Jüngster Eintrag zur Übung, optional ohne ein Training (z. B. das heutige). |
| `exportLog(log)` / `markExported(log)` | Dateiinhalt erzeugen / `lastExportAt` setzen. |
| `parseImport(text)` | Prüft und migriert eine Sicherungsdatei. |
| `mergeLog(log, imported)` | Führt zusammen (data-model B7); liefert Zähler neu/aktualisiert/unverändert. |
| `migrate(doc)` | Bringt ein Dokument schrittweise auf die aktuelle `schema`-Version. |

`app.js` ruft nur diese Funktionen auf und greift nie direkt auf `localStorage` zu.
