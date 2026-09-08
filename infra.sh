#!/usr/bin/env bash
#
# AWS-Infrastruktur für lenziloeffler.de anlegen
#
#   ./infra.sh
#
# Legt an: S3-Bucket (privat), TLS-Zertifikat, CloudFront-Verteilung mit
# Origin Access Control und die passende Bucket-Policy. Schreibt am Ende
# deploy.conf, aus der deploy.sh die Verteilungs-ID liest.
#
# Das Skript ist mehrfach ausführbar: was schon existiert, wird erkannt und
# übersprungen. Es fasst DNS nicht an — die drei DNS-Einträge müssen von Hand
# bei Squarespace gesetzt werden, das Skript sagt genau welche.

set -euo pipefail

DOMAIN="lenziloeffler.de"
BUCKET="$DOMAIN"
REGION="eu-central-1"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Infrastruktur für https://$DOMAIN"
echo

command -v aws >/dev/null || { echo "FEHLER: AWS CLI fehlt."; exit 1; }
aws sts get-caller-identity >/dev/null || { echo "FEHLER: Keine AWS-Zugangsdaten."; exit 1; }
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

# --- 1. S3-Bucket ---------------------------------------------------------

if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "1/4  Bucket $BUCKET existiert bereits."
else
  echo "1/4  Lege Bucket $BUCKET an ($REGION) …"
  aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" \
    --create-bucket-configuration "LocationConstraint=$REGION" >/dev/null
fi

# Der Bucket bleibt privat. Ausgeliefert wird ausschließlich über CloudFront,
# Zugriff bekommt allein die Verteilung über Origin Access Control.
aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# --- 2. Zertifikat --------------------------------------------------------
# CloudFront akzeptiert nur Zertifikate aus us-east-1, unabhängig von der
# Region des Buckets.

CERT_ARN=$(aws acm list-certificates --region us-east-1 \
  --query "CertificateSummaryList[?DomainName=='$DOMAIN'].CertificateArn | [0]" \
  --output text)

if [ "$CERT_ARN" = "None" ] || [ -z "$CERT_ARN" ]; then
  echo "2/4  Fordere Zertifikat für $DOMAIN und www.$DOMAIN an …"
  CERT_ARN=$(aws acm request-certificate --region us-east-1 \
    --domain-name "$DOMAIN" --subject-alternative-names "www.$DOMAIN" \
    --validation-method DNS --query CertificateArn --output text)
  sleep 5
else
  echo "2/4  Zertifikat vorhanden."
fi

CERT_STATUS=$(aws acm describe-certificate --region us-east-1 \
  --certificate-arn "$CERT_ARN" --query Certificate.Status --output text)

if [ "$CERT_STATUS" != "ISSUED" ]; then
  echo
  echo "     Das Zertifikat wartet auf die DNS-Freigabe. Diese CNAME-Einträge"
  echo "     bei Squarespace anlegen (DNS-Einstellungen der Domain):"
  echo
  aws acm describe-certificate --region us-east-1 --certificate-arn "$CERT_ARN" \
    --query 'Certificate.DomainValidationOptions[].ResourceRecord.[Name,Value]' \
    --output text | sed 's/^/       /'
  echo
  echo "     Danach dieses Skript erneut ausführen. Die Freigabe dauert nach"
  echo "     dem Setzen der Einträge meist 5–30 Minuten."
  exit 0
fi

# --- 3. CloudFront --------------------------------------------------------

ORIGIN="$BUCKET.s3.$REGION.amazonaws.com"

# Erst über den Alias suchen, dann über den Kommentar. Der zweite Weg findet
# auch eine Verteilung, die noch OHNE eigene Domain läuft — solange kein
# Zertifikat vorliegt, trägt sie nur das CloudFront-Standardzertifikat und
# hat deshalb keinen Alias. Ohne diesen Rückfall entstünde beim nächsten Lauf
# eine zweite Verteilung auf denselben Bucket.
DIST_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Aliases.Items && contains(Aliases.Items, '$DOMAIN')].Id | [0]" \
  --output text 2>/dev/null || echo "None")

if [ "$DIST_ID" = "None" ] || [ -z "$DIST_ID" ]; then
  DIST_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Comment=='$DOMAIN'].Id | [0]" \
    --output text 2>/dev/null || echo "None")
fi

if [ "$DIST_ID" != "None" ] && [ -n "$DIST_ID" ]; then
  echo "3/4  Verteilung $DIST_ID existiert bereits."
