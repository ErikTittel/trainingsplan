# Trainingsplan-PWA Constitution

## Core Principles

### I. Reines Web ohne Build (NICHT VERHANDELBAR)

- Die App besteht ausschließlich aus HTML, CSS und JavaScript, die der Browser direkt lädt.
- Es gibt KEINE Frameworks, KEINE Build-Tools, KEINE Transpiler, KEINE Paketmanager-
  Abhängigkeiten und KEINE externen CDN-Skripte.
- Jede Datei im Repository MUSS so, wie sie ist, ausgeliefert werden können.

**Begründung:** Der Entwickler hat Grundkenntnisse; die App muss ohne Toolchain verständlich,
wartbar und auf jedem statischen Hosting lauffähig bleiben.

### II. Mobile-first und studiotauglich

- Das Layout wird zuerst für iPhone-Breite entworfen; größere Bildschirme sind nachrangig.
- Interaktive Elemente MÜSSEN große Touch-Flächen haben (mindestens 44 × 44 CSS-Pixel)
  und mit einem Finger bedienbar sein.
- Texte MÜSSEN im Fitnessstudio auf Armlänge lesbar sein; Kontraste erfüllen mindestens
  WCAG AA.
- Dark Mode MUSS unterstützt werden und gleichwertig lesbar sein.

**Begründung:** Die App wird während des Trainings genutzt – mit verschwitzten Händen,
wechselndem Licht und wenig Aufmerksamkeit für Bedienung.

### III. Fokus auf die aktuelle Einheit, alles auf einen Blick

- Die Hauptansicht zeigt die heutige bzw. nächste Trainingseinheit der aktuellen Woche.
- Nur echte Krafttrainingstage werden angezeigt; Lauf- und Recovery-Tage nicht.
- Übungskarten zeigen alle in `plan.json` hinterlegten Angaben der gewählten Phase sofort
  und ohne Interaktion an; die Planangaben sind NICHT auf- oder zuklappbar.
- Jede Karte folgt einem festen Aufbau: Name, darunter eine Kennzahlenzeile (Vorgabe, Tempo,
  RPE, Pause), darunter Zusatztexte (Zweck, Ablaufschritte, Hinweise).
- Jede Angabe erscheint pro Karte genau einmal; fehlende Angaben werden weggelassen statt
  als Platzhalter angezeigt.
- Abkürzungen sind erlaubt, wenn sie das Erfassen beschleunigen; jede verwendete Abkürzung
  MUSS in einer kurzen Legende auf derselben Seite erklärt sein.
- Neue Funktionen DÜRFEN die Hauptansicht nicht überladen oder unnötiges Scrollen erzeugen.
  Ergänzende Infobereiche außerhalb der Übungskarten (z. B. Plan-Details) DÜRFEN aufklappbar
  sein, soweit Prinzip VI eingehalten wird.
- Das Trainingsprotokoll (Prinzip VII) wird in einem aufklappbaren Protokollbereich unter den
  Planangaben jeder Übung erfasst. Das ist die einzige Ausnahme vom Aufklapp-Verbot der Karte;
  die Planangaben selbst bleiben jederzeit sichtbar und nicht aufklappbar.
- Der Protokollbereich ist beim Öffnen der Seite geschlossen. Im geschlossenen Zustand zeigt
  die Karte vom Protokoll nur den jüngsten Eintrag der Übung, kompakt und ohne eigene Zeile:
  Gewicht bzw. Zeit und Power direkt hinter dem Namen, den Kommentar direkt hinter dem Zweck,
  dazu ein Kennzeichen am Nummernfeld. Ohne Eintrag ist die Karte so hoch wie ohne Protokoll.
- Die Werte des letzten Trainings MÜSSEN ohne Antippen sichtbar sein (hinter Name und Zweck);
  ist heute schon erfasst, stehen sie im geöffneten Protokollbereich.
- Erfasst wird pro Übung und Training nur, was vom Plan abweichen kann: Gewicht bzw. Zeit,
  Power (wahrgenommene Anstrengung: schwach, ok, stark; Standard ok) und ein Kommentar. Sätze,
  Wiederholungen und RPE gelten als planmäßig und werden NICHT erfasst; einseitige Übungen
  werden nicht nach Seiten getrennt.
