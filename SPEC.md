# SPEC – Trainingsplan-App

Maßgebliche Beschreibung, **was** die App zeigt und wie sie sich verhält. Nicht verhandelbare
Grundsätze (kein Build, Mobile-first, alles auf einen Blick, lokales Protokoll …) stehen in der
[Verfassung](.specify/memory/constitution.md) und werden hier nicht wiederholt. Datenformate:
[docs/datenformate.md](docs/datenformate.md). Technischer Aufbau: [docs/architektur.md](docs/architektur.md).

## Ziel und Nutzung

Eine mobile Trainingsplan-App für das iPhone im Fitnessstudio – für einen 12-Wochen-Plan
([plan.json](plan.json), einzige Quelle; die App ist zugleich seine Lesefassung). Zwischen zwei Sätzen soll in Sekunden ablesbar sein, was als Nächstes kommt
und was beim letzten Mal geschafft wurde; das Erfassen kostet wenige Antipper.

## Aufbau der Seite

Ohne Großbuchstaben-Überschriften und ohne Erklärtexte über den Übungen; Texte mindestens
0,85 rem.

1. **Kopf** – Plantitel klein und gedämpft; darunter groß die Woche („Woche 6 von 12“), rechts
   daneben die Knöpfe **−** und **+**, darunter die Phase („Phase 2“, ggf. „· Entlastungswoche“).
   Siehe „Woche und Phase“.
2. **Einheit** – ein Knopf je Trainingstag (Kurzname der Einheit); Titel der Einheit, daneben
   „Heute“ bzw. der Wochentag („· nächste Einheit“ an Tagen ohne Krafttraining). Vorgewählt:
   heutiger oder nächster Trainingstag.
3. **Aufwärmen** – aufklappbarer Block „Aufwärmen · 9 Min“ mit nummerierten Schritten; Gruppen
   („5 Min Mobility“) mit Unterpunkten. Offen beim Laden und nach einem Wechsel der Einheit.
4. **Übungen** – nummeriert 1, 2, 3 … in der Reihenfolge des Plans (keine Supersätze); Zähler
   „erfasst / gesamt“ (z. B. „3 / 8“); Phasenleiste in einer Zeile
   („Phase 1 W1–4“ …, vorgewählt die Phase der aktuellen Woche) für Vorgabe, Tempo und Ablauf;
   Meldungszeile des Protokolls; Karten.
5. **Infokarten** (aufklappbar) – „Sicherheit zuerst“ (alle Sicherheitsregeln), „Kürzel &
   Bedienung“ (Legende aller Kürzel und Symbole, Bedienhinweise), „Plan & Progression“ (der
   vollständige übergreifende Plan: Bedienhinweis zur Woche, Grundidee, Annahmen, Wochenverteilung
   mit Laufen, Phasen, Progression mit Entlastung, Pausen und Tempo-Schreibweise, Ampelregel,
   verpasste Einheiten und Sitz-Ausgleich, Kennzahlen, Schlussbemerkung; Teile, die nicht in
   `plan.json` stehen, fehlen), „Protokoll sichern“, „Mit KI optimieren“.

**Woche und Phase:** Die aktuelle Woche stellt der Trainierende selbst ein – der Kalender zählt
nicht mit. „+“ startet die nächste Woche, wenn die Leistung es erlaubt; „−“ kehrt zur vorherigen
zurück. Ein Antippen, keine Rückfrage; die Gegenrichtung nimmt einen Wechsel vollständig zurück.
Nach jedem Wechsel ist die Phase gewählt, zu der die neue Woche laut Plan gehört (auch wenn vorher
eine andere Phase angesehen wurde); Karten zeigen sofort deren Werte, Einheit, offene Übung und
Aufwärmen bleiben. Bereich 1 bis letzte Planwoche; an der Grenze ist der Knopf deaktiviert. Die
Woche bleibt dauerhaft erhalten (Neuladen, folgende Tage, App-Update), ist Teil der Sicherung und
wird bei einem neuen Training im Protokoll vermerkt (ein schon angelegtes Training behält seine
Woche). Beim allerersten Start gilt die aus `startDate` berechnete Woche (begrenzt auf den Plan),
ohne Startdatum Woche 1. Kann nicht gespeichert werden, bleibt die Woche und es erscheint die
Meldung über der Übungsliste.

