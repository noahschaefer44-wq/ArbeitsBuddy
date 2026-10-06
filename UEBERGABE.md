# Azubino – Übergabe an andere Entwickler / KI-Assistenten

Stand: 06.10.2026 · App-Version `2026-10-06.2` · Live: https://noahschaefer44-wq.github.io/ArbeitsBuddy/ (für alle Ausbildungsberufe, Bereiche per Einstellungen wählbar)

Diese Datei beschreibt den aktuellen Stand, damit jemand anderes (Mensch oder KI) nahtlos weitermachen kann.
`CLAUDE.md` enthält die ursprüngliche Projektbeschreibung des Nutzers. Wo diese Datei davon abweicht, gilt diese Datei.

## 1. Was die App ist

Web-App (PWA) „Azubino“ für Auszubildende aller Berufe in Deutschland. Ursprünglich für einen Immobilienkaufmann (Hausverwaltung, Bayern/Augsburg) gebaut, seit 06.10.2026 allgemein:

- **Einrichtungs-Assistent** beim ersten Start (`renderSetup()`): Beruf (40 eingebaute Berufe aus `berufe.json`, alle anderen per KI-Berufspaket), Fachrichtung, Beginn, Dauer, Bundesland (Feiertage aller 16 Länder, Schulferien über openholidaysapi.org), Betrieb, Wochenstunden, Arbeitstage, Schulmodell (Wochentage, jede 2. Woche, Blockunterricht, keine), Berichtsheft-Vorlage, Bereiche.
- **Berichtsheft** (immer an): Vorlagen IHK wöchentlich, IHK wöchentlich mit Arbeitsvorgang (Noahs Vorlage), täglich, HWK, eigene Word-Vorlage mit Platzhaltern. Zufall/KI je Beruf, Diktat + KI-Stichpunkte, Übersicht mit Lücken, Abgleich mit dem Ausbildungsrahmenplan, Export mit Deckblatt und Übersicht.
- **Schule** (abschaltbar): Stundenplan, Hausaufgaben, Noten, Lernkarten, Prüfung (Termine mit Countdown, Lernplan, Lernfeld-Tracker, IHK-Notenrechner, Probeprüfung per KI).
- **Arbeit** (abschaltbar): Heute, Zeiterfassung mit Jugendarbeitsschutz/ArbZG-Hinweisen, Urlaubskonto, Kalender, Aufgaben/Abläufe (Schritte per KI vorschlagen).
- **Immobilien-Werkzeuge** (nur Beruf Immobilien, abschaltbar): Liegenschaften, Assistent.
- **Datenschutz-Modus:** Name, Betrieb, Abteilung und Objektnamen werden vor jedem KI-Aufruf ersetzt (`privacy()`).

Sprache der Oberfläche: Deutsch, einfache Sprache, Datumsformat TT.MM.JJJJ.

## 2. Dateien

| Datei | Zweck |
|---|---|
| `arbeitsbuddy.html` | Die ganze App: HTML, CSS und JavaScript in einer Datei, ohne Framework und ohne Build (ca. 4500 Zeilen) |
| `index.html` | Leitet auf `arbeitsbuddy.html` weiter |
| `sw.js` | Service Worker (Offline). Konstante `CACHE` bei jedem Deploy hochzählen (`azubino-vNN`) |
| `manifest.webmanifest`, `icons/` | PWA (Name „Azubino“) |
| `berufe.json` | 40 Berufe: Lernfelder (Nr., Titel, Jahr), Fachrichtungen, Tätigkeiten (ca. 70 je Beruf), Arbeitsvorgänge, Rahmenplan-Positionen mit Stichworten, Fachbegriffe, Prüfungsbereiche mit Gewichtung, dazu 82 weitere Berufsnamen. Erzeugt außerhalb des Repos mit einem Python-Skript (Grunddaten + KI-Erweiterung). |
| `berichtsheft-pool.json` | Vorrat für den Zufallsbericht: 154 Vorlagen mit Platzhaltern (ca. 100.000 Stichpunkte), Arbeitsvorgänge, Schulthemen je Fach und Jahrgangsstufe (`schuleJahr`) |
| `supabase/functions/lernkarte/index.ts` | Supabase Edge Function für die KI. Modi: `karte`, `bericht`, `beruf` (Berufspaket), `quiz`, `stichpunkte`, `ablauf`. Die App schickt den Beruf mit (`aiBeruf()`). Für Immobilien in Bayern gilt weiter der eingebaute ISB-Lehrplan. |
| `liegenschaften.csv` | Liegenschaften des Nutzers (NICHT mit deployen, wird in der App importiert) |
| `berichtsheft-vorlage.docx` | Offizielle IHK-Vorlage des Nutzers (NICHT mit deployen) |

Nur diese Dateien werden veröffentlicht: `index.html arbeitsbuddy.html manifest.webmanifest sw.js berichtsheft-pool.json berufe.json icons/ .nojekyll`

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
            profile: { name, firma, abteilung, start, software, beruf, berufName, fachrichtung, land, augsburg, mariae,
                       dauer, wochenStunden, arbeitstage[], geburt, urlaub, vorlage, datenschutz, setupDone },
            modules: { schule, arbeit, immo }, ferien: { land, at, list[[von,bis,name]] },
            schulPlan: { schulStart, jahre: { 1: {modell: tage|block|keine, tage[{wd,from,to}], rhythmus 1|2, versatz, bloecke[], tagFrom, tagTo}, … } },
            lernfeld: { "LF3": {s: offen|aktuell|fertig, t} }, pruefung: { termine[], bereiche[{name,gewicht,punkte}] },
            rahmenDone[], wordTpl: {name, data(base64 .docx)} | null,
            orderSteps, school: { 1..6: {from,to,lessons[]} } }   // Stundenplan je Wochentag
