<!--
Sync Impact Report
- Version change: 1.0.0 → 2.0.0 (MAJOR: Prinzip III neu definiert)
- Modified principles:
  - III. Fokus auf die aktuelle Einheit → III. Fokus auf die aktuelle Einheit, alles auf einen Blick
    (Regel „Details erst im geöffneten Zustand“ ersetzt durch „alle Angaben sofort sichtbar,
    nicht aufklappbar, ohne Doppelung, Abkürzungen nur mit Legende“)
- Added sections: keine (Entwicklungsablauf: Prüfpunkt „Auf-/Zuklappen der Karten“ ersetzt
  durch „vollständige Kartenanzeige, Phasenwechsel, Legende“)
- Removed sections: keine
- Auslöser: specs/001-karten-alles-sichtbar (Plan, Complexity Tracking)
- Templates: keine Änderung (Templates lesen die Verfassung zur Laufzeit)
- Follow-up TODOs:
  - CLAUDE.md, Abschnitt „UI-Grundsätze“ und Prüfliste „Lokal starten“: noch auf
    aufklappbare Karten (`<details>`) ausgerichtet → anpassen
  - SPEC.md, Abschnitte 3 „Interaktion“ und 5 „Detailniveau“: beschreiben noch
    expandierbare Karten → anpassen
-->

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
  und ohne Interaktion an; sie sind NICHT auf- oder zuklappbar und haben kein Aufklapp-Symbol.
- Jede Karte folgt einem festen Aufbau: Name, darunter eine Kennzahlenzeile (Vorgabe, Tempo,
  RPE, Pause), darunter Zusatztexte (Zweck, Ablaufschritte, Hinweise).
- Jede Angabe erscheint pro Karte genau einmal; fehlende Angaben werden weggelassen statt
  als Platzhalter angezeigt.
- Abkürzungen sind erlaubt, wenn sie das Erfassen beschleunigen; jede verwendete Abkürzung
  MUSS in einer kurzen Legende auf derselben Seite erklärt sein.
- Neue Funktionen DÜRFEN die Hauptansicht nicht überladen oder unnötiges Scrollen erzeugen.
  Ergänzende Infobereiche außerhalb der Übungskarten (z. B. Plan-Details) DÜRFEN aufklappbar
  sein, soweit Prinzip VI eingehalten wird.

**Begründung:** Im Studio zählt, die nächste Übung in Sekunden zu erfassen – ohne Tippen
zwischen zwei Sätzen. Kompaktheit entsteht durch festes Layout und Abkürzungen, nicht durch
Verstecken.

### IV. Plandaten getrennt von Darstellung

- Trainingsinhalte (Phasen, Wochen, Einheiten, Übungen, Sicherheitsregeln) liegen ausschließlich in `plan.json`; `app.js` enthält KEINE fest codierten Trainingsinhalte.
- `plan.md` und das PDF sind die menschenlesbare Quelle; inhaltliche Änderungen MÜSSEN
  in `plan.json` und `plan.md` konsistent nachgezogen werden.
- Änderungen am Datenformat von `plan.json` MÜSSEN in `app.js` im selben Commit
  berücksichtigt werden.

**Begründung:** Ein neuer oder angepasster Plan soll ohne Codeänderung einspielbar sein.

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

## Technische Rahmenbedingungen

- Zielplattform: Safari auf iOS (aktuelle Version), installiert als Home-Bildschirm-App;
  aktuelle Desktop-Browser zur Entwicklung.
- Hosting: statisch (z. B. GitHub Pages); kein Server-Code, keine Datenbank, keine
  Anmeldung.
- Persistenz nur über den Browser (z. B. `localStorage`) und ausschließlich für
  Komfortfunktionen; die App MUSS ohne gespeicherte Daten korrekt funktionieren.
- Keine Tracker, keine Analytics, keine Übertragung persönlicher Daten an Dritte.
- Sprache der Oberfläche und der Inhalte: Deutsch.

## Entwicklungsablauf

- Jede Änderung wird vor dem Commit lokal über einen statischen Server geprüft:
  Hell- und Dark Mode, schmale Mobilbreite (ab 320 px ohne horizontales Scrollen),
  vollständige Karteninhalte samt Legende, Phasenwechsel, Wochenerkennung.
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

**Version**: 2.0.0 | **Ratified**: 2026-11-14 | **Last Amended**: 2026-11-14
