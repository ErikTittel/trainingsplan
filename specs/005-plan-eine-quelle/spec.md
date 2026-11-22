# Feature 005: Trainingsplan aus einer Quelle, Optimierung mit KI

**Status:** umgesetzt (2026-11-22) · **Verfassung:** 2.5.0

Archiv: Stand zum Zeitpunkt der Umsetzung. Gültig sind [SPEC.md](../../SPEC.md) und
[docs/](../../docs/). Das Feature wurde auf ausdrücklichen Wunsch ohne den vollständigen
Spec-Kit-Ablauf (ohne `plan.md`/`tasks.md`) direkt aus einem abgestimmten Konzept umgesetzt.

## Ausgangslage

Der Plan stand in drei Dateien (`plan.json` für die App, `plan.md` als Lesefassung, ursprüngliches
PDF), die von Hand synchron gehalten werden mussten und auseinanderliefen. Jede Planänderung
erforderte außerdem ein Hochzählen von `CACHE_NAME`, war also technisch ein App-Update.

## Anforderungen

1. **Eine Quelle:** `plan.json` ist führend und einzige Quelle. `plan.md` entfällt, das PDF kommt
   ungepflegt nach `docs/archiv/`. Kein Abgleich der alten Dateien.
2. **Einfach bearbeitbar** von Menschen und KI-Agenten, ohne Änderung an der App: Übungen
   hinzufügen/entfernen, Beschreibungen ändern, Reihenfolge ändern, Aufwärmen ändern.
3. **Leistungsdaten bleiben erhalten** beim Umsortieren und Umbeschreiben (Bindung über die `id`,
   wie bisher; kein neues Protokoll-Schema).
4. **Keine Supersätze:** Aus 3, 4a, 4b, 5 wird 3, 4, 5, 6. Das Feld `number` entfällt; die Nummer
   ergibt sich aus der Reihenfolge. Jede Übung lässt sich unabhängig verschieben.
5. **Entfernte Übungen** stehen in `retiredExercises` (`id`, `name`, optional `retired`); ihre IDs
   sind gesperrt.
6. **Lesefassung in der App:** „Plan & Progression“ zeigt alle übergreifenden Planteile
   (Grundidee, Annahmen, Wochenverteilung, Ampelregel, Kennzahlen …).
7. **Planänderung ohne App-Update:** `plan.json` (und `plan-anleitung.md`) network-first mit 4 s
   Zeitlimit, offline aus dem Cache.
8. **KI-Optimierung:** `plan-anleitung.md` als einzige Quelle der Bearbeitungsregeln und des
   Auftrags an KI-Agenten; Infokarte „Mit KI optimieren“ mit Eingabefeld für zusätzliche
   Anweisungen und Knopf „Für KI kopieren“ (Zwischenablage, sonst Datei). Für Agenten im
   Repository: Sicherungsdatei unter `daten/` (von Git ignoriert).

## Entscheidungen

| Frage | Entscheidung | Verworfen |
|---|---|---|
| Format der einzigen Quelle | JSON (`plan.json`): App liest und prüft es schon, KI-Agenten bearbeiten es zuverlässig, kein Parser nötig | Markdown als Quelle (eigener, fehleranfälliger Parser), YAML (bräuchte eine Bibliothek, Verfassung I) |
| Lesefassung | App-Ansicht | generiertes `plan.md` (bräuchte einen Build-Schritt) |
| Übergabe an die KI | Text in der Zwischenablage, Fallback Datei | direkte Anbindung an einen KI-Dienst (Server/Schlüssel, Verfassung VII) |

## Geänderte Dateien

`plan.json`, `js/plan.js`, `js/ui-info.js`, `js/ui-backup.js`, `js/app.js`, neu `js/ai-package.js`,
`js/ui-ai.js`, `plan-anleitung.md`; `index.html`, `style.css`, `sw.js` (`CACHE_NAME` v16);
`.gitignore`; Verfassung, SPEC.md, README.md, CLAUDE.md, docs/*.md.
