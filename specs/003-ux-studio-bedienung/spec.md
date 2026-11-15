# Feature Specification: UX-Überarbeitung für die Bedienung im Studio

> **Archiv:** Umgesetzt und abgeschlossen. Gültiger Stand: [SPEC.md](../../SPEC.md) und [docs/](../../docs/) – siehe [specs/README.md](../README.md).

**Feature Branch**: `003-ux-studio-bedienung`

**Created**: 2026-11-15

**Status**: Umgesetzt (2026-11-15, archiviert)

**Input**: User description: „Prüfe die Anwendung aus Sicht eines erfahrenen UX/UI-Experten …
Ziel: Die App soll im Fitnessstudio mit minimalem Aufwand bedient werden können. Schnelle
Erkennung der Bedeutung von Text. Schnelle und unkomplizierte Eingabe.“ – umgesetzt werden die
Vorschläge A (Eingabe & Erfassen), B (Lesbarkeit) und C (Komfort) aus dem UX-Review vom
2026-11-15.

Formuliert als Änderung am Ist-Zustand in [SPEC.md](../../SPEC.md). Was hier nicht erwähnt ist,
bleibt wie dort beschrieben.

## User Scenarios & Testing *(mandatory)*

### User Story 1 – Power mit einem Antippen erfassen (Priority: P1)

Nach der Übung öffnet der Trainierende die Karte und tippt direkt auf das passende Symbol
🥵 schwach, 🙂 ok oder 💪 stark. Der Eintrag ist damit gespeichert – samt der vorbelegten Werte
vom letzten Mal. Bisher wurde „ok“ zwar angezeigt, aber erst gespeichert, wenn man auf eine andere
Stufe und zurück wechselte.

**Why this priority**: Häufigste Handlung im Training; heute zwei bis drei Antipper und ein
Umweg, künftig einer.

**Independent Test**: Übung ohne heutigen Eintrag öffnen, einmal 🙂 antippen → Karte zeigt ✓ und
hinter dem Namen den Wert mit 🙂; nach Neuladen weiterhin vorhanden.

**Acceptance Scenarios**:

1. **Given** keine heutige Erfassung, letzter Eintrag 80 kg, **When** der Bereich geöffnet wird,
   **Then** sind drei gleich große Power-Knöpfe sichtbar, „ok“ ist als Vorschlag erkennbar, aber
   nicht als gewählt markiert, und der Status lautet „Power wählen zum Speichern“.
2. **Given** derselbe Zustand, **When** 🙂 angetippt wird, **Then** wird „80 kg, ok“ als heutiger
   Eintrag gespeichert, der Knopf ist als gewählt markiert und die Karte zeigt ✓.
3. **Given** heute erfasst mit „ok“, **When** 💪 angetippt wird, **Then** wird die Power auf
   „stark“ geändert und gespeichert (ein Antippen).
4. **Given** heute erfasst, **When** der bereits gewählte Knopf erneut angetippt wird, **Then**
   ändert sich nichts.

---

### User Story 2 – Fortschritt sehen und zur nächsten Übung springen (Priority: P1)

Der Trainierende sieht auf einen Blick, welche Übungen heute erledigt sind, welche als Nächstes
kommt und wie viele noch fehlen. Nach dem Erfassen springt er mit „Weiter →“ direkt zur nächsten
offenen Übung, ohne zu scrollen.

**Why this priority**: Orientierung zwischen den Sätzen und weniger Antipper pro Übung.

**Independent Test**: Einheit mit 8 Übungen; zwei erfassen → Zähler „2 / 8“, beide Karten als
erledigt erkennbar, die erste nicht erfasste Karte hervorgehoben; „Weiter →“ öffnet sie.

**Acceptance Scenarios**:

1. **Given** 3 von 8 Übungen heute erfasst, **When** die Einheit angezeigt wird, **Then** zeigt der
   Zähler „3 / 8“ (für Screenreader „3 von 8 Übungen heute erfasst“), die erfassten Karten sind
   deutlich als erledigt gekennzeichnet und die erste nicht erfasste Karte ist als „nächste“
   hervorgehoben.
2. **Given** ein offener Protokollbereich, **When** „Weiter →“ angetippt wird, **Then** schließt er,
   der Bereich der nächsten nicht erfassten Übung (in Kartenreihenfolge nach der aktuellen, dann
   von vorn) öffnet sich und ist im Sichtbereich.
3. **Given** alle anderen Übungen sind erfasst, **When** „Weiter →“ angetippt wird, **Then**
   schließt der Bereich nur.
4. **Given** keine Erfassung heute, **When** die Seite geladen wird, **Then** sind alle Karten so
   hoch wie bisher und die erste Karte ist als nächste hervorgehoben.

