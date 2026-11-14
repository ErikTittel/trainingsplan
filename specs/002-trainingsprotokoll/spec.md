# Feature Specification: Trainingsprotokoll

**Feature Branch**: `002-trainingsprotokoll`

**Created**: 2026-11-14

**Status**: Umgesetzt (vereinfachte Fassung vom 2026-11-14)

**Input**: User description: "Der Trainingsplan soll um die Funktion erweitert werden, die Sätze, Wiederholungen und Gewichte der aktuellen Übung einzugeben. Ziel ist, dass ich während des Trainings einen Überblick über meine aktuelle Trainingsperformance bekomme und gleichzeitig sehen kann, wie gut die Performance aus dem letzten Training war. Damit möchte ich meinen aktuellen Trainingsumfang an die Performance aus dem letzten Training anpassen können. Die unterschiedlichen Arten der Übungen sind zu berücksichtigen."

**Änderung (2026-11-14, Vorgabe des Nutzers)**: „Vereinfache die Datenerfassung und Eingabe. Erfasst
werden: Gewicht bzw. Zeit, wahrgenommene Anstrengung (‚Power‘: drei Smileys schwach, ok, stark;
ok ist der Standard) und ein Kommentar. Keine Wiederholungen, Sätze und RPE – diese entsprechen
dem Plan. Keine Anzeige der ‚Heute‘-Daten im Eingabebereich. Keine Unterscheidung zwischen rechts
und links. Übungen ohne Gewicht müssen nicht als erledigt gekennzeichnet werden. Ist für eine
Übung bereits eine Eingabe vorhanden, stehen Gewicht/Zeit und Power direkt hinter dem Namen, der
Kommentar direkt hinter dem ‚Warum‘-Text. Spanish Squat bekommt zusätzlich Gewicht.“
Die erste Fassung (Sätze mit Wiederholungen, RPE, Seiten, ▲/▼-Vergleich) ist damit ersetzt.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Letztes Training an der Übung sehen (Priority: P1)

Der Trainierende öffnet die Einheit und sieht an jeder Übung, die er schon einmal protokolliert
hat, ohne Antippen den jüngsten Eintrag: Gewicht bzw. Zeit und Power direkt hinter dem Namen
(z. B. „Rumänisches Kreuzheben 80 kg 😟“), seinen Kommentar direkt hinter dem Zweck. Daran
entscheidet er, ob er heute mehr, gleich viel oder weniger auflegt.

**Why this priority**: Das ist der Kern des Ziels – der Vergleich im Moment der Entscheidung.

**Independent Test**: Eintrag erfassen, Training auf einen früheren Tag verschieben, neu laden:
Die Werte stehen hinter Name und Zweck, ohne dass etwas angetippt werden muss.

**Acceptance Scenarios**:

1. **Given** zu „Rumänisches Kreuzheben“ gibt es einen früheren Eintrag 80 kg, Power schwach,
   Kommentar „Straps, Rücken gut“, **When** die Einheit angezeigt wird, **Then** steht hinter dem
   Namen „80 kg 😟“ und hinter dem Zweck „„Straps, Rücken gut““.
2. **Given** zu einer Übung gibt es keinen Eintrag, **When** die Karte angezeigt wird, **Then**
   ist sie genauso aufgebaut und genauso hoch wie ohne Protokollfunktion.
3. **Given** alle Karten, **When** die Seite geladen wird, **Then** sind alle Protokollbereiche
   geschlossen und alle Planangaben unverändert sichtbar.

---

### User Story 2 - Heutiges Training mit wenigen Antippern erfassen (Priority: P1)

Nach der Übung tippt der Trainierende auf das Nummernfeld der Karte. Der Protokollbereich öffnet
sich mit dem Gewicht bzw. der Zeit vom letzten Mal. Er korrigiert bei Bedarf den Wert (−/+ oder
Tastatur) und tippt auf einen der drei Smileys. Jede Änderung ist sofort gespeichert. War alles
wie beim letzten Mal, genügt ein Antippen von „ok“.

| Art der Übung | Beispiele | Felder |
|---|---|---|
| Gewicht | Kreuzheben, Kniebeuge, Schrägbank, Shrimp-Squat, Einbein-RDL | Gewicht (kg) |
| Körpergewicht | Klimmzug, Liegestütz, Ringrudern, Einbein-Wadenheben | Zusatzlast (kg), leer = ohne |
| Zeit | Copenhagen Plank | Zeit (s) |
| Zeit und Gewicht | Spanish Squat | Zeit (s), Gewicht (kg) |
| Block ohne Gewicht | Sprung-, Beschleunigungsblock | keine (nur Power und Kommentar) |

Bei allen Übungen kommen Power (😟 schwach · 🙂 ok · 😃 stark, Standard ok) und Kommentar dazu.
Einseitige Übungen werden nicht nach Seiten getrennt: Gewicht und Zeit gelten für beide Seiten.

**Why this priority**: Ohne Erfassung gibt es nichts zu vergleichen.

**Independent Test**: Für je eine Übung jeder Art den Bereich öffnen, Wert ändern bzw. Smiley
antippen, neu laden – der Wert steht hinter dem Namen, das Nummernfeld zeigt „✓“.

