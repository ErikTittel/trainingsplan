# SPEC – Trainingsplan-App

Maßgebliche Beschreibung, **was** die App zeigt und wie sie sich verhält. Nicht verhandelbare
Grundsätze (kein Build, Mobile-first, alles auf einen Blick, lokales Protokoll …) stehen in der
[Verfassung](.specify/memory/constitution.md) und werden hier nicht wiederholt. Datenformate:
[docs/datenformate.md](docs/datenformate.md). Technischer Aufbau: [docs/architektur.md](docs/architektur.md).

## Ziel und Nutzung

Eine mobile Trainingsplan-App für das iPhone im Fitnessstudio – für einen 12-Wochen-Plan
([plan.md](plan.md)). Zwischen zwei Sätzen soll in Sekunden ablesbar sein, was als Nächstes kommt
und was beim letzten Mal geschafft wurde; das Erfassen kostet wenige Antipper.

## Aufbau der Seite

1. **Kopf** – Plantitel; darunter Woche und Phase („Woche 6 von 12 · Phase 2“, ggf.
   „· Entlastungswoche“; vor Planstart „Start am …“, danach „Plan abgeschlossen“).
2. **Deine Einheit** – ein Knopf je Trainingstag (Kurzname der Einheit), daneben „Heute“ bzw.
   der Wochentag („· nächste Einheit“ an Tagen ohne Krafttraining); Titel der Einheit und
   Aufwärmtext. Vorgewählt: heutiger oder nächster Trainingstag.
3. **Übungen** – Zahl der Übungen; Phasenknöpfe („Phase 1 · W1–4“ …, vorgewählt die Phase der
   aktuellen Woche) für Vorgabe, Tempo und Ablauf; Legende; Meldungszeile des Protokolls; Karten.
4. **Infokarten** (aufklappbar) – „Sicherheit zuerst“ (alle Sicherheitsregeln), „Plan &
   Progression“ (Phasen, Entlastung, Pausen, Tempo-Schreibweise, Progressionsregeln),
   „Protokoll sichern“.

## Übungskarte

```text
┌────────────────────────────────────────────┐
│ 3   Rumänisches Kreuzheben (Straps) 80 kg 🥵│  Nummernfeld · Name · jüngster Eintrag
│ +   4×8  ↓2 · 1 · ↑1  RPE 7 → 8  P 2 min    │  Kennzahlen: Vorgabe, Tempo, RPE, Pause
│     Hüftstrecker für Sprint … „Straps, gut“ │  Zweck · Kommentar des jüngsten Eintrags
│     • Ablaufschritt …                       │  nur bei Blöcken
│     Hinweis …                               │  nur bei Blöcken
└────────────────────────────────────────────┘
```

- Feste Reihenfolge; die Vorgabe ist das kräftigste Element der Kennzahlenzeile; die Zeile bricht
  auf schmalen Geräten um. Jede Angabe einmal, leere Angaben fehlen ganz.
- **Kürzel** (in der Legende erklärt): Tempo `↓3 · 1 · ↑1` = Absenken · Pause unten · Anheben
  (· Pause oben), `X` = explosiv; `P` = Satzpause; `/S.` = pro Seite; `RPE` = Anstrengung 1–10;
  `✓` = heute erfasst; 🥵 schwach · 🙂 ok · 💪 stark = Power; `Entl.` = Entlastungswoche.
- Unter dem Nummernfeld: `+` (heute nichts erfasst) bzw. `✓` (heute erfasst), ohne zusätzliche
  Höhe.
- **Hinter dem Namen** (Akzentfarbe): Werte und Power des jüngsten Eintrags – heute, sonst vom
  letzten Training –, z. B. `80 kg 🙂`, `+5 kg 💪` (Zusatzlast), `40 s 🙂`, `40 s · 10 kg 🙂`,
  ohne Werte nur `💪`. Dezimalkomma. Für Screenreader mit „heute“ bzw. „zuletzt W5 · 07.11.“.
- **Hinter dem Zweck** (kursiv, in „…“): Kommentar desselben Eintrags.

## Protokollbereich

Antippen der Kachel (oder des Nummernfelds, auch per Tastatur) öffnet bzw. schließt den Bereich
unter den Planangaben. Höchstens einer ist offen; beim Laden und nach einem Wechsel der Einheit sind
alle geschlossen, ein Phasenwechsel lässt ihn offen.

