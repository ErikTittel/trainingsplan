# Feature Specification: Manuelle Wochensteuerung

> **Archiv:** Umgesetzt und abgeschlossen. Gültiger Stand: [SPEC.md](../../SPEC.md) und [docs/](../../docs/) – siehe [specs/README.md](../README.md).
>
> **Abweichung bei der Umsetzung:** Der Kopf zeigt „Woche N von 12“ groß mit „−“/„+“ rechts
> daneben und die Phase (ggf. „· Entlastungswoche“) in einer eigenen Zeile darunter. Der ganze Satz
> zwischen den Knöpfen brach bei 320 px auf bis zu vier Zeilen um (FR-014 sinngemäß erfüllt:
> Woche und Knöpfe stehen in einer Zeile). [contracts/ui.md](contracts/ui.md) beschreibt noch den
> ursprünglichen Entwurf.

**Feature Branch**: `004-manuelle-wochensteuerung`

**Created**: 2026-11-22

**Status**: Umgesetzt (2026-11-22, archiviert)

**Input**: User description: „Aktuell wird die Phase in Abhängigkeit vom Start-Datum des Plans
berechnet. Allerdings hängt das Fortschreiten von einer Woche zur nächsten und von einer Phase zur
nächsten von meiner Trainingsleistung ab. Ich möchte in der App sehen, in welcher Woche ich bin und
möchte die Woche manuell hochzählen, wenn ich mich bereit fühle, die nächste Woche zu starten. Wenn
ich dadurch in die nächste Phase komme (Übergang von Woche 4 zu Woche 5) wird automatisch die
nächste Phase ausgewählt. Wenn meine Leistung nicht so gut ist, möchte ich die Möglichkeit haben,
die Woche wieder runterzuzählen, um zur vorhergehenden Woche zurückzukehren. Die Phase passt sich
dann entsprechend an.“

Formuliert als Änderung am Ist-Zustand in [SPEC.md](../../SPEC.md). Was hier nicht erwähnt ist,
bleibt wie dort beschrieben.

**Ist-Zustand:** Die App berechnet die aktuelle Planwoche aus dem Startdatum in `plan.json`
(Woche 1 beginnt am Starttag, danach alle 7 Tage eine Woche weiter). Daraus folgen die Anzeige im
Kopf („Woche 6 von 12 · Phase 2“), die vorgewählte Phase, die Entlastungswoche sowie Woche, Phase
und Entlastung, die bei jedem Training im Protokoll vermerkt werden. Der Trainierende hat keinen
Einfluss darauf.

**Neu:** Die aktuelle Woche ist ein vom Trainierenden geführter Wert. Er zählt sie selbst weiter
oder zurück; der Kalender bestimmt sie nicht mehr.

## User Scenarios & Testing *(mandatory)*

### User Story 1 – Aktuelle Woche sehen und nächste Woche starten (Priority: P1)

Der Trainierende öffnet die App und sieht im Kopf, in welcher Woche er ist („Woche 4 von 12 ·
Phase 1“). Fühlt er sich bereit, tippt er auf „Woche weiter“ (+). Die Anzeige springt auf
„Woche 5 von 12 · Phase 2“; weil Woche 5 zu Phase 2 gehört, ist in der Phasenleiste automatisch
Phase 2 gewählt und alle Übungskarten zeigen sofort Vorgabe, Tempo und Ablauf von Phase 2.

**Why this priority**: Kern des Wunsches – das Fortschreiten folgt der Leistung, nicht dem
Kalender. Ohne diese Story hat das Feature keinen Nutzen.

**Independent Test**: Woche 4 eingestellt → einmal „+“ antippen → Kopf zeigt „Woche 5 von 12 ·
Phase 2“, Phasenleiste zeigt Phase 2 gewählt, Karten zeigen die Vorgaben von Phase 2; nach dem
Neuladen und am nächsten Tag weiterhin Woche 5.

**Acceptance Scenarios**:

1. **Given** Woche 3 (Phase 1), **When** „+“ angetippt wird, **Then** zeigt der Kopf
   „Woche 4 von 12 · Phase 1“ samt Entlastungshinweis, falls Woche 4 laut Plan eine
   Entlastungswoche ist; die gewählte Phase bleibt Phase 1.
