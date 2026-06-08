# PharmaLink — ECS Fargate Infrastructure (Terraform)

Runs the **actual** PharmaLink app on AWS Fargate behind Cloudflare:

- **backend** — the Express monolith (handles `/api/*` + `/socket.io/*`)
- **frontend** — the Next.js app (everything else)
- **DocumentDB** — MongoDB-compatible database (the app uses Mongoose)
- **ElastiCache Redis** — cache
- **ALB** — only reachable from Cloudflare ranges; path-routes to the services

> Separate root module from the single-EC2 config in `terraform/`. It does not
> touch the current deployment.

## What it creates

| Layer | Resources |
|-------|-----------|
| Network | VPC `10.0.0.0/16`, 2 public + 2 private subnets (Multi-AZ), IGW, NAT (1 or per-AZ via `single_nat_gateway`), S3 + DynamoDB gateway endpoints |
| Edge | ALB; SG allows **HTTPS 443 from Cloudflare only**; `/api*`+`/socket.io*` → backend, default → frontend |
| Compute | ECS cluster `pharmalink-production` (Fargate); `backend` + `frontend` services; CPU autoscaling; CloudWatch logs |
| Database | Amazon **DocumentDB** cluster (Mongo-compatible), private, encrypted |
| Cache | ElastiCache **Redis** (encrypted + auth token) |
| Config | SSM Parameter Store: `MONGODB_URI`, `REDIS_URL`, JWT secrets (generated), Groq/Cloudinary (placeholders) |
| Registry | ECR repos `pharmalink-backend`, `pharmalink-frontend` |
| IAM | execution role (pull + logs + read SSM) + minimal task role |

## ⚠️ Required app-side changes (so it actually connects)

DocumentDB and encrypted ElastiCache differ from the local docker-compose Mongo/Redis:

1. **DocumentDB TLS CA** — the backend image must include Amazon's CA bundle and
   the app must use it. In `Dockerfile.prod`:
   ```dockerfile
   RUN mkdir -p /app/certs && \
       curl -fsSL https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
       -o /app/certs/global-bundle.pem
   ```
   The injected `MONGODB_URI` already sets `tls=true&tlsCAFile=/app/certs/global-bundle.pem&retryWrites=false`
   (DocumentDB does not support `retryWrites=true`).
2. **Redis over TLS** — `REDIS_URL` is `rediss://…` (TLS). `ioredis` enables TLS
   automatically for the `rediss://` scheme, so no code change is needed if you
   construct the client from `process.env.REDIS_URL`.

## Prerequisites

1. **ACM certificate** for the domain, DNS-validated (add the CNAME in Cloudflare),
   status **ISSUED** → set `certificate_arn`.
2. **ECR images** for backend + frontend (see runbook step 3).

## Runbook

```bash
cd terraform/ecs-fargate
cp terraform.tfvars.example terraform.tfvars     # set certificate_arn (+ images later)

# 1) Create ECR + the rest of the infra
terraform init
terraform apply                                  # or: -var-file=dev.tfvars

# 2) Set the external secrets Terraform left as placeholders
PREFIX=$(terraform output -raw ssm_parameter_prefix)
aws ssm put-parameter --overwrite --type SecureString --name "$PREFIX/GROQ_API_KEY"        --value 'gsk_...'
aws ssm put-parameter --overwrite --type SecureString --name "$PREFIX/CLOUDINARY_CLOUD_NAME" --value '...'   # if used
# (CLOUDINARY_API_KEY / _API_SECRET likewise)

# 3) Build + push images, then point the services at them
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin \
  "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com"
terraform output ecr_repository_urls             # -> backend / frontend repo URLs

docker build -f Dockerfile.prod -t <backend_repo>:latest .
docker push <backend_repo>:latest
docker build -f frontend/Dockerfile.prod \
  --build-arg NEXT_PUBLIC_API_URL=https://mymedcine.com/api \
  --build-arg NEXT_PUBLIC_SOCKET_URL=https://mymedcine.com \
  --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=<client-id> \
  -t <frontend_repo>:latest ./frontend
docker push <frontend_repo>:latest

# set container_images in terraform.tfvars to the pushed URLs, then:
terraform apply

# 4) Point Cloudflare at the ALB
terraform output alb_dns_name
#   CNAME mymedcine.com -> <alb_dns_name>, Proxied (orange), SSL = Full (strict)

# 5) Google OAuth: add https://mymedcine.com to Authorized JavaScript origins
```

## Cost awareness

Always-on: NAT gateway(s), **DocumentDB** instance(s) (min `db.t3.medium`), the
ALB, and Redis. `dev.tfvars` trims to 1 NAT + 1 DocumentDB instance + 1 Redis node
+ 1 task per service.

## Notes

- `enable_deletion_protection` guards the ALB + DocumentDB; set `false` (and
  `docdb_skip_final_snapshot = true`) for throwaway envs.
- App secrets live in SSM, not in CI — see `GITHUB_SECRETS.md`.
