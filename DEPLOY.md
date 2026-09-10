# lenziloeffler.de — Betrieb und Deployment

Stand: 5. September 2026.

---

## In einem Satz

Die Seite ist reines HTML/CSS/JS ohne Framework. Sie liegt in `site/`, wird in
einen S3-Bucket kopiert und von CloudFront ausgeliefert. Es gibt nichts zu
bauen — was in `site/` liegt, ist genau das, was online steht.

---

## Ausgangslage

`lenziloeffler.de` zeigt derzeit auf **Squarespace**:

```
$ dig +short lenziloeffler.de NS
nsa1.squarespacedns.com.  …
```

In AWS existiert für die Domain noch nichts — kein Bucket, keine Verteilung,
kein Zertifikat. Der Umzug besteht aus drei Schritten, von denen zwei
skriptgesteuert sind und einer von Hand bei Squarespace passiert.

---

## Schritt 1 — Infrastruktur anlegen

```bash
./infra.sh
```

Legt an:

| Ressource | Wert |
|---|---|
| S3-Bucket | `lenziloeffler.de`, Region `eu-central-1`, **privat** |
| Zertifikat | ACM in `us-east-1` für `lenziloeffler.de` + `www.` |
| CloudFront | Verteilung mit Origin Access Control, HTTP/3, PriceClass 100 |
| CloudFront Function | hängt bei Ordner-URLs `/index.html` an |
| Bucket-Policy | Lesezugriff ausschließlich für diese Verteilung |

Das Skript ist mehrfach ausführbar. Beim ersten Lauf bricht es nach dem
Zertifikat ab und nennt zwei CNAME-Einträge zur Validierung — die bei
Squarespace setzen, dann das Skript erneut starten.

Am Ende schreibt es `deploy.conf` mit Bucket und Verteilungs-ID. Diese Datei
liest `deploy.sh`.

**Warum der Bucket privat bleibt:** Ausgeliefert wird nur über CloudFront.
Der Bucket ist damit nicht direkt erreichbar, es gibt keine zweite öffentliche
URL für dieselben Inhalte, und die Zugriffskontrolle liegt an einer Stelle.

**Warum eine CloudFront Function:** S3 als REST-Origin liefert bei
`/impressum/` kein `index.html` aus — das kann nur der S3-Website-Endpunkt,
und der wiederum kann kein Origin Access Control. Die Function hängt das
`/index.html` an, bevor die Anfrage den Bucket erreicht.

---

## Schritt 2 — DNS umstellen (von Hand, bei Squarespace)

Nach `./infra.sh` nennt das Skript den CloudFront-Namen, etwa
`d1234abcd.cloudfront.net`. Bei Squarespace unter *Domains → DNS-Einstellungen*:

| Host | Typ | Ziel |
|---|---|---|
| `@` | ALIAS / ANAME | `<verteilung>.cloudfront.net` |
| `www` | CNAME | `<verteilung>.cloudfront.net` |

Die bestehenden Squarespace-A-Records auf `198.185.159.x` / `198.49.23.x`
entfernen.

> **Damit geht die bisherige Squarespace-Seite offline.** Vorher lässt sich
> alles über `https://<verteilung>.cloudfront.net` testen — die Verteilung
> funktioniert, bevor die Domain umgestellt ist.

DNS-Umstellungen brauchen je nach TTL bis zu 24 Stunden, üblicherweise deutlich
weniger.

---

## Schritt 3 — Deployment

```bash
./deploy.sh
```

Zeigt erst eine Vorschau, fragt nach, lädt dann hoch und leert den Cache.
Am Ende prüft es die drei Seiten per HTTP-Status.

Oder von Hand:

```bash
aws s3 sync site/ s3://lenziloeffler.de --delete --exclude "*.md"
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

### Cache-Regeln

Werden beim Upload mitgegeben, sonst raten Browser selbst — und raten lange.

| Dateien | `Cache-Control` | Warum |
|---|---|---|
| `.avif .jpg .png .ico .svg .woff2 .ttf` | `public, max-age=604800` | ändern sich selten, eine Woche |
| `.html .css .js .webmanifest` | `no-cache` | jedes Mal gegenprüfen; mit ETag kostet das nur ein 304 |
| `.mp4` | **keiner** | siehe unten |

**Videos bekommen derzeit keinen `Cache-Control`-Header.** In `deploy.sh`
steht `*.mp4` in keiner der beiden `aws s3 cp`-Include-Listen; hochgeladen
werden die Dateien erst vom abschließenden `aws s3 sync`, und der setzt keine
Header. Content-Type rät S3 richtig (`video/mp4`), die Auslieferung
funktioniert also — die beiden Clips werden nur nicht so lange gecacht wie
Bilder. Wer das ändern will, ergänzt `--include "*.mp4"` in der ersten
`cp`-Zeile (der mit `max-age=604800`).

**Achtung bei Favicons:** Die Dateinamen bleiben über Änderungen hinweg gleich.
Nach einem neuen Favicon kann bis zu eine Woche lang das alte ausgeliefert
werden. Wer das nicht abwarten will, benennt die Datei um und passt die
`<link>`-Tags an.

---

## Rechte

Der IAM-Benutzer `manuel-beck-deploy` (Account `625738166923`) hat S3 und
CloudFront, aber **kein Route 53 und kein IAM**. Für `lenziloeffler.de` ist
das ausreichend, weil die Domain nicht in Route 53 liegt — die DNS-Einträge
werden ohnehin bei Squarespace gesetzt.

---

## Fehlersuche

| Symptom | Ursache | Abhilfe |
|---|---|---|
| Alte Fassung im Browser | CloudFront-Cache | `create-invalidation --paths "/*"` |
| `/impressum/` gibt 403 | CloudFront Function fehlt oder nicht veröffentlicht | `./infra.sh` erneut ausführen |
| Zertifikat bleibt `PENDING_VALIDATION` | CNAME bei Squarespace fehlt | Einträge prüfen, `dig +short <name> CNAME` |
| Bild lädt, wird aber nicht gezeichnet | AVIF mit ungerader Kantenlänge | Ausschnitt mit geraden Kanten neu erzeugen (siehe README) |
| Deployment bricht mit „temporäre Vorschaudateien" ab | `site/__*.html` aus lokalen Tests | löschen |

---

## Lokal testen

```bash
cd site && python3 -m http.server 8000
```

`http://localhost:8000` — die absoluten Pfade brauchen einen Server, ein
Doppelklick auf `index.html` genügt nicht.