2. **Given** Woche 4 (letzte Woche von Phase 1), **When** „+“ angetippt wird, **Then** zeigt der
   Kopf „Woche 5 von 12 · Phase 2“, in der Phasenleiste ist Phase 2 gewählt, und die Karten zeigen
   die Werte von Phase 2.
3. **Given** Woche 5 eingestellt, **When** die App neu geladen oder an einem späteren Tag geöffnet
   wird, **Then** ist weiterhin Woche 5 eingestellt – unabhängig davon, wie viele Kalendertage
   vergangen sind.
4. **Given** die letzte Planwoche (Woche 12), **When** der Kopf angezeigt wird, **Then** ist „+“
   nicht bedienbar (erkennbar deaktiviert), und die Woche bleibt 12.

---

### User Story 2 – Zur vorherigen Woche zurückkehren (Priority: P1)

Lief die Woche nicht gut, tippt der Trainierende auf „Woche zurück“ (−). Die Woche sinkt um eins;
fällt sie dadurch in die vorherige Phase (z. B. von Woche 5 auf Woche 4), wird diese Phase
automatisch gewählt.

**Why this priority**: Ausdrücklicher Wunsch und gleichzeitig die Korrektur für ein versehentliches
Hochzählen – ohne sie wäre „+“ eine Einbahnstraße.

**Independent Test**: Woche 5 eingestellt → einmal „−“ → Kopf „Woche 4 von 12 · Phase 1“,
Phase 1 gewählt, Karten zeigen Phase-1-Werte.

**Acceptance Scenarios**:

1. **Given** Woche 5 (Phase 2), **When** „−“ angetippt wird, **Then** zeigt der Kopf
   „Woche 4 von 12 · Phase 1“ und Phase 1 ist gewählt.
2. **Given** Woche 7 (Phase 2), **When** „−“ angetippt wird, **Then** zeigt der Kopf
   „Woche 6 von 12 · Phase 2“; die gewählte Phase ist Phase 2.
3. **Given** Woche 1, **When** der Kopf angezeigt wird, **Then** ist „−“ nicht bedienbar, und die
   Woche bleibt 1.

---

### User Story 3 – Protokoll vermerkt die eingestellte Woche (Priority: P2)

Trainiert der Trainierende in der eingestellten Woche, werden im Protokoll Woche, Phase und
Entlastung dieser Woche vermerkt – so passen „W5 · 09.11.“ und „Entl.“ in „Letztes Mal“ zu dem,
was er tatsächlich trainiert hat.

**Why this priority**: Hält das Protokoll stimmig; ohne diese Story würde es weiter
Kalenderwochen enthalten, die nicht zum Training passen.

**Independent Test**: Woche 4 (Entlastungswoche laut Plan) einstellen, einen Eintrag speichern →
im Protokollbereich bzw. nach Export erscheint das Training mit Woche 4 und Entlastung.

**Acceptance Scenarios**:

1. **Given** Woche 6 eingestellt und heute noch kein Training der Einheit, **When** der erste
   Eintrag gespeichert wird, **Then** wird das Training mit Woche 6 und der Entlastungsangabe von
   Woche 6 angelegt; als Phase wird wie bisher die beim ersten Eintrag gewählte Phase vermerkt.
2. **Given** ein heute bereits angelegtes Training mit Woche 4, **When** die Woche danach auf 5
   gestellt wird, **Then** bleibt das bereits angelegte Training bei Woche 4 (wie bisher werden
   Trainingsangaben beim Anlegen festgehalten); erst ein neues Training trägt Woche 5.

---

### User Story 4 – Eingestellte Woche bleibt bei Sicherung und Wiederherstellung erhalten (Priority: P3)

Sichert der Trainierende sein Protokoll und stellt es auf einem anderen Gerät oder nach dem
Löschen der Website-Daten wieder her, ist auch die eingestellte Woche wieder da.

**Why this priority**: Schützt vor einem stillen Rücksprung auf eine falsche Woche, ist aber im
Alltag selten.

**Independent Test**: Woche 8 einstellen, sichern, Website-Daten löschen, Sicherung
wiederherstellen → Woche 8 ist eingestellt.