**Am selben Tag wieder geöffnet** (z. B. nachdem iOS die App beendet hat): gewählte Einheit und
Phase, offene Übung, Zustand des Aufwärmens und Scrollposition werden wiederhergestellt. Am
nächsten Tag beginnt die App neu (heutige Einheit, Phase der eingestellten Woche, alles geschlossen).

**Bildschirm:** Solange die App sichtbar ist, bleibt der Bildschirm an (wo das Gerät es erlaubt;
sonst ohne Hinweis nichts).

## Übungskarte

```text
┌────────────────────────────────────────────┐
│ 3   Rumänisches Kreuzheben (Straps) 80 kg 🥵│  Nummernfeld · Name · jüngster Eintrag
│ +   4×8  ↓2 · 1 · ↑1  RPE 7 → 8  P 2 min    │  Kennzahlen: Vorgabe, Tempo, RPE, Pause
│     Hüftstrecker für Sprint … „Straps, gut“ │  Zweck · Kommentar des jüngsten Eintrags
│     • Ablaufschritt …                       │  nur bei Blöcken
│     Hinweis ▸ Aufstieg in die nächste …     │  nur bei Blöcken; eine Zeile, antippen = ganz
└────────────────────────────────────────────┘
```

- Feste Reihenfolge; die Vorgabe ist das kräftigste Element der Kennzahlenzeile; die Zeile bricht
  auf schmalen Geräten um. Jede Angabe einmal, leere Angaben fehlen ganz.
- Rangordnung: Name, Vorgabe und Wert des jüngsten Eintrags fallen am stärksten auf; Zweck,
  Kommentar und Hinweis sind zurückgenommen.
- **Zustand** (ohne Höhenänderung): heute erfasst = Nummernfeld gefüllt, Rand in Akzentfarbe;
  die erste noch nicht erfasste Karte = Akzentring („nächste Übung“). Nach jedem Speichern
  leuchtet das ✓ kurz auf (ohne Animation bei reduzierter Bewegung).
- **Hinweis** unter den Ablaufschritten: eingeklappt eine Zeile („Hinweis ▸ …“), Antippen zeigt
  den ganzen Text, ohne den Protokollbereich zu öffnen.
- **Kürzel** (in der Infokarte „Kürzel & Bedienung“ erklärt): Tempo `↓3 · 1 · ↑1` = Absenken · Pause unten · Anheben
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
unter den Planangaben. Höchstens einer ist offen; beim ersten Laden des Tages und nach einem
Wechsel der Einheit sind alle geschlossen, ein Phasenwechsel lässt ihn offen.

```text
│ ─────────────────────────────────────────── │
│ Letztes Mal (W4 · 07.11. · Entl.): 80 kg 🥵 │  sobald ein früheres Training existiert
│   · „Straps, Rücken gut“                    │
│ Gewicht (kg)                                │  Wertfelder laut Plan, untereinander
│ [  −  ]          80          [  +  ]        │
│ Power                                       │
│ [ 🥵 schwach ][ 🙂 ok ][ 💪 stark ]          │  ohne heutigen Eintrag: „ok“ gestrichelt
│ [ Kommentar (optional)                   ]  │
│ ✓ Heute erfasst            Eintrag löschen  │  bzw. „Noch nicht erfasst – Power wählen zum Speichern“
│ [              Weiter →                  ]  │
```

