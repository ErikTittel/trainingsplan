# UI-Vertrag

## Hauptansicht (oben → unten)

```text
12-Wochen-Trainingsplan: …                 (klein, gedämpft)
Woche 6 von 12 · Phase 2                    (groß, fett)
[Mo Zug und Hüfte][Do Beine …][Sa Druck …]
Einheit 1 – Zug und Hüfte          Heute
▾ Aufwärmen · 9 Min
   1. 2 Min Crosstrainer oder zügiges Gehen
   2. 5 Min Mobility
      • 90/90-Hüftrotation 6/Seite …
Übungen                              3 / 8
[Phase 1 W1–4][Phase 2 W5–8][Phase 3 W9–12]
(Meldungszeile)
Karten …
Infokarten: Sicherheit zuerst · Kürzel & Bedienung · Plan & Progression · Protokoll sichern
                                [Eintrag gelöscht   Rückgängig]   ← fixiert unten, nur nach Löschen
```

## Übungskarte

- `.exercise-card.is-done` – heute erfasst: Nummernfeld gefüllt, Akzentrand.
- `.exercise-card.is-next` – erste nicht erfasste Karte: Akzentring (box-shadow).
- `.exercise-card.just-saved` – kurz nach dem Speichern: ✓ leuchtet auf.
- Hinweis: `<details class="instruction-note"><summary><b>Hinweis</b> Text…</summary></details>`.

## Protokollbereich

```text
Letztes Mal (W4 · 07.11.): 80 kg 🥵 · „Straps“     ← sobald ein früheres Training existiert
Gewicht (kg)
[  −  ]        80        [  +  ]
Power
[ 🥵 schwach ][ 🙂 ok ][ 💪 stark ]                  ← aria-pressed; ohne heute: ok gestrichelt
[ Kommentar (optional)                ]
Noch nicht erfasst – Power wählen zum Speichern     Eintrag löschen
[              Weiter →               ]
```

## Rückruf `actions` an `renderLogPanel`

| Rückruf | neu/alt | Bedeutung |
|---|---|---|
| `save(raw)` | alt | gibt jetzt auch an das Panel zurück: `"saved" \| "invalid" \| "blocked" \| "failed"` |
| `remove()` | alt | ohne Rückfrage, mit Rückgängig |
| `hasTodayEntry()` | alt | |
| `next()` | neu | Bereich schließen, nächste offene Übung öffnen |