---

### User Story 3 – Ruhige, schnell lesbare Seite (Priority: P2)

Der Trainierende öffnet die App und sieht ohne Erklärtexte sofort Woche/Phase, die Einheit, das
Aufwärmen als kurze nummerierte Schritte und die Übungen. Erklärungen (Kürzel, Bedienung) findet er
bei Bedarf in einer Infokarte unten.

**Why this priority**: Schnelleres Erfassen; die Übungen rücken auf dem iPhone nach oben.

**Independent Test**: Seite auf 375 px Breite laden: über der ersten Übungskarte stehen nur
Plantitel, Woche/Phase, Tagesknöpfe, Titel der Einheit, Aufwärmen, Übungszähler und
Phasenleiste – keine Legende, keine Großbuchstaben-Überschriften.

**Acceptance Scenarios**:

1. **Given** die Einheit hat ein Aufwärmprogramm, **When** sie angezeigt wird, **Then** erscheint es
   als nummerierte Liste mit einer Überschrift samt Dauer („Aufwärmen · 9 Min“) und lässt sich
   zu- und aufklappen; beim Laden ist es offen.
2. **Given** die Hauptansicht, **When** sie angezeigt wird, **Then** gibt es keine Legende über den
   Übungen; eine Infokarte „Kürzel & Bedienung“ unter den Übungen erklärt alle Kürzel und Symbole.
3. **Given** die Hauptansicht, **When** sie angezeigt wird, **Then** stehen die Phasen als
   einzeilige Segmentleiste ohne eigene Überschrift; „Woche 6 von 12 · Phase 2“ ist die
   auffälligste Zeile des Kopfs, der Plantitel ist kleiner.
4. **Given** eine Übungskarte, **When** sie angezeigt wird, **Then** sind Name, Vorgabe und der
   Wert des jüngsten Eintrags die auffälligsten Elemente, Zweck und Kommentar sind zurückgenommen,
   aber lesbar.

---

### User Story 4 – Komfort während des Trainings (Priority: P3)

Der Bildschirm geht zwischen den Sätzen nicht aus, solange die App offen ist. Ein versehentlich
gespeicherter Eintrag lässt sich ohne Rückfrage-Dialog löschen und einige Sekunden lang rückgängig
machen. Beim Speichern gibt es eine kurze sichtbare Bestätigung.

**Why this priority**: Spart Entsperren und Dialoge, ist aber nicht für den Kernablauf nötig.

**Independent Test**: App 2 Minuten offen lassen → Bildschirm bleibt an (bei Unterstützung durch
das Gerät). Eintrag löschen → Karte zeigt wieder das letzte Training, Hinweis „Eintrag gelöscht ·
Rückgängig“; Rückgängig → Eintrag ist wieder da.

**Acceptance Scenarios**:

1. **Given** das Gerät unterstützt das Wachhalten, **When** die App sichtbar ist, **Then** schaltet
   sich der Bildschirm nicht automatisch ab; wird die App verlassen und wieder geöffnet, gilt das
   erneut.
2. **Given** das Gerät unterstützt es nicht, **When** die App läuft, **Then** passiert nichts und es
   erscheint keine Meldung.
3. **Given** ein heutiger Eintrag, **When** „Eintrag löschen“ angetippt wird, **Then** wird er ohne
   Rückfrage gelöscht und etwa 6 Sekunden lang ist „Rückgängig“ verfügbar; Antippen stellt den
   Eintrag unverändert wieder her (gespeichert).
4. **Given** eine Änderung wurde gespeichert, **When** das geschieht, **Then** leuchtet das ✓ der
   Karte kurz auf; bei reduzierter Bewegung (Systemeinstellung) ohne Animation.

### Edge Cases

- Speichern ist nicht möglich (Protokoll aus neuerer Version, Speicher voll/nicht verfügbar):
  Power-Knöpfe melden das wie bisher über die Meldungszeile; nichts wird als gewählt markiert.
- Ungültiger Zahlenwert im Feld beim Antippen einer Power-Stufe: Feld markiert, Meldung, nichts
  gespeichert, keine Stufe als gewählt markiert.
- Block-Übungen ohne Wertfelder: Power-Knöpfe allein füllen die Zeile.
- „Weiter →“, wenn der Nutzer gerade im Kommentarfeld tippt: der Kommentar wird vorher gespeichert.
- Rückgängig, nachdem inzwischen dieselbe Übung neu erfasst wurde: Rückgängig ist dann nicht mehr
  verfügbar (verschwindet beim nächsten Speichern).
- Wechsel der Einheit oder der Phase während „Rückgängig“ angezeigt wird: Rückgängig verfällt.
- Einheit ohne Aufwärmen: kein Aufwärmblock.
- Schmale Geräte (320 px): Phasenleiste, Power-Knöpfe und Zähler ohne horizontales Scrollen.

