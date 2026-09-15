# Changelog

Alle nennenswerten Änderungen an lenziloeffler.de. Neueste Version oben.
Jede Version ist als Git-Tag abgelegt und lässt sich mit
`git checkout <tag>` exakt wiederherstellen.

---

## v1.4 — 16.09.2026

Rennwochenende umgestellt: Brno ist gefahren, Mugello ist das Saisonfinale.
Betrifft `site/index.html` und `site/assets/css/style.css`; JavaScript und
alle Assets bleiben unverändert.

### Geändert

**Countdown auf Mugello.** Zielzeitpunkt `2026-10-17T14:20:00+02:00` —
Samstag, 17. Oktober 2026, 14:20 Ortszeit. Der Offset ist +02:00, weil
Europe/Rome an dem Datum noch in der Sommerzeit läuft; die Umstellung erfolgt
erst am 25. Oktober. Streckenverlauf, Ortsname, Flagge und Datum entsprechend
getauscht. Die Timer-Logik in `main.js` ist unberührt — sie liest den Wert
ausschließlich über `Date.parse()` aus `data-countdown`.

**Vierte Kopfzeile** unter dem Datum mit der Serienbezeichnung („Season
Finale Austria Formel Cup & TopJet F2000 Italian Trophy"). Sie trägt bewusst
nicht `--countdown-scale`: bei vollem Grad umbricht sie auf schmalen Blöcken
mehrzeilig und schiebt das Kachelband aus dem Kapitel.

**Brno-Ergebnisse nachgetragen.** Die Zeile stand auf den Platzhaltern
„Racing" und trägt jetzt P1\*/P3\* und 40 Punkte; in der TopJet-Wertung fand
kein Rennen statt. Die Trennlinie zu den gefahrenen Rennen
(`results__row--last-next`) ist auf die Mugello-Zeile gewandert.

**Tabellenstand:** Austria Formel Cup 179 → 219 Pts, Austrian Racing Car
Championship 136 → 182 Pts, „FIA Central European Zone D2F3" → „FIA Central
European Zone F3" mit 92 Pts statt eines Rennstands. Damit steht die Zeile im
selben Format wie die drei darüber. Total Points 179 → 219; die
TopJet-Spalte bleibt bei 158.

**Bio:** sechs von zehn Rennwochenenden, elf Klassensiege, schnellste Runde
in sieben von zwölf Rennen.

### Behoben

**Streckenverlauf überlappte den Tabellenstand.** Die `aspect-ratio` an
`.countdown__track` war beim Streckentausch auf die Proportion der
*Zeichnung* gesetzt worden. `.countdown` hat eine feste Höhe und drei
`auto`-Zeilen, die nicht schrumpfen: der höhere Kasten sprengte die Höhe um
172 px und schob das Kachelband 78 px über den Tabellenstand. Der Wert
beschreibt jetzt den **Kasten** und bleibt bei `622.87 / 350.66`; das SVG
skaliert seinen viewBox über das voreingestellte `preserveAspectRatio`
hinein.

**Streckenverlauf wurde zu klein gezeichnet.** Der gelieferte Mugello-Pfad
füllte seinen viewBox nicht aus — die Tinte lag bei x 58–252 und y 19–293 von
300 × 304,5. Der viewBox ist per `getBBox()` auf die Zeichnung
zusammengezogen und die gezeichnete Höhe auf 296,1 px kalibriert, exakt den
Wert des Brno-Verlaufs. Der Pfad selbst ist unverändert.

### Geprüft

- 20 Viewports von 1920 × 1080 bis 320 × 568, jeweils nach
  `document.fonts.ready`: `scrollHeight` gegen `clientHeight`, Overlap der
  Kacheln gegen Tabellenstand und Ergebnistabelle, Clipping, Querscroll
- Schriftgrade der Kopfzeilen gegen einen v1.3-Worktree gemessen: Kicker
  27 px/400, Ortsname 36 px/700 versal, Datum 27 px/400 — identisch
- gezeichnete Höhe des Verlaufs 296,1 px, identisch zu Brno; die Breite kann
  es nicht sein, Mugello ist hochformatig (0,71) und Brno querformatig (1,80)
- Spaltensummen der Ergebnistabelle gegen `<tfoot>`: 50+40+18+28+43+40 = 219,
  57+44+57 = 158, beide deckungsgleich mit dem Tabellenstand
- alle Inline-SVGs auf Wohlgeformtheit geparst
- `Date.parse()` des Zielzeitpunkts ergibt in Europe/Rome 17.10.2026, 14:20
  MESZ

### Bekannte Einschränkung

Auf Fenstern um 720–768 px Höhe läuft der Countdown-Block über (1440 × 720:
48 px, 1366 × 768: 19 px, 1280 × 720: 36 px). Auf den beiden 720er Höhen
besteht das seit v1.3 und früher, 1366 × 768 kommt durch die vierte Kopfzeile
hinzu. Details unter „Bekannte Punkte" in der README.

---

## v1.3.1 — 14.09.2026

Fehlerbehebung. Betrifft ausschliesslich `site/index.html`; CSS, JavaScript
und alle Assets bleiben unveraendert.

### Behoben

**Racing-Video spielte beim Seitenaufruf.** Das `<video>` im Racing-Pop-up
trug `autoplay`, aber kein `muted`. Da das Panel beim Laden
`visibility: hidden` ist, startete der Clip unsichtbar, sobald der Browser
Autoplay mit Ton erlaubte — man hoerte seine Tonspur waehrend des
Intro-Logos, ohne etwas zu sehen. Ob es auftrat, hing am Media Engagement
Index der Origin, daher nur zeitweise.

Behebung: `autoplay` am Racing-`<video>` entfernt. Kein `muted` ergaenzt —
die Wiedergabe steuert weiterhin vollstaendig `startVideos()` und
`stopVideos()` in `main.js` beim Oeffnen und Schliessen des Panels. Ein
Kommentar ueber dem Element haelt fest, warum dort bewusst kein `autoplay`
steht.

### Geprueft

- kein Ton beim initialen Seitenaufruf; Racing-Video bleibt waehrend des
  gesamten Seitenaufbaus auf `paused: true` und `currentTime: 0`, auch unter
  `--autoplay-policy=no-user-gesture-required`
- Oeffnen startet den Clip von vorn und mit Ton, Schliessen pausiert und
  spult zurueck, erneutes Oeffnen startet wieder von vorn
- Intro-Timing unveraendert (ended 1645 ms, Hold 773 ms, Fade 1300 ms)
- Konsole und Netzwerk sauber, keine 404, keine defekten Bilder oder Videos
- Desktop, iPhone und iPad geprueft
- Pixelvergleich gegen v1.3 ohne relevante Abweichung; die einzige mobile
  Differenz stammt von der laufenden Countdown-Uhr

Die Warnung `Unmuting failed and the element was paused instead`, die in v1.3
noch erschien, entfaellt damit.

---

## v1.3 — 11.09.2026

Aufräum- und Übergabestand. **Keine funktionalen oder visuellen Änderungen**
gegenüber v1.2 — die gerenderte Seite ist auf Desktop, iPhone und iPad
pixelidentisch (byteweise verglichen gegen einen v1.2-Worktree).

### Entfernt

| Was | Umfang | Begründung |
|---|---|---|
| 20 lose JPGs direkt in `site/` | 1,79 MB | Altlasten neben der strukturierten Ablage `assets/images/`; repoweit unreferenziert, waren aber öffentlich erreichbar |
| `site/assets/icons/linkedin-brands-solid-full.svg` | 776 B | überholt — das Stylesheet maskiert ausschließlich `linkedin-in-brands-solid-full_new_.svg` |
| `package-lock.json` | 95 B | verwaist, kein `package.json`, kein Build-Schritt |
| 5 × `.DS_Store` | — | macOS-Temporärdateien |

Betroffene Dateinamen: `band55` `band62` `band70` `f4-A` `f4-B` `f4-C` `f4-D`
`hx40` `hx45` `hx48` `r2-50` `race-1-mobile` `race-1` `race-2` `race-3`
`race-4` `user-1` `user-2` `user-3` `user-4` (alle `.jpg`, alle aus `site/`).

### Ergänzt

- `CHANGELOG.md` (diese Datei)
- README: Voraussetzungen und bekannte Punkte

### Bewusst behalten

`originale/` bleibt vollständig erhalten (Archiv unbearbeiteter Quelldateien,
wird nicht deployt), darin auch `Saira.zip` (11,5 MB, inhaltsgleich mit dem
entpackten Ordner daneben). Ebenso `site/assets/images/racing/race-1.*` —
unreferenziert, aber aufbereitetes Website-Asset der Bildstrecke.

---

## v1.2 — 11.09.2026

Erster Release mit Intro-Opener und Video im Racing-Pop-up.

- **Intro-Opener** auf der Startseite: Fullscreen-Overlay in CDF-Dunkelblau,
  Logo-Clip blendet über 0,45 s ein, läuft 1,6 s, hält seinen letzten Frame
  0,75 s und blendet über 1,4 s zur Startseite aus. Kein Redirect, kein
  Reload. Die Animation der Startseite startet erst mit diesem Übergang statt
  unsichtbar hinter dem Overlay.
- **Video-Kapitel im Racing-Pop-up** als erster Abschnitt, mit
  `--media-zoom: 1.45` gegen den eingebrannten Rahmen des Clips.
- **Sichtbare Scrollleisten** in allen drei Pop-ups: eigene Overlay-Leiste,
  im Ruhezustand unsichtbar, erscheint beim vertikalen Scrollen.
- README und DEPLOY.md um die zugehörigen Messwerte und Fallstricke ergänzt.

---

## v1.1 — 09.09.2026

Ausgangsstand: Startseite mit Hero, drei Pop-ups (Profile, Racing,
Partnerships), Countdown mit Streckenverlauf, Rechtsseiten, Design-System in
zehn Stylesheet-Abschnitten.
