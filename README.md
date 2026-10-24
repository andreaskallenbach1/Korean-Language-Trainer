# Koreanisch-Werkstatt

Eine interaktive Lern-App für Koreanisch: vom ersten Hangul-Zeichen bis zu einfachen Gesprächen (Niveau TOPIK 1–2), mit Schwerpunkt auf Alltag, Reisen und K-Dramen.

## Was die App kann

- **Hangul-Kurs (Linie 1)**: 9 Lektionen mit allen 40 Zeichen und rund 120 Alltagswörtern. Jedes Wort enthält nur Zeichen, die schon gelernt wurden.
- **Erste Gespräche (Linie 2)**: 8 Lektionen auf TOPIK-1-Niveau mit Dialogen, Grammatikkarten, Satzbaukasten, Lückentexten, Zahlen-Hörübungen und Gesprächs-Missionen mit dem KI-Tutor.
- **Handschrift**: Strichfolge aller Zeichen als Animation, Zeichenfeld mit automatischer Prüfung und optionaler Rückmeldung von Claude.
- **Lernpfad als Seouler U-Bahn**, Bildvokabeln (Unsplash), Fehlerheft und animierter Silbenbau.
- **Vier Fertigkeiten**: Lesen (Zeichen und Wörter erkennen), Hören (ähnliche Laute unterscheiden), Schreiben (echte koreanische Tastatur, Dubeolsik) und Sprechen (vorsprechen lassen, nachsprechen, per Spracherkennung prüfen, wo der Browser es erlaubt).
- **Wiederholung im richtigen Abstand**: Alles Gelernte kommt genau dann wieder, wenn es zu verblassen droht.
- **Sitzungen statt Tagespensum**: ausgelegt auf etwa drei Sitzungen pro Woche à 45–60 Minuten. Ablauf: Aufwärmen mit Wiederholung, dann eine neue Lektion, zum Schluss freies Üben.
- **Fortschritt**: Lerntage pro Woche, Lernzeit, gelernte Zeichen und Wörter, Ergebnisse pro Lektion.
- **KI-Tutor**: Fragen stellen und kleine Gespräche üben. Läuft über das eigene Claude-Konto, wenn die App auf claude.ai geöffnet wird; kein API-Schlüssel nötig.
- **Alphabet-Übersicht** mit Silbenbaukasten.

## Zwei Versionen

| | claude.ai-Artifact | Webseite (GitHub Pages) |
|---|---|---|
| Fortschritt | im Claude-Konto, überall gleich | nur im jeweiligen Browser |
| KI-Tutor, Missionen, Handschrift-Rückmeldung | ja | nein |
| Spracherkennung und eigene Aufnahme | nein (Mikrofon gesperrt) | ja (Chrome/Edge) |

Die Webseite wird bei jedem Push auf `main` automatisch gebaut (`.github/workflows/pages.yml`). Einmalig muss dafür in den Repository-Einstellungen unter **Settings → Pages → Source** „GitHub Actions“ gewählt werden. Fortschritt lässt sich zwischen beiden Versionen über **Einstellungen → Sicherung kopieren / wiederherstellen** übertragen.

## Entwicklung

```bash
npm install
npm run dev     # lokaler Server
npm test        # Tests (Silbenbau, Lehrplan-Regeln, Wiederholungssystem)
npm run build   # dist/index.html (eigenständige Datei) und dist/artifact.html (für claude.ai)
```

Die App baut zu einer einzigen HTML-Datei. `dist/index.html` lässt sich direkt im Browser öffnen (Chrome oder Edge empfohlen, wegen der koreanischen Stimme). `dist/artifact.html` wird als claude.ai-Artifact veröffentlicht. Dort wird der Fortschritt im Claude-Konto gespeichert, und der Tutor funktioniert.

## Aufbau

- `src/data/` Lerninhalte: Zeichen (`jamo.ts`), Lektionen, Wörter und Lernpfad (`lessons.ts`)
- `src/lib/` Logik: Hangul-Silbenbau und Tastatur (`hangul.ts`), Übungsgenerator (`exercises.ts`), Wiederholungssystem (`srs.ts`), Fortschritt (`progress.ts`), Speicherung (`storage.ts`), Sprachausgabe und -erkennung (`speech.ts`)
- `src/components/` Oberfläche

Der Lernplan steht in [docs/LERNPLAN.md](docs/LERNPLAN.md).
