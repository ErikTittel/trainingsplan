# Research: Trainingsprotokoll

Entscheidungen zum technischen Setup. Maßstab: Verfassung 2.1.0 (I: kein Build, keine
Abhängigkeiten; V: offline, statisch deploybar; VII: lokal, robust, eigene Daten) und der
Wunsch „Datenspeicherung, möglichst einfach deploybar, ohne weitere Kosten“.

## R1 – Wo liegen die Daten?

**Decision**: Ausschließlich auf dem Gerät im Speicher des Browsers. Kein Backend. Deployment
bleibt unverändert: dieselben statischen Dateien auf GitHub Pages.

**Rationale**:
- Kosten 0 €, kein Konto, keine Schlüssel, nichts einzurichten – „deployen“ heißt weiterhin nur
  `git push`.
- Funktioniert im Studio ohne Empfang (Prinzip V); Speichern dauert Millisekunden.
- Ein Nutzer, ein Gerät: Der einzige Vorteil eines Servers (mehrere Geräte, automatische
  Sicherung) wird durch Export/Import als Datei (R4) ausreichend abgedeckt.
- Das Repository ist für GitHub Pages öffentlich – Trainingsdaten dürfen dort nicht landen.

**Alternatives considered**:

| Alternative | Kosten | Warum verworfen |
|---|---|---|
| Supabase / Firebase (gehostete Datenbank, Gratis-Tarif) | 0 € im Gratis-Tarif | Braucht Konto, Anmeldung und Zugriffsregeln; die SDKs kämen per CDN oder Build (Verstoß gegen I). Ohne SDK per `fetch` machbar, aber Offline-Betrieb erfordert dann trotzdem einen lokalen Speicher plus Abgleichlogik – also die jetzige Lösung **plus** Zusatzaufwand. Gratis-Projekte werden bei Inaktivität pausiert. |
| GitHub (privates Gist/Repo) per Zugriffstoken und `fetch` | 0 € | Token müsste auf dem Gerät liegen und von Hand erneuert werden; Konflikte beim Abgleich; persönliche Daten bei einem Dritten (Prinzip VII). Technisch der günstigste Weg, falls später doch Synchronisation gewünscht wird – dann als eigenes Feature mit Verfassungsänderung. |
| Eigener kleiner Server (z. B. Cloudflare Workers + KV) | 0 € im Gratis-Tarif | Server-Code, Deployment-Pipeline und Authentifizierung widersprechen „reines Web“ und „einfach deploybar“. |
| Datei in iCloud direkt beschreiben (File System Access API) | 0 € | In Safari/iOS nicht verfügbar. Der manuelle Export in „Dateien“/iCloud (R4) erreicht dasselbe Ziel. |

## R2 – Welcher Browser-Speicher?

**Decision**: `localStorage`, ein Schlüssel `trainingsplan.log.v1`, Inhalt: ein JSON-Dokument
(siehe [data-model.md](data-model.md)). Bei jeder Änderung wird das ganze Dokument neu
geschrieben.

**Rationale**:
- Datenmenge ist winzig: 12 Wochen × 3 Einheiten × ca. 8 Übungen × ca. 4 Sätze ≈ 1 200 Sätze,
  grob 60–100 KB pro Zyklus. Das übliche Limit liegt bei rund 5 MB – Platz für Jahrzehnte.
- Synchron und in drei Zeilen benutzbar (`getItem`, `JSON.parse`, `setItem`) – passend zu
  Grundkenntnissen und ohne Hilfsbibliothek.
- Schreiben ist atomar aus Sicht der App: Entweder steht der neue Stand im Speicher oder
  `setItem` wirft einen Fehler, den die App anzeigen kann (FR-022).

**Alternatives considered**:
- **IndexedDB**: Für große Datenmengen und Abfragen gedacht; asynchron, deutlich mehr Code
  (Versionen, Transaktionen, Fehlerpfade). Gleiche Lösch-Regeln wie `localStorage`, also kein
  Gewinn an Sicherheit. Wechsel bleibt möglich: Das Datenmodell ist speicherunabhängig, und alle
  Zugriffe laufen über zwei Funktionen in `log.js` (`loadLog`, `saveLog`).
- **Cache API / Service Worker**: Für App-Dateien gedacht; Vermischung mit `CACHE_NAME` wäre
  genau der Fehler, den Prinzip VII ausschließt.
- **Cookies**: Größenlimit, werden bei jeder Anfrage mitgeschickt – ungeeignet.

## R3 – Wie sicher ist Browser-Speicher auf dem iPhone?

