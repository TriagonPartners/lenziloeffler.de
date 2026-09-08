# lenziloeffler.de

Website von Nicolas „Lenzi" Loeffler, Formel-3-Fahrer.
Reines HTML, CSS und JavaScript — kein Framework, kein Build-Schritt. Was in
`site/` liegt, ist genau das, was online steht.

---

## Aufbau

```
site/
  index.html            Startseite (Hero, drei Schaltflächen, Wortmarke, Social, Fußnote)
  impressum/index.html
  datenschutz/index.html
  site.webmanifest      Für „Zum Startbildschirm" auf Android
  assets/
    css/style.css       Das gesamte Stylesheet, kommentiert und in 10 Abschnitte gegliedert
    js/main.js          Panel-Logik, Scroll-Reveal, Countdown, Umrandungen
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

## Lokal testen

```bash
cd ~/Desktop/lenziloeffler.de/site
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen. Die absoluten Pfade (`/assets/…`)
brauchen einen Server — ein Doppelklick auf `index.html` funktioniert nicht.

---

## Live gehen

1. `./infra.sh` — legt Bucket, Zertifikat und CloudFront-Verteilung an und
   nennt die DNS-Einträge, die bei Squarespace zu setzen sind.
2. DNS bei Squarespace umstellen (siehe DEPLOY.md).
3. `./deploy.sh` — lädt `site/` hoch und leert den Cache.

Details, Rechte und Fehlersuche: **DEPLOY.md**.
