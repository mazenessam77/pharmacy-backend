#!/bin/bash
# ============================================================
# user_data.sh — EC2 bootstrap script
# Runs once as root on first boot via cloud-init.
# Installs: Docker, Docker Compose v2, Nginx, Git
# Clones the app repo and prepares the directory structure.
# ============================================================
set -euo pipefail
exec > /var/log/user-data.log 2>&1

echo "==> [1/6] Updating system packages..."
apt-get update -y
apt-get upgrade -y
apt-get install -y \
  ca-certificates \
  curl \
  gnupg \
  lsb-release \
  git \
  unzip \
  nginx \
  certbot \
  python3-certbot-nginx

echo "==> [2/6] Installing Docker Engine..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin

echo "==> [3/6] Enabling Docker service..."
systemctl enable docker
systemctl start docker
# Allow the 'ubuntu' user to run docker without sudo
usermod -aG docker ubuntu

echo "==> [4/6] Setting up Nginx..."
# Nginx is installed as a system package but we stop it so the
# Docker Compose Nginx container can bind to ports 80 & 443.
# To use SYSTEM Nginx instead (e.g. for Certbot SSL), re-enable it:
#   sudo systemctl enable --now nginx
systemctl stop nginx
systemctl disable nginx

echo "==> [5/6] Cloning application repository..."
APP_DIR="${app_dir}"
mkdir -p "$APP_DIR"
chown ubuntu:ubuntu "$APP_DIR"

# Clone as the ubuntu user so file permissions are correct
sudo -u ubuntu git clone "${github_repo_url}" "$APP_DIR" || {
  echo "Repo clone failed — check that the repo is public or the deploy key is set up."
  echo "You can clone manually: git clone <repo-url> $APP_DIR"
}

echo "==> [6/6] Creating placeholder .env file..."
# The real .env is injected by the CI/CD pipeline (GitHub Actions).
# This placeholder prevents docker compose from failing on first boot.
if [ ! -f "$APP_DIR/.env" ]; then
  cat > "$APP_DIR/.env" <<'ENVEOF'
# This file is overwritten by the CI/CD pipeline on every deploy.
# Do NOT commit real secrets to git — set them as GitHub Actions Secrets.
NODE_ENV=production
PORT=5000
MONGO_USER=admin
MONGO_PASSWORD=CHANGEME
REDIS_PASSWORD=CHANGEME
JWT_ACCESS_SECRET=CHANGEME_MIN_32_CHARS
JWT_REFRESH_SECRET=CHANGEME_MIN_32_CHARS
FRONTEND_URL=http://localhost
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ENVEOF
  chown ubuntu:ubuntu "$APP_DIR/.env"
fi

echo "==> Bootstrap complete!"
echo "    App directory : $APP_DIR"
echo "    Docker        : $(docker --version)"
echo "    Compose       : $(docker compose version)"
echo ""
echo "    Next steps:"
echo "    1. SSH in: ssh ubuntu@<ELASTIC_IP>"
echo "    2. Edit .env: nano $APP_DIR/.env"
echo "    3. Deploy: cd $APP_DIR && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build"
