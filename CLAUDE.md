# ArbeitsBuddy – Projektbeschreibung für Claude Code

Bitte lies diese Datei vollständig, bevor du anfängst. Antworte mir auf Deutsch.

## Worum es geht

ArbeitsBuddy ist meine persönliche Arbeits-App für den Büroalltag bei der Unternehmensgruppe Deurer. Ich verwalte damit Checklisten und Aufgaben, erstelle Aufträge für unsere Liegenschaften, plane Termine und schreibe jede Woche mein Berichtsheft.

Die App soll um vier Bereiche erweitert werden und ein neues, schlichtes Design bekommen:

1. Liegenschaften (alle Objekte, sortiert, mit Google-Maps-Link)
2. Assistent (Chat, der mich bei Aufträgen und Aufgaben Schritt für Schritt begleitet)
3. Kalender (alle Termine)
4. Berichtsheft (Aufgaben der Woche merken, am Wochenende als Bericht drucken)

## Dateien im Ordner

- `arbeitsbuddy.html` – die bestehende App (eine einzige Datei, HTML + CSS + JavaScript ohne Framework).
- `liegenschaften.csv` – alle Liegenschaften (UTF-8, Semikolon getrennt). Spalten: `Kategorie;Firmennummer;Firma;VE;Liegenschaft;Sachbearbeiter`.
- `berichtsheft-vorlage.*` – meine Berichtsheft-Vorlage (lege ich noch dazu; Format kann Word, PDF oder Foto sein).
- `auftragsschritte.txt` – die Schritte beim Anlegen eines Auftrags (lege ich noch dazu).

Wenn eine Datei fehlt, arbeite mit den Vorgaben in dieser Beschreibung weiter und sag mir am Ende, was noch fehlt.

## Grundregeln

- Die App bleibt eine einzige HTML-Datei, die per Doppelklick im Browser läuft (auch über `file://`, ohne Server, ohne Internet). Keine Frameworks, kein Build-Schritt, keine externen Schriften oder CDNs.
- Alle Daten bleiben lokal im Browser (localStorage, Schlüssel `arbeitsbuddy_v2`). Nichts wird an Server geschickt.
- Keine Datenverluste: Bestehende Daten müssen beim Update erhalten bleiben. Erweitere das Datenmodell über die vorhandenen Funktionen `sanitizeState` / `sanitizeList` und ergänze neue Bereiche (Liegenschaften, Termine, Berichte, Aufträge) als eigene Felder im gespeicherten Zustand.
- Export und Import (Einstellungen → Daten) müssen alle neuen Bereiche mit sichern und beim Import prüfen.
- Alles, was angezeigt wird, konsequent mit `esc()` maskieren.
- Oberfläche komplett auf Deutsch, einfache klare Sprache, Datumsformat deutsch (TT.MM.JJJJ, 24-Stunden).
- Funktioniert auf Desktop und Handy, per Tastatur bedienbar, Dunkelmodus bleibt erhalten.
- Vorhandene Funktionen (Checklisten, Vorlagen, Heute, Arbeitsmodus, Suche mit Strg+K, Rückgängig, Drucken, Export/Import) bleiben erhalten.

## Aufräumen

- Die eingebauten Beispiel-Checklisten und Beispielaufgaben (Arbeitsbeginn, Maschinenkontrolle, Arbeitsende in `seedState`) entfernen. Ein neuer Start beginnt leer, aber mit den Liegenschaften aus der CSV.
- Wer schon gespeicherte Daten hat, bekommt beim ersten Start der neuen Version einmalig einen Hinweis mit dem Button „Beispieldaten entfernen“. Nichts ohne Bestätigung löschen.
- Nicht mehr benötigtes CSS und JavaScript des alten Designs entfernen.

## Design: schlicht und professionell fürs Büro

Das aktuelle Design wirkt zu sehr nach Baustelle. Es soll viel simpler werden.

Entfernen:
- Warnstreifen / Warnband, Gelb-Schwarz-Farben, Warndreiecke
- Konfetti, Stempel „Erledigt“, auffällige Animationen
- die schmalen, lauten Überschriften und die große dunkle Karte auf der Übersicht