**Decision**: Drei Schutzmaßnahmen: (1) App vom Home-Bildschirm nutzen, (2) beim ersten
Speichern `navigator.storage.persist()` anfragen, sofern vorhanden, (3) Sicherungsdatei (R4) mit
sichtbarem Hinweis, wann zuletzt gesichert wurde.

**Rationale / Risiken**:
- Safari löscht per Skript geschriebene Daten von Websites, die sieben Tage nicht besucht
  wurden. Für Web-Apps auf dem Home-Bildschirm gilt diese Frist nach Apples Angaben nicht.
  → Die App wird ohnehin als Home-Bildschirm-App genutzt (Zielplattform laut Verfassung).
- Die Home-Bildschirm-App hat einen eigenen Speicher, getrennt vom Safari-Tab. Wer die App vom
  Home-Bildschirm entfernt, löscht damit ihre Daten. → Export vor dem Entfernen; Hinweis im
  Sicherungsbereich.
- Bei knappem Gerätespeicher kann das System Website-Daten räumen. `persist()` bittet darum,
  davon ausgenommen zu werden; eine Garantie gibt es nicht. → Sicherungsdatei.
- **Vor der Umsetzung auf dem echten Gerät zu prüfen** (Aufgabe in `tasks.md`): Daten überleben
  App-Neustart, iPhone-Neustart und ein App-Update (neuer `CACHE_NAME`).

- **Stand 2026-11-14**: In Chrome (Desktop, Headless) geprüft – Daten überleben Neuladen und
  den Wechsel des Service-Worker-Caches. Die Prüfung auf dem iPhone (tasks T030) steht noch aus.

**Alternatives considered**: Automatische, stille Sicherung zu einem Dienst – verworfen (R1).

## R4 – Sicherung: Export und Import

**Decision**:
- **Export**: Das Protokoll-Dokument wird als Datei `trainingsprotokoll-JJJJ-MM-TT.json`
  erzeugt. Wenn der Browser das Teilen von Dateien unterstützt (`navigator.canShare` mit
  `files`), öffnet sich der Teilen-Dialog (→ „In Dateien sichern“, AirDrop, Mail an sich selbst);
  sonst wird die Datei über einen Download-Link gespeichert.
- **Import**: Datei-Auswahl (`<input type="file">`), Prüfung des Formats, dann **Zusammenführen**
  pro Training: fehlt ein Training auf dem Gerät, wird es übernommen; gibt es dasselbe Training
  auf beiden Seiten, gewinnt der Stand mit dem neueren `updatedAt`.
- Der Zeitpunkt des letzten Exports wird gespeichert und angezeigt (FR-020).

**Rationale**: Reine Browser-Funktionen, kein Dienst, Daten verlassen das Gerät nur auf
ausdrücklichen Wunsch (Prinzip VII). JSON ist menschenlesbar und lässt sich notfalls von Hand
oder in einer Tabellenkalkulation weiterverwenden. Zusammenführen statt Ersetzen verhindert, dass
ein Import neuere Einträge überschreibt.

**Alternatives considered**: CSV-Export (verlustbehaftet bei einseitigen Übungen, Import
fehleranfällig – als zusätzliche Auswertungshilfe später denkbar); „Ersetzen“ als einziger
Importmodus (riskant, verworfen).

## R5 – Wie wird eine Übung dauerhaft wiedererkannt?

**Decision**: Jede Übung in `plan.json` bekommt ein Feld `id` (kurzer, sprechender Text wie
`klimmzug`), jede Einheit ein Feld `id` (`e1`–`e3`). Das Protokoll verweist nur auf diese IDs.

**Rationale**: Name („Klimmzug (Parallelgriff/Ringe)“), Nummer („2a“) und Position können sich
bei einer Plananpassung ändern; dann ginge der Bezug zum letzten Training verloren (FR-023).
Sprechende IDs sind in der Sicherungsdatei lesbar.

**Alternatives considered**: Name als Schlüssel (bricht beim Umbenennen); Position
`Einheit/Nummer` (bricht beim Umsortieren); zufällige IDs (unleserlich, kein Vorteil).

## R6 – Wie werden die Übungsarten abgebildet?

**Decision**: Zwei getrennte Ebenen.
- **Plan** (`plan.json`, Feld `log` pro Übung) legt fest, **welche Felder die Oberfläche
  anbietet**: Erfassungsart `weightReps`, `bodyweightReps`, `duration` oder `block`, dazu
  `perSide` (links/rechts getrennt). Kombinierte Karten gibt es nicht mehr: Jede Übung ist ein
  eigener Planeintrag mit eigener `id` (Entscheidung des Nutzers, siehe R10).
