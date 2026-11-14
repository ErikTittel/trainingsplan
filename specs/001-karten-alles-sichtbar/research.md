# Research: Übungskarten ohne Aufklappen

Keine `NEEDS CLARIFICATION` im Technical Context. Die folgenden Entscheidungen klären die
Gestaltungsfragen aus der Spec.

## R1 – Kartenelement

- **Decision**: `<details>/<summary>` wird durch ein statisches `<article class="exercise-card">`
  ersetzt. Kein Chevron, kein Klick-Handler.
- **Rationale**: FR-001 verlangt, dass nichts mehr aufklappbar ist. `<article>` ist semantisch
  passend (eigenständiger Inhaltsblock) und Screenreader lesen alles direkt.
- **Alternatives considered**: `<details open>` mit deaktiviertem Toggle – verworfen, weil
  Safari das Zuklappen per Tap trotzdem zulässt und das Markup irreführend bleibt.

## R2 – Pausenangabe aus dem Namen lösen

- **Decision**: Beim Rendern wird der Name mit `/,\s*Pause\s+(.+)$/i` geteilt: der Teil davor
  ist der Name, die Gruppe ist die Pause (z. B. „90 s“, „2–2,5 Min“,
  „90 s nach beiden Seiten“). Ohne Treffer gibt es keine Pausen-Kennzahl.
- **Rationale**: Die Plandaten bleiben unverändert (Spec-Annahme, Verfassungsprinzip IV:
  `plan.json` und `plan.md` bleiben synchron, ohne beide anzufassen). Alle 5 betroffenen Namen
  (Hang Power Clean, Rumänisches Kreuzheben, Kniebeuge zur Box, Shrimp-Squat, Schrägbank)
  folgen dem Muster „…, Pause X“.
- **Alternatives considered**: Neues Feld `rest` in `plan.json` – sauberer, verlangt aber
  Änderungen an `plan.json` *und* `plan.md` und gehört in ein eigenes Daten-Feature.
  Bleibt als Option für später.

## R3 – Abkürzungen

- **Decision**: Diese Abkürzungen gelten nur für die Anzeige, die Daten bleiben unverändert:

  | Anzeige | Bedeutung | Quelle |
  |---------|-----------|--------|
  | `P 90 s` | Pause zwischen den Sätzen | aus Name (R2) |
  | `/S.` | pro Seite | ersetzt „/Seite“ in der Vorgabe |
  | `RPE 8` | Anstrengung 1–10 | bestehend |
  | `↓` / `↑` | Absenken / Anheben (Tempo) | R4 |
  | `min` | Minuten | ersetzt „Min“ in der Pause |

  „Wdh.“ wird nicht eingeführt: Die Vorgabe „4×8“ ist bereits kürzer als jede
  ausgeschriebene Form.
- **Rationale**: Nur Abkürzungen, die mehrfach vorkommen und sofort lesbar sind (FR-005).
  Fachwörter wie „explosiv“ und „statisch“ bleiben ausgeschrieben, weil Kürzel wie „expl.“
  langsamer zu lesen sind.
- **Alternatives considered**: Übungsnamen kürzen (z. B. „RDL“) – verworfen, weil die Namen
  aus dem Plan stammen und bekannt bleiben sollen.

## R4 – Tempo einzeilig

- **Decision**: Ein Tempo nach `TEMPO_PATTERN` (z. B. `3-1-1`, `2-1-X`, `2-0-2-1`) wird als
  `↓3 · 1 · ↑1` (· 4. Wert) angezeigt. `X` bleibt `X` (explosiv, steht in der Legende).
  Tempo als Wort („explosiv“, „statisch“) wird unverändert gezeigt. Das `aria-label` behält
  die Langform („Absenken 3 s, Pause unten 1 s, Anheben 1 s“).
- **Rationale**: FR-007 – Zuordnung erkennbar, genau eine Zeile; die Pfeile tragen die
  Bedeutung, die Legende erklärt die Reihenfolge.
- **Alternatives considered**: Bisherige Rhythmus-Grafik mit 3–4 Kästchen – zu hoch für eine
  Daueranzeige (verstößt gegen SC-004).

## R5 – Legende

- **Decision**: Eine einzeilige, kleine Legende steht direkt unter der Überschrift „Übungen“ in
  `index.html` (statischer Text): `Tempo ↓ ab · Pause · ↑ auf (X = explosiv) · P = Satzpause ·
  /S. = pro Seite · RPE = Anstrengung 1–10`.
- **Rationale**: Die Legende ist sichtbar, ohne dass man aufklappen oder scrollen muss.
  Statischer Text, weil die Abkürzungen fest im Code definiert sind.
- **Alternatives considered**: Legende im aufklappbaren Infobereich „Plan-Details“ – verworfen,
  weil sie dort nicht auffindbar ist.

## R6 – Zusatzinhalte (Ablauf, Hinweis, Zweck)

- **Decision**: Der Zweck (`why`) steht als einzeilige, gedämpfte Zeile unter den Kennzahlen.
  Ablaufschritte stehen als kompakte Liste darunter, der Ablaufhinweis klein und gedämpft
  darunter. Die Zwischenüberschriften „Ablauf“, „Trainingsziel“ und „Bewegungsrhythmus“
  entfallen.
- **Rationale**: Die Zwischenüberschriften kosten Höhe und sind ohne Aufklappen überflüssig,
  weil die visuelle Hierarchie die Rollen trennt.
- **Alternatives considered**: Den Hinweis kürzen – verworfen, weil die Spec alle
  Informationen verlangt und der Hinweis sicherheitsrelevant ist.

## R7 – Verfassung (erledigt)

- **Decision**: Prinzip III und der Prüfpunkt „Auf-/Zuklappen der Karten“ sind per
  `/speckit-constitution` angepasst (Verfassung 2.0.0): Karten zeigen alle Angaben dauerhaft,
  kompakt mit Abkürzungen und Legende. Offen bleiben die Folgeanpassungen in `CLAUDE.md` und
  `SPEC.md`; sie werden mit diesem Feature umgesetzt.
- **Rationale**: Der Nutzer hat diese Änderung ausdrücklich verlangt. Der Kern von Prinzip III
  (schnelle Erfassung, keine Überladung) bleibt erhalten, nur das Mittel ändert sich.
- **Alternatives considered**: Abweichung dauerhaft im Plan begründen statt Verfassung ändern –
  verworfen, weil die Verfassung sonst nicht mehr dem tatsächlichen Verhalten der App entspricht.
