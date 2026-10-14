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
- Einheiten werden als expandierbare Karten dargestellt.
- Geschlossen:
  - Name der Übung
  - Sätze, Wiederholungen und Tempo
  - kurze, kompakte Übersicht
- Geöffnet:
  - ausführlichere Übungsdetails
  - Hinweise zur Ausführung
  - schematische Darstellung der Übung
  - ggf. kurze Begründung / Zweck der Übung

### 4. Farbschema
- sportlich/klar
- hohe Kontrastfähigkeit
- gut lesbar im Dark Mode
- klare visuelle Trennung zwischen Hauptübungen, Hilfsübungen und Sicherheits-/Hinweisbereichen

### 5. Detailniveau
- Die mobile Ansicht priorisiert schnell nutzbare Informationen im Training.
- Wichtige Sicherheitsregeln werden an klarer Stelle sichtbar, aber nicht überladen dargestellt.
- Technische Detailangaben werden nur im geöffneten Zustand der jeweiligen Übung gezeigt.

### 6. Trainingstage
- Nur tatsächliche Trainingseinheiten werden angezeigt.
- Montag, Donnerstag und Samstag als Haupttrainings-Tage bleiben sichtbar.
- Lauf- und Recovery-Tage werden bewusst nicht dargestellt.

## Strukturvorschlag der Oberfläche
1. Header mit Phase / Woche / heutiger Einheit
2. Einheit/Kartenbereich
3. Expandierbare Übungskarten
4. Hinweisbereich für Sicherheit und Progression
5. Optional: kleiner Abschlussbereich mit Kennzahlen oder Status

## UX-Ziele
- Keine überladenen Listen
- Im Studio schnell auffindbar
- Vermeidung von unnötigem Scrollen
- Gute Handhabung mit einem Finger / großer Touch-Zone

## Offene Punkte für spätere Umsetzung
- genaue Ausgestaltung der schematischen Übungsdarstellungen
- gewünschtes Verhalten für die Karten beim Klick / Tap
- genaue Positionierung der Hinweise und Sicherheitsregeln
- Abschluss- oder Statusbereich je nach späterem Bedarf