- **Protokoll** speichert jeden Satz in **einer einheitlichen Form** mit optionalen Feldern
  (`reps`, `seconds`, `weight`, `side`, `rpe`). Was nicht erfasst wurde, fehlt.

**Rationale**: Ein einheitlicher Satz braucht keine Fallunterscheidung beim Speichern, Mischen
und Migrieren. Ändert der Plan die Art einer Übung (z. B. Einbein-Wadenheben ab Phase 2 „mit
Last“), bleiben alte Sätze gültig und vergleichbar. Die Erfassungsart ist Planinhalt und gehört
laut Prinzip IV nicht in `app.js`.

**Alternatives considered**: Eigene Satz-Struktur je Art (mehr Code, Migration bei Artwechsel);
Art aus dem Vorgabetext erraten („3×20–30 s/Seite“ → Dauer, einseitig) – fehleranfällig bei
Texten wie „3×6/Seite, 12 kg, auf Pad/Box“ und ein Verstoß gegen „Plan legt fest“.

## R7 – Was ist ein „Training“, und was ist das „letzte Training“?

**Decision**:
- Ein Training ist eindeutig durch **Kalendertag + Einheit** (`2026-11-16_e1`). Es entsteht mit
  dem ersten erfassten Wert. Wurde dasselbe Training in den letzten 6 Stunden noch bearbeitet,
  wird es fortgesetzt, auch wenn das Datum inzwischen gewechselt hat.
- Das Training merkt sich Planwoche, Phase und Entlastungswoche **zum Zeitpunkt des Trainings**.
- „Letztes Training“ einer Übung = das jüngste **andere** Training, in dem diese Übung
  mindestens einen Satz (bzw. „erledigt“) hat – unabhängig von Einheit, Phase und Woche.

**Rationale**: Deckt ausgelassene Einheiten, ausgelassene Übungen, Phasenwechsel und einen
neuen Zyklus ab, ohne Sonderfälle. Die gespeicherte Woche/Phase macht den Vergleich einordbar
(FR-013), auch wenn später ein neues `startDate` gesetzt wird.

## R8 – Aufteilung im Code

**Decision**: Neue Datei `log.js` (klassisches Skript, vor `app.js` eingebunden) mit der reinen
Daten- und Speicherlogik ohne DOM: laden, speichern, migrieren, Training finden/anlegen, Satz
hinzufügen/ändern/löschen, letztes Training suchen, Export/Import zusammenführen. `app.js`
bleibt für Darstellung und Bedienung zuständig.

**Rationale**: `app.js` bleibt überschaubar; die Speicherlogik ist ohne Oberfläche in der
Browser-Konsole prüfbar (es gibt keine Tests). Flache Struktur bleibt erhalten. `log.js` kommt in
`APP_SHELL`, `CACHE_NAME` wird hochgezählt (v9 → v10).

**Alternatives considered**: Alles in `app.js` (wächst auf das Doppelte, Logik und DOM
vermischt); ES-Module (`import`) – funktionieren ohne Build, wären aber ein Stilwechsel für das
ganze Projekt ohne Nutzen bei zwei Dateien.

## R9 – Eingabe mit wenigen Antippern

**Decision**: Im geöffneten Protokollbereich (R10) eine Eingabezeile mit Zahlenfeldern (`inputmode="decimal"` bzw.
`numeric`, öffnet die Zifferntastatur) und je einem −/+-Knopf (≥ 44 px). Vorbelegung nach FR-006.
Ein Knopf „✓“ übernimmt den Satz. Gewichtsschritt standardmäßig 2,5 kg, pro Übung über
`log.step` im Plan änderbar (z. B. 1 kg bei Kurzhanteln, 0,5 kg bei Zusatzlast).

**Rationale**: Der häufigste Fall (gleicher Satz wie zuvor) kostet ein Antippen, der
zweithäufigste (eine Wiederholung weniger, eine Stufe mehr Last) zwei. Die Tastatur wird nur für
größere Sprünge gebraucht.

**Alternatives considered**: Auswahlräder/Dialoge (verdecken Plan und Vergleich); reine
Texteingabe „60x8“ (fehleranfällig, viel Tippen).

## R10 – Aufklappbarer Protokollbereich und „eine Karte = eine Übung“

**Decision** (Vorgabe des Nutzers vom 2026-11-14):
- Das Protokoll liegt in einem aufklappbaren Bereich unter den Planangaben jeder Übung. Er ist
  beim Laden geschlossen; im Lesen-Modus behält die Seite ihre bisherige Länge.