## Requirements *(mandatory)*

### Functional Requirements

**Eingabe & Erfassen**

- **FR-001**: Power MUSS über drei nebeneinanderliegende Knöpfe (schwach 🥵, ok 🙂, stark 💪, jeweils
  mit sichtbarem Wort) gewählt werden; die −/+-Bedienung der Power entfällt.
- **FR-002**: Jedes Antippen einer anderen als der gespeicherten Stufe MUSS den ganzen sichtbaren
  Stand (Werte, Power, Kommentar) sofort als heutigen Eintrag speichern – auch „ok“ ohne
  vorherigen heutigen Eintrag.
- **FR-003**: Ohne heutigen Eintrag MUSS „ok“ als Standard-Vorschlag erkennbar sein, darf aber nicht
  wie eine gespeicherte Wahl aussehen; mit heutigem Eintrag ist genau die gespeicherte Stufe als
  gewählt markiert (für Screenreader als gedrückt).
- **FR-004**: Der Status ohne heutigen Eintrag MUSS „Noch nicht erfasst – Power wählen zum
  Speichern“ lauten.
- **FR-005**: Änderungen an Werten (−/+ oder Tastatur) speichern weiterhin sofort; die Power ist
  dabei die zuletzt gespeicherte Stufe, ohne heutigen Eintrag „ok“.
- **FR-006**: Heute erfasste Karten MÜSSEN als erledigt erkennbar sein (z. B. Akzentrand und
  gefülltes ✓-Kennzeichen), ohne ihre Höhe zu ändern.
- **FR-007**: Die erste nicht erfasste Karte der Einheit MUSS als „nächste“ hervorgehoben sein;
  sind alle erfasst, ist keine hervorgehoben.
- **FR-008**: Der Übungszähler MUSS „erfasst / gesamt“ zeigen und sich beim Speichern und Löschen
  sofort aktualisieren.
- **FR-009**: Der Protokollbereich MUSS einen Knopf „Weiter →“ enthalten, der den Bereich schließt
  und den der nächsten nicht erfassten Übung (nach der aktuellen, dann von vorn) öffnet und in den
  Sichtbereich bringt; gibt es keine, schließt er nur.
- **FR-010**: Bedienelemente im Protokollbereich (−/+, Power, Weiter) MÜSSEN mindestens 48 px hoch
  sein; die Zahl im Wertfeld ist deutlich größer als der Fließtext.
- **FR-011**: Jedes erfolgreiche Speichern MUSS kurz sichtbar bestätigt werden (Aufleuchten des
  ✓-Kennzeichens); bei reduzierter Bewegung ohne Animation.

**Lesbarkeit**

- **FR-012**: Das Aufwärmen MUSS in `plan.json` als Überschrift mit Dauer und Liste von Schritten
  hinterlegt sein und als nummerierte Liste erscheinen; der Block ist auf- und zuklappbar und beim
  Laden sowie nach einem Wechsel der Einheit geöffnet.
- **FR-013**: Die Legende MUSS aus dem Übungsbereich in eine Infokarte „Kürzel & Bedienung“
  (nach den Übungen, bei den anderen Infokarten) wandern und dort alle Kürzel und Symbole
  inklusive Power-Symbolen und Bedienhinweisen erklären.
- **FR-014**: Die Phasenwahl MUSS als einzeilige Segmentleiste ohne eigene Überschrift erscheinen,
  Beschriftung „Phase 1 · W1–4“ o. ä.; Touch-Höhe mindestens 44 px.
- **FR-015**: Die Großbuchstaben-Überschriften „DEIN TRAININGSPLAN“, „DEINE EINHEIT“, „DEIN
  ABLAUF“ und der Fußzeilen-Spruch MÜSSEN entfallen; die Zeile „Woche x von y · Phase z“ ist im
  Kopf am auffälligsten, der Plantitel kleiner als bisher.
- **FR-016**: Kein dauerhaft sichtbarer Text der Hauptansicht darf kleiner als ca. 0,85 rem sein;
  gedämpfte Texte MÜSSEN in Hell- und Dark Mode mindestens WCAG AA erreichen.
- **FR-017**: In der Übungskarte MÜSSEN Name, Vorgabe und Wert des jüngsten Eintrags typografisch
  dominieren; Zweck, Kommentar und Hinweis sind zurückgenommen. Alle Planangaben bleiben ohne
  Aufklappen sichtbar.

**Komfort**

- **FR-018**: Solange die App sichtbar ist, MUSS sie – wo das Gerät es erlaubt – das automatische
  Abschalten des Bildschirms verhindern und dies nach Rückkehr in die App erneut anfordern; ohne
  Unterstützung geschieht stillschweigend nichts.
