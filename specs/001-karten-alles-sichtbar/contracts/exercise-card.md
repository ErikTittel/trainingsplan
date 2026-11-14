# UI Contract: Übungskarte

Verbindliche Struktur der Karte, wie sie für den Nutzer sichtbar ist. Die Felder stammen
aus dem CardView ([data-model.md](../data-model.md)).

## Aufbau (von oben nach unten)

```text
┌──────────────────────────────────────────────┐
│ [2a]  Rumänisches Kreuzheben (Straps)         │  ← Nummer + title
│       3×8        ↓3 · 1 · ↑1   RPE 7→8  P 2 min│  ← Kennzahlenzeile (darf umbrechen)
│       Hüftstrecker für Sprint und Laufökonomie│  ← purpose (gedämpft)
│       • Schritt 1 …                            │  ← steps (nur falls vorhanden)
│       Hinweis …                                │  ← note (klein, gedämpft)
└──────────────────────────────────────────────┘
```

## Regeln

1. Das Wurzelelement ist nicht interaktiv: kein `<details>`, kein `<summary>`, kein Chevron,
   kein `tabindex`, kein Klick-Handler.
2. Die Reihenfolge in der Kennzahlenzeile ist fest: Vorgabe → Tempo → RPE → Pause. Die Vorgabe
   ist das größte bzw. fetteste Element der Zeile.
3. Jede Kennzahl ist ein eigenes Element. Leere Kennzahlen fehlen ganz.
4. Die Tempo-Kennzahl trägt das `aria-label` mit der Langform (R4).
5. Die Zeile bricht auf schmalen Geräten um, es gibt kein horizontales Scrollen (FR-009).
6. Die Farben stammen aus den bestehenden CSS-Variablen, damit Hell- und Dark Mode
   automatisch funktionieren.

## Legende (einmal pro Seite, in `index.html`)

Steht unter der Überschrift „Übungen“ und erklärt alle in R3 und R4 verwendeten Kürzel:
`↓`, `↑`, `X`, `P`, `/S.`, `RPE`.
