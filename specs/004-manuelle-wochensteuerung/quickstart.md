# Quickstart: Manuelle Wochensteuerung prüfen

Voraussetzung: `python -m http.server 8000` im Repository, Aufruf `http://localhost:8000/`,
DevTools „Update on reload“ aktiv, Gerätebreite 375 px (zusätzlich 320 px). Hell und Dunkel.
Allgemeiner Prüfumfang: [docs/pruefung.md](../../docs/pruefung.md). Format:
[data-model.md](data-model.md), Bedienung: [contracts/ui.md](contracts/ui.md).

## 1. Umstieg mit vorhandenem Protokoll (Schema 2)

1. Vor dem Update ein Protokoll mit Schema 2 im `localStorage` haben (oder Beispiel aus
   `docs/datenformate.md` B4 unter `trainingsplan.log.v1` einsetzen).
2. Neue Version laden.
3. Erwartet: Kopf zeigt dieselbe Woche wie vorher (mit `startDate` 2026-10-12 am 2026-11-22:
   Woche 6). `trainingsplan.log.backup` enthält den alten Stand, `trainingsplan.log.v1` hat
   `schema: 3` und `currentWeek: { number: 6, changedAt: null }`. Alle Trainings unverändert.

## 2. Hochzählen über die Phasengrenze (US1)

1. Mit „−“ auf Woche 4 stellen. Erwartet: „Woche 4 von 12 · Phase 1 · Entlastungswoche“ (Woche 4 ist laut `plan.json` Entlastungswoche;
   Woche 8 und 12 ebenso), Phase 1 gewählt.
2. „+“ antippen. Erwartet: „Woche 5 von 12 · Phase 2“, Phasenleiste Phase 2 gewählt, Karten mit
   Vorgaben von Phase 2; die offene Übung bleibt offen.
3. Neu laden und Systemdatum bzw. `today` gedanklich einen Tag weiter: weiterhin Woche 5.
4. Bis Woche 12 hochzählen: „+“ deaktiviert; Screenreader-Label „Woche weiter“.

## 3. Herunterzählen (US2)

1. Von Woche 5: „−“ → Woche 4, Phase 1 gewählt.
2. Bis Woche 1: „−“ deaktiviert.
3. Phase 3 in der Leiste ansehen, dann „+“ in Woche 6 → Phase 2 (Phase der Woche) ist gewählt.

## 4. Protokoll (US3)

1. Woche 6 einstellen, Einheit ohne heutiges Training, eine Power antippen.
2. Erwartet: neues Training mit `week: 6`, `deload` laut Plan, `phase` = gewählte Phase.
3. Danach Woche auf 7 stellen: das heutige Training bleibt bei `week: 6`.

## 5. Sichern und Wiederherstellen (US4)

1. Woche 8 einstellen, „Sichern“.
2. Website-Daten löschen, neu laden (Startwert aus `startDate`), Sicherung wiederherstellen.
3. Erwartet: Woche 8, Meldung nennt die übernommene Woche.
4. Auf dem Gerät Woche 9 einstellen (also nach der Sicherung), die ältere Sicherung erneut wiederherstellen → Woche 9 bleibt.
5. Eine Sicherung mit Schema 2 wiederherstellen → Trainings übernommen, Woche unverändert.

## 6. Speichern nicht möglich

- Protokoll mit `schema: 99` im Speicher: „+“ zeigt die Meldung „… aus einer neueren
  App-Version …“, Woche bleibt.
- Privater Modus/kein Speicher: Meldung, Woche bleibt.

## 7. Layout

- 320 px: Kopfzeile ohne horizontales Scrollen, Text bricht zwischen den Knöpfen um, Knöpfe
  44 × 44 px; Hauptansicht nicht höher als vorher (außer ggf. Umbruch des Kopftexts).
- Dark Mode: Knöpfe und deaktivierter Zustand gut erkennbar.
- Offline nach dem ersten Laden: Wochenwechsel funktioniert.

## 8. Fachfunktionen in Node (optional)

```text
node --input-type=module -e "const c = await import('./js/calendar.js'); console.log(c.clampWeek(15, 12), c.clampWeek(0, 12))"
```

Erwartet: `12 1`. Ebenso `migrate` eines Schema-2-Dokuments → `schema: 3`, `currentWeek: null`.