- Der Schalter zum Aufklappen ist das Nummernfeld in der linken Spalte der Karte (sichtbar
  38 × 38 px wie bisher, Touch-Fläche 44 × 44 px). Der Stand (`+`, `2/4`, `✓`) steht als kleines
  Kennzeichen direkt darunter, wo Platz frei ist – so gehen weder Höhe noch Textbreite verloren.
- Höchstens ein Bereich ist gleichzeitig offen (`openExerciseId` in `app.js`). Er bleibt beim
  Neuzeichnen offen (Satz bestätigt, Phasenwechsel) und schließt beim Wechsel der Einheit.
- Kombinierte Karten sind im Plan in eigene Übungen (6a/6b) aufgeteilt. Das Datenmodell braucht
  dadurch keine „Teilübungen“ (`parts`) und Sätze kein Feld `part`.

**Rationale**: Die Planansicht bleibt so kompakt wie heute (Prinzip III); die Eingabe ist eine
bewusste Handlung von einem Antippen. Ohne `parts` hat jede Übung genau eine Erfassungsart, ein
Protokoll und einen Verlauf – weniger Sonderfälle in Daten, Code und Oberfläche.

**Folge, bewusst in Kauf genommen**: Die Werte des letzten Trainings sind erst nach dem
Aufklappen sichtbar (ein Antippen pro Übung), nicht mehr beim bloßen Lesen der Karte.

**Alternatives considered**: Protokoll dauerhaft sichtbar (verlängert jede Karte um 2–4 Zeilen,
vom Nutzer verworfen); eigene Schalterzeile unter der Karte (kostet rund 44 px pro Karte, also
Seitenlänge); natives `<details>` (verliert beim Neuzeichnen den Zustand und braucht eine
eigene Zeile); eine einzeilige „Zuletzt“-Kurzfassung im geschlossenen Zustand (verlängert die
Seite ebenfalls); mehrere Bereiche gleichzeitig offen (Seite wächst unkontrolliert).

## R11 – Vereinfachte Erfassung (Änderung vom 2026-11-14)

**Decision** (Vorgabe des Nutzers): Pro Übung und Training ein Eintrag mit Gewicht bzw. Zeit,
Power (schwach/ok/stark, Standard ok) und Kommentar. Keine Sätze, Wiederholungen, RPE, Seiten,
kein „erledigt“. Der jüngste Eintrag steht hinter Name und Zweck. Ersetzt R6 (Satzform), R9
(Eingabezeile mit „✓ Satz n“) und den Teil von R10, nach dem geschlossene Karten nie höher werden
dürfen.

**Umsetzungsentscheidungen**

- **Kein Speichern-Knopf** (Prinzip VII): Jede Änderung speichert den ganzen sichtbaren Stand.
  Damit ein unverändertes Gewicht mit einem Antippen übernommen wird, speichert auch das Antippen
  eines Smileys – „ok“ antippen heißt „wie vorbelegt, normal anstrengend“. Öffnen allein
  speichert nichts, damit Nachschauen keinen Eintrag erzeugt.
- **Was hinter dem Namen steht**: der jüngste Eintrag (heute, sonst letztes Training). Damit ist
  der Vergleichswert vor dem Training ohne Antippen sichtbar. Sobald heute erfasst ist, zeigt die
  Karte die heutigen Werte und der geöffnete Bereich „Letztes Mal …“ – sonst ginge der Vergleich
  verloren. Das Nummernfeld (`+`/`✓`) zeigt, welcher Fall vorliegt.
- **Aktualisieren ohne Neuaufbau**: Nach dem Speichern werden nur Angaben, Kennzeichen und Status
  der Karte geändert, nicht der Bereich neu gezeichnet – sonst verlöre ein Feld beim Wechsel zum
  nächsten Feld den Fokus.
- **Datenformat**: Schema 2 mit Migration 1 → 2 (höchstes Gewicht, längste Zeit, Kommentar,
  Power ok), damit bereits erfasste Daten erhalten bleiben (Prinzip VII).
- **Smileys**: 😟 🙂 😃 als Emoji (keine Bilddateien, auf iOS farbig), jeweils mit Text
  „schwach/ok/stark“ darunter, damit die Bedeutung nicht nur am Symbol hängt.

**Alternatives considered**: Speichern-Knopf (widerspricht Prinzip VII und kostet ein
Antippen mehr); Speichern schon beim Öffnen (erzeugt Einträge beim bloßen Nachschauen); hinter
dem Namen immer das letzte Training statt des jüngsten Eintrags (dann wären die heutigen Werte
nirgends geschlossen sichtbar).
