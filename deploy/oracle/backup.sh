#!/usr/bin/env bash
# Scriptia: back up the database (which also holds every uploaded and signed document).
#
#   sudo bash /opt/paraphe/deploy/oracle/backup.sh
#
# - Writes a compressed dump to ./backups/ and keeps the last 14 there.
# - If ./secrets/backup-upload-url exists (an Oracle Object Storage pre-authenticated
#   request URL, set with set-backup-target.sh), also uploads the dump off the server.
#
# Restore (on a fresh install, after setup.sh):
#   cat backups/<file>.dump | sudo docker compose exec -T database \
#     pg_restore -U paraphe -d paraphe --clean --if-exists --no-owner

set -euo pipefail
cd "$(dirname "$0")"

KEEP=14
STAMP="$(date -u +%Y%m%d-%H%M%S)"
FILE="backups/scriptia-$STAMP.dump"

mkdir -p backups
chmod 700 backups

docker compose exec -T database pg_dump -U paraphe -d paraphe --format=custom --compress=9 > "$FILE.part"
mv "$FILE.part" "$FILE"
chmod 600 "$FILE"
SIZE="$(du -h "$FILE" | cut -f1)"
echo "$(date -u +%FT%TZ) local backup ok: $FILE ($SIZE)"

# Keep only the newest $KEEP local dumps.
ls -1t backups/scriptia-*.dump 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f

if [ -f secrets/backup-upload-url ]; then
  URL="$(cat secrets/backup-upload-url)"
  NAME="$(basename "$FILE")"
  CODE="$(curl -sS -o /dev/null -w '%{http_code}' -X PUT --data-binary @"$FILE" "${URL%/}/$NAME")"
  if [ "$CODE" = "200" ]; then
    echo "$(date -u +%FT%TZ) off-site upload ok: $NAME"
  else
    echo "$(date -u +%FT%TZ) OFF-SITE UPLOAD FAILED (HTTP $CODE): $NAME" >&2
    exit 1
  fi
else
  echo "$(date -u +%FT%TZ) no off-site target set (run set-backup-target.sh)"
fi
