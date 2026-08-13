# About-Me-Medien

Die vier finalen Motive des About-Me-Overlays.

| Kapitel | Titel                      | Datei          | Format               | Anordnung                  |
| ------- | -------------------------- | -------------- | -------------------- | -------------------------- |
| 1       | From Kaufbeuren to Chicago | `chicago.*`    | quer, 1600 × 1066    | Bild oben, Text darunter   |
| 2       | Munich                     | `munich.*`     | quer, 1600 × 1200    | Text oben, Bild darunter   |
| 3       | Augsburg                   | `augsburg.*`   | hoch, 750 × 1000     | Bild rechts, Text links    |
| 4       | Motorsport                 | `motorsport.*` | hoch, 1000 × 1778    | Bild links, Text rechts    |

Die Anordnung folgt der Ausrichtung: Querformate laufen über die volle Breite
unter dem Text, Hochformate stehen neben dem Text. Bei 3 und 4 wechselt die
Seite, damit das Blatt nicht statisch wirkt.

## Ausgeliefert wird pro Bild nur eine Datei

`<picture>` in `site/index.html` lässt den Browser AVIF wählen, das JPEG ist
nur Rückfallebene für alte Browser. Praktisch geladen werden rund 400 KB für
alle vier Kapitel.

## Bildausschnitt

Die Rahmen haben feste Proportionen, der Inhalt wird per `object-fit: cover`
beschnitten. Der Ausschnitt sitzt pro Bild über `object-position` direkt am
`<img>`:

| Bild       | Wert         | Grund                                     |
| ---------- | ------------ | ----------------------------------------- |
| chicago    | `center 45%` | hält Fahnen und Turmspitzen im Bild       |
| munich     | `center 55%` | Gewicht auf Gebäude statt Himmel          |
| augsburg   | `center 45%` | Brunnenfigur und Fassade                  |
| motorsport | `center 62%` | beide Personen und das Fahrzeug           |

## Farbliche Anmutung

Die Motive stammen aus verschiedenen Jahren, Kameras und Lichtsituationen.
Sie sind **nicht** in die Dateien hineingerechnet, sondern liegen als
CSS-Filter auf `.story__media img`:

```css
filter: saturate(0.88) contrast(1.06) brightness(0.97);
```

Das nimmt der stärksten Aufnahme (Augsburg, sehr sattes Blau) die Spitze und
lässt alle vier als eine Serie lesen. Beim Hover geht die Sättigung auf volle
Stärke — das Bild wacht unter dem Zeiger auf. Vorteil gegenüber gebackenen
Dateien: jederzeit in einer Zeile änderbar, ohne die Bilder neu zu erzeugen.

## Neues Bild einsetzen

Original nach `originale/about-me/` legen, dann aus dem Bildordner heraus:

```
N=name; W=1600     # W=1000 bei Hochformat
sips --resampleWidth $W ../../../../originale/about-me/$N.jpg --out /tmp/$N.png
sips -s format avif -s formatOptions 55 /tmp/$N.png --out $N.avif
sips -s format jpeg -s formatOptions 62 /tmp/$N.png --out $N.jpg
```

Danach in `site/index.html` `width`/`height` am `<img>` auf die neuen Maße
setzen — sie verhindern, dass das Layout beim Laden springt.

**Achtung — gerade Bildmaße:** `sips` erzeugt bei ungerader Pixelhöhe eine
AVIF-Datei, die ihre Maße korrekt meldet, aber im Browser nichts anzeigt.
Genau das passierte bei `munich` (1600 × 1199). Notfalls über
`--resampleHeight` skalieren, damit beide Kanten gerade sind, und das
Ergebnis im Browser gegenprüfen — nicht nur die Dateigröße.

**Achtung bei Fotos vom iPhone:** `sips` rechnet die EXIF-Drehung je nach
Zielformat unterschiedlich ein. AVIF und JPEG können danach unterschiedlich
herum liegen. Immer beide Dateien im Browser gegenprüfen, nicht `sips -g`
vertrauen — das meldet die Maße vor der Drehung. Bei `augsburg` war genau das
der Fall, dort steckt eine zusätzliche `sips -r 90` in der AVIF-Kette.

## Video statt Bild

Das komplette `<picture>` lässt sich gegen ein `<video>` tauschen, das CSS
greift für beide (`.story__media img, .story__media video`).
