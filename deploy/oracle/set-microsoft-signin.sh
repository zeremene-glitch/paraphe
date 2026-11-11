#!/usr/bin/env bash
# Scriptia: switch on "Sign in with Microsoft".
# Run it yourself so the client secret never leaves the server:
#
#   sudo bash /opt/paraphe/deploy/oracle/set-microsoft-signin.sh
#
# The Entra app registration needs: account types "any organizational directory and
# personal Microsoft accounts", Web redirect URI
# https://app.scriptia.eu/api/auth/callback/microsoft, and optional ID-token claims
# email + xms_edov (without xms_edov, work accounts are refused as unverified).

set -euo pipefail
cd "$(dirname "$0")"

GUID='^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'

echo
echo "Scriptia: ligar \"Entrar com Microsoft\""
echo
read -rp "1) Application (client) ID: " ID
read -rsp "2) Client secret - a coluna \"Value\" (não aparece enquanto colas): " SECRET
echo

ID="$(printf '%s' "$ID" | tr -d '[:space:]')"
SECRET="$(printf '%s' "$SECRET" | tr -d '[:space:]')"

if ! [[ "$ID" =~ $GUID ]]; then
  echo "O Client ID não parece certo (deve ser do tipo 1234abcd-....). Nada foi alterado."
  exit 1
fi
if [[ "$SECRET" =~ $GUID ]]; then
  echo "Isso é o \"Secret ID\". Copia antes a coluna \"Value\". Nada foi alterado."
  exit 1
fi
if [ "${#SECRET}" -lt 30 ] || [ "${#SECRET}" -gt 60 ]; then
  echo "A chave tem ${#SECRET} caracteres; esperava cerca de 40 (colaste duas vezes?). Nada foi alterado."
  exit 1
fi

tmp="$(mktemp)"
grep -v -E '^(NEXT_PRIVATE_MICROSOFT_CLIENT_ID|NEXT_PRIVATE_MICROSOFT_CLIENT_SECRET|NEXT_PUBLIC_MICROSOFT_SSO_ENABLED)=' .env > "$tmp"
cat >> "$tmp" <<EOF
NEXT_PRIVATE_MICROSOFT_CLIENT_ID=$ID
NEXT_PRIVATE_MICROSOFT_CLIENT_SECRET=$SECRET
NEXT_PUBLIC_MICROSOFT_SSO_ENABLED=true
EOF
install -m 600 "$tmp" .env
rm -f "$tmp"

echo
echo "A reiniciar o Scriptia..."
docker compose up -d --force-recreate app >/dev/null 2>&1
echo "Feito. O botão \"Microsoft\" aparece em https://app.scriptia.eu/signin dentro de 1 minuto."
echo
echo "Para desligar: sudo sed -i '/^NEXT_PRIVATE_MICROSOFT_CLIENT_SECRET=/d' .env && sudo docker compose up -d --force-recreate app"
echo
