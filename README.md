# lenziloeffler.de

Website von Nicolas „Lenzi" Loeffler, Formel-3-Fahrer.
Reines HTML, CSS und JavaScript — kein Framework, kein Build-Schritt. Was in
`site/` liegt, ist genau das, was online steht.

---

## Aufbau

```
site/
  index.html            Startseite (Hero, drei Icons, Wortmarke, Social, Fußnote)
  impressum/index.html
  datenschutz/index.html
  site.webmanifest      Für „Zum Startbildschirm" auf Android
  assets/
    css/style.css       Das gesamte Stylesheet, kommentiert und in 10 Abschnitte gegliedert
    js/main.js          Panel-Logik und Scroll-Reveal im Overlay
    fonts/Saira/        Variable Font, lokal ausgeliefert (keine Google-Fonts-Anfrage)
    icons/              SVGs, per CSS-Maske eingefärbt
    images/about-me/    Bildstrecke des User-Pop-ups (user-1 … user-4)
    images/racing/      Bildstrecke des Race-Flag-Pop-ups (race-1 … race-4)
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
| „Formula 3 Driver." | Oberkante Icon-Reihe | 1u |
| Icon-Reihe | Wortmarke (mittig im Rest) | zentriert |
| „Follow Lenzi" | Social-Icons | 1u |
| Social-Icons | Fußnote | 2u |

Der Hero skaliert per `clamp()` mit der Fensterbreite, alle Abstände wachsen
und schrumpfen im selben Verhältnis mit. Wer den Rhythmus ändern will, ändert
`0.3125` — sonst nichts.

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

### Das Contact-Panel spannt sich zwischen zwei Kanten auf

Es liegt im Logo-Slot, nicht beim Briefumschlag-Icon, und ist über `top` und
`bottom` an der Unterkante der Hero-Zeile und der Oberkante der Wortmarke
verankert. `height: fit-content` plus `margin-block: auto` verteilen den Rest
gleichmäßig: der Abstand nach oben ist immer exakt so groß wie der nach unten.

Ohne `fit-content` wäre `height: auto` bei gesetztem `top` **und** `bottom`
keine Inhaltshöhe, sondern die volle Bandhöhe — die auto-Ränder hätten dann
nichts mehr zu verteilen.

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
| `--color-orange` | `#FC4615` | Text und Icons der Startseite |
| `--color-light` | `#E2E2E2` | Text der Rechtsseiten und Pop-ups, Wortmarke, Trennlinie |

Die Wortmarke liegt in einer eigenen Fassung vor, in der die dunkelblauen
Flächen im CDF-Hellgrau laufen — im Original wären sie auf dunkelblauem Grund
unsichtbar.

---

## Bilder

Beide Pop-ups zeigen vier Kapitel. Kapitel 1 und 2 sind 16:9, Kapitel 3 und 4
sind 4:5 — genau die Seitenverhältnisse der Bildkästen, damit `object-fit:
cover` nichts Wesentliches abschneidet. Jedes Bild liegt als AVIF und JPEG vor,
Kapitel 1 und 2 zusätzlich in einer kleineren Fassung für Telefone.

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
