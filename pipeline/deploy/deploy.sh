#!/usr/bin/env bash
# GitTiger — build + deploy the Next.js app on the VPS.
# Run as the gittiger user, from /opt/gittiger, after bootstrap.sh.
#   cd /opt/gittiger && bash pipeline/deploy/deploy.sh
#
# It builds the site with pnpm and installs a systemd service so the app
# survives reboots. Caddy in front handles TLS and the public port.
set -euo pipefail

APP=/opt/gittiger/web
PORT=3000
SERVICE=/etc/systemd/system/gittiger-app.service

echo "=== GitTiger deploy ==="

cd "$APP"

echo "--- installing dependencies ---"
pnpm install --frozen-lockfile --silent

echo "--- building ---"
# Standalone output: smaller image, no dev deps needed at runtime.
pnpm exec next build

echo "--- installing systemd service ---"
cat > "$SERVICE" <<UNIT
[Unit]
Description=GitTiger Next.js app (port ${PORT})
After=network.target postgresql.service
Wants=network.target

[Service]
Type=simple
User=gittiger
WorkingDirectory=${APP}
Environment=NODE_ENV=production
Environment=PORT=${PORT}
Environment=HOSTNAME=127.0.0.1
# Data dir the site reads rankings/metadata from.
Environment=PIPELINE_DATA=/opt/gittiger/pipeline/data
EnvironmentFile=/etc/gittiger/secrets.env
ExecStart=$(pnpm exec which node)/next start -p ${PORT}
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNIT

# Caddy reverse proxy — this domain block goes in /etc/caddy/Caddyfile.
cat > /opt/gittiger/pipeline/deploy/Caddyfile.example <<'CADDY'
# GitTiger. Cloudflare proxies traffic here; Caddy terminates TLS.
# With the orange cloud on, Caddy's own Let's Encrypt cert is still used
# for the Cloudflare -> origin hop.
gittiger.com, www.gittiger.com {
	encode zstd gzip
	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
		X-Content-Type-Options nosniff
		Referrer-Policy strict-origin-when-cross-origin
	}

	# The Next.js app.
	reverse_proxy 127.0.0.1:3000

	# Long-cache static assets.
	@static path /_next/static/* /favicon.ico /email.svg /robots.txt /llms.txt
	header @static Cache-Control "public, max-age=31536000, immutable"

	# The revalidate endpoint is internal only — callers use NEXT_REVALIDATE_TOKEN.
	@api path /api/*
	header @api Cache-Control "no-store"
}
CADDY

echo "--- enabling ---"
sudo systemctl daemon-reload
sudo systemctl enable --now gittiger-app

echo ""
echo "=== deployed on port ${PORT} ==="
echo "Now wire Caddy:"
echo "  sudo cp /opt/gittiger/pipeline/deploy/Caddyfile.example /etc/caddy/Caddyfile"
echo "  sudo systemctl reload caddy"
echo ""
echo "Health check: curl -sI http://127.0.0.1:${PORT}"
curl -sI "http://127.0.0.1:${PORT}" | head -3 || true
