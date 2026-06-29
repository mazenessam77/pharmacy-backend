# PharmaLink Observability — Engineering Roadmap

**Design invariants:** dedicated Monitoring Server A · Application Server B ·
same-VPC private-IP comms only · Security-Group-gated (no public exporter
ports) · Grafana only via SSM port-forwarding · Docker Compose · Prometheus +
Grafana + Alertmanager.

**Targets:** VPC `vpc-050496bb391675a42` (eu-west-2) · Server A
`i-002420d1073790c56` @ `10.0.1.112` (SG `pharma-monitor-sg`) · Server B
`i-03c610848aec1cb45` @ `10.0.1.222` (SG `sg-0b8940d3d5378f596`).

## Phase roadmap
| Phase | Adds | New B-SG ingress (← monitor SG) | Status |
|---|---|---|---|
| 1 | Provision A + Prometheus + Grafana + Alertmanager | — | ✅ done |
| 2 | node_exporter on B → host metrics | 9100 | ✅ done |
| 3 | cAdvisor on B → per-container metrics | 8080 | |
| 4 | mongodb_exporter + redis_exporter | 9216, 9121 | |
| 5 | backend prom-client /metrics (app + business) | 9101 | |
| 6 | nginx stub_status + exporter | 9113 | |
| 7 | Alertmanager routing + alert rules (Slack) | — | ✅ done |
| 8 | End-to-end validation + stress replay | — | |
| 9 (future) | Loki/Promtail · OpenTelemetry · Tempo | reserved | |

Each phase adds exactly one exporter + one SG port (least privilege, source =
Server A's SG only), so attack surface and debugging surface grow one step at
a time.

## Per-phase: objective / deliverables / verification / outcome
- **P1 Provision** — A running P/G/A, privately reachable. Verify: SSM tunnel to
  Grafana; Prometheus `/targets` shows `prometheus` + `monitor-host` UP. Zero B impact.
- **P2 Host** — node_exporter@`10.0.1.222:9100`, job `node-b`, import dash 1860.
  Verify: target UP, host CPU/mem live; replay `stress-ng` and watch it.
- **P3 Containers** — cAdvisor@`:8080`, dash 193. Verify: per-container CPU/mem for all 5.
- **P4 DB/cache** — Mongo `monitor` user (clusterMonitor), mongodb_exporter@`:9216`
  + redis_exporter@`:9121`, dashes 2583/763. Verify: connections/ops, hit-rate.
- **P5 App** — `prom-client` `/metrics`@`:9101` (private bind), custom API+Ops dashes.
  Verify: p95/p99 per route, event-loop lag, business counters increment.
- **P6 Nginx** — stub_status + nginx-prometheus-exporter@`:9113`, dash 12708.
- **P7 Alerts** — rules + Alertmanager routing (email via SMTP_* / Slack webhook),
  severity grouping + inhibition. Verify: stop a container → alert fires + resolves.
- **P8 Validate** — stress + load replay, all targets UP, RUNBOOK.md.

## Prometheus storage
`retention.time=15d` (intended lookback) **and** `retention.size=8GB` (hard
guardrail). Prometheus deletes oldest blocks when either limit hits first. Time
alone risks a cardinality spike filling the disk and crashing the box; size is
the safety net. 20 GB volume leaves headroom for WAL + Grafana + OS.

## Metrics catalog
**App (prom-client):** `http_request_duration_seconds{method,route,status}` (rate,
p95, p99, error rate), `http_requests_in_flight`, `nodejs_eventloop_lag_seconds`,
default Node metrics. *Route label must be the template (`/api/orders/:id`).*
**Business (counters/gauges in controllers):** `pharmacy_orders_created_total`,
`pharmacy_orders_completed_total` / `pharmacy_orders_failed_total{reason}`,
`pharmacy_order_processing_seconds`, `pharmacy_active_users`,
`pharmacy_auth_failures_total{reason}`, `pharmacy_payment_failures_total{method}`,
`pharmacy_inventory_update_failures_total`, `pharmacy_prescriptions_uploaded_total` /
`pharmacy_prescription_failed_total`, `pharmacy_dlq_depth`.

## Alert catalog
**Infra:** HighCPU(>85%/5m), HighMemory(MemAvail<12%/5m), HighDisk(>80%/10m),
TargetDown/ExporterDown(up==0/2m), ContainerDown, MongoDBUnavailable,
RedisUnavailable. **App:** HighErrorRate(5xx>5%/5m), HighLatency(p95>1s/5m),
AuthFailureSpike, PaymentFailures, OrderProcessingFailures, PrescriptionDLQGrowing.
Alertmanager: group by alertname+severity, inhibit app alerts when host/container down.

## Dashboard strategy
**Import (grafana.com):** Node Exporter Full **1860**, cAdvisor/Docker **193**,
MongoDB **2583**/7353, Redis **763**/11835, Nginx Exporter **12708**, Node.js App
**11159**/14058, Prometheus **3662**, Alertmanager **9578**.
**Custom (build):** Pharmacy Ops Overview (orders/min, completed/failed, payment +
auth failures, prescription funnel + DLQ, active users); API Health/SLO (per-route
p95/p99, error budget, in-flight); Prescription Pipeline (upload→processed funnel,
Lambda errors, SQS/DLQ depth).

## Future (Phase 9) — extensible without redesign
Grafana = single pane → Loki & Tempo plug in as datasources; A's compose just
gains containers; backend/Lambda already log structured JSON (Promtail/Loki
ingest as-is); OpenTelemetry SDK adds trace IDs to correlate logs↔traces↔metrics;
prom-client histograms can later carry trace exemplars.
