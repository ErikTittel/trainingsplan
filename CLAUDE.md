# CLAUDE.md

Hinweise für Claude Code in diesem Repository. Überblick und Dokumentenlandkarte: [README.md](README.md).

## Projekt

Mobile Trainingsplan-PWA (iPhone, im Fitnessstudio) für einen 12-Wochen-Plan mit lokalem
Trainingsprotokoll. Reines HTML/CSS/JavaScript (ES-Module unter `js/`) – keine Frameworks, kein
Build, keine Paketabhängigkeiten, keine CDN-Skripte, keine Test-Toolchain.

Sprache: Oberfläche, Inhalte, Dokumentation, Commit-Nachrichten und Erklärungen an den Nutzer auf
Deutsch; Erklärungen verständlich für Grundkenntnisse. Bezeichner im Code englisch.

## Maßgebliche Dokumente (nicht hier duplizieren – dort nachlesen und dort ändern)

- [.specify/memory/constitution.md](.specify/memory/constitution.md) – verbindliche Regeln, Vorrang vor allem anderen
- [SPEC.md](SPEC.md) – Oberfläche und Verhalten
- [docs/architektur.md](docs/architektur.md) – Module, Zustand, Abhängigkeitsregeln, „wo ändere ich was?“
- [docs/datenformate.md](docs/datenformate.md) – `plan.json`, Protokoll, Migration, Sicherungsdatei
- [docs/pruefung.md](docs/pruefung.md) – manuelle Prüfung vor dem Commit

Ändert sich Verhalten, Aufbau oder Format, im selben Commit das zuständige Dokument nachziehen.

## Starten und prüfen

```
python -m http.server 8000
```

Nie über `file://`. Der Service Worker liefert cache-first aus – beim Testen DevTools „Update on
reload“ nutzen. Prüfumfang je Art der Änderung: [docs/pruefung.md](docs/pruefung.md).

## Regeln, die leicht übersehen werden

- **`CACHE_NAME` in `sw.js` hochzählen** bei jeder Änderung an einer ausgelieferten Datei; neue
  Dateien in `APP_SHELL` aufnehmen. Ausnahme: `plan.json` und `plan-anleitung.md` (network-first).
- **IDs nie umbenennen oder wiederverwenden** (Übungen, Einheiten, Phasen) – daran hängt das
  Protokoll.
- Keine Trainingsinhalte und keine Planstruktur (Phasen, Wochen, Entlastungswochen, Trainingstage)
  im Code – alles in `plan.json` (einzige Quelle, es gibt kein `plan.md`). Planänderungen nach
  [plan-anleitung.md](plan-anleitung.md): entfernte Übungen in `retiredExercises`, keine Supersätze.
- Formatänderung an `plan.json` → Prüfung in `js/plan.js` im selben Commit.
- Formatänderung am Protokoll → `LOG_SCHEMA` erhöhen und Schritt in `MIGRATIONS` (`js/log.js`);
  vorhandene Daten nie verwerfen.
- Nur `js/log-storage.js` greift auf `localStorage` zu; Fachmodule ohne DOM; Oberfläche nur über
  `makeElement` (kein `innerHTML`).
- Alle Pfade relativ (Deployment unter `/<repo-name>/`).
- Erfasste Trainingswerte gehören nie ins Repository (Sicherungsdateien für Agenten nur unter
  `daten/`, von Git ignoriert).

## Spec Kit

Neue Features: `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`;
jeder Plan enthält einen Verfassungs-Check. Specs als Änderung am Ist-Zustand formulieren, die
bestehende Struktur beibehalten (`js/`, `docs/`; kein `src/`, kein `tests/`, kein Test-Framework)
und das Hochzählen von `CACHE_NAME` als eigene Aufgabe einplanen. Nach der Umsetzung den neuen
Stand in `SPEC.md` und `docs/` übernehmen; `specs/NNN-*/` bleibt als Archiv.
