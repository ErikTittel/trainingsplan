# Data Model: Übungskarten ohne Aufklappen

`plan.json` bleibt **unverändert**. Neu ist nur ein abgeleitetes Anzeige-Modell, das `app.js`
beim Rendern pro Übung und gewählter Phase bildet.

## Quelle: Übung (`plan.json → workouts[].exercises[]`)

| Feld | Typ | Pflicht | Beispiel |
|------|-----|---------|----------|
| `number` | string | ja | `"2a"` |
| `name` | string | ja | `"Rumänisches Kreuzheben (Straps), Pause 2 Min"` |
| `phaseProgression.{phase1..3}` | string | ja | `"3×8/Seite"` |
| `tempo.{phase1..3}` | string, ggf. leer | ja | `"3-1-1"`, `"explosiv"`, `""` |
| `rpe` | string, ggf. leer | ja | `"7 → 8"` |
| `why` | string | ja | `"Hüftstrecker für …"` |
| `instructions.{phase1..3}` | string[] | nein | Sprungblock |
| `instructionsNote` | string | nein | Progressionskriterien |

## Abgeleitet: CardView (nur zur Laufzeit)

| Feld | Herleitung | Leer, wenn … |
|------|------------|--------------|
| `number` | `number` | – |
| `title` | `name` ohne `, Pause …`-Suffix (research R2) | – |
| `rest` | Pausen-Suffix, „Min“ → „min“ | kein Suffix |
| `prescription` | `phaseProgression[phase]`, „/Seite“ → „/S.“ | – |
| `tempoShort` | Tempo nach R4 formatiert | Tempo leer |
| `tempoLong` | Langform für `aria-label` | Tempo leer |
| `rpe` | `rpe` | leer |
| `purpose` | `why` | leer |
| `steps` | `instructions[phase]` | fehlt/leer |
| `note` | `instructionsNote` | fehlt |

### Regeln

- Leere Felder werden **nicht** gerendert (FR-008), auch nicht als „Nicht angegeben“.
- Jedes Feld wird genau einmal gerendert (FR-003).
- Ein Phasenwechsel bildet alle CardViews neu (wie heute über `renderWorkout()`).
- Es gibt keine Zustände und keine Zustandsübergänge (kein „offen“ oder „zu“).