else
  echo "3/4  Lege Origin Access Control und Verteilung an …"

  OAC_ID=$(aws cloudfront list-origin-access-controls \
    --query "OriginAccessControlList.Items[?Name=='oac-$BUCKET'].Id | [0]" --output text)
  if [ "$OAC_ID" = "None" ] || [ -z "$OAC_ID" ]; then
    OAC_ID=$(aws cloudfront create-origin-access-control \
      --origin-access-control-config \
      "Name=oac-$BUCKET,Description=OAC $DOMAIN,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3" \
      --query OriginAccessControl.Id --output text)
  fi

  # Ordner-URLs (/impressum/) brauchen eine Function, die /index.html
  # anhängt — S3 als REST-Origin kann das im Gegensatz zum Website-Endpunkt
  # nicht selbst, und der Website-Endpunkt kann kein OAC.
  # CloudFront-Function-Namen erlauben nur [a-zA-Z0-9-_] — der Punkt in der
  # Domain ist nicht zulaessig, deshalb die Domain mit Bindestrichen.
  FN_NAME="rewrite-index-${DOMAIN//./-}"
  FN_ARN=$(aws cloudfront list-functions \
    --query "FunctionList.Items[?Name=='$FN_NAME'].FunctionMetadata.FunctionARN | [0]" \
    --output text 2>/dev/null || echo "None")
  if [ "$FN_ARN" = "None" ] || [ -z "$FN_ARN" ]; then
    cat > /tmp/rewrite-index.js <<'JS'
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (!uri.includes('.')) {
    request.uri = uri + '/index.html';
  }
  return request;
}
JS
    FN_ETAG=$(aws cloudfront create-function \
      --name "$FN_NAME" \
      --function-config "Comment=Ordner-URLs auf index.html,Runtime=cloudfront-js-2.0" \
      --function-code fileb:///tmp/rewrite-index.js \
      --query ETag --output text)
    aws cloudfront publish-function --name "$FN_NAME" --if-match "$FN_ETAG" >/dev/null
    FN_ARN=$(aws cloudfront describe-function --name "$FN_NAME" \
      --query FunctionSummary.FunctionMetadata.FunctionARN --output text)
  fi

  cat > /tmp/dist-config.json <<JSON
{
  "CallerReference": "$DOMAIN-$(date +%s)",
  "Aliases": { "Quantity": 2, "Items": ["$DOMAIN", "www.$DOMAIN"] },
  "DefaultRootObject": "index.html",
  "Origins": { "Quantity": 1, "Items": [{
    "Id": "s3-$BUCKET",
    "DomainName": "$ORIGIN",
    "OriginAccessControlId": "$OAC_ID",
    "S3OriginConfig": { "OriginAccessIdentity": "" }
  }]},
  "DefaultCacheBehavior": {
    "TargetOriginId": "s3-$BUCKET",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"],
      "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] } },
    "Compress": true,
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "FunctionAssociations": { "Quantity": 1, "Items": [
      { "EventType": "viewer-request", "FunctionARN": "$FN_ARN" } ] }
  },
  "CustomErrorResponses": { "Quantity": 1, "Items": [
    { "ErrorCode": 403, "ResponseCode": "404", "ResponsePagePath": "/index.html",
      "ErrorCachingMinTTL": 10 } ] },
  "Comment": "$DOMAIN",
  "Enabled": true,
  "ViewerCertificate": {
    "ACMCertificateArn": "$CERT_ARN",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "HttpVersion": "http2and3",
  "PriceClass": "PriceClass_100"
}
JSON

  DIST_ID=$(aws cloudfront create-distribution --distribution-config file:///tmp/dist-config.json \
    --query Distribution.Id --output text)
fi

DIST_DOMAIN=$(aws cloudfront get-distribution --id "$DIST_ID" \
  --query Distribution.DomainName --output text)

# --- 4. Bucket-Policy -----------------------------------------------------
# Lesezugriff ausschließlich für genau diese Verteilung.

echo "4/4  Setze Bucket-Policy …"
cat > /tmp/bucket-policy.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontServicePrincipal",
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::$BUCKET/*",
    "Condition": { "StringEquals": {
      "AWS:SourceArn": "arn:aws:cloudfront::$ACCOUNT:distribution/$DIST_ID" } }
  }]
}
JSON
aws s3api put-bucket-policy --bucket "$BUCKET" --policy file:///tmp/bucket-policy.json

# --- Ergebnis -------------------------------------------------------------

cat > "$DIR/deploy.conf" <<CONF
# Von infra.sh geschrieben. deploy.sh liest diese Werte.
BUCKET="$BUCKET"
DISTRIBUTION="$DIST_ID"
CONF

echo
echo "Fertig. Verteilung $DIST_ID → $DIST_DOMAIN"
echo
echo "Letzter Schritt, von Hand bei Squarespace:"
echo "  lenziloeffler.de       ALIAS/ANAME →  $DIST_DOMAIN"
echo "  www.lenziloeffler.de   CNAME       →  $DIST_DOMAIN"
echo
echo "Achtung: damit geht die bestehende Squarespace-Seite offline."
echo "Vorher testen über https://$DIST_DOMAIN"
