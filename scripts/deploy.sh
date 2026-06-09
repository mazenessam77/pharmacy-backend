#!/usr/bin/env bash
#
# Production deploy steps, executed ON the EC2 box (as root, via SSM Run Command).
# The code checkout (git fetch/reset to origin/main) is done by the SSM bootstrap
# in .github/workflows/cd.yml BEFORE this script runs — so this only rebuilds and
# restarts the Docker Compose stack and waits for health.
#
# Run manually (e.g. via Session Manager) with:  sudo bash /opt/pharma-app/scripts/deploy.sh
set -euo pipefail

cd /opt/pharma-app
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
export DEBIAN_FRONTEND=noninteractive

# ── SSL: install certbot if missing ─────────────────────────────────────
if ! command -v certbot >/dev/null 2>&1; then
  apt-get update -qq && apt-get install -y certbot
fi

mkdir -p nginx/certbot/www

# ── SSL: issue cert on first run ─────────────────────────────────────────
if [ ! -f /etc/letsencrypt/live/pharmcy.site/fullchain.pem ]; then
  echo "No cert found — obtaining Let's Encrypt cert..."
  docker stop pharma-nginx 2>/dev/null || true
  certbot certonly --standalone -d pharmcy.site --agree-tos --non-interactive -m shananmazen99@gmail.com
fi

# ── SSL: renew if within 30 days of expiry ───────────────────────────────
# NOTE: standalone renewal needs port 80 reachable. Once the Security Group is
# locked to Cloudflare, migrate this to DNS-01 (certbot-dns-cloudflare) or a
# Cloudflare Origin CA cert — see the Cloudflare hardening notes.
certbot renew --quiet \
  --pre-hook "docker stop pharma-nginx 2>/dev/null || true" \
  --post-hook "docker start pharma-nginx 2>/dev/null || true" 2>/dev/null || true

# ── Rebuild + restart app containers (mongodb/redis/nginx unchanged) ─────
# --no-cache picks up new dependencies; --renew-anon-volumes avoids stale node_modules.
$COMPOSE build --no-cache backend frontend
$COMPOSE up -d --renew-anon-volumes backend frontend

# ── Wait for backend health BEFORE touching nginx (prevents a 502 window) ─
echo "Waiting for backend to be ready..."
for i in $(seq 1 24); do
  if docker exec pharma-backend wget -qO- http://localhost:5000/health >/dev/null 2>&1; then
    echo "Backend healthy after $((i * 5))s"
    break
  fi
  if [ "$i" -eq 24 ]; then
    echo "--- backend logs (last 60 lines) ---"
    docker logs pharma-backend --tail=60 || true
    echo "Backend did not become healthy within 120s"
    exit 1
  fi
  sleep 5
done

# ── Wait for frontend (Next.js can take a little longer to listen) ───────
echo "Waiting for frontend to be ready..."
for i in $(seq 1 24); do
  if docker exec pharma-frontend wget -qO- http://localhost:3000 >/dev/null 2>&1; then
    echo "Frontend healthy after $((i * 5))s"
    break
  fi
  sleep 5
done

# ── Reload nginx (both upstreams alive) + clean up dangling images ───────
$COMPOSE up -d nginx
docker image prune -f
echo "Deploy complete."