- Das Erfassen MUSS mit wenigen Antippern möglich sein: Felder sind mit dem letzten Eintrag
  vorbelegt, ein unveränderter Wert ist mit einem Antippen übernommen, es gibt KEINE
  Pflichtfelder, und das Training ist auch ganz ohne Eingabe nutzbar.
- Auswertungen und Verläufe über mehrere Wochen gehören NICHT in die Übungskarte.
- Jede Karte steht für genau eine Übung; kombinierte Karten („A + B“) sind unzulässig, damit
  jede Übung eigene Planangaben und ein eigenes Protokoll hat.

**Begründung:** Im Studio zählt, die nächste Übung in Sekunden zu erfassen – ohne Tippen
zwischen zwei Sätzen. Kompaktheit entsteht durch festes Layout und Abkürzungen, nicht durch
Verstecken. Das Protokoll ist eine bewusste Handlung und bleibt bis auf den jüngsten Eintrag
zugeklappt; dieser steht dort, wo die Entscheidung fällt („wie viel heute?“) – an der Übung.

### IV. Plandaten getrennt von Darstellung und Protokoll

- Trainingsinhalte (Phasen, Wochen, Einheiten, Übungen, Sicherheitsregeln) liegen ausschließlich in `plan.json`; `app.js` enthält KEINE fest codierten Trainingsinhalte.
- `plan.md` und das PDF sind die menschenlesbare Quelle; inhaltliche Änderungen MÜSSEN
  in `plan.json` und `plan.md` konsistent nachgezogen werden.
- Änderungen am Datenformat von `plan.json` MÜSSEN in `app.js` im selben Commit
  berücksichtigt werden.
- `plan.json` beschreibt das Soll, das Protokoll das Ist. `plan.json` enthält KEINE erfassten
  Trainingswerte und wird von der App nie verändert.
- Jede Übung in `plan.json` MUSS eine stabile, eindeutige ID tragen, über die das Protokoll sie
  wiederfindet. Eine einmal vergebene ID DARF NICHT umbenannt oder für eine andere Übung
  wiederverwendet werden – auch dann nicht, wenn Name, Nummer oder Reihenfolge sich ändern.
- Welche Werte zu einer Übung erfasst werden (z. B. Gewicht und Wiederholungen, nur Dauer),
  legt `plan.json` pro Übung fest, nicht `app.js`.

**Begründung:** Ein neuer oder angepasster Plan soll ohne Codeänderung einspielbar sein, und
bereits erfasste Trainings dürfen durch eine Planänderung nicht ihren Bezug verlieren.

### V. Offline-fähig und relativ deploybar

- Alle Pfade (HTML, CSS, JS, Manifest, Service Worker, Icons) MÜSSEN relativ sein,
  damit die Seite unter `/<repo-name>/` (z. B. GitHub Pages) läuft.
- Die App MUSS als PWA installierbar und nach dem ersten Laden offline nutzbar sein.
- Jede Änderung an ausgelieferten Dateien MUSS `CACHE_NAME` in `sw.js` hochzählen;
  neue Dateien MÜSSEN in `APP_SHELL` aufgenommen werden.

**Begründung:** Im Studio ist der Empfang oft schlecht; veraltete Caches sind die häufigste
Fehlerquelle bei Service Workern.

### VI. Sicherheitshinweise sichtbar

- Sicherheitsregeln (Schmerzregel, Knie, Zeigefinger, Barfußschuhe) MÜSSEN in der App
  an klarer Stelle erreichbar sein und DÜRFEN durch keine Änderung entfernt oder
  versteckt werden.
- Sie werden kompakt dargestellt und überladen die Einheitenansicht nicht.

**Begründung:** Der Plan ist auf Knie- und Fingerschutz ausgelegt; Hinweise, die im
Training nicht auffindbar sind, schützen nicht.

### VII. Trainingsprotokoll: lokal, robust, eigene Daten

- Erfasste Trainingswerte (Gewicht bzw. Zeit, Power, Kommentar) werden
  ausschließlich auf dem Gerät im Speicher des Browsers abgelegt. Es gibt KEINEN Server, KEINE
  gehostete Datenbank, KEINE Anmeldung und KEINE laufenden Kosten.
- Jede Eingabe MUSS sofort gespeichert werden – ohne „Speichern“-Knopf und ohne Netz. Ein
  Schließen der App, ein Neuladen oder ein Update der App DARF KEINE erfassten Werte kosten.
