# GitHub Actions Secrets — new AWS account (498341975421)

Update these under **Repo → Settings → Secrets and variables → Actions**.
Values that are **derivable** from the new account / Terraform outputs are filled
in; the rest are marked **[you provide]**.

> Account `498341975421` · Region `us-east-1` · ECR registry
> `498341975421.dkr.ecr.us-east-1.amazonaws.com`

---

## A. AWS authentication — required for any deploy to the new account

Pick **one** approach.

**Preferred — OIDC (no long-lived keys):**

- [ ] `AWS_ROLE_ARN` = `arn:aws:iam::498341975421:role/<github-actions-deploy-role>`  *(create an IAM role trusting `token.actions.githubusercontent.com`)*
- [ ] `AWS_REGION` = `us-east-1`

**Or — static IAM user keys:**

- [ ] `AWS_ACCESS_KEY_ID` = **[you provide]** *(from a CI IAM user in 498341975421)*
- [ ] `AWS_SECRET_ACCESS_KEY` = **[you provide]**
- [ ] `AWS_REGION` = `us-east-1`

---

## B. Current pipeline (`.github/workflows/cd.yml` — EC2 over SSH)

The existing pipeline deploys by SSH to an EC2 host. After the account move it
will **fail** until these point at the new server:

- [ ] `PRODUCTION_HOST` = **[you provide]** *(new EC2 Elastic IP / hostname in 498341975421)*
- [ ] `PRODUCTION_USER` = `ubuntu`
- [ ] `PRODUCTION_SSH_KEY` = **[you provide]** *(private key for the new instance's key pair)*

> These are the only secrets `cd.yml` references today, so updating them is the
> minimum to keep the current pipeline green on the new account.

---

## C. New ECS/Fargate pipeline (when you switch `cd.yml` to push ECR + update ECS)

Once you move off SSH to a push-image-and-update-service flow, you'll need:

- [ ] `ECR_REGISTRY` = `498341975421.dkr.ecr.us-east-1.amazonaws.com`
- [ ] `ECS_CLUSTER` = `pharmalink-production`  *(or `pharmalink-dev`)*
- [ ] `AWS_ACCOUNT_ID` = `498341975421`
- [ ] (plus the **A** AWS-auth secret above)

**ECR repository URLs** (targets for `docker push`, also `terraform output ecr_repository_urls`):

| Service | Repository URL |
|---------|----------------|
| auth     | `498341975421.dkr.ecr.us-east-1.amazonaws.com/pharmalink-auth` |
| orders   | `498341975421.dkr.ecr.us-east-1.amazonaws.com/pharmalink-orders` |
| pharmacy | `498341975421.dkr.ecr.us-east-1.amazonaws.com/pharmalink-pharmacy` |
| worker   | `498341975421.dkr.ecr.us-east-1.amazonaws.com/pharmalink-worker` |

**ECS service names** (for `aws ecs update-service --force-new-deployment`):
`pharmalink-production-auth`, `-orders`, `-pharmacy`, `pharmalink-production-worker`.

---

## Notes

- **App secrets** (DB passwords, Redis auth, etc.) are **not** GitHub secrets in
  the ECS design — Terraform stores them in SSM Parameter Store and injects them
  into containers, so they never touch CI.
- The minimum IAM permissions for the CI principal: `ecr:GetAuthorizationToken`,
  `ecr:BatchCheckLayerAvailability`, `ecr:PutImage`, `ecr:Upload*`,
  `ecs:UpdateService`, `ecs:DescribeServices`, and `iam:PassRole` for the ECS
  task/execution roles.
