# lenziloeffler.de

Website von Nicolas „Lenzi" Loeffler, Formel-3-Fahrer.
Reines HTML, CSS und JavaScript — kein Framework, kein Build-Schritt. Was in
`site/` liegt, ist genau das, was online steht.

**Aktueller Stand: v1.3** — Versionsverlauf siehe `CHANGELOG.md`.
Diesen Stand auschecken: `git checkout v1.3`

---

## Aufbau

```
site/
  index.html            Startseite (Hero, drei Schaltflächen, Wortmarke, Social, Fußnote)
  impressum/index.html
  datenschutz/index.html
  site.webmanifest      Für „Zum Startbildschirm" auf Android
  assets/
    css/style.css       Das gesamte Stylesheet, kommentiert und in 11 Abschnitte gegliedert
    js/main.js          Panel-Logik, Scroll-Reveal, Countdown, Umrandungen,
                        Video-Wiedergabe, Scrollleisten
    perfect-intro-logo-only.mp4   Logo-Clip des Intro-Openers (1,6 s, ohne Ton)
    racing-panel-final_v2_.mp4    Video im Racing-Pop-up (6,6 s, mit Tonspur)
    fonts/Saira/        Variable Font, lokal ausgeliefert (keine Google-Fonts-Anfrage)
    icons/              SVGs, per CSS-Maske eingefärbt
                        linkedin-…svg — selbst gezeichnet, siehe unten
    images/about-me/    Bildstrecke des Profile-Pop-ups (user-1 … user-3)
    images/racing/      Bildstrecke des Racing-Pop-ups (race-1 … race-3)
    images/bg/          Hintergrund der Startseite, siehe README dort
    images/lenzi-logo.svg
    favicon/
originale/              Unbearbeitete Quelldateien, wird nicht deployt
deploy.sh               Upload nach S3 + CloudFront-Cache leeren
infra.sh                Legt die AWS-Infrastruktur an (einmalig)
DEPLOY.md               Betriebsanleitung
CHANGELOG.md            Versionsverlauf, je Tag ein Eintrag
```

---

## Die wichtigsten Entscheidungen

### Eine Abstandseinheit für die ganze Seite

Alle senkrechten Abstände der Startseite leiten sich aus **einem** Wert ab:

```css
--space-unit: calc(var(--hero-size) * 0.3125);   /* 30px bei 96px Hero */
```

| Von | Nach | Abstand |
|---|---|---|
| Hero-Zeile | „Formula 3 Driver." | 1u |
| „Formula 3 Driver." | Umrandung der Schaltflächen | **sichtbar** gleich wie oben |
| Icon-Reihe | Wortmarke (mittig im Rest) | zentriert |
| „Follow Lenzi" | Social-Icons | 1u |
| Social-Icons | Fußnote | 2u |

Der Hero skaliert per `clamp()` mit der Fensterbreite, alle Abstände wachsen
und schrumpfen im selben Verhältnis mit. Wer den Rhythmus ändern will, ändert
`0.3125` — sonst nichts.

**Die Ausnahme ist die Schaltflächenreihe.** Dort zählt nicht der Abstand der
Zeilenkästen, sondern der sichtbare: der Zeilenkasten des Claims reicht unter
seine letzte Pixelzeile, der Kasten der Tagline beginnt über ihrer Versalhöhe,
und der Rahmen sitzt niedriger als die Reihe, in der er steht. Gleichgesetzt
ergibt das

```css
--space-actions: 1u
                 + --hero-size × --claim-descent
                 + --tagline-size × (--sf-ascent − --cap-height − --claim-descent)
                 − (--icon-button-size − --action-frame-h) / 2;
```

1440 × 900: 30 + 14,23 + 0,33 − 18,44 = **26,12px** Kastenabstand — und damit
oben wie unten gemessene **51,50px** sichtbarer Abstand.

### Die Wortmarke hängt an der Versalhöhe

Ober- und Unterkante des Logos liegen exakt auf Ober- und Unterkante des „N"
im Hero-Claim. Das „N" hat keine Unterlänge, seine sichtbare Höhe ist also die
Versalhöhe von Saira: gemessene **0,688 em**, über alle Schriftgrößen und
-stärken konstant.

```css
--cap-height: 0.688;
--logo-height: calc(var(--hero-size) * var(--cap-height));
--logo-width: calc(var(--logo-height) * 308.7 / 37.55);
```

Waagerecht sitzt es mittig, senkrecht genau in der Mitte zwischen Icon-Reihe
und „Follow Lenzi". Dafür teilt der Hero seinen freien Raum in zwei gleich
große Flächen: `.hero::before` über dem Claim, `.hero__logo-slot` unter der
Icon-Reihe. Beide wachsen mit demselben Faktor — der Claim steht dadurch
genauso hoch wie bei `justify-content: center`, das Logo mittig darunter.

### Standings & Results steht auf der Kante des Helmbildes

Tabellenstand und Rennliste beginnen und enden genau auf den senkrechten
Kanten des Helmbildes aus dem Kapitel darüber. Beide teilen diese Breite in
**drei gleiche Spalten** — Strecke | Austria Formel Cup | TopJet F2000 —, und
jede Serie teilt ihr Drittel wieder in drei: R1, R2, Pts. Gemessen
(1440 × 900):

| | links | rechts |
|---|---|---|
| Helmbild | 321,13 | 684,01 |
| Tabelle, Tabellenstand, Fußnote | 321,12 | 683,99 |

