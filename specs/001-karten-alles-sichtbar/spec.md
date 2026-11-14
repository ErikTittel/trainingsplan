# Feature Specification: Übungskarten ohne Aufklappen

**Feature Branch**: `001-karten-alles-sichtbar`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "Aktuell enthalten die aufklappbaren Karten der einzelnen Übungen Inhalte, die zu großen Teilen redundant zu den zugeklappten Karten sind. In Zukunft sollen alle Informationen sofort auf der Karte sichtbar sein. Ein Aufklappen soll damit nicht mehr nötig sein. Stell sicher, dass alle vorhandenen Informationen auf den Karten dargestellt werden. Ziel ist, dass die Angaben schnell erfasst werden können. Nutze dafür, wenn sinnvoll, Abkürzungen."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Übung auf einen Blick erfassen (Priority: P1)

Der Trainierende steht im Studio zwischen zwei Sätzen, schaut aufs iPhone und will zur
aktuellen Übung sofort alles sehen: Name, Sätze × Wiederholungen bzw. Last, Tempo, RPE,
Pause und Zweck – ohne zu tippen.

**Why this priority**: Das ist der Kern des Wunsches; jede Bedienung mitten im Training kostet
Aufmerksamkeit.

**Independent Test**: Einheit öffnen und für jede Karte prüfen, dass alle in den Plandaten
hinterlegten Angaben der gewählten Phase ohne Antippen sichtbar sind.

**Acceptance Scenarios**:

1. **Given** die Einheit „Montag“ in Phase 1 ist geöffnet, **When** der Nutzer die Karte
   „Klimmzug“ ansieht, **Then** sieht er ohne Interaktion „4×4–5“, Tempo „3-0-1“, RPE „8“
   und den Zweck der Übung.
2. **Given** eine beliebige Übungskarte, **When** der Nutzer darauf tippt, **Then** passiert
   nichts (kein Auf-/Zuklappen, kein Pfeil-Symbol).
3. **Given** eine Übung mit eingebetteter Pausenangabe im Namen (z. B. „Pause 90 s“),
   **When** die Karte angezeigt wird, **Then** ist die Pause als eigene, kurze Angabe
   erkennbar (z. B. „P 90 s“) und nicht im Fließtext des Namens versteckt.

---

### User Story 2 - Kompakte, redundanzfreie Darstellung (Priority: P1)

Jede Angabe erscheint auf der Karte genau einmal. Wiederkehrende Begriffe werden durch
gängige, im Plan erklärte Abkürzungen ersetzt, damit die Karte kurz bleibt.

**Why this priority**: Ohne Entdoppelung und Abkürzungen würden aufgeklappte Inhalte die
Einheit unübersichtlich lang machen.

**Independent Test**: Karte prüfen: Keine Angabe (Sätze/Wdh., Tempo, RPE) erscheint doppelt;
verwendete Abkürzungen stehen in einer Legende.

**Acceptance Scenarios**:

1. **Given** eine Karte mit Tempo „2-1-2“, **When** sie angezeigt wird, **Then** erscheint
   das Tempo genau einmal, mit kompakter Zuordnung der Ziffern zu den Bewegungsphasen
   (z. B. „↓2 · P1 · ↑2“ oder ähnlich kurz).
2. **Given** die Einheit wird angezeigt, **When** der Nutzer die Bedeutung einer Abkürzung
   nicht kennt, **Then** findet er sie in einer kurzen Legende auf derselben Seite.

---

### User Story 3 - Blöcke mit Ablaufliste vollständig sehen (Priority: P2)

Bei Übungen mit mehreren Teilschritten (z. B. Sprung-/Elastizitätsblock) sieht der Nutzer
die komplette Liste der Teilschritte der aktuellen Phase und den Hinweis zur Stufen-
Progression direkt auf der Karte.

**Why this priority**: Betrifft nur wenige Übungen, die Inhalte sind aber sicherheits-
relevant (Progressionskriterien).

**Independent Test**: Donnerstag/Samstag öffnen, Blockkarte prüfen: alle Teilschritte und der
Progressionshinweis sind sichtbar.

**Acceptance Scenarios**:

1. **Given** Phase 2 ist gewählt, **When** die Karte „Sprung-/Elastizitätsblock“ angezeigt
   wird, **Then** sind alle 7 Teilschritte der Phase 2 und der Progressionshinweis sichtbar.

