#!/usr/bin/env bash
# Scriptia: open public sign-up, protected by Cloudflare Turnstile.
# Run it yourself so the secret key never leaves the server:
#
#   sudo bash /opt/paraphe/deploy/oracle/open-signup.sh

set -euo pipefail
cd "$(dirname "$0")"

echo
echo "Scriptia: abrir o registo público (com verificação Turnstile)"
echo
read -rp "1) Turnstile Site Key (começa por 0x...): " SITE
read -rsp "2) Turnstile Secret Key (não aparece enquanto colas): " SECRET
echo

if [ -z "$SITE" ] || [ -z "$SECRET" ]; then
  echo "Falta uma das chaves. Nada foi alterado."
  exit 1
fi

tmp="$(mktemp)"
grep -v -E '^(NEXT_PUBLIC_TURNSTILE_SITE_KEY|NEXT_PRIVATE_TURNSTILE_SECRET_KEY|NEXT_PUBLIC_DISABLE_SIGNUP|NEXT_PUBLIC_TERMS_OF_SERVICE_URL|NEXT_PUBLIC_PRIVACY_POLICY_URL|NEXT_PRIVATE_SIGNUP_NOTIFY_EMAIL)=' .env > "$tmp"
cat >> "$tmp" <<EOF
NEXT_PUBLIC_TURNSTILE_SITE_KEY=$SITE
NEXT_PRIVATE_TURNSTILE_SECRET_KEY=$SECRET
NEXT_PUBLIC_DISABLE_SIGNUP=false
NEXT_PUBLIC_TERMS_OF_SERVICE_URL=https://scriptia.eu/terms
NEXT_PUBLIC_PRIVACY_POLICY_URL=https://scriptia.eu/privacy
NEXT_PRIVATE_SIGNUP_NOTIFY_EMAIL=hello@scriptia.eu
EOF
install -m 600 "$tmp" .env
rm -f "$tmp"

echo
echo "A reiniciar o Scriptia..."
docker compose up -d --force-recreate app >/dev/null 2>&1
echo "Feito. O registo está aberto em https://app.scriptia.eu/signup"
echo
echo "Para fechar outra vez: sudo sed -i 's/^NEXT_PUBLIC_DISABLE_SIGNUP=.*/NEXT_PUBLIC_DISABLE_SIGNUP=true/' .env && sudo docker compose up -d --force-recreate app"
echo
