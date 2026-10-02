#!/usr/bin/env bash
# GitTiger — fresh Ubuntu 24.04 VPS bootstrap.
# Run as root on a CLEAN server only. It installs the stack and pulls the site.
#
# Usage (from your Mac, once the VPS IP is known):
#   ssh root@<IP> 'bash -s' < pipeline/deploy/bootstrap.sh
#
# After it finishes:
#   1. Point Cloudflare DNS A records (gittiger.com + www) at this IP, proxied.
#   2. Edit /etc/gittiger/secrets.env — add GITHUB_TOKEN and the LLM key.
#   3. systemctl enable --now gittiger-app gittiger-ingest.timer gittiger-daily.timer
#
# What this installs: Node 24 + pnpm + bun, Caddy (reverse proxy + auto TLS),
# Postgres 16, Python 3.12, and a non-root `gittiger` user that owns everything.
# No Docker — five apps fit comfortably on one VPS this way, which is the point.
set -euo pipefail

echo "=== GitTiger bootstrap — Ubuntu 24.04 ==="

if [[ "$(whoami)" != "root" ]]; then
  echo "Run as root."; exit 1
fi

export DEBIAN_FRONTEND=noninteractive

# --- base packages ----------------------------------------------------------
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git build-essential python3 python3-pip python3-venv \
  ufw fail2ban ca-certificates gnupg postgresql postgresql-contrib

# --- user -------------------------------------------------------------------
if ! id gittiger &>/dev/null; then
  useradd -m -s /bin/bash gittiger
  echo "gittiger ALL=(ALL) NOPASSWD:/usr/bin/systemctl" >> /etc/sudoers.d/gittiger
fi

# --- Node 24 (via fnm — no apt node, which lags) ----------------------------
if ! command -v node &>/dev/null; then
  curl -fsSL https://fnm.vercel.app/install | bash -s -- --install-dir /usr/local/bin
  export PATH="/usr/local/bin:$PATH"
  fnm install 24 && fnm use 24 && fnm default 24
  ln -sf "$(command -v node)" /usr/local/bin/node || true
fi
corepack enable
corepack prepare [email protected] --activate

# --- bun --------------------------------------------------------------------
if ! command -v bun &>/dev/null; then
  curl -fsSL https://bun.sh/install | bash -s
  ln -sf /root/.bun/bin/bun /usr/local/bin/bun
fi

# --- Caddy (reverse proxy, automatic TLS via Let's Encrypt) -----------------
if ! command -v caddy &>/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  apt-get install -y -qq caddy
fi

# --- firewall ---------------------------------------------------------------
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# --- app + secrets ----------------------------------------------------------
mkdir -p /opt/gittiger /etc/gittiger
cp -r /tmp/gittiger/. /opt/gittiger/ 2>/dev/null || true
chown -R gittiger:gittiger /opt/gittiger /etc/gittiger

if [[ ! -f /etc/gittiger/secrets.env ]]; then
  cat > /etc/gittiger/secrets.env <<'SECRETS'
# GitTiger secrets — chmod 600, never commit. Fill these in.
GITHUB_TOKEN=
LOGIC_MOSAIC_LLM_API_KEY=
NEXT_REVALIDATE_TOKEN=
SECRETS
  chmod 600 /etc/gittiger/secrets.env
  chown gittiger:gittiger /etc/gittiger/secrets.env
fi

# --- Postgres ---------------------------------------------------------------
systemctl enable --now postgresql
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='gittiger'" | grep -q 1; then
  sudo -u postgres psql -q <<'SQL'
CREATE ROLE gittiger WITH LOGIN PASSWORD 'changeme-git-tiger-2026';
CREATE DATABASE gittiger OWNER gittiger;
SQL
fi
# Local only for now — Caddy is the only public surface.
sudo -u postgres psql -q -d gittiger -f /opt/gittiger/pipeline/schema.sql 2>/dev/null || true

echo ""
echo "=== bootstrap done ==="
echo "Next:"
echo "  1. Cloudflare DNS: A record gittiger.com + www -> $(curl -s ifconfig.me), proxied (orange cloud)."
echo "  2. sudo -u gittiger psql -d gittiger -c 'ALTER ROLE gittiger PASSWORD ...' — change the DB password."
echo "  3. Fill /etc/gittiger/secrets.env (GITHUB_TOKEN, LLM key, revalidate token)."
echo "  4. sudo systemctl enable --now gittiger-ingest.timer gittiger-daily.timer"
echo "  5. Deploy the app: see pipeline/deploy/deploy.sh"
