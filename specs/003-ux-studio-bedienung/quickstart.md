# Quickstart: Prüfung

`python -m http.server 8000`, `http://localhost:8000`, DevTools „Update on reload“, Breite 375 px.

1. Laden: keine Eyebrows, keine Legende über den Übungen; „Woche … · Phase …“ ist die größte Zeile
   im Kopf; Aufwärmen nummeriert und offen; Zähler „0 / 8“; Karte 1 hervorgehoben.
2. Aufwärmen zuklappen → erste Karte rückt nach oben.
3. Karte 1 öffnen → drei Power-Knöpfe, „ok“ gestrichelt, Status „… Power wählen zum Speichern“.
   🙂 antippen → ✓ leuchtet, Karte erledigt, Zähler „1 / 8“, Karte 2 hervorgehoben.
4. „Weiter →“ → Karte 1 zu, Karte 2 offen und sichtbar.
5. Eintrag löschen → kein Dialog, Leiste „Eintrag gelöscht · Rückgängig“; Rückgängig → Eintrag da.
6. Früheres Training erzeugen (docs/pruefung.md), Karte öffnen ohne heutigen Eintrag → „Letztes Mal“.
7. Block mit Hinweis (Do, Sprungblock): eine Zeile „Hinweis …“; Antippen klappt auf, öffnet nicht
   das Protokoll.
8. Übung öffnen, scrollen, neu laden → gleiche Übung offen, gleiche Position. Datum im Zustand
   (`trainingsplan.view`) auf gestern setzen, neu laden → alles zu, heutige Einheit.
9. Infokarte „Kürzel & Bedienung“ erklärt alle Kürzel und Power-Symbole.
10. 320 px und Dark Mode: kein horizontales Scrollen, lesbar.
11. Fehler: `warmup` in plan.json auf einen Text setzen → Ladefehler.