Die Serientitel stehen **linksbündig** in ihrem Drittel. Damit beginnt jeder
Titel auf genau derselben senkrechten Linie wie die Werte darunter — „R1"
trägt denselben Zellabstand, sein Text startet also an derselben Kante. Die
neun Spaltenanfänge liegen dadurch auf einem durchgehenden Raster:

```
323,5 | 444,5  484,8  525,1 | 565,4  605,7  646,0      Abstand überall 40,31
        ^ Austria Formel Cup   ^ TopJet F2000 · Gold
```

Vor der Klassenangabe steht ein Mittelpunkt, kein senkrechter Strich:
`Austria Formel Cup · AF3-T`, `TopJet F2000 · Gold`.

#### Ein Schriftgrad für den ganzen Block

Tabellenstand, Rennliste und Quellenangabe tragen **einen** Grad und **eine**
Farbe. Gefordert ist der Grad des Fließtextes; er steht als Obergrenze,
darunter entscheidet die Geometrie: der längste Eintrag muss ohne Umbruch in
seine Spalte passen. Zwei Einträge kommen dafür in Frage, beide im Satz
gemessen (mit Kerning und mit `font-variant-numeric: tabular-nums`, die
zusammen bis zu 6 % ausmachen):

| Eintrag | Breite |
|---|---|
| „Austria Formel Cup · AF3-T" | **12,181 em** — der breitere, also maßgeblich |
| „16–18 Oct · Season finale" | 11,687 em |

```css
--results-font: min(var(--text-body-compact),
                    calc((var(--results-w) / 3 - 0.4rem) / 12.181));
```

Die 0,4rem sind derselbe Abstand, der auch die Streckenspalte von „R1"
trennt — damit stoßen die beiden Serientitel nicht aneinander. Auf 1440 × 900
ergibt das **9,40px**; die geforderten 15px erreicht der Block erst ab
`--results-w` = 705px, so breit ist das Helmbild auf üblichen Fenstern nicht.
Der Grad ist damit keine Setzung, sondern das Maß, das drei gleiche Spalten
auf Helmbildbreite ohne Zeilenumbruch zulassen.

Ausgezeichnet ist nur, was die Aussage trägt: die orangen Platzangaben. Die
Trennlinien laufen im CDF-Hellgrau, in DER Strichstärke der Seite. Die
Quellenangabe behält allein ihre zurückgenommene Deckkraft — und trägt die
Breite der **Tabelle**, nicht die der Textspalte: sonst liefe sie über die
rechte Kante des Helmbildes hinaus.

### Das Contact-Panel spannt sich zwischen zwei Kanten auf

Es liegt im Logo-Slot, nicht beim Briefumschlag-Icon, und ist über `top` und
`bottom` an der Unterkante der Hero-Zeile und der Oberkante der Wortmarke
verankert. `height: fit-content` plus `margin-block: auto` verteilen den Rest
gleichmäßig: der Abstand nach oben ist immer exakt so groß wie der nach unten.

Ohne `fit-content` wäre `height: auto` bei gesetztem `top` **und** `bottom`
keine Inhaltshöhe, sondern die volle Bandhöhe — die auto-Ränder hätten dann
nichts mehr zu verteilen.

Inhaltlich stehen darin erst die beiden Einleitungsabsätze, dann drei
Kontaktzeilen im gleichen Label-Wert-Rhythmus: **Ansprechpartner, Mail,
Telefon** — erst wer, dann wie. Hinter dem Namen sitzt das LinkedIn-Zeichen
als Verweis auf das Profil. Es steht, wie die Flagge neben „BRNO", auf der
Versalhöhe seiner Zeile: die Marke füllt 57,14 % der Zeichenfläche
(137,14–502,86 von 640), der Kasten ist so bemessen, dass genau diese Fläche
die Versalhöhe trifft, und `vertical-align` setzt ihre Unterkante auf die
Grundlinie.

Das Icon liegt nicht bei Font Awesome vor und ist deshalb selbst gezeichnet —
in derselben Geometrie wie die übrigen (Zeichenfläche 640, Marke 64–576,
Innenränder 72,8 auf allen vier Seiten, ein Pfad, Buchstaben als Aussparung
über `fill-rule="evenodd"`), damit es sich per CSS-Maske einfärben lässt wie
YouTube, Instagram und Facebook.

### Die beiden Overlays decken die Social-Icons ab

`--about-height` ist so bemessen, dass die Unterkante des Overlays genau
mittig zwischen der Unterkante der Social-Icons und der Oberkante der Fußnote
liegt. Weil das Overlay im Viewport zentriert ist, ist der Abstand nach oben
automatisch derselbe wie nach unten.

```css
--about-inset: calc(var(--footer-inset) + var(--footer-line) + var(--space-hero-tagline));
--about-height: calc(100svh - 2 * var(--about-inset));
```

### Rechtsseiten: gleiche Zeilenhöhe links und rechts

Deutsche und englische Fassung lösen sich ab 861px per
`grid-template-rows: subgrid` in das gemeinsame Raster des Elternelements auf.
Beide n-ten Kinder liegen dadurch in derselben Rasterzeile — jede Überschrift
startet links wie rechts auf exakt derselben Höhe, unabhängig davon, wie viele
Zeilen der Absatz darüber braucht.

Wichtig: die Fassungen bleiben dabei **ein** Kasten (kein `display: contents`).
Nur so behalten sie ihre Shrink-to-fit-Breite und rücken als Block an die
Trennlinie.