- **FR-019**: „Eintrag löschen“ MUSS ohne Rückfrage löschen und danach etwa 6 Sekunden lang
  „Rückgängig“ anbieten, das den Eintrag unverändert wiederherstellt und speichert. Danach,
  beim nächsten Speichern oder bei einem Wechsel von Einheit/Phase verfällt das Angebot.

### Key Entities

- **Aufwärmen (plan.json, je Einheit)**: Überschrift mit Dauer (Text) und geordnete Liste von
  Schritten (Texte). Ersetzt den bisherigen Fließtext; Inhalte bleiben gleich, nur gegliedert.
- **Protokolleintrag**: unverändert (Werte, Power, Kommentar). Kein neues Speicherformat.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Eine Übung mit unveränderten Werten und Power „ok“ ist mit 2 Antippern erfasst
  (Karte öffnen, 🙂) – bisher 3 und ein Umweg.
- **SC-002**: Vom Erfassen einer Übung zum offenen Bereich der nächsten: 1 Antippen, kein Scrollen.
- **SC-003**: Auf 375 × 667 px ist beim Laden mindestens die erste Übungskarte vollständig ohne
  Scrollen sichtbar, wenn das Aufwärmen zugeklappt ist; geöffnet beginnt sie im ersten Bildschirm.
- **SC-004**: Erledigte Übungen und die nächste Übung sind in unter 2 Sekunden erkennbar
  (Blicktest), der Fortschritt steht als Zahl im Kopf der Übungsliste.
- **SC-005**: Kein sichtbarer Text der Hauptansicht unter 0,85 rem; alle Texte erfüllen WCAG AA in
  beiden Farbmodi.
- **SC-006**: Seitenlänge ohne Protokolleinträge ist nicht größer als vorher.

## Ergänzung nach Verfassung 2.4.0

Die zunächst gestrichenen Vorschläge sind nach der Änderung von Prinzip III enthalten:

- **FR-020**: Hinweistexte (Hinweis unter den Ablaufschritten) MÜSSEN eingeklappt starten, mit
  sichtbarer Kurzbeschriftung „Hinweis“ und dem Textanfang; Antippen klappt sie auf und zu, ohne
  den Protokollbereich zu öffnen.
- **FR-021**: Im geöffneten Protokollbereich MUSS „Letztes Mal (W… · Datum): Werte · „Kommentar““
  stehen, sobald ein früheres Training der Übung existiert – auch vor dem ersten heutigen Eintrag.
- **FR-022**: Wird die App am selben Tag erneut geöffnet, MÜSSEN gewählte Einheit, gewählte
  Phase, zuletzt offene Übung und Scrollposition wiederhergestellt werden; am nächsten Tag beginnt
  die App wie bisher (heutige Einheit, aktuelle Phase, alles geschlossen). Der Anzeigezustand wird
  getrennt vom Protokoll gespeichert, gehört nicht zur Sicherungsdatei und darf das Protokoll nie
  gefährden; ist er unlesbar oder nicht speicherbar, wird er still ignoriert.

Acceptance:

1. **Given** Block mit Hinweistext, **When** die Karte angezeigt wird, **Then** ist „Hinweis“ mit
   Textanfang in einer Zeile sichtbar; Antippen zeigt den ganzen Text.
2. **Given** früheres Training 80 kg 🥵, heute nichts erfasst, **When** der Bereich geöffnet wird,
   **Then** steht „Letztes Mal (W4 · 07.11.): 80 kg 🥵“ über den Feldern.
3. **Given** Übung 4 offen und Seite gescrollt, **When** die App am selben Tag neu geladen wird,
   **Then** ist Übung 4 offen und die Scrollposition gleich; am Folgetag ist alles geschlossen.

## Assumptions

- Die Power-Stufe beim Speichern über −/+ ohne heutigen Eintrag ist „ok“ (Standard laut
  Verfassung).
- Das Wachhalten des Bildschirms ist eine Komfortfunktion; auf iOS-Versionen ohne Unterstützung
  für installierte Web-Apps entfällt sie ohne Hinweis.
- Die Dauer des Aufwärmens wird als Text aus dem bisherigen Fließtext übernommen; der Inhalt der
  Schritte wird nicht verändert, nur aufgeteilt. `plan.md` wird entsprechend als Liste gegliedert.
- Kein neues Protokollformat; `LOG_SCHEMA` bleibt unverändert.
- `CACHE_NAME` wird hochgezählt (eigene Aufgabe); SPEC.md, docs/datenformate.md,
  docs/architektur.md und docs/pruefung.md werden nach der Umsetzung nachgezogen.
