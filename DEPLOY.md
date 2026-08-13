# manuel-beck.com — Betrieb und Deployment

Kurzanleitung für alles, was mit der Live-Seite zu tun hat.
Stand: 13. August 2026.

---

## In einem Satz

Die Seite ist reines HTML/CSS/JS ohne Framework. Sie liegt in `site/`, wird
in einen S3-Bucket kopiert und von CloudFront ausgeliefert. Es gibt nichts zu
bauen oder zu kompilieren — was in `site/` liegt, ist genau das, was online
steht.

---

## Die zwei Befehle fürs Deployment

```bash
cd ~/Desktop/manuel-beck.com

aws s3 sync site/ s3://manuel-beck.com --delete --exclude "*.md"
aws cloudfront create-invalidation --distribution-id E3PTUBGVEU4KYY --paths "/*"
```

Oder bequemer, mit Vorschau und Rückfrage:

```bash
./deploy.sh
```

**Was die Befehle tun**

| Teil | Bedeutung |
|---|---|
| `s3 sync site/ s3://…` | kopiert den Inhalt von `site/` in den Bucket |
| `--delete` | löscht im Bucket alles, was lokal nicht mehr existiert |
| `--exclude "*.md"` | hält interne Notizen (README-Dateien) aus dem Netz |
| `create-invalidation --paths "/*"` | leert den CloudFront-Cache, sonst sehen Besucher bis zu 24 h die alte Version |

Nach der Invalidierung dauert es etwa 30 Sekunden, bis die Änderung weltweit
sichtbar ist.

---

## Vorher lokal testen

```bash
cd ~/Desktop/manuel-beck.com/site
python3 -m http.server 8000
```

Dann **http://localhost:8000** öffnen. Beenden mit `Strg` + `C`.

**Nicht per Doppelklick öffnen.** Alle Pfade sind absolut (`/assets/…`), so
wie AWS sie braucht. Ohne lokalen Server fehlen Schriftart, Icons und Bilder.

Im Browser hart neu laden mit `Cmd` + `Shift` + `R`, sonst zeigt er das alte
CSS aus seinem Zwischenspeicher.

---

## Die Infrastruktur

| | |
|---|---|
| AWS-Konto | 625738166923 |
| IAM-Benutzer | `manuel-beck-deploy` (S3 + CloudFront Full Access) |
| S3-Bucket | `manuel-beck.com`, Region eu-central-1 (Frankfurt) |
| CloudFront-Distribution | `E3PTUBGVEU4KYY` |
| Domains | manuel-beck.com, www.manuel-beck.com |
| Zugriff auf den Bucket | über Origin Access Control — der Bucket ist **nicht** öffentlich, nur CloudFront darf lesen |
| Versionierung | **nicht aktiviert** — gelöschte Dateien sind endgültig weg |

Zugangsdaten liegen lokal in `~/.aws/`. Falls sie fehlen: `aws configure`,
dann Access Key, Secret, Region `eu-central-1`, Format `json`. Prüfen mit
`aws sts get-caller-identity`.

---

## Die CloudFront-Function — bitte nicht löschen

**Name:** `manuel-beck-dir-index`
**Typ:** viewer-request, Runtime `cloudfront-js-2.0`
**Angelegt:** 13. August 2026

```js
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    if (uri.charAt(uri.length - 1) === '/') {
        request.uri = uri + 'index.html';
    } else if (uri.lastIndexOf('.') < uri.lastIndexOf('/')) {
        request.uri = uri + '/index.html';
    }

    return request;
}
```

**Warum sie existiert:** CloudFront holt die Dateien direkt vom S3-REST-
Endpunkt. Der kennt keine Verzeichnisindizes — ein Aufruf von
`/impressum/` sucht ein Objekt namens `impressum/` und findet nichts,
Ergebnis 403. Die Function hängt bei Ordnerpfaden `index.html` an.

Ohne sie sind **Impressum und Datenschutz nicht erreichbar**. Beim Impressum
ist das eine Pflichtangabe, also kein kosmetisches Problem.

Die alte Aerial-Seite brauchte das nie, weil sie aus einer einzigen
`index.html` bestand.

---

## Achtung: Terraform

Im Konto liegt ein Bucket `terraform-website-deploy-state-…`. Falls diese
Infrastruktur per Terraform verwaltet wird, ist sie jetzt nicht mehr
deckungsgleich: die CloudFront-Function wurde direkt über die API angelegt,
nicht über Terraform. Ein späteres `terraform apply` könnte sie entfernen —
dann wären Impressum und Datenschutz wieder tot.

**Vor dem nächsten Terraform-Lauf klären.** Wer auch immer den Terraform-Code
betreut, sollte die Function dort nachtragen.

---

## Bilder austauschen

Die Motive im About-Me-Overlay liegen in `site/assets/images/about-me/`,
die unbearbeiteten Originale außerhalb in `originale/about-me/` (die werden
nicht mit hochgeladen).

Vorgehen und Fallstricke stehen ausführlich in
`site/assets/images/about-me/README.md`. Die zwei wichtigsten:

**Gerade Pixelmaße.** `sips` erzeugt bei ungerader Bildhöhe eine AVIF-Datei,
die ihre Maße korrekt meldet, aber im Browser nichts anzeigt. Passierte beim
München-Bild (1600 × 1199). Mit `--resampleHeight` skalieren, damit beide
Kanten gerade sind.

**Drehung bei iPhone-Fotos.** `sips` rechnet die EXIF-Drehung je nach
Zielformat unterschiedlich ein — AVIF und JPEG können danach unterschiedlich
herum liegen. Immer **beide** Dateien im Browser gegenprüfen, nicht `sips -g`
vertrauen, das meldet die Maße vor der Drehung.

---

## Wenn etwas schiefgeht

**Seite zeigt noch die alte Version**
Cache. Invalidierung erneut auslösen und im Browser hart neu laden.

**Unterseite wirft 403**
Die CloudFront-Function fehlt oder ist nicht mehr verknüpft. Prüfen mit:
```bash
aws cloudfront get-distribution-config --id E3PTUBGVEU4KYY \
  --query 'DistributionConfig.DefaultCacheBehavior.FunctionAssociations'
```
Es sollte `"Quantity": 1` erscheinen.

**Schrift oder Icons fehlen**
Content-Type im Bucket prüfen:
```bash
aws s3api head-object --bucket manuel-beck.com \
  --key assets/fonts/PlusJakartaSans/PlusJakartaSans-Variable.woff2 \
  --query ContentType
```
Erwartet: `font/woff2`. Falls `binary/octet-stream`, mit
`aws s3 cp --content-type` korrigieren.

**Versehentlich Falsches hochgeladen**
Es gibt keine Versionierung im Bucket, also kein Zurückrollen auf AWS-Seite.
Der lokale Stand in `site/` ist die einzige Quelle — einfach korrigieren und
erneut deployen.

---

## Was wo liegt

```
manuel-beck.com/
├── site/              ← wird deployed
│   ├── index.html
│   ├── impressum/index.html
│   ├── datenschutz/index.html
│   └── assets/        css, js, fonts, icons, favicon, images
├── originale/         Originalfotos, bleiben lokal
├── deploy.sh          Deployment-Skript
└── DEPLOY.md          diese Datei
```

Das alte Aerial-Template wurde am 13. August 2026 entfernt. Es liegt weiterhin
im Branch `backup-aerial` und in der Git-Historie, falls doch einmal jemand
hineinschauen will.
