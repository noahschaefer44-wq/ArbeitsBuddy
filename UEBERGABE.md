# Azubino – Übergabe an andere Entwickler / KI-Assistenten

Stand: 06.10.2026 · App-Version `2026-10-02.1` · Live: https://noahschaefer44-wq.github.io/ArbeitsBuddy/ (nur Berichtsheft + Einstellungen, Schalter `REPORT_ONLY`)

Diese Datei beschreibt den aktuellen Stand, damit jemand anderes (Mensch oder KI) nahtlos weitermachen kann.
`CLAUDE.md` enthält die ursprüngliche Projektbeschreibung des Nutzers. Wo diese Datei davon abweicht, gilt diese Datei.

## 1. Was die App ist

Persönliche Web-App (PWA) für einen Auszubildenden zum Immobilienkaufmann (1. Lehrjahr, Hausverwaltung, Bayern/Augsburg).
Zwei Bereiche:

- **Schule:** Stundenplan, Hausaufgaben, Noten, Lernkarten, Berichtsheft (IHK-Ausbildungsnachweis)
- **Arbeit:** Heute, Zeiterfassung, Kalender, Liegenschaften, Assistent, Aufgaben (geführte Abläufe)

Sprache der Oberfläche: Deutsch, einfache Sprache, Datumsformat TT.MM.JJJJ.

## 2. Dateien

| Datei | Zweck |
|---|---|
| `arbeitsbuddy.html` | Die ganze App: HTML, CSS und JavaScript in einer Datei, ohne Framework und ohne Build (ca. 4500 Zeilen) |
| `index.html` | Leitet auf `arbeitsbuddy.html` weiter |
| `sw.js` | Service Worker (Offline). Konstante `CACHE` bei jedem Deploy hochzählen (`azubino-vNN`) |
| `manifest.webmanifest`, `icons/` | PWA (Name „Azubino“) |
| `berichtsheft-pool.json` | Vorrat für den Zufallsbericht: 154 Vorlagen mit Platzhaltern (ca. 100.000 Stichpunkte), Arbeitsvorgänge, Schulthemen je Fach und Jahrgangsstufe (`schuleJahr`) |
| `supabase/functions/lernkarte/index.ts` | Supabase Edge Function für die KI (Lernkarten und Berichtsheft-Entwürfe) |
| `liegenschaften.csv` | Liegenschaften des Nutzers (NICHT mit deployen, wird in der App importiert) |
| `berichtsheft-vorlage.docx` | Offizielle IHK-Vorlage des Nutzers (NICHT mit deployen) |

Nur diese Dateien werden veröffentlicht: `index.html arbeitsbuddy.html manifest.webmanifest sw.js berichtsheft-pool.json icons/`

## 3. Grundregeln im Code

- Alles in `arbeitsbuddy.html`, Vanilla JS in einer IIFE. Keine externen Bibliotheken, keine CDNs (Schrift „Inter“ ist als base64 eingebettet).
- Jede Ausgabe mit `esc()` maskieren.
- Oberfläche: `render()` baut die Seite neu; Klicks laufen über `data-act="…"` → `handleAction(act, el)`; Formulare über den globalen `submit`-Listener (nach `f.id`); Eingabefelder über den `change`-Listener.
- Routing über den Hash: `parseRoute()` (z. B. `#/report/5`, `#/task/<id>`, `#/cards/lernen`), `renderPage()` wählt die Ansicht.
- Navigation: Array `NAV` (`[id, href, icon, label, mobil, gruppe]`), Gruppen „Schule“ und „Arbeit“.
- Gespeichert wird im Browser unter `localStorage["arbeitsbuddy_v2"]` und per Sync in Supabase.
- Datenmodell erweitern: immer in `sanitizeState()` (prüft und bereinigt alles), `seedState()` (leerer Start) und `mergeStates()` (Sync-Konflikte, Listen per `id`).
- Nach Änderungen: `APP_VERSION` in `arbeitsbuddy.html` und `CACHE` in `sw.js` hochzählen.

## 4. Datenmodell (gespeicherter Zustand)