- Das Protokoll MUSS als Datei exportierbar und aus einer solchen Datei wieder importierbar
  sein. Das ist die Sicherung und der Weg auf ein neues Gerät.
- Protokolldaten verlassen das Gerät NUR durch eine ausdrückliche Aktion des Nutzers (Export).
  Sie DÜRFEN NICHT ins Repository gelangen und NICHT automatisch an Dritte übertragen werden.
- Das gespeicherte Format trägt eine Versionsnummer. Ändert sich das Format, MUSS die App ältere
  Stände beim Laden in das neue Format überführen; vorhandene Daten zu verwerfen ist unzulässig.
- Protokolleinträge verweisen auf Übungen nur über deren stabile ID (Prinzip IV). Einträge zu
  Übungen, die es im Plan nicht mehr gibt, bleiben erhalten.
- Die App MUSS ohne Protokolldaten vollständig funktionieren (erster Start, geleerter Speicher,
  nicht verfügbarer Speicher). Ist Speichern nicht möglich, MUSS die App das sichtbar melden,
  statt Eingaben stillschweigend zu verlieren.
- Der Service Worker speichert nur die App-Dateien zwischen; ein Hochzählen von `CACHE_NAME`
  DARF das Protokoll nicht berühren.

**Begründung:** Das Protokoll ist nur etwas wert, wenn es über zwölf Wochen lückenlos bleibt.
Lokale Speicherung hält Prinzip I und V ein (kein Backend, offline, kostenlos, weiter auf jedem
statischen Hosting), ist aber an Gerät und Browser gebunden – deshalb sind sofortiges Speichern,
Export/Import und Migration Pflicht und kein Komfort.

## Technische Rahmenbedingungen

- Zielplattform: Safari auf iOS (aktuelle Version), installiert als Home-Bildschirm-App;
  aktuelle Desktop-Browser zur Entwicklung.
- Hosting: statisch (z. B. GitHub Pages); kein Server-Code, keine gehostete Datenbank, keine
  Anmeldung.
- Persistenz nur über die im Browser eingebauten Speicher (z. B. `localStorage`, IndexedDB) –
  für Komfortfunktionen und für das Trainingsprotokoll nach Prinzip VII.
- Keine Tracker, keine Analytics, keine automatische Übertragung persönlicher Daten; das
  Repository und das Hosting enthalten nur den Plan, nie erfasste Trainingswerte.
- Sprache der Oberfläche und der Inhalte: Deutsch.

## Entwicklungsablauf

- Jede Änderung wird vor dem Commit lokal über einen statischen Server geprüft:
  Hell- und Dark Mode, schmale Mobilbreite (ab 320 px ohne horizontales Scrollen),
  vollständige Karteninhalte samt Legende, Phasenwechsel, Wochenerkennung.
- Bei Änderungen am Protokoll zusätzlich: Seitenlänge ohne Einträge unverändert; Eintrag
  erfassen, ändern und löschen; Werte bleiben nach
  Neuladen und nach App-Update erhalten; Anzeige des letzten Trainings; Erfassen im Offline-
  Betrieb; Export und Import; Start mit leerem Speicher.
- Bei Änderungen am Service Worker wird das Offline-Verhalten geprüft.
- Änderungen werden kurz auf Deutsch erklärt, verständlich für Grundkenntnisse.
- Commit-Nachrichten auf Deutsch, knapp und beschreibend.
- Für neue Features gilt der Spec-Kit-Ablauf (`/speckit-specify` → `/speckit-plan` →
  `/speckit-tasks` → `/speckit-implement`); jeder Plan prüft die Einhaltung dieser
  Verfassung.

## Governance

- Diese Verfassung hat Vorrang vor anderen Projektregeln; `SPEC.md` und
  `CLAUDE.md` MÜSSEN ihr entsprechen.
- Änderungen erfolgen über `/speckit-constitution`, werden mit Begründung dokumentiert
  und als eigener Commit festgehalten.
- Versionierung nach SemVer: MAJOR für entfernte oder neu definierte Prinzipien, MINOR für
  neue Prinzipien oder Abschnitte, PATCH für Klarstellungen und Formulierungen.
- Jeder Implementierungsplan enthält einen Verfassungs-Check; Abweichungen MÜSSEN dort
  begründet werden, sonst ist der Plan abzulehnen.

**Version**: 2.2.0 | **Ratified**: 2026-11-14 | **Last Amended**: 2026-11-14