berufPack                      // eigenes Berufspaket (KI) oder null
quiz[]                         // Ergebnisse der Probeprüfungen
checklists, history            // alt, in der Navigation ausgeblendet
properties[]                   // Liegenschaften {id, ve, name, ort, firma, firmaNr, kategorie, sb, notes, archived}
events[]                       // {id, title, date, allDay, from, to, place, propId, note, repeat, kind: termin|schule|klausur, subject, report}
orders[]                       // alt (früherer Assistent)
days{ "JJJJ-MM-TT": {from, to, pause, status: ""|urlaub|krank|frei, school, breaks[], entries[]} }   // Zeiterfassung + Einträge fürs Berichtsheft
logs[]                         // automatisch gemerkte Tätigkeiten fürs Berichtsheft
reports{ nr: {betrieb, vorgangTitel, vorgang, schule, unterweisung, hBetrieb, hSchule, hUnterweisung, tage{datum:{t,h}}, done, archived, sick[], nr, from, to, savedAt} }
chat[], homework[], grades[], cards[], flows[], flowRuns[], flags
```

## 5. Wichtige Fachlogik

- **Bestandsdaten (Noah):** `sanitizeExtra()` erkennt alte Daten ohne `setupDone` und setzt Immobilien, Bayern, Augsburg, Vorlage „IHK mit Arbeitsvorgang“, Schule Do/Fr (ab 2. Jahr jede 2. Woche).
- **Allgemeiner Zufallsbericht:** `loadPool()` nimmt für Immobilien `berichtsheft-pool.json`, sonst `genericPool()` aus dem Berufspaket. Schulthemen kommen aus den Lernfeldern des Ausbildungsjahres (bevorzugt „läuft gerade“ mit eigenen Themen) bzw. `ALLG_THEMEN` für Deutsch, Englisch, Sozialkunde.
- **Vorlagen:** `vorlage()`; `ihk-woche` nutzt `ihkSheet()`/`pdfPage()`, alle anderen `sheetSpec()` → `genSheet()` (Vorschau) und `genPdfPage()` (PDF). Täglich: `tageFrom()` verteilt die Stichpunkte auf die Tage. Word: `saveWord()` füllt `{{PLATZHALTER}}` (Liste `WORD_KEYS`) per eigenem ZIP-Code (`zipEntries`, `zipBuild`, DecompressionStream).
- **Prüfung:** `renderExam()`; Notenschlüssel `ihkNote()`; Lernplan `lernplan()`.
- **Arbeitsschutz:** `isMinor()` (aus `profile.geburt`), `needPause()`, `arbeitsschutz(k)` (JArbSchG §§ 8, 11–14 bzw. ArbZG §§ 3–5), `urlaubKonto()`.

- **Zeiterfassung:** Gleitzeit, Soll = Wochenstunden / Arbeitstage (`tagesSoll()`) ab `profile.start`. Urlaub, Krank und Berufsschultage zählen das volle Tagessoll. Gesetzliche Pause wird automatisch abgezogen (Erwachsene über 6 Std. 30 Min., über 9 Std. 45 Min.; unter 18 über 4,5 Std. 30 Min., über 6 Std. 60 Min.). Funktionen: `workMins`, `istMins`, `sollMins`, `saldo`.
- **Berufsschule:** Termine mit `kind: "schule"`, erzeugt aus `schulPlan` je Ausbildungsjahr (`schoolEvents()`, `reseedSchool()`).
- **Feiertage:** alle Bundesländer (`holidays(y)`), Bayern optional mit Augsburger Friedensfest und Mariä Himmelfahrt; Schulferien über `refreshFerien()` (openholidaysapi.org), offline Bayern-Fallback.
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

- Ausbilder-Freigabe, Ausbilder-Konto und Gruppen wurden bewusst NICHT gebaut (Wunsch des Nutzers).
- Rahmenplan-Stichworte und Prüfungsgewichte in `berufe.json` sind Orientierung; maßgeblich ist die jeweilige Ausbildungsordnung.
- „Sehr viele Arbeitsprozesse“ als weitere Aufgaben (Abläufe) einbauen; der Nutzer liefert die Schritte.
- Weitere Ideen, die der Nutzer gut fand: Handwerker-Adressbuch, Übersicht offener Aufträge mit Fristen, Textbausteine.
- Supabase: Schutz vor gehackten Passwörtern ist noch aus (Authentication-Einstellung).
- Wenn der KI-Schlüssel gewechselt wird, nur in `public.app_secrets` aktualisieren.

## 10. Arbeitsweise, die der Nutzer mag

- Antworten auf Deutsch, kurz, mit klaren Schritten.
- Erst sinnvoll annehmen und bauen, am Ende die Annahmen nennen.
- Keine Daten ohne Bestätigung löschen, immer mit „Rückgängig“.
- Keine persönlichen Daten (Namen, Stundenplan, Firmen) fest in den Quelltext schreiben.
