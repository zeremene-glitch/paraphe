#!/usr/bin/env bash
# Scriptia: set where backups are copied off the server (Oracle Object Storage).
# Run it yourself so the upload link never leaves the server:
#
#   sudo bash /opt/paraphe/deploy/oracle/set-backup-target.sh

set -euo pipefail
cd "$(dirname "$0")"

echo
echo "Scriptia: destino das cópias de segurança (Oracle Object Storage)"
echo
read -rsp "Cola o link do Pre-Authenticated Request (não aparece enquanto colas): " URL
echo

case "$URL" in
  https://*objectstorage*/p/*/b/*/o/*) ;;
  *)
    echo "Esse link não parece um Pre-Authenticated Request de bucket do Oracle. Nada foi alterado."
    exit 1
    ;;
esac

mkdir -p secrets
umask 077
printf '%s\n' "$URL" > secrets/backup-upload-url
chmod 600 secrets/backup-upload-url

echo
echo "Link guardado. A fazer já uma cópia de teste..."
bash ./backup.sh
echo
echo "Feito. A partir de agora, a cópia diária também vai para o Oracle Object Storage."
echo
