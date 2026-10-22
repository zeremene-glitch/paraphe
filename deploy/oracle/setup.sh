#!/usr/bin/env bash
# Scriptia server setup for Oracle Cloud (Ubuntu 24.04, arm64).
# Safe to run again: it only creates secrets that are missing, then rebuilds and restarts.
#
#   sudo bash deploy/oracle/setup.sh [domain]
#
# Without a domain it uses a free one based on the server's public IP:
# scriptia-1-2-3-4.sslip.io

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

say() { printf '\n==> %s\n' "$*"; }

# 1. Docker
if ! command -v docker >/dev/null 2>&1; then
  say 'Installing Docker'
  apt-get update -y
  apt-get install -y docker.io docker-compose-v2 openssl
  systemctl enable --now docker
  usermod -aG docker "${SUDO_USER:-ubuntu}" || true
fi

# 2. Firewall: Oracle's Ubuntu images reject everything except SSH by default.
for port in 80 443; do
  if ! iptables -C INPUT -m state --state NEW -p tcp --dport "$port" -j ACCEPT 2>/dev/null; then
    say "Opening port $port"
    iptables -I INPUT -m state --state NEW -p tcp --dport "$port" -j ACCEPT
  fi
done
if command -v netfilter-persistent >/dev/null 2>&1; then netfilter-persistent save; fi

# 3. Swap, so the build does not run out of memory.
if ! swapon --show | grep -q /swapfile; then
  say 'Adding 4 GB swap'
  fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# 4. Domain
DOMAIN="${1:-}"
if [ -z "$DOMAIN" ] && [ -f .env ]; then
  DOMAIN="$(grep -E '^PARAPHE_DOMAIN=' .env | cut -d= -f2- || true)"
fi
if [ -z "$DOMAIN" ]; then
  IP="$(curl -fsS https://ifconfig.me || curl -fsS https://api.ipify.org)"
  DOMAIN="scriptia-${IP//./-}.sslip.io"
fi
say "Domain: https://$DOMAIN"

# 5. Secrets (created once, kept on later runs)
mkdir -p secrets caddy.d
chmod 700 secrets
if [ ! -f .env ]; then
  say 'Creating .env with new secrets'
  PASS="$(openssl rand -hex 16)"
  cat > .env <<EOF
PARAPHE_DOMAIN=$DOMAIN
POSTGRES_PASSWORD=$(openssl rand -hex 24)
NEXTAUTH_SECRET=$(openssl rand -hex 32)
NEXT_PRIVATE_ENCRYPTION_KEY=$(openssl rand -hex 32)
NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY=$(openssl rand -hex 32)
NEXT_PUBLIC_WEBAPP_URL=https://$DOMAIN
NEXT_PRIVATE_SIGNING_PASSPHRASE=$PASS
NEXT_PRIVATE_SIGNING_TIMESTAMP_AUTHORITY=http://timestamp.digicert.com,http://timestamp.sectigo.com
NEXT_PRIVATE_SMTP_TRANSPORT=smtp-auth
NEXT_PRIVATE_SMTP_HOST=mail
NEXT_PRIVATE_SMTP_PORT=1025
NEXT_PRIVATE_SMTP_UNSAFE_IGNORE_TLS=true
NEXT_PRIVATE_SMTP_FROM_NAME=Scriptia
NEXT_PRIVATE_SMTP_FROM_ADDRESS=noreply@$DOMAIN
EOF
  chmod 600 .env
fi

# Settings added after the first install (kept if already present)
grep -q '^CONVERTER_PASSWORD=' .env || echo "CONVERTER_PASSWORD=$(openssl rand -hex 24)" >> .env

if [ ! -f secrets/cert.p12 ]; then
  say 'Creating the document signing certificate'
  PASS="$(grep -E '^NEXT_PRIVATE_SIGNING_PASSPHRASE=' .env | cut -d= -f2-)"
  openssl req -x509 -newkey rsa:2048 -nodes -days 1095 \
    -keyout secrets/key.pem -out secrets/cert.pem \
    -subj "/CN=Scriptia Signing/O=Scriptia/C=PT" 2>/dev/null
  openssl pkcs12 -export -out secrets/cert.p12 -inkey secrets/key.pem -in secrets/cert.pem \
    -passout "pass:$PASS" -keypbe PBE-SHA1-3DES -certpbe PBE-SHA1-3DES -macalg sha1
  rm -f secrets/key.pem
  # The app container runs as uid 1001.
  chown 1001:1001 secrets/cert.p12
  chmod 400 secrets/cert.p12
fi

# 6. Daily database backup at 03:15 UTC (see backup.sh)
mkdir -p backups
chmod 700 backups
if [ ! -f /etc/systemd/system/scriptia-backup.timer ]; then
  say 'Installing the daily backup timer'
  cat > /etc/systemd/system/scriptia-backup.service <<UNIT
[Unit]
Description=Scriptia database backup

[Service]
Type=oneshot
WorkingDirectory=$HERE
ExecStart=/bin/bash $HERE/backup.sh
StandardOutput=append:$HERE/backups/backup.log
StandardError=append:$HERE/backups/backup.log
UNIT
  cat > /etc/systemd/system/scriptia-backup.timer <<UNIT
[Unit]
Description=Daily Scriptia database backup

[Timer]
OnCalendar=*-*-* 03:15:00 UTC
Persistent=true

[Install]
WantedBy=timers.target
UNIT
  systemctl daemon-reload
  systemctl enable --now scriptia-backup.timer
fi

# 7. Build and start
say 'Building and starting Scriptia (the first build takes 10-20 minutes)'
docker compose up -d --build

say "Done. Scriptia will answer at https://$DOMAIN in about a minute."