Stattdessen:
- Heller, neutraler Hintergrund (helles Grau), weiße Flächen, feine graue Linien.
- Eine einzige ruhige Akzentfarbe (gedecktes Blau). Grün nur für „erledigt“, Rot nur für Löschen und Fehler.
- Eine normale Systemschrift (z. B. `"Segoe UI", system-ui, -apple-system, Arial, sans-serif`), gut lesbar, klare Größenabstufung.
- Viel Weißraum, wenige Rahmen, einheitliche Abstände. Tabellen und Listen statt vieler Kacheln, wo es sinnvoll ist.
- Einfacher Fortschrittsbalken, einfaches Häkchen. Kurze, dezente Übergänge sind in Ordnung.
- Navigation: helle Seitenleiste links mit den Bereichen Übersicht, Heute, Kalender, Liegenschaften, Assistent, Checklisten, Vorlagen, Berichtsheft, Einstellungen. Auf dem Handy eine untere Leiste mit den wichtigsten 4–5 Bereichen und einem „Mehr“-Menü.
- Übersicht: ruhige Startseite mit heutigen Terminen, offenen Aufgaben und dem Stand des Berichtshefts dieser Woche.

## 1. Liegenschaften

Daten:
- Beim ersten Start die Liegenschaften aus `liegenschaften.csv` übernehmen. Da die App über `file://` läuft und keine Dateien nachladen kann, die Daten als Startdaten direkt in die HTML-Datei einbauen. Zusätzlich einen Import für CSV und Excel-CSV (Semikolon, UTF-8 mit BOM) anbieten, damit ich die Liste später selbst aktualisieren kann.
- Felder pro Liegenschaft: VE (Nummer), Bezeichnung / Straße, Ort (anfangs leer, von mir ergänzbar), Firma, Firmennummer, Kategorie, Sachbearbeiter (Kürzel), Notizen, archiviert.
- Firmen:
  - Firma 1 – Gregor Deurer GmbH & Co. KG
  - Firma 2 – Dr. Markus Deurer, Vermietungen
  - Firma 11 – Sonderbilanz Gregor Deurer GmbH & Co. KG
- Kategorie „Projekte“: 80000 Projekte Dr. Markus Deurer (eigene Gruppe, getrennt von den Firmen).

Ansicht:
- Liste gruppiert nach Firma (in der Reihenfolge Firma 1, Firma 2, Firma 11), danach die Gruppe „Projekte“. Innerhalb jeder Gruppe nach VE-Nummer sortiert.
- Suche und Filter nach VE, Straße, Firma und Sachbearbeiter.
- Jede Liegenschaft hat eine eigene Detailseite (eigener Reiter) mit: VE, Bezeichnung, Firma mit Nummer, Sachbearbeiter, Ort, Notizen, direktem Google-Maps-Link, sowie verknüpften Aufträgen, Aufgaben und Terminen.
- Google-Maps-Link: `https://www.google.com/maps/search/?api=1&query=` + URL-kodiert Bezeichnung und Ort. Öffnet in neuem Tab. Weil viele Einträge nur einen Straßen- oder Gebietsnamen haben, soll das Feld „Ort“ in den Link einfließen, sobald ich es ausgefüllt habe. Keine eingebettete Karte und keine Bilder von Google laden.
- Liegenschaften anlegen, bearbeiten und archivieren können.
- Hinweis: Die VE 10290 kommt in der Liste zweimal vor (Firma 1 „DON, Mieterstrom“ und Firma 11 „Stadtberger Str. 65 a,b“). VE-Nummern also nicht als eindeutige ID verwenden, sondern eine eigene interne ID vergeben.

## 2. Assistent (Chat)

Ein Chat-Fenster in der App, das mich bei Aufträgen und Aufgaben begleitet. Er funktioniert ohne KI und ohne Internet: regelbasiert, mit Eingabefeld und Antwort-Buttons.

Auftrag anlegen:
1. Ich tippe eine Liegenschaft ein (Straße, Teil des Namens oder VE-Nummer). Die Suche ist fehlertolerant (Groß-/Kleinschreibung, Umlaute, „Str.“ = „Straße“).
2. Der Assistent zeigt die passenden Treffer als Buttons. Nach der Auswahl nennt er sofort: Firma mit Firmennummer, VE und Sachbearbeiter.
3. Danach führt er mich Schritt für Schritt durch die Auftragsschritte aus `auftragsschritte.txt`. Solange die Datei fehlt, nimm als Platzhalter: Was ist zu tun (Beschreibung), Dringlichkeit, gewünschter Termin, Ansprechpartner / Firma, Notiz. Die Schritte sollen in den Einstellungen bearbeitbar sein.
4. Am Ende zeigt er eine Zusammenfassung aller Angaben mit „Kopieren“-Button (für die Übernahme in unser Firmenprogramm) und speichert den Auftrag in der App, verknüpft mit der Liegenschaft. Auf Wunsch wird daraus eine Aufgabe mit Fälligkeit und/oder ein Kalendertermin.