### Die Umrandung ist das i-Pünktchen

Die drei Schaltflächen unter der Tagline tragen keinen Kreis mehr, sondern
einen gescherten Rahmen mit Wortbeschriftung (Profile · Racing ·
Partnerships). Die Form ist nicht gewählt, sondern aus dem i-Pünktchen der
Wortmarke gerechnet — Pfad der Klasse `.g` in
`originale/logo lenzi_bunt blau freigestellt_svg.svg`:

| Maß | Wert |
|---|---|
| untere Waagerechte | (300,10 \| 8,56) → (285,42 \| 8,56), 14,68 lang |
| obere Waagerechte | (294,00 \| 0,01) → (308,71 \| 0,01), 14,71 lang |
| Höhe der Fläche | 8,55 |
| Versatz der Schräge | 8,58 |
| **Winkel gegen die Senkrechte** | **45,10°** |
| Sehne der Eckrundung | 3,75 = 43,8 % der Höhe |

Das Pünktchen ist also ein Parallelogramm mit waagerechter Ober- und
Unterkante, 45,10° geneigten Seiten und gerundeten Ecken — **nur auf den
beiden stumpfen** (oben links, unten rechts), die spitzen bleiben scharf.
Daher `border-radius: r 0 r 0`.

Gestreckt werden für die Beschriftung nur die beiden Waagerechten; Winkel und
Eckrundung bleiben am Original. Dieselbe Umrandung tragen die
Countdown-Kacheln im Racing-Pop-up.

Die Beschriftung steht in Versalien, der Innenabstand zur Umrandung ist
doppelt so groß wie zuvor. Beide Wortbreiten sind **gesetzt** gemessen, nicht
aus der Fontdatei gerechnet — Kerning zieht Versalienpaare wie „PA" und „TN"
um 0,04 em zusammen:

| | Breite | Innenabstand je Seite | Buttonbreite |
|---|---|---|---|
| vorher | Partnerships 6,0306 em | 0,6847 em | 7,400 em |
| jetzt | PARTNERSHIPS 7,6172 em | **1,3694 em** | **10,356 em** |

Damit wird die Reihe deutlich breiter. `--action-label-size` trägt deshalb
eine zweite Grenze: drei Schaltflächen, zwei Zwischenräume und der 45°-Überhang
der äußeren beiden müssen zwischen die Seitenränder passen
(`3 × 10,356 + 2 × 1,0035 = 33,075`). Sie greift erst unter rund 640px
Fensterbreite — dort wird die Beschriftung kleiner, statt dass die Reihe über
den Rand läuft.

Die Reihe behält ihre alte Höhe (`--icon-button-size`) — sichtbar ist nur der
niedrigere Rahmen, senkrecht mittig darin.

### Warum die Umrandung gerechnet und nicht geschert wird

Eine per `skewX()` gescherte CSS-Umrandung kann **nicht** überall gleich dick
sein. Die Scherung ist nicht winkeltreu, und das trifft jede der drei
Kantenarten anders:

| Stelle | Dicke |
|---|---|
| Ober- und Unterkante (bleiben waagerecht) | 1,00 × |
| die beiden 45°-Kanten (aus den senkrechten Umrandungen) | 0,71 × |
| gerundetes Eck, wo die Tangente durch die gestauchte Richtung dreht | 1,41 × |

Zwischen dünnster und dickster Stelle liegt ein **Faktor 2** — sichtbar als
dünne Schrägen und aufgedickte Ecken. Reparieren lässt sich das nicht: die
Umkehrabbildung eines Rings gleicher Dicke unter einer Scherung ist kein
Ring, den `border` und `border-radius` beschreiben können.

Deshalb rechnet `main.js` die Kontur und zeichnet sie als SVG-Pfad. Ein Strich
auf einem Pfad ist richtungsunabhängig gleich dick. Gemessen am Screenshot
(1440 × 900, Gerätepixel): waagerechte Kante **3,01**, 45°-Kante **2,95** —
beide auf dem gerechneten Wert von 3,23. Vorher wären es 3,23 gegen 2,28
gewesen.

Zwei Dinge werden dabei sogar originalgetreuer:

* Der Winkel ist in jeder Kastengröße exakt 45,10°.
* Die beiden stumpfen Ecken tragen einen **echten Kreisbogen** mit der Sehne
  des Originals (43,8 % der Höhe, gemessen 16,434 bei 37,52 Höhe). Unter der
  Scherung war nur eine Ellipse möglich.

Ohne JavaScript bleibt die gescherte Umrandung als Rückfallebene stehen —
lieber eine ungleichmäßige Linie als keine.

### Eine Strichstärke für die ganze Seite

Alles Gezogene trägt dieselbe Breite: die Umrandung der Schaltflächen und der
Countdown-Kacheln, der Streckenverlauf, die Trennlinien in Tabellenstand und
Rennliste, die Trennlinie der Rechtsseiten.

Ihr Maß ist nicht gesetzt, sondern gemessen — der senkrechte Stamm des „R" auf
dem Racing-Button. In Saira Regular läuft seine linke Kante bei x = 100, die
rechte bei x = 186 (Einheiten, upem = 1000):

```css
--stem-ratio: 0.086;                                        /* 86 / 1000 */
--line-w: calc(var(--action-label-size) * var(--stem-ratio));
```

