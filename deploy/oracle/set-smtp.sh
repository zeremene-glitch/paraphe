#!/usr/bin/env bash
# Paraphe: switch outgoing email from the local catcher (Mailpit) to Brevo SMTP.
# Run it yourself so the key never leaves the server:
#
#   sudo bash /opt/paraphe/deploy/oracle/set-smtp.sh

set -euo pipefail
cd "$(dirname "$0")"

echo
echo "Paraphe: ligar o envio de emails (Brevo)"
echo
read -rp "1) SMTP login do Brevo (ex.: 9a1b2c001@smtp-brevo.com): " LOGIN
read -rsp "2) SMTP key do Brevo (não aparece enquanto colas): " KEY
echo
read -rp "3) Email de remetente verificado no Brevo: " FROM

if [ -z "$LOGIN" ] || [ -z "$KEY" ] || [ -z "$FROM" ]; then
  echo "Falta um dos valores. Nada foi alterado."
  exit 1
fi

tmp="$(mktemp)"
grep -v -E '^NEXT_PRIVATE_SMTP_(HOST|PORT|USERNAME|PASSWORD|UNSAFE_IGNORE_TLS|SECURE|FROM_ADDRESS)=' .env > "$tmp"
cat >> "$tmp" <<EOF
NEXT_PRIVATE_SMTP_HOST=smtp-relay.brevo.com
NEXT_PRIVATE_SMTP_PORT=587
NEXT_PRIVATE_SMTP_USERNAME=$LOGIN
NEXT_PRIVATE_SMTP_PASSWORD=$KEY
NEXT_PRIVATE_SMTP_FROM_ADDRESS=$FROM
EOF
install -m 600 "$tmp" .env
rm -f "$tmp"

echo
echo "A reiniciar o Paraphe com o novo email..."
docker compose up -d --force-recreate app >/dev/null 2>&1
echo "Feito. Os emails passam a sair pelo Brevo, com o remetente $FROM."
echo
