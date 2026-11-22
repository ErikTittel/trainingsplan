# Trainingsplan

Mobile Web-App (PWA) für einen 12-Wochen-Trainingsplan – gebaut für das iPhone im Fitnessstudio.
Sie zeigt die heutige Einheit mit allen Planangaben auf einen Blick und protokolliert pro Übung
Gewicht bzw. Zeit, Power und einen Kommentar – nur auf dem Gerät, offline, ohne Konto.

Reines HTML, CSS und JavaScript: keine Frameworks, kein Build, keine Abhängigkeiten.

## Starten

```
python -m http.server 8000
```

Dann `http://localhost:8000` öffnen. Über `file://` funktioniert die App nicht (Module und
`plan.json` werden per HTTP geladen). Veröffentlichen: Dateien auf ein statisches Hosting legen,
z. B. GitHub Pages – alle Pfade sind relativ.

## Aufbau

```text
index.html            Seitengerüst
style.css             Gestaltung (Farbvariablen, Dark Mode)
js/                   JavaScript-Module (Einstieg: js/app.js)
plan.json             Trainingsplan (einzige Quelle; die App zeigt ihn an)
plan-anleitung.md     Regeln zum Bearbeiten des Plans, Auftrag an KI-Agenten
sw.js                 Service Worker (Offline-Betrieb)
manifest.webmanifest  PWA-Angaben, icons/ App-Symbole
docs/                 technische Dokumentation (docs/archiv/: ursprüngliches PDF, nicht gepflegt)
daten/                Leistungsdaten für KI-Agenten (nicht im Repository, siehe .gitignore)
specs/                Feature-Spezifikationen (Archiv, Spec Kit)
.specify/             Spec Kit: Verfassung, Vorlagen, Skripte
```

## Welches Dokument gilt wofür?

Jede Information steht an genau einer maßgeblichen Stelle; die anderen Dokumente verweisen dorthin.

| Frage | Dokument |
|---|---|
| Welche Regeln gelten immer? (Vorrang vor allem anderen) | [Verfassung](.specify/memory/constitution.md) |
| Was zeigt die App, wie verhält sie sich? | [SPEC.md](SPEC.md) |
| Wie ist der Code aufgebaut, wo ändere ich was? | [docs/architektur.md](docs/architektur.md) |
| Wie sehen `plan.json` und das Protokoll aus? | [docs/datenformate.md](docs/datenformate.md) |
| Was prüfe ich vor einem Commit? | [docs/pruefung.md](docs/pruefung.md) |
| Was steht im Trainingsplan? | [plan.json](plan.json); lesbar in der App („Plan & Progression“ und die Einheiten) |
| Wie ändere oder optimiere ich den Plan (auch mit KI)? | [plan-anleitung.md](plan-anleitung.md) |
| Wie entstand ein Feature? | [specs/](specs/README.md) (abgeschlossene Feature-Spezifikationen) |
| Hinweise für Claude Code | [CLAUDE.md](CLAUDE.md) |

## Neue Funktionen

Neue Features laufen über Spec Kit: `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` →
`/speckit-implement`. Ist ein Feature umgesetzt, wird der Stand in `SPEC.md` und `docs/`
übernommen; die Feature-Spezifikation bleibt als Archiv in `specs/`.
