# PharmaLink — ECS Fargate Infrastructure (Terraform)

Production-grade Terraform for the refactored **microservices** architecture:
Cloudflare edge → ALB → ECS Fargate services → database-per-service RDS, with
ElastiCache, DynamoDB and SQS. See the diagram in
[`../../docs/architecture/`](../../docs/architecture/).

> This is a **separate root module** from the existing single-EC2 config in
> `terraform/`. It does not touch or replace the current deployment.

## What it creates

| Layer | Resources |
|-------|-----------|
| **Network** | VPC `10.0.0.0/16`, 2 public + 2 private subnets across `us-east-1a/1b`, IGW, **2 NAT gateways** (one per AZ), per-AZ private route tables, S3 + DynamoDB gateway endpoints |
| **Edge / Ingress** | ALB in public subnets; SG allows **HTTPS (443) from Cloudflare ranges only**; path-based routing (`/api/v1/auth*`, `/api/v1/orders*`, `/api/v1/pharmacies*`) |
| **Compute** | ECS cluster `pharmalink-production` (Fargate); services `auth`, `orders`, `pharmacy` + `worker`; CloudWatch log groups; CPU & SQS-backlog autoscaling |
| **Database-per-service** | `auth_db` (PostgreSQL), `orders_db` (PostgreSQL), `pharmacy_db` (MySQL) — all Multi-AZ, encrypted, private; each reachable only from its owning service |
| **Decoupling / state** | SQS `pharmalink-work-queue` + DLQ; DynamoDB sessions table (PAY_PER_REQUEST); ElastiCache Redis (encrypted, auth token) |
| **Config** | SSM Parameter Store: DB credentials (SecureString) + endpoints + queue/table config |
| **IAM** | One execution role + four least-privilege task roles |

## Prerequisites (one-time, manual)

1. **ACM certificate** for your domain, **DNS-validated**:
   ```bash
   aws acm request-certificate --domain-name mymedcine.com \
     --validation-method DNS --region us-east-1
   ```
   Add the returned CNAME validation record in **Cloudflare DNS**, wait until the
   cert status is **ISSUED**, then set `certificate_arn` in `terraform.tfvars`.
   (ALB listeners require an already-issued cert.)

2. **Container images** in ECR for each service; set `container_images`. The
   defaults are public `nginx` placeholders so `plan` works — they will not pass
   the `/health` check until you push real images.

## Apply

```bash
cd terraform/ecs-fargate
cp terraform.tfvars.example terraform.tfvars   # then edit certificate_arn + images
terraform init
terraform plan
terraform apply
```

## After apply — wire Cloudflare

1. `terraform output alb_dns_name`.
2. In Cloudflare DNS, create a **CNAME** `mymedcine.com → <alb_dns_name>`,
   **Proxied (orange cloud)**.
3. Set **SSL/TLS mode → Full (strict)**.
4. Because the ALB SG only admits Cloudflare ranges, the origin can't be reached
   directly — all traffic must pass through the Cloudflare WAF.

## Security notes

- **No public 0.0.0.0/0 on 443** — only Cloudflare's published ranges (fetched
  live at plan time from `cloudflare.com/ips-v4`/`-v6`; override with
  `cloudflare_ipv4_cidrs` / `cloudflare_ipv6_cidrs`).
- RDS/Redis are in private subnets, encrypted at rest, never publicly accessible.
- Secrets live in SSM SecureString and are injected via the ECS task `secrets`
  block; passwords are generated (`random_password`), never hardcoded.
- Each database's SG admits only its owning service (the worker also reaches
  `pharmacy_db` to write results).

## Cost awareness

The expensive always-on pieces: **2 NAT gateways** (~$32/mo each + data),
**3 Multi-AZ RDS** instances, the **ALB**, and the **Redis** replication group.
For non-prod, consider one NAT gateway, `db_multi_az = false`, and
`redis_num_nodes = 1`.

## Notes / extension points

- Interface VPC endpoints (ECR API/DKR, CloudWatch Logs, SQS, SSM) can be added
  to drop the NAT dependency for AWS API traffic — left out to keep cost down.
- `enable_execute_command` (ECS Exec) is intentionally off; enabling it requires
  adding `ssmmessages:*` to the task roles.
- Worker uses `FARGATE` launch type; switch to `FARGATE_SPOT` (already a cluster
  capacity provider) to cut async-tier cost.