Bezug ist der Grad der Button-Beschriftung. Die Linie ist damit exakt so dick
wie der Buchstabe daneben, auf jedem Fenster — 1,61px bei 18,76px
Beschriftung.

### Der Streckenverlauf ist eine Linie, kein Bild

Im Countdown des Racing-Pop-ups steht der Verlauf des Automotodrom Brno.
Quelle ist das Pre-Event-Blatt von Franz Wöss Racing. Dort liegt der Plan als
Bitmap (622 × 358) — **zweimal**, und die beiden Fassungen sind
unterschiedlich gedreht: `xref 21` auf Seite 1 im Querformat, `xref 32` auf
Seite 4 um 90° gekippt. Maßgeblich ist das Querformat.

Die Zeichnung stellt die Strecke als Korridor aus zwei feinen Linien dar.
Freigestellt wurde sie über die Struktur, nicht per Hand:

| Schritt | Merkmal |
|---|---|
| Kurvenblasen, Zielflagge, „N" weg | gefüllte Flächen — was ein Opening mit r = 4 übersteht |
| Nordpfeil weg | der einzige bunte Teil der Zeichnung |
| Zeiger-Ticks weg | Äste mit freiem Ende und Länge < 14 px |
| Lücken schließen | die Blasen verdecken die Linie; freie Enden bis 44 px Abstand werden verbunden |
| Kanten ziehen | Außen- und Innenrand des **gefüllten** Korridors |

Ausgeliefert wird davon **eine einzige Linie**: die **Mittellinie** des
Korridors. Sie ist nicht gezeichnet, sondern gerechnet — die Außenkontur um
die halbe Korridorbreite nach innen versetzt:

| Schritt | Wert |
|---|---|
| Korridorbreite, gemessen | Median **7,86** Einheiten (10 %-Quantil 7,67, 90 % 8,09) |
| Versatz nach innen | 3,93 Einheiten entlang der Normalen |
| Glättung | zyklische Gauß-Faltung, σ = 4 Einheiten |
| Knoten setzen | sobald 12° Richtungswechsel oder 24 Einheiten Weg |
| Ausgabe | geschlossener Catmull-Rom als kubische Bézier, **149 Knoten** |

Die Kontrolle liegt in der Fläche: die Mittellinie umschließt 85 843
Quadrateinheiten, das arithmetische Mittel von Außen- (92 991) und
Innenkontur (78 795) sind 85 893 — 0,06 % Abweichung.

Der Verlauf steht **inline im Markup**, nicht als `<img>`. Nur so erreicht
das Stylesheet die Linie — und genau das braucht es: sie trägt das
CDF-Hellgrau des Fließtextes und `--line-w`, DIE Strichstärke der Seite.
`vector-effect="non-scaling-stroke"` hält sie in jeder Größe auf genau diesem
Maß.

### Countdown

Der Zielzeitpunkt steht als ISO-Zeitstempel mit Zeitzone im Markup
(`data-countdown`), die Ziffern setzt `main.js`. Aktuell:

```html
data-countdown="2026-09-12T12:45:00+02:00"
```

Samstag, 12. September 2026, 12:45 Ortszeit Brno. Der Offset ist +02:00, weil
Europe/Prague im September in der Sommerzeit läuft (CEST).

Die Kacheln stehen im Markup auf `hidden` und werden erst per JavaScript
eingeschaltet — ohne JavaScript stünde sonst eine Reihe Nullen. Ort und Datum
sind Text und bleiben in jedem Fall lesbar. Ist der Termin durch, verschwinden
die Kacheln wieder, statt ins Negative zu laufen.

#### Die vier Kacheln sind EIN geneigtes Band

Sie stehen in zwei Reihen, aber nicht als vier einzeln gesetzte Flächen: ihre
Ecken treffen sich, die Kanten laufen durch. Damit liest sich die Fläche wie
ein durchgehender Schrägbalken, der in vier Module geteilt ist — dieselbe
Flussrichtung wie der erste rubinrote Querbalken der Wortmarke.

```
DAYS  HRS
MIN   SEC
```

Zwei Verschiebungen sind dafür nötig, und beide sind gerechnet:

| | Wert | gemessen |
|---|---|---|
| untere Reihe nach links | (Kachelhöhe − Strichstärke) × tan 45,10° | −50,297 px (soll −50,316) |
| Reihennaht | −Strichstärke, damit die Waagerechte **einmal** gezeichnet wird | −1,609 px (soll −1,609) |
| Spaltennaht | −Strichstärke × sec 45,10°, dieselbe Logik für die Schräge | −2,281 px (soll −2,280) |

Ohne die erste Verschiebung liegt die obere linke Ecke von MIN um genau den
Schrägversatz **rechts** von der unteren linken Ecke von DAYS — das war der
Bruch im Band. Der Versatz bemisst sich an der Höhe zwischen den beiden
Pfaden, also an (Kachelhöhe − Strichstärke), nicht an der Kachelhöhe selbst.

Waagerecht wird über `left` verschoben und nicht über einen Rand: die
Kachelbreite kommt aus der Rasterspur, und ein Rand würde sie verändern.
Senkrecht muss der Rand greifen, weil die Zeilenhöhe wirklich kürzer werden
soll.

Weil die untere Reihe nach links rückt, sitzt die Mitte der Fläche nicht mehr
auf der Mitte des Rasters. `translateX` holt sie um die Hälfte der beiden
Verschiebungen zurück — die Fläche steht damit wieder mittig unter der
Datumszeile (gemessen 937,46 gegen 937,44).