---

### Edge Cases

- Übung ohne Tempo oder ohne RPE (z. B. Sprungblock): Die fehlende Angabe wird weggelassen,
  nicht als „Nicht angegeben“ angezeigt.
- Tempo mit „X“ (explosiv) oder Tempo als Wort („explosiv“): wird verständlich und kompakt
  dargestellt.
- Sehr lange Übungsnamen oder Ablauflisten: Text bricht um, die Karte bleibt ohne
  horizontales Scrollen lesbar.
- Phasenwechsel: Alle Karteninhalte aktualisieren sich auf die gewählte Phase.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Übungskarten MÜSSEN dauerhaft vollständig sichtbar sein; es gibt keinen
  auf-/zugeklappten Zustand und kein Aufklapp-Symbol mehr.
- **FR-002**: Jede Karte MUSS alle in den Plandaten vorhandenen Angaben der gewählten Phase
  zeigen: Nummer, Name, Satz-/Wdh.-/Last-Vorgabe, Tempo, RPE, Ablaufschritte, Ablaufhinweis
  und Zweck der Übung.
- **FR-003**: Jede Angabe MUSS pro Karte genau einmal erscheinen (keine Doppelung wie
  bisher zwischen Kopfzeile und Detailbereich).
- **FR-004**: Die Karte MUSS ein festes, für alle Übungen gleiches Layout haben: oben Name,
  darunter eine Kennzahlenzeile (Sätze×Wdh., Tempo, RPE, Pause), darunter Zusatztexte.
- **FR-005**: Die App MUSS kurze, gängige Abkürzungen verwenden, wo sie die Erfassung
  beschleunigen (z. B. „Wdh.“, „P“ für Pause, „RPE“, „/S.“ für pro Seite), und MUSS diese
  in einer Legende auf der Seite erklären.
- **FR-006**: Pausenangaben, die heute Teil des Übungsnamens sind, MÜSSEN als eigene
  Kennzahl dargestellt werden.
- **FR-007**: Die Tempo-Angabe MUSS die Zuordnung der Ziffern zu den Bewegungsphasen
  (Absenken, Pause unten, Anheben, Pause oben) erkennbar machen, ohne mehr als eine Zeile
  zu belegen.
- **FR-008**: Fehlende Angaben MÜSSEN ausgeblendet werden statt als Platzhaltertext zu
  erscheinen.
- **FR-009**: Die Karten MÜSSEN weiterhin im Hell- und Dark Mode gut lesbar sein und auf
  iPhone-Breite ohne horizontales Scrollen funktionieren.

### Key Entities

- **Übung**: Nummer, Name (ggf. mit Pausenangabe), Vorgabe je Phase, Tempo je Phase, RPE,
  Zweck, optional Ablaufschritte je Phase und Ablaufhinweis.
- **Abkürzung**: Kurzform und Bedeutung; Teil der Legende.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 % der in den Plandaten hinterlegten Übungsangaben sind ohne jede
  Interaktion auf der Karte sichtbar.
- **SC-002**: Name, Vorgabe, Tempo und RPE einer Übung lassen sich in unter 3 Sekunden
  ablesen.
- **SC-003**: Keine Angabe erscheint auf einer Karte mehr als einmal.
- **SC-004**: Die Gesamtlänge einer Einheit (ohne Sprungblock) wächst um höchstens 50 %
  gegenüber der bisherigen zugeklappten Ansicht.

## Assumptions

- Die Plandaten werden inhaltlich nicht geändert; nur die Darstellung ändert sich. Die
  Pausenangabe wird zur Anzeige aus dem Namen gelesen.
- Eine „schematische Darstellung der Übung“ (SPEC.md) existiert in den Daten bisher nicht und
  ist nicht Teil dieses Features.
- Die grafische Tempo-Darstellung (Bewegungsrhythmus mit Pfeilen) wird durch eine kompakte
  Einzeilen-Darstellung ersetzt.
- Die Verfassung wurde für dieses Feature auf 2.0.0 angepasst (Prinzip III „alles auf einen
  Blick“, neuer Prüfpunkt im Entwicklungsablauf). `CLAUDE.md` und `SPEC.md` werden im Zuge
  des Features nachgezogen.
