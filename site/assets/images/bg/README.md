# Hintergrund der Startseite

`home.avif` / `home.jpg` — 2560 × 1440, das Foto aus dem Drive-Ordner
„312 ohne Nico" (`nicolas lenzi loeffler website`): der F312 mit der 91 in
der Franz-Wöss-Lackierung, Mitzieher.

## Warum die Datei so dunkel ist

Der Grund der Startseite ist CDF-Dunkelblau. Alles darauf läuft in
CDF-Orange, und Orange auf `#0A1F33` hat 4,80:1 — knapp über der
AA-Schwelle von 4,5:1 für Lesegrößen. **Jede Aufhellung des Grundes zehrt
daran.** Deshalb ist das Bild nicht per CSS abgedunkelt, sondern in der
Datei bereits auf den Grund heruntergerechnet:

| Schritt | Wert | Warum |
|---|---|---|
| Beschnitt | mittig auf 16:9 | füllt jedes Fenster mit `cover` |
| Entsättigung | Rec.-709-Luminanz | eine Farbe weniger im Bild |
| Weichzeichnung | Gauß σ 2,2 px | Fläche liest als Atmosphäre, nicht als Motiv |
| Normierung | 2./98. Perzentil | Ergebnis hängt nicht an der Belichtung der Vorlage |
| Tonwertkurve | t^1,25 | zieht die Mitten nach unten |
| Duotone | `#071523` → `#102B41` | beide Enden knapp um `#0A1F33` |
| Untere Hülle | ab 58 % Höhe auf `#0A1F33`, voll ab 80 % | Social-Icons und Fußnote (14 px) behalten 4,80:1 |

Gemessen am Ergebnis: hellster Punkt `#102B41` → **4,17:1** gegen Orange,
Mittelwert der Fläche `#0C2235` — der Gesamtton der Seite bleibt also
praktisch der alte.

Die Icon-Buttons brauchen dabei nichts: `.action` trägt eine deckende Fläche
in `--color-dark`, die Kreise stehen unberührt vor dem Bild.

## Neu erzeugen

Vorlage nach `originale/` legen, dann mit `bg.py` (Duotone-Werte und Hülle
stehen oben) auf 2560 × 1440 rechnen und exportieren:

```
sips -s format avif -s formatOptions 60 bg.png --out home.avif
sips -s format jpeg -s formatOptions 70 bg.png --out home.jpg
```

Gerade Kantenlängen sind Pflicht — `sips` schreibt bei ungerader Kante eine
AVIF-Datei, die der Browser als geladen meldet und trotzdem nicht zeichnet
(siehe `../about-me/README.md`).

## Geprüfte Alternative

`monza circuit` (Haupttribüne Monza im Morgenlicht) ist mit demselben
Rezept getestet worden. Sie fällt durch, weil ihr Motiv an der Fluchtlinie
hängt: im Hochformat beschneidet `cover` genau diese weg, und übrig bleibt
eine fast flächige Fläche. Der Mitzieher trägt dagegen eine Diagonale, die
jedes Seitenverhältnis schneidet — und die Schrägen nehmen die Schrägen der
Wortmarke auf.
