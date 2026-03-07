# Phase 1 — AWS Infrastructure Setup Guide

This guide walks you through provisioning the EC2 server with Terraform
and wiring it into the existing GitHub Actions CI/CD pipeline.

---

## Architecture Overview

```
GitHub (push to main / tag v*)
        │
        ▼
┌───────────────────────────────────────┐
│  ci.yml  — Lint, Test, Docker build   │
└───────────────┬───────────────────────┘
                │ passes
                ▼
┌───────────────────────────────────────┐
│  cd.yml  — Build & push to GHCR       │
│           → SSH deploy to EC2         │
└───────────────────────────────────────┘
                │
                ▼
    ┌───────────────────────┐
    │   AWS EC2 t3.medium   │  ← Terraform provisions this
    │   pharma-app server   │
    │                       │
    │  Docker Compose:      │
    │  ├─ nginx  (:80/443)  │
    │  ├─ backend (:5000)   │
    │  ├─ frontend (:3000)  │
    │  ├─ mongodb (:27017)  │
    │  └─ redis   (:6379)   │
    └───────────────────────┘
```

---

## Step 1 — Prerequisites

- [ ] AWS account with IAM user that has EC2/VPC permissions
- [ ] AWS CLI configured (`aws configure`)
- [ ] Terraform >= 1.6 installed (`terraform -version`)
- [ ] An EC2 Key Pair created in AWS Console → EC2 → Key Pairs
- [ ] Your GitHub repo is public, or you have a deploy key set up

---

## Step 2 — Create Terraform variables file

```bash
cd terraform/
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
key_pair_name   = "your-keypair-name"       # name of your Key Pair in AWS
github_repo_url = "https://github.com/YOU/pharmacy-backend.git"
ssh_allowed_cidr = "YOUR.IP/32"             # your home IP for SSH
```

---

## Step 3 — Provision the infrastructure

```bash
cd terraform/

# Download providers
terraform init

# Preview what will be created
terraform plan

# Create the resources (~2 minutes)
terraform apply
```

After apply, copy the outputs:

```
elastic_ip  = "X.X.X.X"       ← copy this
ssh_command = "ssh -i ..."    ← use this to connect
```

---

## Step 4 — Wait for EC2 bootstrap (~3 minutes)

The `user_data.sh` script runs on first boot. Check its progress:

```bash
# From the terraform output ssh_command:
ssh -i ~/.ssh/your-key.pem ubuntu@X.X.X.X "sudo tail -f /var/log/user-data.log"
```

When you see `Bootstrap complete!` it's ready.

---

## Step 5 — Create the .env file on the server

SSH into the server and create the production `.env`:

```bash
ssh -i ~/.ssh/your-key.pem ubuntu@X.X.X.X
nano /opt/pharma-app/.env
```

Fill in all real values:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://admin:STRONG_PASS@mongodb:27017/pharma_db?authSource=admin
REDIS_URL=redis://:STRONG_PASS@redis:6379
MONGO_USER=admin
MONGO_PASSWORD=STRONG_PASS
REDIS_PASSWORD=STRONG_PASS
JWT_ACCESS_SECRET=at_least_32_random_chars_here
JWT_REFRESH_SECRET=different_32_random_chars_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
FRONTEND_URL=https://yourdomain.com
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

---

## Step 6 — First manual deploy

```bash
# On the server:
cd /opt/pharma-app
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

Test it:
```bash
curl http://localhost/health
# {"status":"ok","timestamp":"..."}
```

---

## Step 7 — Set GitHub Secrets for CI/CD

Go to: **GitHub repo → Settings → Secrets and variables → Actions**

Add these secrets:

| Secret Name          | Value                                          |
|----------------------|------------------------------------------------|
| `STAGING_HOST`       | Elastic IP from terraform output               |
| `STAGING_USER`       | `ubuntu`                                       |
| `STAGING_SSH_KEY`    | Contents of your `.pem` private key file       |
| `PRODUCTION_HOST`    | Elastic IP from terraform output (same for Phase 1) |
| `PRODUCTION_USER`    | `ubuntu`                                       |
| `PRODUCTION_SSH_KEY` | Contents of your `.pem` private key file       |

Add these variables:

| Variable Name      | Value                        |
|--------------------|------------------------------|
| `STAGING_URL`      | `http://X.X.X.X`            |
| `PRODUCTION_URL`   | `https://yourdomain.com`     |

---

## Step 8 — Point DNS to the server

In **Cloudflare**:
- Add an **A record**: `@` or `yourdomain.com` → Elastic IP
- Set proxy status to **DNS only** (grey cloud) initially
- Once working, enable **Proxied** (orange cloud) for DDoS protection

---

## Step 9 — Trigger CI/CD

The existing `.github/workflows/cd.yml` deploys automatically when:
- You push a git tag: `git tag v1.0.0 && git push --tags`
- Or manually: GitHub → Actions → CD → Run workflow

**What it does:**
1. `ci.yml` — runs lint, tests, security scan
2. `cd.yml` — builds Docker image, pushes to GHCR
3. SSH into EC2 → pulls new image → `docker compose up -d`
4. Health checks `/health` endpoint

---

## Terraform Commands Reference

```bash
# Preview changes without applying
terraform plan

# Apply changes
terraform apply

# Destroy all resources (CAREFUL — deletes the server!)
terraform destroy

# Show current state
terraform show

# See just the outputs
terraform output
```

---

## Cost Breakdown (Phase 1 — us-east-1)

| Resource        | Type        | Cost/month   |
|-----------------|-------------|--------------|
| EC2 t3.medium   | Compute     | ~$30.37      |
| EBS 30 GB gp3   | Storage     | ~$2.40       |
| Elastic IP      | Networking  | Free (while attached) |
| Data transfer   | Networking  | ~$1–5        |
| **Total**       |             | **~$34–38/month** |

**What we avoided:**
- NAT Gateway: $32/month + data processing fees → **$0**
- ALB (Load Balancer): $16/month minimum → **$0**
- DocumentDB: $57/month minimum → **$0** (using self-hosted MongoDB)
- ElastiCache: $12/month minimum → **$0** (using self-hosted Redis)

**Phase 2 upgrades (when traffic grows):**
- Add ALB + auto-scaling group
- Move MongoDB to DocumentDB or Atlas
- Add private subnets + NAT Gateway
- Add CloudFront CDN for Next.js static assets

---

## Troubleshooting

**Containers not starting:**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=50
```

**Port 80 not responding:**
```bash
docker ps   # check nginx container is running
curl -v http://localhost/health
```

**Bootstrap script didn't finish:**
```bash
sudo cat /var/log/user-data.log
sudo systemctl status docker
```

**Out of disk space:**
```bash
df -h
docker system prune -af   # clears unused images/containers
```