#### Ein Faktor für den ganzen Block

Kicker, Ort, Datum und die Kachelfläche stehen um ein Drittel größer als
zuvor. Der Faktor sitzt an genau einer Stelle:

```css
--countdown-scale: 1.33;
```

Die Kachelhöhe ist nicht gesetzt, sondern gerechnet — Ziffer, Zwischenraum,
Einheit und zweimal die Luft an Ober- und Unterkante. Die Luft ist zusätzlich
um die Hälfte gewachsen: vorher blieben bei 36px Kachelhöhe 2,91px über der
Ziffernzeile und ebenso viel unter der Einheit, das sind 0,1617 des
Zifferngrades; mit +50 % sind es 0,2425. Gemessen liegen jetzt **5,81px** oben
und 5,83px unten.

Der Abstand vom Streckenverlauf zum Kopfblock und der vom Kopfblock zur
Kachelfläche bleiben dabei exakt gleich groß — `align-content: space-between`
verteilt den Rest zu gleichen Teilen (gemessen beide **25,578px**).

Auf flachen Fenstern (`max-height: 640px`) fällt der Faktor auf 1 zurück: die
Spalte ist dort nur so hoch wie das Hochformat daneben, und der vergrößerte
Satz liefe unten aus dem Block heraus. Gestapelt (`max-width: 820px`) nimmt
die Spalte ihre Inhaltshöhe und trägt die beiden Abstände als einen festen,
damit weiter gleich großen Wert.

### Überschrift auf der Bildoberkante

Kapitel mit Hochformat setzen Bild und Text nebeneinander. `align-items:
stretch` gibt der Textspalte dieselbe Höhe wie dem Bild; zusammen mit der
engen Zeilenhöhe von `.story__title` liegen Überschriftoberkante und
Bildoberkante auf derselben Linie. Das gilt über `.story--split` für **jedes**
solche Kapitel in **jedem** Pop-up — dieselbe Auflösung wie auf
manuel-beck.com.

### Der Intro-Opener ist ein Layer, keine zweite Seite

Beim Aufruf der Startseite läuft zuerst ein Logo-Clip. Das ist **kein
Redirect und kein zweiter Seitenaufruf**: Das Overlay liegt über dem bereits
geladenen Dokument und nimmt sich nach dem Video selbst aus dem DOM.

Markup steht als erstes Element im `<body>`, Gestaltung in **Abschnitt 11**
des Stylesheets, Steuerung in einem Inline-Skript direkt darunter. Bewusst
inline und nicht in `main.js`: Das Skript muss binden, bevor `ended` feuern
kann, und `main.js` lädt erst am Seitenende.

Ablauf, live gemessen:

| Phase | Wert | Woher |
|---|---|---|
| Fade-in des Clips | 0,45 s (`--fade-panel`) | gemessen 383 ms |
| Clip läuft | 1,6 s | `ended`-Ereignis, keine geschätzte Dauer |
| Hold — letzter Frame steht | 0,75 s (`HOLD` im Skript) | gemessen 788 ms |
| Fade-out des Overlays | 1,4 s (`--intro-fade-out`) | gemessen 1294 ms |
| Overlay aus dem DOM | +1,6 s nach Fade-Beginn | gemessen 4115 ms |

**Der wichtigste Punkt — die Startseite darf nicht vorher animieren.**
Abschnitt 4 friert die Seite mit `body.is-preload` ein, und ursprünglich hob
`window.onload` das auf. Das feuerte nach **34–139 ms**; die komplette
Hero-Animation lief also bis 2400 ms unsichtbar hinter dem Overlay ab, und
darunter kam eine bereits fertig eingeblendete Seite zum Vorschein. Deshalb
gibt heute nicht mehr `onload` frei, sondern das Intro-Skript:

```js
window.onload = function () {
  if (!document.documentElement.classList.contains('is-intro'))
    document.body.classList.remove('is-preload');
};
```

`is-preload` fällt jetzt im selben Durchlauf, in dem der Fade startet — die
Seite kommt **während** des Übergangs herauf, nicht danach. Läuft kein Intro
(Fehler, kein JavaScript), bleibt es beim alten Verhalten.

**Stolperfalle:** `body.is-preload *` setzt `transition: none !important` und
trifft damit auch das Overlay selbst. Ohne Ausnahme sprang der Fade-in des
Clips innerhalb eines Frames von 0,000 auf 1,000. Zwei Regeln am Ende von
Abschnitt 11 nehmen die beiden Intro-Elemente aus; `!important` gegen
`!important` entscheidet die höhere Spezifität — die Universalregel wiegt
(0,1,0), die Ausnahme (0,2,0).

**Zweite Stolperfalle:** Der Clip ist 33 KB und oft fertig, bevor überhaupt
einmal gerendert wurde. Wird die Sichtbar-Klasse dann sofort gesetzt, hat der
Browser keinen Ausgangszustand zum Überblenden. Zwei `requestAnimationFrame`
Vorlauf lösen das.

Kein Nutzer kann auf dem Layer hängen bleiben:

| Fall | Reaktion |
|---|---|
| kein JavaScript | Overlay bleibt `display: none`, Seite sofort da |
| MP4 lädt nicht | `error`-Ereignis → sofortige Freigabe |
| `play()` abgelehnt | Promise-`catch` → sofortige Freigabe |
| `ended` bleibt aus | Watchdog: echte Laufzeit + 3 s |

### Das Racing-Video bringt seinen Rahmen mit

