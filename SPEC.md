# SPEC – mobile Trainingsplan-Website

## Ziel
Eine mobile, schnell lesbare Trainingsplan-App für iPhone im Fitnessstudio. Fokus liegt auf der aktuellen Trainingseinheit. Die Oberfläche soll schnell verständlich, groß genug für die Hand und für den Einsatz im Training geeignet sein.

## Grundsatz
- Nur HTML, CSS und JavaScript
- Keine Frameworks, keine Build-Tools
- Relative Pfade, damit die Seite später unter /<repo-name>/ laufen kann
- Mobile-first, große Touch-Flächen, gute Lesbarkeit im Fitnessstudio
- Dark Mode unterstützt

## Getroffene Entscheidungen

### 1. Inhaltlicher Fokus
- Die App zeigt standardmäßig nur die aktuelle Trainingseinheit an.
- Die komplette Woche wird nicht als Hauptansicht dargestellt.
- Lauf- und Recovery-Tage werden nicht angezeigt.

### 2. Layout
- Einfache, kompakte Tagesansicht mit klaren Abschnittsüberschriften
- Große Karten für die einzelnen Einheiten
- Fokus auf schnelle Erkennung der wichtigsten Angaben: 
  - Übungsname
  - Sätze
  - Wiederholungen
  - Ausführungsgeschwindigkeit (Tempo)
  - RPE

### 3. Interaktion
- Übungen werden als dauerhaft sichtbare Karten dargestellt; die Planangaben sind nicht
  aufklappbar und reagieren nicht auf Antippen. Aufklappbar ist nur der Protokollbereich
  (Abschnitt 7).
- Jede Karte steht für genau eine Übung (keine kombinierten Karten „A + B“).
- Jede Karte hat denselben Aufbau:
  - Name der Übung
  - Kennzahlenzeile: Sätze/Wiederholungen, Tempo, RPE, Pause
  - Zweck der Übung
  - bei Blöcken: Ablaufschritte und Hinweis
- Jede Angabe erscheint genau einmal; fehlende Angaben werden weggelassen.
- Abkürzungen (↓/↑ im Tempo, X, P, /S., RPE) werden in einer Legende unter „Übungen“ erklärt.
- Künftige Idee (noch nicht umgesetzt): schematische Darstellung der Übung.

### 4. Farbschema
- sportlich/klar
- hohe Kontrastfähigkeit
- gut lesbar im Dark Mode
- klare visuelle Trennung zwischen Hauptübungen, Hilfsübungen und Sicherheits-/Hinweisbereichen

### 5. Detailniveau
- Die mobile Ansicht priorisiert schnell nutzbare Informationen im Training.
- Wichtige Sicherheitsregeln werden an klarer Stelle sichtbar, aber nicht überladen dargestellt.
- Alle Angaben einer Übung sind ohne Antippen sichtbar, kompakt durch Abkürzungen.

### 6. Trainingstage
- Nur tatsächliche Trainingseinheiten werden angezeigt.
- Montag, Donnerstag und Samstag als Haupttrainings-Tage bleiben sichtbar.
- Lauf- und Recovery-Tage werden bewusst nicht dargestellt.

### 7. Trainingsprotokoll
Details: [specs/002-trainingsprotokoll/](specs/002-trainingsprotokoll/spec.md)

- Ziel: Während des Trainings festhalten, mit welchem Gewicht bzw. welcher Zeit eine Übung
  gemacht wurde und wie sie sich angefühlt hat – und beim nächsten Mal genau das an der Übung
  sehen, um Last und Umfang anzupassen.
- Erfasst wird pro Übung und Training nur:
  - Gewicht (kg) bzw. Zusatzlast bei Körpergewichtsübungen, bzw. Zeit (s) bei Halteübungen;
    Spanish Squat hat Zeit und Gewicht; Sprung- und Beschleunigungsblock haben keinen Wert
  - Power (wahrgenommene Anstrengung): 😟 schwach · 🙂 ok · 😃 stark, Standard ok
  - ein Kommentar
- Nicht erfasst: Sätze, Wiederholungen, RPE (sie entsprechen dem Plan), keine Trennung links/
  rechts (Gewicht und Zeit gelten für beide Seiten), kein „erledigt“.
- Anzeige: Gibt es zu einer Übung einen Eintrag, stehen Gewicht/Zeit und Power des jüngsten
  Eintrags direkt hinter dem Namen, der Kommentar direkt hinter dem Zweck – ohne Antippen. Das
  Nummernfeld zeigt „✓“, wenn die Übung heute erfasst ist, sonst „+“.
- Eingabe: Nummernfeld antippen öffnet den Protokollbereich unter der Übung (höchstens einer
  offen, beim Laden alle geschlossen). Felder sind mit dem letzten Wert vorbelegt; jede Änderung
  wird sofort gespeichert; ein Smiley antippen übernimmt die Werte. Keine „Heute“-Zeile – die
  Felder zeigen den heutigen Stand. Ist heute schon erfasst, steht oben „Letztes Mal …“.
- Kurzhantel: Gewicht einer Hantel; Langhantel: Gesamtgewicht.
- Speicherung: nur auf dem Gerät, sofort bei jeder Eingabe, auch offline. Kein Server, kein
  Konto, keine Kosten; das Deployment bleibt unverändert.
- Sicherung: Protokoll als Datei exportieren und wieder importieren (Gerätewechsel, Schutz vor
  Datenverlust).
- Bewusst nicht enthalten: Diagramme und Verläufe über viele Wochen, automatische
  Lastvorschläge, Synchronisation zwischen Geräten, Pausen-Timer.

## Strukturvorschlag der Oberfläche
1. Header mit Phase / Woche / heutiger Einheit
2. Einheit/Kartenbereich
3. Dauerhaft sichtbare Übungskarten mit Legende, je Karte mit aufklappbarem Protokollbereich
4. Hinweisbereich für Sicherheit und Progression
5. Sicherungsbereich für das Protokoll (aufklappbare Infokarte)

## UX-Ziele
- Keine überladenen Listen
- Im Studio schnell auffindbar
- Vermeidung von unnötigem Scrollen
- Gute Handhabung mit einem Finger / großer Touch-Zone

## Offene Punkte für spätere Umsetzung
- genaue Ausgestaltung der schematischen Übungsdarstellungen (künftige Idee)
- genaue Positionierung der Hinweise und Sicherheitsregeln
- Auswertung des Protokolls über mehrere Wochen (Verläufe, Kennzahlen) – eigene Ansicht, nicht
  in der Übungskarte
- Synchronisation des Protokolls zwischen Geräten (würde eine Verfassungsänderung erfordern)