Aufgaben begleiten:
- Ich kann eine offene Aufgabe oder Checkliste wählen, und der Assistent geht sie mit mir Punkt für Punkt durch (ähnlich wie der Arbeitsmodus, nur im Chat).

Außerdem:
- Schnelle Fragen per Stichwort: „Welche Firma hat 20630?“, „Was betreut RM?“ usw. liefern die passenden Einträge aus der Liegenschaftsliste.
- Der Chatverlauf wird lokal gespeichert und kann geleert werden.

## 3. Kalender

- Monats-, Wochen- und Tagesansicht, Woche beginnt am Montag, Kalenderwochen anzeigen.
- Termine mit Titel, Datum, Uhrzeit von/bis oder ganztägig, Ort, optionaler Liegenschaft, Notiz und optionaler Wiederholung (täglich, wöchentlich, monatlich).
- Aufgaben und Aufträge mit Fälligkeitsdatum erscheinen ebenfalls im Kalender (optisch unterscheidbar von Terminen).
- Termine anlegen per Klick auf einen Tag, bearbeiten, verschieben, löschen (mit Rückgängig).
- Heutige Termine erscheinen auf der Übersicht und unter „Heute“.
- Optional: Export eines Termins oder aller Termine als `.ics`-Datei.

## 4. Berichtsheft

- Die App merkt sich automatisch, was ich in der Woche erledigt habe: erledigte Aufgaben, abgeschlossene Checklisten, angelegte Aufträge und vergangene Termine, jeweils mit Datum.
- Bei Aufgaben und Terminen gibt es einen Schalter „Fürs Berichtsheft merken“ (Standard: an). Dazu kann ich pro Tag freie Einträge ergänzen.
- Am Ende der Woche (ab Freitag) zeigt die App einen Hinweis „Berichtsheft für KW xx erstellen“.
- Daraus entsteht ein Wochenbericht nach meiner Vorlage `berichtsheft-vorlage.*`: Lies die Vorlage und bilde Aufbau, Felder und Reihenfolge möglichst genau nach. Solange sie fehlt, nimm: Name, Kalenderwoche, Zeitraum (Montag bis Freitag), pro Tag die Tätigkeiten mit Stunden, Feld für Bemerkungen, Unterschriftsfelder.
- Vor dem Drucken kann ich jeden Eintrag bearbeiten, kürzen oder entfernen.
- Drucken: saubere A4-Druckansicht mit Vorschau in der App. Über den Druckdialog des Browsers als PDF speichern oder direkt drucken.
- Fertige Wochenberichte werden gespeichert und bleiben im Bereich Berichtsheft abrufbar.

## Vorgehen

- Arbeite die Bereiche in dieser Reihenfolge ab: Design und Aufräumen → Liegenschaften → Assistent → Kalender → Berichtsheft.
- Nach jedem Bereich: die App im Browser testen (keine Fehler in der Konsole, Desktop und Handy-Breite, Hell und Dunkel), kurz zusammenfassen, was fertig ist, und dann weitermachen.
- Wenn etwas unklar ist, triff eine sinnvolle Annahme, schreib sie in die Zusammenfassung und arbeite weiter, statt anzuhalten.
- Lege vor größeren Änderungen eine Sicherheitskopie der HTML-Datei an (z. B. `arbeitsbuddy.backup.html`).

## Offene Punkte (von mir noch zu klären)

- Block „30000 ETG-Verwaltung“ (30100 Leitershofer Str. 106b, 30710 Am Eulenhorst 9c) ist noch nicht in der Liste. Vorerst weglassen.
- Doppelte VE 10290 prüfe ich noch.
- Orte der Liegenschaften trage ich nach und nach selbst ein.
- Berichtsheft-Vorlage und Auftragsschritte lege ich noch in den Ordner.