`racing-panel-final_v2_.mp4` ist 1920 × 1080, **die Aufnahme darin aber nur
1280 × 720**, mittig auf einer dunkelblauen Fläche. `ffmpeg -vf cropdetect`
meldet über alle Frames konstant `1280:720:320:180`. Die Randfarbe ist
`#081D32` und liegt damit knapp neben dem `--color-dark` der Seite
(`#0A1F33`) — deshalb liest sich der Rand als eigener, etwas dunklerer Kasten
um das Video.

Der Kasten steht bereits auf voller Kapitelbreite; das Bild wirkte trotzdem
klein, weil zwei Drittel davon Rahmen sind. Gegenmittel ist der vorhandene
Zoom-Mechanismus des Designsystems, derselbe wie bei `.story--imola`:

```css
.story--racing-video .story__media video { --media-zoom: 1.45; }
```

**Warum genau 1,45 und nicht mehr.** Das TopJet-Wasserzeichen sitzt bei
x 1557–1588, y 852–878 — die Aufnahme endet bei x 1600, es bleiben also nur
**zwölf Pixel Luft**. Bei Zoom 1,5 läge die Schnittkante exakt auf der
Bildkante und das Wasserzeichen würde angeschnitten; das war schon einmal der
Fall. Bei 1,45 bleiben 34 Pixel Abstand:

| Zoom | sichtbar bis | Luft zum Wasserzeichen | Bild in % der Kastenbreite |
|---|---|---|---|
| 1,40 | x 1646 | 58 px | 93,3 % |
| **1,45** | **x 1622** | **34 px** | **96,7 %** |
| 1,50 | x 1600 | 12 px | 100 % |

Weggeschnitten werden dabei 298 von 320 Rahmenpixeln je Seite — **nur
Rahmen, kein Bildpunkt**. Die verbleibenden 22 Pixel sind rund 15 CSS-Pixel
und lesen sich als Hintergrund.

Zwei Begleitregeln gehören dazu:

- `max-height: none` hebt den Höhendeckel von `.story--media-first` auf. Beim
  Foto darf der oben anschneiden, beim Video kippte er das Seitenverhältnis:
  auf flachen Fenstern wurde aus 16:9 ein Streifen von bis zu **5,4 : 1** und
  `cover` schnitt zwei Drittel der Bildhöhe weg.
- `object-fit: contain` statt des geerbten `cover`. Beide zeigen bei einem
  16:9-Kasten dasselbe Bild, aber `cover` würde bei jeder Rundung im
  Kastenmaß die Überlänge abschneiden.

Der Clip endet mit einem LENZI-Logo-Outro (Bounding-Box x 565–1426,
y 482–595) — auch das bleibt beim Zoom vollständig sichtbar.

### Ton läuft nicht von allein — und HTTPS ändert daran nichts

Der Intro-Clip hat **keine Tonspur**, dort stellt sich die Frage nicht. Das
Racing-Video hat AAC in Stereo, Spitzenpegel −18,7 dB.

