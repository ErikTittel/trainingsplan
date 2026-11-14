# Quickstart: Trainingsprotokoll prüfen

Manuelle Prüfung (es gibt keine automatisierten Tests). Details: [data-model.md](data-model.md),
[contracts/log-card.md](contracts/log-card.md), [contracts/log-storage.md](contracts/log-storage.md).

## Vorbereitung

```
python -m http.server 8000
```

`http://localhost:8000` öffnen, DevTools → Application → Service Workers → „Update on reload“.
Protokoll ansehen/leeren: DevTools → Application → Local Storage → `trainingsplan.log.v1`.

Ein „früheres Training“ lässt sich ohne Warten erzeugen: Einträge erfassen, dann im Local Storage
im Dokument das `date` und die `id` des Trainings auf einen früheren Tag ändern und neu laden.

## Szenarien

| # | Schritte | Erwartung | Deckt ab |
|---|---|---|---|
| 1 | Local Storage leeren, Seite laden | Plan wie bisher; keine Angaben hinter Namen, Nummernfelder zeigen „+“, keine Fehlermeldung | FR-008, FR-014, SC-004 |
| 2 | „Rumänisches Kreuzheben“: Nummernfeld antippen, Gewicht 80 eingeben, Feld verlassen | Bereich bleibt offen; hinter dem Namen „80 kg 🙂“; Nummernfeld „✓“; Status „Heute erfasst“ | FR-001, FR-006, FR-010, FR-011 |
| 3 | „+“ beim Gewicht, dann „stark“ antippen, Kommentar eintragen | 82,5 kg 😃 hinter dem Namen, Kommentar hinter dem Zweck | FR-002, FR-010 |
| 4 | Seite neu laden; DevTools → Network → Offline, Wert ändern, neu laden | Alles gespeichert, Bereiche geschlossen | FR-016 |
| 5 | Training auf einen früheren Tag umdatieren (siehe oben), neu laden | Hinter Name/Zweck stehen die Werte vom letzten Mal, Nummernfeld „+“; im Bereich ist das Gewicht vorbelegt, Power „ok“, Kommentar leer | FR-005, FR-010, SC-002 |
| 6 | Danach nur „ok“ antippen | Gewicht vom letzten Mal ist für heute gespeichert; im Bereich steht „Letztes Mal (W… · Datum): …“ | FR-006, FR-012, SC-001 |
| 7 | Klimmzug, Liegestütz: Bereich öffnen | Feld „Zusatzlast (kg)“; nur „ok“ antippen speichert ohne Gewicht | FR-003 |
| 8 | Spanish Squat: 40 s und 10 kg | Zwei Felder; hinter dem Namen „40 s · 10 kg 🙂“ | FR-003 |
| 9 | Copenhagen Plank, Einbein-RDL, Einbein-Wadenheben | Keine L/R-Unterscheidung; Copenhagen nur Zeit | FR-002 |
| 10 | Sprungblock: Bereich öffnen, „stark“ | Kein Zahlenfeld, kein „erledigt“; hinter dem Namen „😃“ | FR-008 |
| 11 | Bereich ansehen | Keine Felder für Sätze, Wiederholungen, RPE; keine „Heute“-Zeile | FR-002, FR-013 |
| 12 | „abc“ bzw. Zeit „12,5“ eingeben | Feld markiert, Meldung, gespeichert bleibt der letzte gültige Wert | FR-007 |
| 13 | „Eintrag löschen“ bestätigen | Eintrag weg, Nummernfeld „+“, hinter dem Namen wieder das letzte Training | FR-009 |
| 14 | Local Storage: Dokument im alten Format (Schema 1 mit `sets`) ablegen, neu laden | Umgewandelt: höchstes Gewicht, längste Zeit, Kommentar, Power ok; alter Stand unter `trainingsplan.log.backup` | FR-018 |
| 15 | „Sichern“, Local Storage leeren, „Wiederherstellen“ | Alle Trainings wieder da; Meldung „x neu“ | FR-017, SC-005 |
| 16 | Nach Export einen Wert ändern, dann die ältere Datei importieren | Neuerer Gerätestand bleibt; Meldung „unverändert“ | FR-017 |
| 17 | Beliebige andere Datei (z. B. `plan.json`) importieren | Fehlermeldung, Daten unverändert | US4 |
| 18 | In `plan.json` den Namen einer Übung ändern (ID gleich lassen), neu laden | Angaben hinter dem Namen weiterhin vorhanden | data-model B8 |
| 19 | In `plan.json` eine `id` entfernen/verdoppeln bzw. `log.fields` ungültig machen | Verständliche Ladefehlermeldung | data-model A5 |
| 20 | `CACHE_NAME` hochzählen, neu laden (zweimal) | Neue Version aktiv, Protokoll unverändert | FR-016, Prinzip VII |
| 21 | Local Storage: `schema` im Dokument auf `99` setzen, neu laden | Hinweis „neuere App-Version“, nichts wird überschrieben | data-model B5 |
| 22 | Hell- und Dark Mode, Breite 320 px, alle 24 Bereiche öffnen | Lesbar, kein horizontales Scrollen, Knöpfe ≥ 44 px, Legende erklärt ✓ und Smileys | FR-015, FR-020 |
| 23 | Alle Planangaben und „Sicherheit zuerst“ ansehen | Unverändert sichtbar | Prinzip III, VI |
| 24 | Mit leerem Protokoll Höhe von `#exercise-list` je Einheit und Phase (320 und 390 px) mit den Ausgangswerten unten vergleichen | Identische Höhe | FR-014, SC-004 |
| 25 | Bereich A öffnen, dann Bereich B öffnen; Phase wechseln; Einheit wechseln; neu laden | Nur B offen; bleibt beim Phasenwechsel offen; nach Einheitenwechsel und Neuladen alles geschlossen | FR-001a |
| 26 | Schalter per Tastatur (Tab, Enter) bedienen | Öffnet/schließt; `aria-expanded` wechselt | Vertrag log-card |

### Ausgangswerte vor Umsetzung (Szenario 24)

Höhe von `#exercise-list` in px, gemessen am 2026-11-14 in Chrome (Headless) vor der Umsetzung.
Nach der Umsetzung (auch der vereinfachten Fassung) wurden mit leerem Protokoll dieselben Werte gemessen; auch
die Höhe jeder einzelnen Karte und die Breite der Kartentexte sind unverändert.

| Einheit · Phase | 320 px | 390 px |
|---|---|---|
| Mo · Phase 1 | 939 | 821 |
| Mo · Phase 2 | 939 | 821 |
| Mo · Phase 3 | 963 | 821 |
| Do · Phase 1 | 1572 | 1346 |
| Do · Phase 2 | 1707 | 1349 |
| Do · Phase 3 | 1670 | 1390 |
| Sa · Phase 1 | 1340 | 1147 |
| Sa · Phase 2 | 1291 | 1147 |
| Sa · Phase 3 | 1402 | 1234 |

Die absoluten Werte hängen von Browser und Schrift ab; entscheidend ist der Vergleich im selben
Browser vor und nach einer Änderung.

## Auf dem iPhone (vor dem ersten echten Training)

1. App über Safari → Teilen → „Zum Home-Bildschirm“ installieren.
2. Zwei Einträge erfassen, App schließen (aus dem App-Umschalter wischen), öffnen → Einträge da.
3. iPhone neu starten → Einträge da.
4. Flugmodus: Eintrag erfassen → gespeichert.
5. „Sichern“ → Teilen-Dialog erscheint, „In Dateien sichern“ funktioniert; Datei per
   „Wiederherstellen“ wieder einlesbar.
