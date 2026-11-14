# Quickstart: Übungskarten ohne Aufklappen prüfen

## Voraussetzungen

- Lokaler statischer Server im Repo-Root, z. B. `python -m http.server 8000`
  (oder die Erweiterung „Live Server“ in VS Code).
- Browser mit Geräte-Emulation (iPhone-Breite 390 px), optional ein echtes iPhone im WLAN.
- Den Service Worker vorher abmelden oder ein privates Fenster verwenden, damit kein alter
  Cache greift.

## Szenarien

| # | Schritte | Erwartet | Bezug |
|---|----------|----------|-------|
| 1 | Montag, Phase 1 öffnen | Alle 7 Karten zeigen Name, Vorgabe, Tempo, RPE und Zweck ohne Tippen | FR-001, FR-002, SC-001 |
| 2 | Auf eine Karte tippen | Nichts passiert; kein Chevron sichtbar | FR-001 |
| 3 | Karte „Hang Power Clean“ ansehen | Titel ohne „Pause 90 s“; Kennzahl `P 90 s`; Tempo „explosiv“ | FR-006, R2 |
| 4 | Karte „Klimmzug“ ansehen | `4×4–5`, `↓3 · 0 · ↑1`, `RPE 8` – jede Angabe genau einmal | FR-003, FR-007 |
| 5 | Donnerstag, Phase 2 → Sprungblock | Kein Tempo/RPE-Platzhalter; alle 7 Schritte + Hinweis sichtbar | FR-008, US3 |
| 6 | „Einbein-RDL“ | Vorgabe `3×8/S.` | R3 |
| 7 | Legende unter „Übungen“ lesen | Erklärt ↓, ↑, X, P, /S., RPE | FR-005 |
| 8 | Phasen 1 → 2 → 3 durchschalten | Alle Kennzahlen wechseln passend zur Phase | Edge Case |
| 9 | Dark Mode im System umschalten | Karten gut lesbar, Kontrast ok | FR-009 |
| 10 | 320 px Breite | Kennzahlenzeile bricht um, kein horizontales Scrollen | FR-009 |
| 11 | Seitenhöhe Montag vorher und nachher vergleichen (DevTools) | Zuwachs ≤ 50 % | SC-004 |
| 12 | Nach Deploy: App offline neu laden | Neue Karten erscheinen (Cache-Version erhöht) | Verfassung V |
| 13 | Alle 5 Karten mit Pause im Namen prüfen (Mo, Do, Sa) | Titel ohne Pause; `P …` als Kennzahl, „Min“ → „min“ | FR-006, R2 |
| 14 | „Sicherheit zuerst“ und „Plan-Details“ antippen | Infokarten klappen weiterhin auf/zu; Sicherheitsregeln vollständig | Verfassung III, VI |
| 15 | `CLAUDE.md` und `SPEC.md` lesen | Keine Beschreibung aufklappbarer Übungskarten mehr | Verfassung 2.0.0 (Sync Report) |

**Notiz zu Szenario 11** – Ausgangswert: 736 px (Höhe von `#exercise-list`, Montag/Phase 1,
390 px Breite, alle Karten zugeklappt, gemessen vor der Umsetzung). Grenze für SC-004: 1104 px.