**Acceptance Scenarios**:

1. **Given** eine Sicherung mit Woche 8 und ein Gerät ohne eingestellte Woche, **When** die
   Sicherung wiederhergestellt wird, **Then** ist Woche 8 eingestellt.
2. **Given** ein Gerät mit Woche 9 (später eingestellt) und eine ältere Sicherung mit Woche 8,
   **When** die Sicherung wiederhergestellt wird, **Then** bleibt Woche 9 – es gilt die zuletzt
   vorgenommene Einstellung.

---

### Edge Cases

- **Erster Start nach dem Update** (noch keine Woche eingestellt): Ist im Plan ein gültiges
  Startdatum hinterlegt, wird die bisher daraus berechnete Woche einmalig übernommen und auf den
  Bereich 1 bis Planende begrenzt (vor Planstart → Woche 1, nach Planende → letzte Woche). Ohne
  Startdatum beginnt der Plan in Woche 1. So ändert sich für den Trainierenden nach dem Update
  zunächst nichts.
- **Danach ist das Startdatum ohne Wirkung** auf Woche, Phase und Entlastung; der Kalender
  zählt nicht mehr weiter.
- **Versehentliches Antippen** von „+“ oder „−“: Ein Antippen der Gegenrichtung stellt den
  vorherigen Stand vollständig wieder her (Woche und dazugehörige Phase). Es gibt keine
  Rückfrage.
- **Gewählte Phase weicht von der Woche ab**: Der Trainierende darf wie bisher in der
  Phasenleiste eine andere Phase ansehen (z. B. zum Vorausschauen). Ein Wochenwechsel wählt immer
  die Phase der neuen Woche, auch wenn die Phasengrenze nicht überschritten wurde.
- **Am selben Tag wieder geöffnet**: Die zuletzt gewählte Phase wird wie bisher wiederhergestellt;
  am nächsten Tag ist die Phase der eingestellten Woche vorgewählt.
- **Plan wird geändert** (z. B. kürzer): Liegt die eingestellte Woche außerhalb des neuen Plans,
  wird sie für Anzeige und Protokoll auf den gültigen Bereich begrenzt.
- **Speichern nicht möglich** (Speicher voll, Protokoll aus neuerer App-Version, privater Modus):
  Der Wochenwechsel wird nicht übernommen, und es erscheint dieselbe Art Meldung wie beim
  Protokoll; Anzeige und gespeicherter Stand laufen nicht auseinander.
- **Wochenwechsel während „Rückgängig“ angeboten wird**: „Rückgängig“ verfällt wie beim
  Phasenwechsel.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die App MUSS eine aktuelle Woche führen, die nur der Trainierende ändert; sie hängt
  nicht vom heutigen Datum ab.
- **FR-002**: Der Kopf MUSS die aktuelle Woche wie bisher anzeigen („Woche N von 12 · Phase X“,
  ggf. „· Entlastungswoche“). Die Texte „Start am …“ und „Plan abgeschlossen“ entfallen.
- **FR-003**: Im Kopf MÜSSEN zwei Bedienelemente bei der Wochenanzeige stehen: „Woche zurück“ (−)
  und „Woche weiter“ (+), jeweils mindestens 44 × 44 Punkte groß, mit verständlicher Beschriftung
  für Screenreader (z. B. „Woche 5 starten“ bzw. „Zurück zu Woche 3“).
- **FR-004**: „+“ MUSS die Woche um genau eins erhöhen, „−“ um genau eins verringern; die Woche
  bleibt im Bereich 1 bis zur letzten Planwoche. An der jeweiligen Grenze ist das Element
  deaktiviert.
- **FR-005**: Nach jedem Wochenwechsel MUSS die Phase, zu der die neue Woche laut Plan gehört,
  gewählt sein; Phasenleiste und alle Übungskarten zeigen sofort deren Werte. Offene
  Protokollbereiche, Aufwärmzustand und Einheit bleiben wie beim bisherigen Phasenwechsel
  erhalten.
- **FR-006**: Die Entlastungsangabe im Kopf und im Protokoll MUSS sich nach der eingestellten
  Woche richten.
