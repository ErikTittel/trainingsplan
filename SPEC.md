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
- Übungen werden als dauerhaft sichtbare Karten dargestellt; sie sind nicht aufklappbar und
  reagieren nicht auf Antippen.
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

## Strukturvorschlag der Oberfläche
1. Header mit Phase / Woche / heutiger Einheit
2. Einheit/Kartenbereich
3. Dauerhaft sichtbare Übungskarten mit Legende
4. Hinweisbereich für Sicherheit und Progression
5. Optional: kleiner Abschlussbereich mit Kennzahlen oder Status

## UX-Ziele
- Keine überladenen Listen
- Im Studio schnell auffindbar
- Vermeidung von unnötigem Scrollen
- Gute Handhabung mit einem Finger / großer Touch-Zone

## Offene Punkte für spätere Umsetzung
- genaue Ausgestaltung der schematischen Übungsdarstellungen (künftige Idee)
- genaue Positionierung der Hinweise und Sicherheitsregeln
- Abschluss- oder Statusbereich je nach späterem Bedarf
