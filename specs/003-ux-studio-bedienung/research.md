# Research: UX-Überarbeitung für die Bedienung im Studio

## R1 Power-Eingabe
- **Decision**: drei Knöpfe (Symbol über Wort), volle Zeile unter den Wertfeldern; `aria-pressed`;
  ohne heutigen Eintrag „ok“ gestrichelt als Vorschlag.
- **Rationale**: ein Antippen je Stufe; Wörter passen erst in voller Breite (320 px).
- **Alternatives**: Stepper behalten und „ok“ beim Öffnen speichern – verstößt gegen „Öffnen allein
  speichert nichts“.

## R2 Layout Protokollbereich
- **Decision**: Wertfelder untereinander in voller Breite, darunter Power, Kommentar, Status,
  „Weiter →“. −/+ 52 × 50 px.
- **Rationale**: Bei 320 px bleibt neben 2 × 52 px sonst kein Platz für „82,5“.

## R3 Anzeigezustand
- **Decision**: eigener `localStorage`-Schlüssel `trainingsplan.view` mit Datum; Wiederherstellung
  nur bei gleichem Kalendertag und gültigen IDs; geschrieben bei Auswahl, Aufklappen und Scrollen
  (verzögert) sowie beim Verlassen (`pagehide`, `visibilitychange`).
- **Rationale**: iOS beendet Home-Bildschirm-Apps im Hintergrund; `sessionStorage` überlebt das
  nicht. Getrennter Schlüssel hält das Protokoll unberührt.

## R4 Bildschirm wachhalten
- **Decision**: `navigator.wakeLock.request("screen")` beim Start, nach `visibilitychange` und
  zusätzlich beim ersten Antippen, falls noch keine Sperre aktiv ist; Fehler still ignoriert.
- **Rationale**: Safari unterstützt die API seit iOS 16.4 (in Home-Bildschirm-Apps ab 18.4); manche
  Browser verlangen eine Nutzeraktion.

## R5 Rückgängig
- **Decision**: Kopie des Eintrags und Verweis auf das Training merken; `restoreEntry` legt das
  Training ggf. wieder an. Leiste unten fixiert (Daumenbereich), 6 s.
- **Alternatives**: `confirm()` – blockierender Dialog, zwei Antipper.

## R6 Aufwärmformat
- **Decision**: `warmup: { duration, steps[] }`, Schritt = Text oder `{ title, items[] }`
  (Gruppen wie „5 Min Mobility“). Darstellung: nummerierte Liste, Gruppen mit Unterpunkten.
- **Rationale**: Inhalte bleiben wörtlich erhalten, Gruppierung des Originals bleibt sichtbar.

## R7 Hinweis einklappbar
- **Decision**: `<details>` mit dem ganzen Text im `<summary>`, geschlossen auf eine Zeile gekürzt
  (`line-clamp`), Präfix „Hinweis“; Klick darauf öffnet nicht den Protokollbereich.
- **Rationale**: Anfang bleibt sichtbar (Verfassung 2.4.0), Screenreader lesen den ganzen Text.

## R8 Kartenzustände
- **Decision**: erledigt = Nummernfeld gefüllt + Akzentrand; nächste = Ring per `box-shadow`
  (keine Höhenänderung).