```
settings: { theme, animations, confirmDelete, autoRepeat, sort,
            profile: { name, firma, abteilung, start (Ausbildungsbeginn), software },
            orderSteps, school: { 4: {from,to,lessons[]}, 5: {…} } }   // 4 = Donnerstag, 5 = Freitag
checklists, history            // alt, in der Navigation ausgeblendet
properties[]                   // Liegenschaften {id, ve, name, ort, firma, firmaNr, kategorie, sb, notes, archived}
events[]                       // {id, title, date, allDay, from, to, place, propId, note, repeat, kind: termin|schule|klausur, subject, report}
orders[]                       // alt (früherer Assistent)
days{ "JJJJ-MM-TT": {from, to, pause, status: ""|urlaub|krank|frei, school, breaks[], entries[]} }   // Zeiterfassung + Einträge fürs Berichtsheft
logs[]                         // automatisch gemerkte Tätigkeiten fürs Berichtsheft
reports{ nr: {betrieb, vorgangTitel, vorgang, schule, hBetrieb, hSchule, done, archived, sick[], nr, from, to, savedAt} }
chat[], homework[], grades[], cards[], flows[], flowRuns[], flags
```

## 5. Wichtige Fachlogik

- **Zeiterfassung:** Gleitzeit, Soll 8 Std./Werktag ab `profile.start`. Urlaub, Krank und Berufsschultage zählen pauschal 8 Std. Gesetzliche Pause wird automatisch abgezogen (über 6 Std. 30 Min., über 9 Std. 45 Min.). Funktionen: `workMins`, `istMins`, `sollMins`, `saldo`.
- **Berufsschule:** 1. Lehrjahr Do + Fr (Do 08:45–16:00, Fr 08:00–13:45), eingetragen als Termine mit `kind: "schule"`. Ab dem 2./3. Lehrjahr ist nur noch jede zweite Woche Schule (noch nicht umgesetzt).
- **Feiertage:** Bayern plus Augsburger Friedensfest (`holiday()`); Schulferien 2026/27 in `FERIEN` (nur als Hinweis).
- **Berichtsheft:** Nachweis-Nr. und Woche zählen ab `profile.start` (Woche 1 = 01.09.–04.09.2026). IHK-Layout in `ihkSheet()`. PDF erzeugt die App selbst in `pdfPage()`/`savePdf()`, ohne Bibliothek (Helvetica, WinAnsi). Dateiname `Berichtsheft_Woche_<nr>.pdf`, Speichern-Dialog über `showSaveFilePicker`.
  - Zufallsbericht: `randomWeek()` (Pool + echte Einträge). Stunden: 8 Std. je Wochentag, Schulzeit zuerst, der Rest ist Betrieb.
  - KI-Entwurf: `aiWeek()`. Die App rechnet den Rahmen (Stunden, Krank, Feiertage, Klausuren, Fächer), die KI schreibt die Inhalte. Vorbild sind die archivierten Nachweise (`reports[n].archived`).
  - Jedes Schulfach darf pro Woche nur einmal vorkommen.
- **Aufgaben:** Eingebauter Ablauf „Auftrag an Handwerker erteilen“ (`auftragSteps()`), Schritte hängen von den Angaben ab. Dateinamen `JJMMTT_Auftrag_Firma` bzw. `…_Mieter`. Abschließen ist erst möglich, wenn alles abgehakt ist.
- **Assistent:** Regelbasiert, ohne KI (`answer()`, `parseWhen()`). Versteht Datum und Uhrzeit, Fächer und Gewerke und kennt 25 Fachbegriffe (`GLOSSAR`).
- **Liegenschaften:** VE-Nummern sind nicht eindeutig (10290 kam doppelt vor), deshalb eigene `id`. Firmennamen kommen aus den Liegenschaften, nicht aus dem Quelltext.

## 6. Login und Sync (Supabase)

