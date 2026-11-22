# Research: Manuelle Wochensteuerung

Entscheidungen für die offenen technischen Fragen. Grundlage: [spec.md](spec.md), Verfassung 2.4.0.

## R1 – Wo wird die eingestellte Woche gespeichert?

**Decision**: Im Protokoll-Dokument (`trainingsplan.log.v1`) als neues Feld `currentWeek`;
dafür `LOG_SCHEMA` 2 → 3 mit Migrationsschritt.

**Rationale**:
- Die Woche ist Trainingsfortschritt des Nutzers, kein Anzeige-Komfort. Sie braucht dieselbe
  Robustheit wie das Protokoll (Prinzip VII: sofort speichern, Meldung bei Fehler, Erhalt bei
  Update) – `saveLog`/`commitLog` leisten das bereits.
- Sie gelangt so ohne neuen Mechanismus in die Sicherungsdatei (FR-010).
- Eine ältere App-Version (veralteter Service-Worker-Cache) sieht `schema: 3` als „zu neu“ und
  schreibt nichts – sie kann die Woche also nicht stillschweigend verlieren.

**Alternatives considered**:
- Eigener `localStorage`-Schlüssel (wie `trainingsplan.view`): wäre nicht in der Sicherung und
  bräuchte eigene Fehlermeldung und eigenes Import-Format. Verworfen.
- Anzeigezustand `trainingsplan.view`: gilt nur für denselben Tag, Fehler werden still
  ignoriert – widerspricht FR-007/FR-012. Verworfen.
- Feld ohne Schema-Erhöhung: alte Stände blieben lesbar, aber CLAUDE.md/B6 verlangen bei
  Formatänderungen `LOG_SCHEMA` + Migration; zudem fehlte der Schutz gegen ältere App-Versionen.

## R2 – Startwert beim Umstieg und Zusammenspiel mit der Wiederherstellung

**Decision**: Fehlt `currentWeek` (nach Migration `null`), setzt `app.js` beim Start
`{ number: <Startwert>, changedAt: null }` und speichert, wenn Speichern erlaubt ist.
Startwert = bisherige Berechnung aus `startDate`, begrenzt auf 1…`totalWeeks`; ohne gültiges
`startDate` Woche 1. `changedAt: null` heißt „nicht vom Nutzer eingestellt“.

**Rationale**:
- „Einmalig übernommen“ (Spec, Edge Cases): Nach dem ersten Start zählt der Kalender nicht weiter.
- Beim Wiederherstellen schlägt jede vom Nutzer eingestellte Woche (`changedAt` gesetzt) einen
  bloßen Startwert. So bleibt Akzeptanzszenario US4-1 erfüllt: Ein neues Gerät hat nur einen
  Startwert, die Sicherung mit Woche 8 gewinnt.

**Alternatives considered**:
- Startwert nur im Speicher ableiten, nie speichern: Die Woche würde weiter mit dem Kalender
  wandern, solange der Nutzer nie „+“/„−“ tippt – widerspricht FR-001.
- Startwert mit `changedAt = jetzt` speichern: Ein frisch geöffnetes Gerät würde jede ältere
  Sicherung überstimmen. Verworfen.

## R3 – Zusammenführen beim Import

**Decision**: `mergeLog` übernimmt `imported.currentWeek`, wenn es eine gültige Woche mit
`changedAt` hat und das Gerät keine eingestellte Woche hat (`changedAt` null/fehlt) oder dessen
`changedAt` älter ist. Ungültige oder fehlende Woche in der Datei wird ignoriert (Trainings werden
trotzdem übernommen). Das Ergebnis meldet, ob die Woche übernommen wurde.

**Rationale**: Gleiche Regel wie bei Trainings („zuletzt geändert gewinnt“), FR-010. Eine kaputte
Wochenangabe soll die Wiederherstellung der Trainings nicht verhindern.

**Alternatives considered**: Sicherung gewinnt immer – könnte einen neueren Gerätestand
überschreiben. Datei bei ungültiger Woche ablehnen – zu strenge Folge für ein Nebenfeld.

## R4 – Begrenzung bei Planänderung

**Decision**: Die gespeicherte Zahl bleibt unverändert; angezeigt und im Protokoll vermerkt wird
`clampWeek(number, totalWeeks)`. „+“/„−“ rechnen von der begrenzten Woche aus.

**Rationale**: Verfassung VII – gespeicherte Daten nicht stillschweigend verändern; die Anzeige
ist trotzdem immer gültig (Spec, Edge Case „Plan wird geändert“).

## R5 – Was wird aus `startDate`, `planStart`, `created`, `planWeek`?

**Decision**:
- `startDate` bleibt optional in `plan.json` und dient nur noch als Startwert (R2); keine
  Formatänderung an `plan.json`, keine Änderung an `plan.js`.
- `planWeek` bleibt in `calendar.js` (für den Startwert). Neu dort: `clampWeek`, `initialWeek`.
- `session.planStart` wird weiter wie bisher geschrieben (Format unverändert; rein informativ).
- `created` wird nicht mehr im Kopf angezeigt (der Fall „keine Wochenerkennung“ entfällt); das
  Feld bleibt Pflicht in `plan.json` (keine Formatänderung), `datenformate.md` beschreibt es als
  Planinformation ohne Anzeige.
- `formatDateLong` (nur für „Start am …“) entfällt.

**Rationale**: Kleinster Eingriff; keine Planformatänderung nötig.

## R6 – Platz der Bedienelemente

**Decision**: Im Kopf in einer Zeile: `[−]  Woche 5 von 12 · Phase 2  [+]` (Text in der Mitte
darf umbrechen, Knöpfe bleiben außen, je 44 × 44 px). Darstellung in `js/ui-workout.js`
(`renderWeekControl`), keine neue Datei.

**Rationale**: Die Woche wird dort angezeigt, wo sie geändert wird; keine zusätzliche Zeile in der
Hauptansicht (FR-014, Verfassung III). `ui-workout.js` enthält bereits die verwandte Phasenleiste;
eine neue Datei bräuchte nur einen zusätzlichen `APP_SHELL`-Eintrag.

**Alternatives considered**: Steuerung in „Plan & Progression“ – versteckt, zwei Antipper mehr.
Eigene Zeile über der Phasenleiste – mehr Höhe.

## R7 – Rückmeldung und Fehlerfall

**Decision**: Kein Dialog. Nach dem Wechsel aktualisieren sich Kopf, Phasenleiste und Karten
sofort; die Kopfzeile ist ein `aria-live="polite"`-Bereich, damit Screenreader die neue Woche
ansagen. Ist das Protokoll nicht schreibbar oder schlägt Speichern fehl, bleibt die Anzeige beim
alten Stand und `#log-message` zeigt die Meldung (wie beim Erfassen).

## R8 – Prüfung

**Decision**: Manuell nach `docs/pruefung.md` (neue Szenarien: Wochenwechsel, Phasengrenze,
Migration Schema 2 → 3, Sicherung/Wiederherstellung). Die Fachfunktionen (`clampWeek`,
`initialWeek`, `setCurrentWeek`, `migrate`, `mergeLog`) lassen sich in Node bzw. der
Browser-Konsole per `import()` prüfen; ein Prüfskript bleibt im Scratchpad, nicht im Repository
(Verfassung I, keine Test-Toolchain).
