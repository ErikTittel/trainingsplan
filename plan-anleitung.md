# Anleitung: Trainingsplan bearbeiten und optimieren

Diese Anleitung gilt für Menschen und KI-Agenten. Der Trainingsplan steht vollständig in
`plan.json` – das ist die einzige Quelle. Die App liest diese Datei und zeigt den Plan an; für eine
Änderung am Plan muss die App nicht angepasst werden.

## Auftrag an einen KI-Agenten

Du bekommst den aktuellen Trainingsplan (`plan.json`), die Leistungsdaten (Trainingsprotokoll)
und zusätzliche Anweisungen des Trainierenden. Optimiere den Plan auf dieser Grundlage:

1. Lies die zusätzlichen Anweisungen zuerst; sie haben Vorrang vor allgemeinen Empfehlungen.
2. Werte die Leistungsdaten aus: Verlauf von Gewicht bzw. Zeit je Übung, Power
   (`weak` = schwach, `ok`, `strong` = stark) und Kommentare, jeweils mit Woche (`week`), Phase
   (`phase`) und Entlastungswoche (`deload`). `target` ist die Vorgabe, die beim Training galt.
3. Ändere nur, was sich begründen lässt. Behalte Sicherheitsregeln (`safetyRules`) und den
   Grundgedanken des Plans bei, es sei denn, die Anweisungen verlangen etwas anderes.
4. Halte die Regeln unten ein – sonst gehen Leistungsdaten verloren oder die App lädt den Plan
   nicht.
5. Antworte mit
   - einer kurzen Liste der Änderungen, jeweils mit Begründung aus den Leistungsdaten bzw.
     Anweisungen, und
   - der **vollständigen** neuen `plan.json` als JSON (gültiges JSON, UTF-8, zwei Leerzeichen
     Einrückung, keine Kommentare).

Arbeitest du direkt im Repository (z. B. mit Claude Code), ändere nur `plan.json` und begründe die
Änderungen in der Commit-Nachricht. Leistungsdaten liegen dann als Sicherungsdatei unter
`daten/` (nie committen).

## Regeln für Änderungen

Die Leistungsdaten hängen an der `id` einer Übung, nicht an Name, Nummer oder Position.
**Die `id` steht für die Bewegung, nicht für den Text.**

| Änderung | So geht es | Leistungsdaten |
|---|---|---|
| Beschreibung ändern (`name`, `why`, `instructions`, `instructionsNote`, `phaseProgression`, `tempo`, `rpe`, `rest`) | Text ändern, `id` unverändert lassen | bleiben erhalten |
| Reihenfolge ändern, auch in eine andere Einheit | Übungsobjekt in `exercises` verschieben; die Nummern (1, 2, 3 …) vergibt die App selbst | bleiben erhalten |
| Aufwärmen ändern | `warmup.duration` und `warmup.steps` bearbeiten | nicht betroffen |
| Übung hinzufügen | neues Objekt mit neuer, nie benutzter `id` (nur `a–z`, `0–9`, `-`) | beginnen neu |
| Übung entfernen | Objekt aus `exercises` löschen **und** in `retiredExercises` eintragen: `{ "id": "…", "name": "…", "retired": "JJJJ-MM-TT" }` | bleiben im Protokoll |
| Übung durch eine andere Bewegung ersetzen (z. B. Back Squat → Front Squat) | alte Übung entfernen (siehe oben), neue mit neuer `id` anlegen | alte Werte bleiben, getrennt von den neuen |

Außerdem:

- Eine `id` (Übung, Einheit, Phase) nie umbenennen und nie wiederverwenden – auch keine aus
  `retiredExercises`.
- Jede Übung ist eine eigene Karte; es gibt keine Supersätze oder kombinierten Übungen.
- Phasenabhängige Werte (`phaseProgression`, `tempo`, `instructions`) sind entweder ein Wert für
  alle Phasen oder ein Objekt mit einem Wert je Phasen-`id` (`phase1`, `phase2`, `phase3`).
- `log.fields` legt fest, was erfasst wird: `[]`, `["weight"]`, `["addedWeight"]`,
  `["seconds"]` oder `["seconds", "weight"]` (`weight` und `addedWeight` nie zusammen).
  `log.step` = Schrittweite in kg (Standard 2,5).
- Je Wochentag (`day`) höchstens eine Einheit; die Phasenwochen beginnen lückenlos bei Woche 1.
- `plan.json` enthält nie erfasste Trainingswerte.

Alle Felder im Einzelnen: [docs/datenformate.md](docs/datenformate.md), Teil A. Im Zweifel an
vorhandenen Einträgen in `plan.json` orientieren.

## Änderung prüfen

1. `python -m http.server 8000` und `http://localhost:8000` öffnen. Verstößt `plan.json` gegen
   eine Regel, zeigt die App eine verständliche Fehlermeldung statt des Plans.
2. Die geänderten Einheiten in allen Phasen durchsehen.
3. Commit und veröffentlichen. Die App lädt `plan.json` bei Netz immer neu; ein Hochzählen von
   `CACHE_NAME` ist für Planänderungen nicht nötig.