**Acceptance Scenarios**:

1. **Given** der Bereich ist geöffnet und mit 80 kg vom letzten Mal vorbelegt, **When** der
   Nutzer „ok“ antippt, **Then** sind 80 kg und Power ok für heute gespeichert.
2. **Given** der Bereich ist geöffnet, **When** der Nutzer das Gewicht auf 82,5 kg ändert,
   **Then** ist der Wert sofort gespeichert (Power ok, falls noch keine gewählt), und hinter dem
   Namen steht „82,5 kg 🙂“.
3. **Given** die Karte „Spanish Squat“, **When** der Bereich geöffnet wird, **Then** gibt es ein
   Feld für die Zeit und eines für das Gewicht.
4. **Given** die Karte „Sprung-/Elastizitätsblock“, **When** der Bereich geöffnet wird, **Then**
   gibt es kein Zahlenfeld und keinen „erledigt“-Schalter, nur Power und Kommentar.
5. **Given** der Bereich ist geöffnet, **When** angezeigt, **Then** gibt es keine Felder für Sätze,
   Wiederholungen, RPE oder Seiten und keine „Heute“-Zeile – die Eingabefelder zeigen den
   heutigen Stand.
6. **Given** das Öffnen des Bereichs allein, **When** nichts geändert wird, **Then** wird nichts
   gespeichert.

---

### User Story 3 - Korrigieren und Löschen (Priority: P2)

Der Trainierende ändert einen Wert, die Power oder den Kommentar jederzeit im geöffneten Bereich;
der neue Stand ersetzt den alten. Einen versehentlichen Eintrag löscht er mit „Eintrag löschen“
(mit Rückfrage).

**Acceptance Scenarios**:

1. **Given** ein heutiger Eintrag, **When** der Nutzer einen anderen Smiley antippt, **Then** ist
   die neue Power gespeichert und hinter dem Namen sichtbar.
2. **Given** ein heutiger Eintrag, **When** der Nutzer „Eintrag löschen“ bestätigt, **Then** ist
   der Eintrag entfernt, das Nummernfeld zeigt wieder „+“ und hinter dem Namen steht wieder der
   Eintrag des letzten Trainings (falls vorhanden).
3. **Given** heute ist erfasst und es gibt ein früheres Training, **When** der Bereich geöffnet
   ist, **Then** steht oben „Letztes Mal (W5 · 07.11.): 80 kg 😟 · „Kommentar““, weil die Karte
   jetzt die heutigen Werte zeigt.

---

### User Story 4 - Protokoll sichern und wiederherstellen (Priority: P2)

Unverändert gegenüber der ersten Fassung: Sicherung als Datei über „Protokoll sichern“, Import
mit Zusammenführen pro Training; ältere Sicherungen (mit Sätzen) werden beim Import umgewandelt.

**Acceptance Scenarios**:

1. **Given** erfasste Trainings, **When** „Sichern“, Speicher leeren, „Wiederherstellen“,
   **Then** sind alle Trainings wieder da.
2. **Given** eine Sicherung im alten Format (Sätze), **When** sie eingelesen wird, **Then** werden
   pro Übung das höchste Gewicht, die längste Zeit und der Kommentar übernommen, Power ok.
3. **Given** eine Datei, die keine Sicherung ist, **When** sie eingelesen wird, **Then** erscheint
   eine Fehlermeldung und der Speicher bleibt unverändert.

---

### Edge Cases

- **Erstes Training / leerer Speicher**: keine Angaben hinter den Namen, Felder leer, Power ok
  vorausgewählt.
- **Ungültige Eingabe** („abc“, Zeit mit Nachkommastelle, über 999 kg): Feld wird markiert, eine
  Meldung erscheint, gespeichert bleibt der letzte gültige Stand.
- **Mehrere Bereiche**: höchstens einer offen; Einheitenwechsel und Neuladen schließen alle.
- **Entlastungswoche**: In „Letztes Mal“ steht „Entl.“, damit ein niedrigerer Wert richtig
  eingeordnet wird.
- **Daten aus der ersten Fassung**: werden beim Laden automatisch umgewandelt (höchstes Gewicht,
  längste Zeit, Kommentar, Power ok); der alte Stand wird vorher beiseitegelegt.
- **Speichern nicht möglich** / **Protokoll aus neuerer App-Version**: sichtbare Meldung, nichts
  wird überschrieben, der Plan funktioniert weiter.
- **Plan ändert sich**: Verlauf hängt an der Übungs-`id`, nicht an Name oder Nummer.

## Requirements *(mandatory)*

### Functional Requirements

**Erfassen**

- **FR-001**: Jede Übungskarte MUSS einen aufklappbaren Protokollbereich unter den Planangaben
  haben; das Nummernfeld der Karte öffnet und schließt ihn.
- **FR-001a**: Beim Laden sind alle Bereiche geschlossen; höchstens ein Bereich ist offen.
- **FR-002**: Erfasst werden pro Übung und Training nur: Gewicht bzw. Zeit (je nach Übung, siehe
  Tabelle in User Story 2), Power (schwach/ok/stark, Standard ok) und ein Kommentar (max. 200
  Zeichen). Sätze, Wiederholungen, RPE und Seiten werden NICHT erfasst.