- **FR-007**: Die eingestellte Woche MUSS dauerhaft auf dem Gerät erhalten bleiben (Neuladen,
  Neustart, App-Update, folgende Tage).
- **FR-008**: Neu angelegte Trainings MÜSSEN die eingestellte Woche und deren Entlastungsangabe
  vermerken; bereits angelegte Trainings bleiben unverändert.
- **FR-009**: Beim ersten Start ohne eingestellte Woche MUSS die App den Startwert wie unter
  „Edge Cases“ beschrieben bestimmen (bisher berechnete Woche, begrenzt; sonst Woche 1).
- **FR-010**: Die Sicherungsdatei MUSS die eingestellte Woche enthalten; beim Wiederherstellen gilt
  die zuletzt vorgenommene Einstellung (Gerät oder Sicherung). Ältere Sicherungen ohne Woche
  bleiben einlesbar und lassen die Woche auf dem Gerät unverändert.
- **FR-011**: Vorhandene Protokolldaten MÜSSEN beim Update vollständig erhalten bleiben.
- **FR-012**: Kann die Woche nicht gespeichert werden, MUSS die Anzeige beim bisherigen Stand
  bleiben und eine Meldung erscheinen.
- **FR-013**: Die Infokarten „Kürzel & Bedienung“ und „Plan & Progression“ MÜSSEN kurz erklären,
  dass die Woche selbst weitergezählt wird, wenn die Leistung es erlaubt.
- **FR-014**: Die Hauptansicht DARF durch die Bedienelemente nicht höher werden als nötig: die
  Wochenanzeige samt „−“ und „+“ steht in einer Zeile.

### Key Entities

- **Aktuelle Woche**: Ganzzahl von 1 bis zur letzten Planwoche, vom Trainierenden geführt;
  dazu der Zeitpunkt der letzten Änderung (zum Abgleich bei der Wiederherstellung). Aus ihr folgen
  Phase und Entlastung laut Plan.
- **Training (bestehend)**: vermerkt weiterhin Woche, Phase und Entlastung beim Anlegen – künftig
  aus der eingestellten Woche statt aus dem Kalender.
- **Plan (bestehend)**: legt Phasengrenzen, Entlastungswochen und Planlänge fest; das Startdatum
  dient nur noch als einmaliger Startwert beim Umstieg.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Der Trainierende erkennt die aktuelle Woche und Phase beim Öffnen der App ohne
  Antippen in unter 2 Sekunden.
- **SC-002**: Der Wechsel in die nächste oder vorherige Woche gelingt mit genau einem Antippen;
  die Karten zeigen danach ohne weiteres Antippen die Werte der passenden Phase.
- **SC-003**: Bei 10 Wechseln über eine Phasengrenze (Woche 4↔5, 8↔9) ist in 10 von 10 Fällen die
  zur Woche gehörende Phase gewählt.
- **SC-004**: Nach Neuladen, Neustart und Datumswechsel bleibt die eingestellte Woche in 100 % der
  Fälle unverändert.
- **SC-005**: Nach dem Update ist kein vorhandenes Training verloren oder verändert; die beim
  ersten Start angezeigte Woche entspricht der vor dem Update angezeigten (innerhalb des Plans).

## Assumptions

- Es gibt einen Trainierenden pro Gerät; die Woche gilt für alle Einheiten gemeinsam.
- Wochen werden einzeln gezählt; ein Springen um mehrere Wochen auf einmal ist nicht nötig
  (mehrfaches Antippen genügt).
- Ein Wochenwechsel braucht keine Rückfrage, weil die Gegenrichtung ihn vollständig zurücknimmt;
  eine kurze, sichtbare Änderung der Kopfzeile genügt als Bestätigung.
- Phasengrenzen, Entlastungswochen und Planlänge bleiben in `plan.json`; der Code enthält keine
  Planstruktur.
- Die Phasenleiste bleibt zum Ansehen anderer Phasen erhalten; sie ändert die Woche nicht.
- Das Startdatum bleibt im Plan stehen (Startwert beim Umstieg); ob es später entfernt wird,
  entscheidet die Planung.
- Automatische Vorschläge, wann die nächste Woche dran ist (z. B. aus der Power-Bewertung), sind
  nicht Teil dieses Features.