| Element | Verhalten |
|---|---|
| Werte | Felder je nach Übung (siehe unten), vorbelegt mit dem heutigen, sonst dem letzten Wert. −/+ speichert sofort (Gewicht in Schritten laut Plan, Standard 2,5 kg; Zeit in 5 s, erstes „+“ in leerem Feld = 30 s); Tastatureingabe speichert beim Verlassen bzw. mit Enter. Ungültig: Feld markiert, Meldung, nichts gespeichert. Gespeichert wird mit der heutigen Power, sonst ok. |
| Power | drei Knöpfe schwach · ok · stark. Ein Antippen wählt die Stufe und speichert den ganzen sichtbaren Stand – auch „ok“ und auch unveränderte Werte vom letzten Mal. Die gespeicherte Stufe ist gefüllt (gedrückt); ohne heutigen Eintrag ist keine gewählt und „ok“ als Vorschlag gestrichelt. |
| Kommentar | höchstens 200 Zeichen, speichert beim Verlassen bzw. Enter; ein leerer Kommentar allein legt keinen Eintrag an |
| Eintrag löschen | nur bei heutigem Eintrag, ohne Rückfrage; danach zeigt die Karte wieder das letzte Training, und unten erscheint 6 s lang „Eintrag gelöscht · Rückgängig“ (stellt den Eintrag unverändert wieder her). Verfällt auch beim nächsten Speichern und beim Wechsel von Einheit oder Phase. |
| Weiter → | schließt den Bereich und öffnet die nächste noch nicht erfasste Übung (nach der aktuellen, dann von vorn) und scrollt zu ihr; gibt es keine, wird nur geschlossen |

Bedienelemente im Bereich sind mindestens 48 px hoch.

- Öffnen allein speichert nichts. Es gibt keine Felder für Sätze, Wiederholungen, RPE oder Seiten,
  keinen „erledigt“-Schalter, keinen Speichern-Knopf.
- Speichern aktualisiert Angaben hinter Name/Zweck, Kennzeichen, Zähler, „nächste Übung“ und
  Status, ohne den Bereich neu aufzubauen (Fokus bleibt).

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
  ohne Änderung. Die eingestellte Woche der Sicherung wird übernommen, wenn sie neuer ist als die
  auf dem Gerät eingestellte (oder dort noch keine eingestellt wurde) – dann „Woche N übernommen.“
  und die Phase der Woche ist gewählt.

## Mit KI optimieren

Infokarte mit kurzer Erklärung, Eingabefeld „Zusätzliche Anweisungen (optional)“ (wird nicht
gespeichert) und Knopf **Für KI kopieren**. Der Knopf legt das KI-Paket in die Zwischenablage:
Anleitung ([plan-anleitung.md](plan-anleitung.md)), `plan.json`, alle Leistungsdaten und die
Anweisungen (Aufbau: [docs/datenformate.md](docs/datenformate.md), Teil C). Meldung „Kopiert. Jetzt
in einen KI-Chat einfügen und absenden.“ Ist die Zwischenablage nicht verfügbar, wird das Paket
als Datei `ki-paket-JJJJ-MM-TT.md` wie eine Sicherung weitergegeben (Meldung mit Dateiname;
„Abgebrochen.“, wenn der Teilen-Dialog abgebrochen wird). Konnte die Anleitung nicht geladen
werden (erster Start offline), erscheint eine Meldung mit der Bitte, es mit Netz erneut zu
versuchen. Der Knopf ist auch ohne Trainings nutzbar. Die KI antwortet mit Änderungen und einer
neuen `plan.json`; diese kommt per Commit ins Repository – die App ändert den Plan nie selbst.

## Plan ändern

Der Plan wird nur in `plan.json` geändert (Regeln: [plan-anleitung.md](plan-anleitung.md)). Bei
Netz zeigt die App beim nächsten Öffnen den neuen Plan, ohne App-Update; offline gilt der zuletzt
geladene Stand. Leistungsdaten bleiben erhalten, solange die `id` einer Übung gleich bleibt.

## Bewusst nicht enthalten

Lauf- und Recovery-Tage, Verläufe und Diagramme über viele Wochen, automatische Lastvorschläge,
Synchronisation zwischen Geräten, Pausen-Timer, Supersätze, Bearbeiten des Plans in der App,
direkte Anbindung an einen KI-Dienst.

## Offene Punkte

- schematische Darstellung der Übungen
- Auswertung des Protokolls über mehrere Wochen – als eigene Ansicht, nicht in der Übungskarte
- Synchronisation zwischen Geräten (erfordert eine Änderung der Verfassung, Prinzip VII)
