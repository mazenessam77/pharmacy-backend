# PharmaLink Monitoring (Server A)

Self-hosted **Prometheus + Grafana + Alertmanager** on a dedicated EC2 (Server A),
scraping the app host (Server B) over the **private VPC IP only**. No public
ports; Grafana is reached via **AWS SSM port-forwarding**.

| | |
|---|---|
| Server A | `i-002420d1073790c56` (t4g.small, eu-west-2, `10.0.1.112`) |
| Server B (scraped) | `i-03c610848aec1cb45` (`10.0.1.222`) |
| Monitor SG | `pharma-monitor-sg` (egress-only) |
| App path | `/opt/monitoring` on Server A |

## Deploy / update (via SSM, no SSH)
The stack lives in `/opt/monitoring` on Server A. After changing configs:
```bash
aws ssm send-command --region eu-west-2 --instance-ids i-002420d1073790c56 \
  --document-name AWS-RunShellScript \
  --parameters 'commands=["cd /opt/monitoring && docker compose -f docker-compose.monitor.yml up -d"]'
# reload Prometheus config without restart:
#   docker exec prometheus kill -HUP 1   (or curl -X POST localhost:9090/-/reload)
```

## Open Grafana (SSM tunnel)
```bash
aws ssm start-session --region eu-west-2 --target i-002420d1073790c56 \
  --document-name AWS-StartPortForwardingSession \
  --parameters '{"portNumber":["3000"],"localPortNumber":["3000"]}'
# then browse http://localhost:3000  (admin / value of GRAFANA_ADMIN_PASSWORD on the box)
```
Same pattern for Prometheus (`9090`) and Alertmanager (`9093`).

See `ROADMAP.md` for the phased rollout.
