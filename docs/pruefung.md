# Prüfung vor dem Commit

Es gibt keine automatisierten Tests (Verfassung I). Jede Änderung wird lokal im Browser geprüft;
welche Abschnitte nötig sind, steht jeweils dabei.

## Vorbereitung

```
python -m http.server 8000
```

`http://localhost:8000` öffnen (nicht über `file://` – dort scheitern `fetch("plan.json")` und
die Module). DevTools → Application → Service Workers → „Update on reload“, sonst liefert der
Service Worker den alten Stand aus dem Cache. Protokoll ansehen/leeren: DevTools → Application →
Local Storage → `trainingsplan.log.v1`.

Ein „früheres Training“ ohne Warten: Einträge erfassen, dann im Local Storage bei dem Training
`date` und `id` auf einen früheren Tag und `updatedAt` auf einen Zeitpunkt vor mehr als 6
Stunden setzen, neu laden.

## A. Immer

| # | Prüfen | Erwartung |
|---|---|---|
| A1 | Hell- und Dark Mode | gut lesbar, ausreichender Kontrast |
| A2 | Breite 320 px und 390 px | kein horizontales Scrollen, Kennzahlenzeile bricht um |
| A3 | Alle Einheiten × alle Phasen durchschalten | Karten vollständig (Name, Vorgabe, Tempo, RPE, Pause, Zweck, Ablauf, Hinweis), leere Angaben fehlen ganz, Werte wechseln mit der Phase |
| A4 | Legende unter „Übungen“ | erklärt ↓/↑, X, P, /S., RPE, ✓, Power-Symbole, Entl. |
| A5 | Wochenerkennung (Systemdatum ändern oder `startDate` in `plan.json`) | Untertitel „Woche N von 12 · Phase N“ (+ „Entlastungswoche“), vor Start „Start am …“, danach „Plan abgeschlossen“; vorgewählt sind heutiger bzw. nächster Trainingstag und die Phase der Woche |
| A6 | „Sicherheit zuerst“ und „Plan & Progression“ öffnen | vollständig, aufklappbar |
| A7 | Fehler in `plan.json` einbauen (z. B. doppelte `id`) | verständliche Ladefehlermeldung |

## B. Bei Änderungen am Protokoll

| # | Schritte | Erwartung |
|---|---|---|
| B1 | Local Storage leeren, laden | keine Angaben hinter den Namen, alle Nummernfelder „+“, keine Meldung |
| B2 | Höhe von `#exercise-list` mit leerem Protokoll messen | gleich den Referenzwerten unten (Karten ohne Eintrag sind so hoch wie ohne Protokoll) |
| B3 | „Rumänisches Kreuzheben“ antippen, Gewicht 80, Feld verlassen | Bereich bleibt offen; hinter dem Namen „80 kg 🙂“, Nummernfeld „✓“, Status „✓ Heute erfasst“ |
| B4 | „+“ beim Gewicht, Power „+“ bis stark, Kommentar | „82,5 kg 💪“ hinter dem Namen, Kommentar hinter dem Zweck |
| B5 | „abc“ bzw. Zeit „12,5“ eingeben | Feld markiert, Meldung, gespeichert bleibt der letzte gültige Wert |
| B6 | Bereich A öffnen, dann B; Phase wechseln; Einheit wechseln; neu laden | nur B offen; bleibt beim Phasenwechsel offen; nach Einheitenwechsel und Neuladen alles zu |
| B7 | Klimmzug, Liegestütz; Spanish Squat; Copenhagen Plank; Sprungblock | „Zusatzlast (kg)“ / Zeit **und** Gewicht / nur Zeit / kein Zahlenfeld, nur Power und Kommentar |
| B8 | Früheres Training erzeugen (siehe oben), neu laden, Bereich öffnen, nur Power antippen | vorher: Werte vom letzten Mal hinter Name/Zweck, „+“, Felder vorbelegt, Power ok; danach: für heute gespeichert, oben „Letztes Mal (W… · Datum): …“ |
| B9 | „Eintrag löschen“ bestätigen | Eintrag weg, „+“, hinter dem Namen wieder das letzte Training |
| B10 | Neu laden; App-Update (`CACHE_NAME` hochzählen, zweimal laden) | alle Werte erhalten |
| B11 | DevTools → Network → Offline, Wert ändern, neu laden | gespeichert |
| B12 | Nummernfeld per Tastatur (Tab, Enter) | öffnet/schließt, `aria-expanded` wechselt |
| B13 | „Sichern“, Local Storage leeren, „Wiederherstellen“ | alle Trainings wieder da, Meldung „… neu“ |
| B14 | Nach dem Sichern einen Wert ändern, ältere Datei wiederherstellen | neuerer Gerätestand bleibt („unverändert“) |
| B15 | `plan.json` als Sicherung wählen | Fehlermeldung, Daten unverändert |
| B16 | Dokument im alten Format (Schema 1 mit `sets`) in den Local Storage legen, laden | umgewandelt (höchstes Gewicht, längste Zeit, Kommentar, Power ok); alter Stand unter `trainingsplan.log.backup` |
| B17 | `schema` auf 99 setzen, laden, Wert ändern | Hinweis „neuere App-Version“, nichts wird überschrieben |
| B18 | Unlesbaren Text unter `trainingsplan.log.v1` ablegen, laden | Meldung, Stand unter `trainingsplan.log.defekt`, App läuft leer weiter |
| B19 | Namen einer Übung in `plan.json` ändern (`id` gleich) | Angaben hinter dem Namen bleiben |

### Referenz für B2

Höhe von `#exercise-list` in px mit leerem Protokoll, Chrome (headless), gemessen am 2026-11-14
und nach dem Architektur-Umbau am 2026-11-15 unverändert. Die absoluten Werte hängen von Browser
und Schrift ab; entscheidend ist der Vergleich im selben Browser vor und nach einer Änderung.

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

## C. Bei Änderungen am Service Worker

`CACHE_NAME` hochgezählt, neue Dateien in `APP_SHELL`; einmal online laden, dann offline neu
laden → App vollständig, Protokoll unverändert.

## D. Auf dem iPhone (vor dem ersten echten Training mit einer neuen Version)

1. Safari → Teilen → „Zum Home-Bildschirm“.
2. Zwei Einträge erfassen, App aus dem App-Umschalter wischen, öffnen → Einträge da.
3. Flugmodus: Eintrag erfassen → gespeichert.
4. „Sichern“ → Teilen-Dialog, „In Dateien sichern“; Datei per „Wiederherstellen“ wieder einlesbar.
