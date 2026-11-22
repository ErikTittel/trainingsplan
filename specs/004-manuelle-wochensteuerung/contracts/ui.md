# UI-Vertrag: Wochensteuerung im Kopf

## Aufbau

```text
Trainingsplan · Knie & Sprint                       ← #plan-title (unverändert)
[ − ]   Woche 5 von 12 · Phase 2          [ + ]      ← neue Zeile .week-control
        (· Entlastungswoche)
```

- `index.html`: Im `<header>` umschließt `<div id="week-control" class="week-control">` den
  Knopf `#week-back`, den bestehenden Text `#plan-subtitle` und den Knopf `#week-forward`.
  Die Knöpfe sind `hidden`, bis der Plan geladen ist, und bleiben es bei einem Ladefehler.
- `#plan-subtitle` erhält `aria-live="polite"`.
- Knöpfe: `type="button"`, sichtbarer Text „−“ bzw. „+“, mindestens 44 × 44 px, Farben nur über
  `:root`-Variablen, in Hell und Dunkel mit AA-Kontrast; `disabled` an der Grenze (erkennbar
  gedämpft).

## Beschriftung

| Element | Text | `aria-label` |
|---|---|---|
| Kopftext | `Woche N von T · Phase X` + ggf. ` · Entlastungswoche` | – |
| `#week-back` | `−` | `Zurück zu Woche N−1` (an der Grenze: `Woche zurück`) |
| `#week-forward` | `+` | `Woche N+1 starten` (an der Grenze: `Woche weiter`) |

## Funktion in `js/ui-workout.js`

```text
renderWeekControl({ text, canBack, canForward, backLabel, forwardLabel }, onChange)
  onChange(-1 | +1) – wird beim Antippen aufgerufen; ändert selbst keinen Zustand
```

Die Funktion kennt nur die Element-IDs `#week-control`, `#week-back`, `#plan-subtitle`,
`#week-forward`; Texte kommen fertig aus `format.js` (`describeWeek`, neue Labels).

## Verhalten (`js/app.js`, `changeWeek(delta)`)

1. Protokoll nicht schreibbar → Meldung in `#log-message`, nichts ändert sich.
2. Neue Woche = `clampWeek(aktuelle + delta)`; gleich der aktuellen → nichts tun.
3. `setCurrentWeek(state.log, neu)` und `commitLog()`; schlägt es fehl, bleibt die Anzeige (das
   Protokoll wird von `commitLog` neu geladen).
4. `cancelUndo()`, `state.phaseId = phaseForWeek(…, neu).id`, Kopf, Phasenleiste und Einheit neu
   zeichnen (`showWorkout`); offene Übung und Aufwärmzustand bleiben; `saveView()`.

## Infokarten

- „Kürzel & Bedienung“ → Bedienung: „**−** / **+** neben der Woche: zur vorherigen Woche zurück
  bzw. nächste Woche starten – wenn die Leistung es erlaubt. Die Phase folgt der Woche.“
- „Plan & Progression“: ein kurzer Satz am Anfang („Die Woche zählst du selbst weiter (+ im Kopf),
  sobald du für die nächste bereit bist.“) – UI-Text in `ui-info.js`, kein Trainingsinhalt.