Die Pop-ups öffnen auf Geräten mit Maus per `mouseenter`. **Ein Hover ist für
Browser keine Nutzergeste** — `play()` mit Ton wird mit `NotAllowedError`
abgelehnt („play() failed because the user didn't interact with the document
first"). Ein Klick auf den Button hilft nicht: der schaltet um und würde das
per Hover bereits geöffnete Panel schließen.

`main.js` löst das in drei Stufen:

1. Beim Öffnen mit Ton versuchen. Gelingt, sobald irgendwo auf der Seite
   schon einmal geklickt wurde.
2. Wird abgelehnt, läuft der Clip stumm weiter und meldet sich für die
   nächste echte Geste an (`pointerdown`, `keydown`).
3. Ein Klick direkt auf das Video startet es jederzeit von vorn mit Ton — der
   einzige in jedem Browser verlässliche Weg.

**Ein Deploy ändert daran nichts.** Chromes Autoplay-Policy kennt als
Kriterien Nutzergeste, Media Engagement Index und installierte PWA — das
Protokoll gehört nicht dazu, HTTP, HTTPS und `localhost` werden gleich
behandelt. Der MEI zählt zudem pro Origin, ein Erstbesucher startet also
überall bei null. Safari und Firefox verlangen ebenfalls eine Geste.

Wer Ton verlässlich will, braucht einen sichtbaren Ton-Schalter: stumm
starten, ein Klick darauf ist die Geste, die alle Browser akzeptieren.

### Die Scrollleiste liegt über dem Inhalt, nicht daneben

Die drei Pop-ups zeigen beim vertikalen Scrollen eine dünne Leiste am rechten
Innenrand. Sie ist **keine gestaltete native Scrollbar**: Sobald
`::-webkit-scrollbar` eine Breite bekommt, ist sie in Chrome und Safari keine
Overlay-Leiste mehr und **belegt Layoutbreite** — der Inhalt aller Pop-ups
würde schmaler, samt `--content-w` und allem, was daraus abgeleitet ist.

Stattdessen hängt `main.js` in jedes Panel eine eigene Leiste ein und liest
per `scroll`-Ereignis nur mit. `pointer-events: none` hält sie vollständig
aus jeder Interaktion heraus; ziehen lässt sie sich deshalb bewusst nicht.

| | |
|---|---|
| Breite | 3 px, Daumen als Pille (`border-radius: 999px`) |
| Farbe | `var(--color-light)` bei `opacity: 0.32` |
| Abstand rechts | derselbe `clamp(0.5rem, 1.5vw, 0.9rem)` wie `.panel__close` |
| Beginn oben | in Profile und Racing unter dem Close-Button |
| Sichtbarkeit | im Ruhezustand 0, beim Scrollen 1, nach 1 s Ruhe wieder 0 |

Ausgelöst wird ausschließlich vom `scroll`-Ereignis des Containers. Da alle
drei nur `overflow-y` führen, kann es gar nicht anders als durch vertikales
Scrollen entstehen — Hover und waagerechte Mausbewegung erzeugen keines. Der
Sprung auf `scrollTop = 0` beim Öffnen wird unterdrückt, sonst blitzte die
Leiste beim Aufklappen auf.

In Partnerships bleibt sie meist unsichtbar: Dort passt der Inhalt in den
Kasten, es gibt also nichts anzuzeigen. Sie erscheint erst, wenn er
überläuft.

### Schrift

Saira, lokal aus `assets/fonts/` — keine Anfrage an Google, wie es die
Datenschutzerklärung zusagt. Eine Variable-Font-Datei deckt 200–800 ab.

Zwei Stärken (`--weight-regular` 400, `--weight-bold` 700). Fett steht an
genau zwei Stellen: Titel und Abschnittsüberschriften der Rechtsseiten sowie
Kapitelüberschriften in den Pop-ups.

Laufweite und Zeilenhöhe hängen an Tokens statt an Einzelwerten:

| Token | Wert | Wofür |
|---|---|---|
| `--tracking-display` | −0,03 em | Hero-Claim, 96 px |
| `--tracking-title` | −0,02 em | Seitentitel, 30 px |
| `--tracking-subhead` | −0,01 em | 17–28 px |
| `--tracking-small` | +0,01 em | Bildunterschrift, 12 px |
| `--lh-display` … `--lh-base` | 1 / 1,15 / 1,2 / 1,4 / 1,5 / 1,6 | Display → Grundwert |

Zwei Lesegrößen: `--text-body` (16 px, Rechtsseiten) und
`--text-body-compact` (15 px, Pop-ups).

**Ersatzschrift mit erzwungenen Metriken.** Die Seite leitet zwei Maße aus
Saira ab — die Versalhöhe (`--cap-height`, bestimmt die Logohöhe) und den
Anteil des Zeilenkastens unter der Grundlinie (`--claim-descent`, verankert
das Contact-Panel). Ein zweites `@font-face` („Saira Fallback") zwingt der
Ersatzschrift dieselben senkrechten Metriken auf, damit beide Maße auch
während des Ladens und bei fehlender Schrift stimmen.

### Farben

Vier Werte, keine abgeschwächten Varianten:

| Token | Wert | Verwendung |
|---|---|---|
| `--color-dark` | `#0A1F33` | Grund aller Seiten und Pop-ups; Glyphe im Icon-Button beim Hover |
| `--color-orange` | `#FC4615` | Text und Icons der Startseite; Kachelspalte HRS/SEC |
| `--color-light` | `#E2E2E2` | Text der Rechtsseiten und Pop-ups, Wortmarke, Trennlinien, Streckenverlauf |
| `--color-ruby` | `#770B23` | Kachelspalte DAYS/MIN |

Die Wortmarke liegt in einer eigenen Fassung vor, in der die dunkelblauen
Flächen im CDF-Hellgrau laufen — im Original wären sie auf dunkelblauem Grund
unsichtbar.

---

## Bilder

Beide Pop-ups zeigen drei Kapitel. Im User-Pop-up sind Kapitel 1 und 2 16:9
und Kapitel 3 ist 4:5; im Race-Flag-Pop-up ist nur Kapitel 1 16:9, Kapitel 2
und 3 stehen im Hochformat neben ihrem Text. Es sind genau die
Seitenverhältnisse der Bildkästen, damit `object-fit: cover` nichts
Wesentliches abschneidet. Jedes Bild liegt als AVIF und JPEG vor, die
Querformate zusätzlich in einer kleineren Fassung für Telefone.

Der Streckenverlauf ist kein Bild mehr und liegt auch nicht mehr als Datei
unter `images/racing/` — er steht inline im Markup, siehe oben.

Der Grund der Startseite trägt zusätzlich ein Hintergrundfoto, das in der
Datei bereits auf CDF-Dunkelblau heruntergerechnet ist — Rezept und
Kontrastrechnung in `site/assets/images/bg/README.md`.

Kapitel 2 des Racing-Pop-ups zeigt `race-2` — Imola 2026, Nicolas vor einem
zweiten Wagen. Die Vorlage ist 1067 × 1600 und damit schmaler als die
geforderten 4:5. Beschnitten wurden die **oberen** 266 Pixel, unten bleibt
alles stehen: dort liegen Randstein, Kiesbett und die Signatur des
Fotografen, und der Wagen rückt dadurch in die Mitte des Ausschnitts (0,55
der Höhe).

**Fallstrick beim Beschneiden:** `sips` kann nur mittig beschneiden
(`--cropOffset` bleibt ohne Wirkung), ein Versatz nach oben oder unten ist
damit nicht zu erreichen — auch nicht über eine Kombination aus Rand und
Schnitt, weil beide mittig arbeiten. Der Ausschnitt entsteht deshalb über
CoreGraphics (`CGImage.cropping(to:)`, Ursprung oben links) mit
anschließendem Neuzeichnen auf 904 × 1130.

**Fallstrick bei der Bildaufbereitung:** `sips` schreibt kaputte AVIF-Dateien,
sobald eine Kantenlänge **ungerade** ist. 900 × 1125 lässt sich nicht
dekodieren, 900 × 1124 schon (4:2:0-Chroma). Der Browser meldet die Datei als
geladen und zeichnet sie trotzdem nicht — und fällt auch nicht auf das JPEG
zurück. Alle Ausschnitte deshalb mit geraden Kanten: **1600 × 900**,
**1024 × 576**, **904 × 1130**.

---

## Voraussetzungen

| Wofür | Was | Anmerkung |
|---|---|---|
| lokal ansehen | `python3` | für `http.server`, auf macOS vorinstalliert |
| deployen | AWS CLI v2, konfiguriertes Profil | Rechte siehe DEPLOY.md |
| Infrastruktur anlegen | AWS CLI v2 | einmalig, `./infra.sh` |

Kein Node, kein npm, kein Build-Schritt, keine Abhängigkeiten. `deploy.conf`
wird von `infra.sh` geschrieben, ist kontospezifisch und deshalb nicht im
Repository — sie enthält nur Bucket-Name und CloudFront-Verteilungs-ID, keine
Zugangsdaten. Die kommen aus dem AWS-Profil.

---

## Lokal testen

```bash
cd ~/Desktop/lenziloeffler.de/site
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen. Die absoluten Pfade (`/assets/…`)
brauchen einen Server — ein Doppelklick auf `index.html` funktioniert nicht.

**Immer mit Hard Reload prüfen** (`Cmd` + `Shift` + `R`). `python3 -m
http.server` schickt `Last-Modified`, und der Browser hält Stylesheet und
Skript danach fest. Beim Nachmessen einer CSS-Änderung sah es dadurch mehrfach
so aus, als hätte eine Regel keine Wirkung — tatsächlich lief noch die alte
Datei. Wer länger testet, aktiviert in den DevTools unter Network besser
dauerhaft „Disable cache".

Gegenprobe in der Konsole, ob die neue CSS aktiv ist:

```js
getComputedStyle(document.querySelector('#panel-racing .story__media')).maxHeight
// "none"  → neue Datei;  ein Pixelwert → noch die alte im Cache
```

Das Intro läuft bei jedem Aufruf. Zum Überspringen während der Arbeit an der
Startseite reicht in der Konsole:

```js
document.getElementById('intro').remove();
document.documentElement.classList.remove('is-intro');
document.body.classList.remove('is-preload');
```

---

## Live gehen

1. `./infra.sh` — legt Bucket, Zertifikat und CloudFront-Verteilung an und
   nennt die DNS-Einträge, die bei Squarespace zu setzen sind.
2. DNS bei Squarespace umstellen (siehe DEPLOY.md).
3. `./deploy.sh` — lädt `site/` hoch und leert den Cache.

Details, Rechte und Fehlersuche: **DEPLOY.md**.

---

## Bekannte Punkte

Stand v1.3. Nichts davon blockiert den Betrieb; alles ist bewusst so und
nicht versehentlich.

### Racing-Video: Ton kann beim Seitenaufruf zu hören sein

Das `<video>` im Racing-Pop-up trägt `autoplay`, aber kein `muted`. Das Panel
ist beim Laden `visibility: hidden` — erlaubt der Browser Autoplay mit Ton,
startet der Clip trotzdem und man hört seine Tonspur, während das Intro-Logo
einblendet, ohne etwas zu sehen.

Nachgewiesen in Chrome: Unter `--autoplay-policy=no-user-gesture-required`
läuft das Racing-Video ab 300 ms mit `paused: false`, `muted: false` und
laufender `currentTime`, während das Intro noch aktiv ist. Unter
`document-user-activation-required` bleibt es pausiert. Ob es auftritt, hängt
also am Media Engagement Index der Origin — deshalb „manchmal".

Das Intro-Video selbst ist **nicht** die Quelle: `perfect-intro-logo-only.mp4`
hat gar keine Audiospur (ein einziger Stream, Typ `video`).

**Behebung:** `autoplay` am Racing-`<video>` streichen. Die Wiedergabe steuert
ohnehin vollständig `startVideos()` in `main.js` beim Öffnen des Panels. Die
Korrektur ist in v1.3 bewusst **nicht** enthalten, weil v1.3 den geprüften
Stand unverändert festhalten soll.

### Ton im Racing-Pop-up braucht eine Nutzergeste

Die Pop-ups öffnen per `mouseenter`, und ein Hover ist für Browser keine
Nutzergeste. Details und der dreistufige Umgang damit stehen oben unter
„Ton läuft nicht von allein". Ein Deploy oder HTTPS ändert daran nichts.

### Videos werden ohne `Cache-Control` ausgeliefert

`*.mp4` steht in keiner der `aws s3 cp`-Include-Listen von `deploy.sh`;
hochgeladen wird erst vom abschließenden `sync`. Siehe DEPLOY.md.

### Archiv und Repository-Größe

`originale/` (30 MB) wird nicht deployt und bleibt bewusst erhalten, darin
`Saira.zip` (11,5 MB) inhaltsgleich mit dem entpackten Ordner daneben. Das
`.git`-Verzeichnis liegt bei rund 41 MB; die in v1.3 gelöschten Dateien
stecken weiterhin in der History. Schrumpfen ginge nur per History-Rewrite
und ist nicht vorgesehen.
