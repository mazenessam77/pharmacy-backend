# GitHub Actions Secrets — new AWS account (498341975421)

Update these under **Repo → Settings → Secrets and variables → Actions**.
Derivable values are filled in; the rest are **[you provide]**.

> Account `498341975421` · Region `us-east-1` · ECR registry
> `498341975421.dkr.ecr.us-east-1.amazonaws.com`

---

## A. AWS authentication — required for any deploy

Pick **one**.

**Preferred — OIDC:**
- [ ] `AWS_ROLE_ARN` = `arn:aws:iam::498341975421:role/<github-actions-deploy-role>`
- [ ] `AWS_REGION` = `us-east-1`

**Or — static IAM user keys:**
- [ ] `AWS_ACCESS_KEY_ID` = **[you provide]**
- [ ] `AWS_SECRET_ACCESS_KEY` = **[you provide]**
- [ ] `AWS_REGION` = `us-east-1`

---

## B. ECS/Fargate deploy (build → ECR → update service)

- [ ] `ECR_REGISTRY` = `498341975421.dkr.ecr.us-east-1.amazonaws.com`
- [ ] `ECS_CLUSTER` = `pharmalink-production`  *(or `pharmalink-dev`)*
- [ ] `AWS_ACCOUNT_ID` = `498341975421`

**ECR repositories** (`docker push` targets; also `terraform output ecr_repository_urls`):

| Service | Repository URL |
|---------|----------------|
| backend  | `498341975421.dkr.ecr.us-east-1.amazonaws.com/pharmalink-backend` |
| frontend | `498341975421.dkr.ecr.us-east-1.amazonaws.com/pharmalink-frontend` |

**ECS service names** (for `aws ecs update-service --force-new-deployment`):
`pharmalink-production-backend`, `pharmalink-production-frontend`.

**Frontend build args** (baked at image build, not runtime):
`NEXT_PUBLIC_API_URL=https://mymedcine.com/api`,
`NEXT_PUBLIC_SOCKET_URL=https://mymedcine.com`,
`NEXT_PUBLIC_GOOGLE_CLIENT_ID=<client-id>`.

---

## Notes

- **App secrets are NOT GitHub secrets.** Terraform stores `MONGODB_URI`,
  `REDIS_URL`, and JWT secrets in SSM; you set `GROQ_API_KEY` / `CLOUDINARY_*`
  directly in SSM (they're created as `CHANGEME` placeholders). Containers read
  them via the ECS task `secrets` block.
- Minimum CI IAM permissions: `ecr:GetAuthorizationToken`,
  `ecr:BatchCheckLayerAvailability`, `ecr:PutImage`, `ecr:Upload*`,
  `ecr:InitiateLayerUpload`, `ecr:CompleteLayerUpload`, `ecs:UpdateService`,
  `ecs:DescribeServices`, and `iam:PassRole` for the task/execution roles.
- The legacy EC2-over-SSH pipeline (`cd.yml`) is unrelated to this ECS module;
  if you keep it, it still uses `PRODUCTION_HOST` / `PRODUCTION_USER` /
  `PRODUCTION_SSH_KEY`.