- **FR-003**: Welche Felder eine Übung hat, legt der Plan fest. Spanish Squat hat Zeit und Gewicht.
- **FR-004**: Jede Karte steht für genau eine Übung (kombinierte Übungen sind aufgeteilt).
- **FR-005**: Die Felder MÜSSEN mit dem heutigen Eintrag, sonst mit dem jüngsten früheren Eintrag
  vorbelegt sein; Power ist ohne heutigen Eintrag „ok“.
- **FR-006**: Jede Änderung (Wert, Power, Kommentar) MUSS sofort den ganzen sichtbaren Stand
  speichern; ein Antippen eines Smileys übernimmt unveränderte Werte. Öffnen allein speichert
  nichts.
- **FR-007**: Gewichte in kg mit Komma oder Punkt, 0–999; Zeit in ganzen Sekunden 1–3600. Leere
  Felder sind erlaubt; ungültige Werte werden markiert und nicht gespeichert.
- **FR-008**: Es gibt KEINE Pflichtfelder und keinen „erledigt“-Schalter.
- **FR-009**: Ein heutiger Eintrag MUSS geändert und (nach Rückfrage) gelöscht werden können.

**Anzeigen**

- **FR-010**: Gibt es zu einer Übung einen Eintrag, MÜSSEN Gewicht/Zeit und Power des jüngsten
  Eintrags (heute, sonst letztes Training) direkt hinter dem Namen und dessen Kommentar direkt
  hinter dem Zweck stehen – ohne Antippen.
- **FR-011**: Das Nummernfeld MUSS zeigen, ob die Übung heute erfasst ist (`✓`) oder nicht (`+`).
- **FR-012**: Ist heute erfasst und gibt es ein früheres Training, MUSS der geöffnete Bereich
  dessen Werte, Kommentar und Woche/Datum (mit „Entl.“ in Entlastungswochen) zeigen.
- **FR-013**: Der Eingabebereich zeigt KEINE gesonderte „Heute“-Zeile.
- **FR-014**: Ohne Eintrag DARF eine Karte nicht höher sein als ohne Protokollfunktion.
- **FR-015**: Neue Symbole (`+`, `✓`, Smileys, Entl.) MÜSSEN in der Legende erklärt sein.

**Speichern und Sichern** (unverändert)

- **FR-016**: Speichern sofort, offline, auf dem Gerät; übersteht Neuladen und App-Update.
- **FR-017**: Sichern als Datei und Wiederherstellen mit Zusammenführen pro Training.
- **FR-018**: Daten der ersten Fassung und alte Sicherungen werden umgewandelt, nicht verworfen.
- **FR-019**: Kann nicht gespeichert werden, MUSS die App das sichtbar melden.
- **FR-020**: Touch-Flächen ≥ 44 × 44 px; Hell- und Dark Mode; ab 320 px ohne horizontales Scrollen.

### Key Entities

- **Übung (Plan)**: stabile `id` und Liste der Erfassungsfelder (`log.fields`).
- **Training**: Kalendertag + Einheit, mit Planwoche, Phase und Entlastungswoche.
- **Eintrag**: pro Übung und Training – Gewicht bzw. Zeit, Power, Kommentar, Planvorgabe zum
  Zeitpunkt des Trainings.
- **Sicherung**: Datei mit allen Trainings.

## Success Criteria *(mandatory)*

- **SC-001**: Ein unverändertes Gewicht ist mit zwei Antippern erfasst (Nummernfeld, Smiley);
  ein geänderter Wert mit höchstens vier.
- **SC-002**: Der jüngste Eintrag jeder Übung ist mit null Antippern sichtbar.
- **SC-003**: Alle 24 Übungen sind mit passenden Feldern erfassbar.
- **SC-004**: Ohne Einträge ist jede Einheit genauso lang wie ohne Protokollfunktion.
- **SC-005**: Nach 12 Wochen ist kein erfasster Eintrag verloren; eine Sicherung lässt sich auf
  einem leeren Gerät vollständig wiederherstellen.
- **SC-006**: Keine laufenden Kosten, kein zusätzlicher Einrichtungsaufwand.

## Assumptions

- Vom Nutzer bestätigt: ein Gerät; nur Arbeitssätze; Kurzhantel = Gewicht einer Hantel,
  Langhantel = Gesamtgewicht; Varianten-Übungen als eine Übung; kombinierte Übungen aufgeteilt;
  Sätze und Wiederholungen entsprechen dem Plan.
- Pro Übung und Training gibt es genau einen Eintrag. Wechselt das Gewicht innerhalb der Übung,
  wird das Arbeitsgewicht (in der Regel das höchste) eingetragen; Details gehören in den Kommentar.
- „Power“ ist die subjektive Einschätzung nach der Übung, keine RPE-Skala.
- Nicht im Umfang: Verläufe über viele Wochen, Lastvorschläge, Synchronisation, Pausen-Timer.
- Es gilt die Projektverfassung ab Version 2.2.0.