- Projekt-ID `vigfdkcqqakuxlxravdl` (Region eu-central-1), URL `https://vigfdkcqqakuxlxravdl.supabase.co`.
- Der öffentliche Publishable Key steht in `arbeitsbuddy.html` (`const SB`). Er ist öffentlich gedacht, die Sicherheit kommt über RLS.
- Ohne Anmeldung zeigt die App nur den Login-Bildschirm (`renderAuth`). Neue Konten starten leer. Beim Abmelden werden die lokalen Daten gelöscht.
- Tabelle `public.app_state` (ein Datensatz je Benutzer: `user_id`, `data` jsonb, `version`, `device`, `updated_at`). RLS: jeder nur sein eigener Datensatz. Konflikterkennung über `version`.
- Tabelle `public.ai_usage` und Funktion `ai_bump(uid)`: Tageslimit für die KI (nur service_role).
- Tabelle `public.app_secrets`: enthält den KI-Schlüssel `XKIRO_API_KEY` (nur service_role, **nie in den Code oder ins Repo schreiben**).
- Edge Function `lernkarte` (verify_jwt an; prüft den Nutzer zusätzlich über `/auth/v1/user`):
  - `mode: "karte"`: Lernkarte aus einem Begriff
  - `mode: "bericht"`: Berichtsheft-Entwurf
  - Anbieter: xKiro (OpenAI-kompatibel, `https://api.xkiro.com/v1/chat/completions`), nur kostenlose Modelle (`qwen/qwen3.5-flash:free`, Ausweichmodelle siehe Code). Gemini dient als Ersatz, falls `GEMINI_API_KEY` gesetzt ist.
  - Enthält die **Lehrplanrichtlinien Bayern (ISB) für Immobilienkaufleute, Jgst. 10–12** als Text (`LEHRPLAN`).

## 7. Veröffentlichen

**Aktuell: GitHub Pages** – https://noahschaefer44-wq.github.io/ArbeitsBuddy/arbeitsbuddy.html
Quelle ist der Branch `gh-pages`. Er enthält nur die Webseiten-Dateien aus Abschnitt 2 plus `.nojekyll`. Zum Aktualisieren die Dateien dort ersetzen und pushen.
Das Netlify-Guthaben war am 02.10.2026 aufgebraucht; Netlify zeigt seitdem eine alte Version.

### Netlify (früher)

- Seite: https://azubino.netlify.app (Netlify-Site „azubino“).
- Einfachster Weg ohne Werkzeuge: Die Dateien aus Abschnitt 2 in einen Ordner legen und im Netlify-Dashboard unter „Deploys“ per Drag and Drop hochladen.
- Vorher `APP_VERSION` und `CACHE` in `sw.js` hochzählen, sonst sehen Handys die alte Version.
- Edge Function ändern: Supabase-Dashboard → Edge Functions → `lernkarte` → Code ersetzen (oder `supabase functions deploy lernkarte`).

## 8. Testen

Es gibt keine Test-Suite im Repo. Bisher wurde mit Playwright (Chromium) geprüft:

- alle Ansichten ohne Konsolenfehler
- 360 px Breite ohne waagrechtes Scrollen
- hell und dunkel
- Login, Sync und KI gegen einen lokalen Mock-Server (Supabase-URL im HTML ersetzen)

Keine Testkonten im echten Supabase-Projekt anlegen.

## 9. Offene Punkte und Wünsche des Nutzers

- 2./3. Lehrjahr: Berufsschule nur jede zweite Woche (Kalender-Generator anpassen).
- „Sehr viele Arbeitsprozesse“ als weitere Aufgaben (Abläufe) einbauen; der Nutzer liefert die Schritte.
- Weitere Ideen, die der Nutzer gut fand: Handwerker-Adressbuch, Übersicht offener Aufträge mit Fristen, Textbausteine.
- Supabase: Schutz vor gehackten Passwörtern ist noch aus (Authentication-Einstellung).
- Wenn der KI-Schlüssel gewechselt wird, nur in `public.app_secrets` aktualisieren.

## 10. Arbeitsweise, die der Nutzer mag

- Antworten auf Deutsch, kurz, mit klaren Schritten.
- Erst sinnvoll annehmen und bauen, am Ende die Annahmen nennen.
- Keine Daten ohne Bestätigung löschen, immer mit „Rückgängig“.
- Keine persönlichen Daten (Namen, Stundenplan, Firmen) fest in den Quelltext schreiben.
