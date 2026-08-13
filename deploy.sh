#!/usr/bin/env bash
#
# Deployment von manuel-beck.com
#
#   ./deploy.sh
#
# Kopiert den Inhalt von site/ in den S3-Bucket und leert den CloudFront-Cache.
# Zeigt vorher, was sich ändern würde, und fragt nach. Details in DEPLOY.md.

set -euo pipefail

BUCKET="manuel-beck.com"
DISTRIBUTION="E3PTUBGVEU4KYY"
SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/site"

echo "Deployment nach https://$BUCKET"
echo

# --- Vorbedingungen -------------------------------------------------------

if ! command -v aws >/dev/null 2>&1; then
  echo "FEHLER: Die AWS CLI ist nicht installiert."
  exit 1
fi

if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo "FEHLER: Keine AWS-Zugangsdaten. Bitte 'aws configure' ausführen."
  exit 1
fi

if [ ! -f "$SITE_DIR/index.html" ]; then
  echo "FEHLER: $SITE_DIR/index.html nicht gefunden."
  exit 1
fi

# Vorschaudateien aus lokalen Tests sollen nie live gehen.
STRAY=$(find "$SITE_DIR" -maxdepth 1 -name "__*.html" | wc -l | tr -d ' ')
if [ "$STRAY" != "0" ]; then
  echo "FEHLER: In site/ liegen $STRAY temporäre Vorschaudateien (__*.html)."
  echo "        Bitte löschen, sonst landen sie im Netz."
  exit 1
fi

# --- Vorschau -------------------------------------------------------------

echo "Diese Änderungen würden übertragen:"
echo
aws s3 sync "$SITE_DIR/" "s3://$BUCKET" --delete --exclude "*.md" --dryrun \
  | sed 's/^(dryrun) upload:/  NEU     /; s/^(dryrun) delete:/  LÖSCHEN /'
echo

read -r -p "Fortfahren? [j/N] " ANSWER
case "$ANSWER" in
  [jJyY]) ;;
  *) echo "Abgebrochen. Es wurde nichts verändert."; exit 0 ;;
esac

# --- Upload ---------------------------------------------------------------

echo
echo "Lade hoch …"
aws s3 sync "$SITE_DIR/" "s3://$BUCKET" --delete --exclude "*.md"

# --- Cache leeren ---------------------------------------------------------

echo
echo "Leere den CloudFront-Cache …"
INVALIDATION=$(aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION" --paths "/*" \
  --query 'Invalidation.Id' --output text)

printf "Warte auf Abschluss (%s) " "$INVALIDATION"
aws cloudfront wait invalidation-completed \
  --distribution-id "$DISTRIBUTION" --id "$INVALIDATION"
echo "— fertig."

# --- Kontrolle ------------------------------------------------------------

echo
echo "Prüfe die Live-Seite:"
for PATH_ in "/" "/impressum/" "/datenschutz/"; do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' "https://$BUCKET$PATH_")
  if [ "$CODE" = "200" ]; then STATUS="ok"; else STATUS="FEHLER"; fi
  printf "  %-16s %s  %s\n" "$PATH_" "$CODE" "$STATUS"
done

echo
echo "Fertig. https://$BUCKET"
