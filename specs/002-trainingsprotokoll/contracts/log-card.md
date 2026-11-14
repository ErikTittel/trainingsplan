# Vertrag: Protokoll an der Übungskarte

Stand: vereinfachte Fassung vom 2026-11-14. Ergänzt
[../../001-karten-alles-sichtbar/contracts/exercise-card.md](../../001-karten-alles-sichtbar/contracts/exercise-card.md);
der Kartenaufbau (Name → Kennzahlenzeile → Zweck/Ablauf/Hinweis) bleibt.

## Geschlossen (Zustand beim Laden)

```text
┌────────────────────────────────────────────┐
│ 3   Rumänisches Kreuzheben (Straps) 80 kg 😟│  ← jüngster Eintrag: Gewicht/Zeit + Power
│ +   4×8 · ↓2 · 1 · ↑1 · RPE 7 → 8 · P 2 min │
│     Hüftstrecker für Sprint … „Straps, gut“ │  ← Kommentar direkt hinter dem Zweck
└────────────────────────────────────────────┘
```

- **Nummernfeld = Schalter** (`button.log-toggle`, sichtbar 38 × 38 px, Touch-Fläche 44 × 44 px,
  `aria-expanded`, `aria-controls`). Darunter, absolut positioniert: `+` (heute nichts erfasst)
  oder `✓` (heute erfasst).
- **Hinter dem Namen** (`span.exercise-log`, Akzentfarbe, nicht umbrechend): Werte und Power des
  jüngsten Eintrags – heute, sonst letztes Training. Schreibweise: `80 kg 🙂`, `+5 kg 😃`,
  `40 s 🙂`, `40 s · 10 kg 🙂`, ohne Werte nur `😃`. Dezimalkomma. `aria-label` nennt, ob es
  „heute“ oder „zuletzt W5 · 07.11.“ ist.
- **Hinter dem Zweck** (`span.exercise-note`, kursiv): Kommentar desselben Eintrags in
  Anführungszeichen.
- Ohne Eintrag: keine dieser Angaben, Karte exakt so hoch wie ohne Protokoll.

## Geöffnet

```text
┌────────────────────────────────────────────┐
│ 3   Rumänisches Kreuzheben (Straps) 80 kg 🙂│
│ ✓   4×8 · ↓2 · 1 · ↑1 · RPE 7 → 8 · P 2 min │
│     Hüftstrecker für Sprint …               │
│ ─────────────────────────────────────────── │
│ Letztes Mal (W4 · 07.11. · Entl.): 80 kg 😟 │  nur wenn heute erfasst und es ein
│   · „Straps, Rücken gut“                    │  früheres Training gibt
│             Gewicht (kg)                    │
│ [ − ]          80              [ + ]        │  Felder laut log.fields
│ Power [😟 schwach] [🙂 ok] [😃 stark]        │  ok vorausgewählt
│ [ Kommentar (optional)                   ]  │
│ ✓ Heute erfasst            Eintrag löschen  │  bzw. „Noch nicht erfasst – …“
└────────────────────────────────────────────┘
```

| Element | Verhalten |
|---|---|
| Zahlenfelder | vorbelegt (data-model B6); −/+ speichert sofort; Tastatureingabe speichert beim Verlassen des Felds bzw. mit Enter; ungültige Werte: Feld markiert (`aria-invalid`), Meldung, nichts gespeichert |
| Power | drei Knöpfe (`aria-pressed`); Antippen speichert den ganzen sichtbaren Stand – auch unveränderte Werte |
| Kommentar | max. 200 Zeichen; speichert beim Verlassen bzw. Enter |
| Status | „✓ Heute erfasst“ / „Noch nicht erfasst – Wert anpassen oder Power antippen.“ |
| Eintrag löschen | nur bei heutigem Eintrag; mit Rückfrage; danach zeigt die Karte wieder das letzte Training |

- Es gibt keine Felder für Sätze, Wiederholungen, RPE oder Seiten, keinen „erledigt“-Schalter und
  keine „Heute“-Zeile.
- Speichern aktualisiert Name-/Zweck-Angaben, Kennzeichen und Status **ohne** Neuaufbau des
  Bereichs, damit Fokus und Eingaben erhalten bleiben.
- Höchstens ein Bereich ist offen; Einheitenwechsel und Neuladen schließen ihn, Phasenwechsel nicht.

## Rahmenbedingungen

- Alle Knöpfe und Felder ≥ 44 × 44 px; Zahlenfelder mit Zifferntastatur und 16 px Schrift.
- Ab 320 px ohne horizontales Scrollen; Hell- und Dark Mode über die Farbvariablen.
- Legende unter „Übungen“: Nummernfeld = Protokoll, `✓` = heute erfasst, Angaben hinter dem
  Namen = letztes Gewicht/Zeit und Power, 😟 schwach · 🙂 ok · 😃 stark, Entl. = Entlastungswoche.

## Sicherungsbereich – unverändert

Aufklappbare Infokarte „Protokoll sichern“: Zahl der Trainings, Datum der letzten Sicherung,
„Sichern“ (Teilen-Dialog oder Download) und „Wiederherstellen“ (Datei-Auswahl, Zusammenführen),
Hinweis „Sicherung empfohlen“ nach 14 Tagen mit neueren Trainings.