```text
│ ─────────────────────────────────────────── │
│ Letztes Mal (W4 · 07.11. · Entl.): 80 kg 🥵 │  nur wenn heute erfasst und ein früheres
│   · „Straps, Rücken gut“                    │  Training existiert
│ Gewicht (kg)              Power: ok         │  links Werte laut Plan, rechts Power
│ [ − ]   80   [ + ]     [ − ]  🙂  [ + ]      │
│ [ Kommentar (optional)                   ]  │
│ ✓ Heute erfasst            Eintrag löschen  │  bzw. „Noch nicht erfasst – Wert oder Power anpassen.“
```

| Element | Verhalten |
|---|---|
| Werte | Felder je nach Übung (siehe unten), vorbelegt mit dem heutigen, sonst dem letzten Wert. −/+ speichert sofort (Gewicht in Schritten laut Plan, Standard 2,5 kg; Zeit in 5 s, erstes „+“ in leerem Feld = 30 s); Tastatureingabe speichert beim Verlassen bzw. mit Enter. Ungültig: Feld markiert, Meldung, nichts gespeichert. |
| Power | −/+ zwischen schwach ↔ ok ↔ stark, Standard ok; an den Enden gesperrt. Jede Änderung speichert den ganzen sichtbaren Stand – ein Antippen übernimmt also unveränderte Werte. |
| Kommentar | höchstens 200 Zeichen, speichert beim Verlassen bzw. Enter; ein leerer Kommentar allein legt keinen Eintrag an |
| Eintrag löschen | nur bei heutigem Eintrag, mit Rückfrage; danach zeigt die Karte wieder das letzte Training |

- Öffnen allein speichert nichts. Es gibt keine Felder für Sätze, Wiederholungen, RPE oder Seiten,
  keinen „erledigt“-Schalter, keinen Speichern-Knopf.
- Speichern aktualisiert Angaben hinter Name/Zweck, Kennzeichen und Status, ohne den Bereich neu
  aufzubauen (Fokus bleibt).

| Art der Übung | Beispiele | Felder |
|---|---|---|
| Gewicht | Kreuzheben, Kniebeuge, Schrägbank, Shrimp-Squat | Gewicht (kg) |
| Körpergewicht | Klimmzug, Liegestütz, Ringrudern, Einbein-Wadenheben | Zusatzlast (kg), leer = ohne |
| Zeit | Copenhagen Plank | Zeit (s) |
| Zeit und Gewicht | Spanish Squat | Zeit (s), Gewicht (kg) |
| Block | Sprung-, Beschleunigungsblock | keine (nur Power und Kommentar) |

Pro Übung und Training gibt es einen Eintrag. Wechselt das Gewicht innerhalb der Übung, wird das
Arbeitsgewicht (meist das höchste) eingetragen, Details in den Kommentar. Kurzhantel = Gewicht einer
Hantel, Langhantel = Gesamtgewicht. „Power“ ist die subjektive Einschätzung nach der Übung, keine
RPE-Skala.

## Meldungen

Über der Übungsliste (bleibt beim Scrollen sichtbar): ungültige Zahl; Speichern fehlgeschlagen;
Protokoll aus neuerer App-Version bzw. Speicher nicht verfügbar (dann wird nichts gespeichert, der
Plan funktioniert weiter); unlesbares Protokoll beiseitegelegt. Fehler beim Laden des Plans
erscheinen unter den Infokarten.

## Protokoll sichern

Infokarte mit Zahl der gespeicherten Trainings und Datum der letzten Sicherung; Untertitel
„Sicherung empfohlen“, wenn es neuere Trainings gibt und die letzte Sicherung über 14 Tage
zurückliegt (oder nie war).

- **Sichern** (gesperrt ohne Trainings): Datei über den Teilen-Dialog, wo es den nicht gibt als
  Download.
- **Wiederherstellen** (gesperrt, wenn nicht gespeichert werden kann): Datei wählen, prüfen,
  pro Training zusammenführen; Ergebnis „x neu, y aktualisiert, z unverändert“ bzw. Fehlermeldung
  ohne Änderung.

## Bewusst nicht enthalten

Lauf- und Recovery-Tage, Verläufe und Diagramme über viele Wochen, automatische Lastvorschläge,
Synchronisation zwischen Geräten, Pausen-Timer.

## Offene Punkte

- schematische Darstellung der Übungen
- Auswertung des Protokolls über mehrere Wochen – als eigene Ansicht, nicht in der Übungskarte
- Synchronisation zwischen Geräten (erfordert eine Änderung der Verfassung, Prinzip VII)
- Anzeige weiterer Planteile, die bereits in `plan.json` stehen (Ampelregel, Kennzahlen,
  Wochenverteilung)
