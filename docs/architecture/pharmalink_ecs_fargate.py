#!/usr/bin/env python3
"""
PharmaLink — production architecture (ECS Fargate microservices, Multi-AZ).

Renders a professional AWS-icon diagram of the refactored architecture:

  - Edge handled by Cloudflare (mymedcine.com, proxied / orange cloud).
    No Route 53, no CloudFront — Cloudflare owns DNS + TLS + WAF + CDN and
    origin-pulls to the ALB.
  - Compute on Amazon ECS / AWS Fargate (Auth, Orders, Pharmacy services +
    async Worker tasks), spread Multi-AZ.
  - ALB -> API Gateway / Envoy ingress doing path-based routing.
  - Database-per-service: one isolated Amazon RDS per microservice.
  - Shared ElastiCache (Redis) + DynamoDB (sessions/state).
  - Amazon SQS decouples request path from heavy async pharmacy workloads.
  - CloudWatch + Systems Manager for observability / config.
  - AWS Shield Standard (always-on, no extra cost) automatically protects the
    internet-facing ALB against common Layer 3/4 DDoS attacks. Shield Advanced
    is intentionally NOT used.

Run:  python3 docs/architecture/pharmalink_ecs_fargate.py
Out:  docs/architecture/pharmalink-ecs-fargate.png
"""

import os

from diagrams import Cluster, Diagram, Edge
from diagrams.aws.compute import Fargate
from diagrams.aws.database import RDS, Dynamodb, ElastiCache
from diagrams.aws.integration import SQS
from diagrams.aws.management import Cloudwatch, SystemsManager
from diagrams.aws.network import APIGateway, ElbApplicationLoadBalancer
from diagrams.aws.security import Shield
from diagrams.onprem.client import Users
from diagrams.saas.cdn import Cloudflare

# ── Edge styles: make synchronous vs asynchronous visually unambiguous ──
SYNC = {"color": "#1f4e79", "penwidth": "2.0"}                       # HTTP/HTTPS request path
DATA = {"color": "#2563eb", "penwidth": "1.4"}                       # synchronous data-plane reads/writes
ASYNC = {"color": "#c0392b", "style": "dashed", "penwidth": "2.0"}   # event-driven (SQS)
OBS = {"color": "#7f8c8d", "style": "dotted", "penwidth": "1.3"}     # telemetry / config
SHIELD = {"color": "#1a7f37", "style": "dashed", "penwidth": "1.6"}  # AWS Shield Standard — always-on L3/L4 DDoS

GRAPH_ATTR = {
    "fontsize": "22",
    "fontname": "Helvetica",
    "bgcolor": "white",
    "pad": "0.7",
    "nodesep": "0.85",
    "ranksep": "1.6",
    "splines": "spline",
    "compound": "true",
}
NODE_ATTR = {"fontsize": "12", "fontname": "Helvetica"}
EDGE_ATTR = {"fontsize": "11", "fontname": "Helvetica"}

OUTFILE = os.path.join(os.path.dirname(__file__), "pharmalink-ecs-fargate")


def cluster_attr(bg, color):
    return {
        "bgcolor": bg,
        "color": color,
        "fontcolor": color,
        "fontsize": "14",
        "style": "rounded",
        "penwidth": "2",
    }


with Diagram(
    "PharmaLink — ECS Fargate Microservices (Multi-AZ)",
    filename=OUTFILE,
    outformat="png",
    show=False,
    direction="LR",
    graph_attr=GRAPH_ATTR,
    node_attr=NODE_ATTR,
    edge_attr=EDGE_ATTR,
):
    users = Users("Users\n(Patients · Pharmacies · Admin)")

    cf = Cloudflare(
        "Cloudflare Edge\nmymedcine.com\nProxied (Orange Cloud)\nDNS · TLS · WAF · CDN"
    )

    users >> Edge(label="HTTPS 443", **SYNC) >> cf

    with Cluster("AWS Cloud", graph_attr=cluster_attr("#f7fbff", "#232f3e")):

        # AWS Shield Standard — automatic, always-on, no-cost L3/L4 DDoS
        # protection for internet-facing AWS resources (the ALB below).
        # Shield Advanced is intentionally NOT used (no paid services).
        shield = Shield(
            "AWS Shield Standard\nAutomatic L3/L4 DDoS protection\n(always-on · no extra cost)"
        )

        with Cluster("VPC — Multi-AZ (us-east-1a / us-east-1b)",
                     graph_attr=cluster_attr("#f0fff4", "#1a7f37")):

            alb = ElbApplicationLoadBalancer(
                "Application\nLoad Balancer\n(HTTPS origin)"
            )
            ingress = APIGateway(
                "API Gateway / Ingress\n(Envoy reverse proxy)\npath-based routing"
            )

            cf >> Edge(label="origin pull (HTTPS)", **SYNC) >> alb
            shield >> Edge(label="protects (L3/L4 DDoS)", **SHIELD) >> alb
            alb >> Edge(**SYNC) >> ingress

            # ── Compute: ECS Cluster on Fargate ──────────────────────
            with Cluster("Amazon ECS Cluster — AWS Fargate",
                         graph_attr=cluster_attr("#fff4ec", "#d45b07")):

                with Cluster("Application Services (Fargate tasks · Multi-AZ)",
                             graph_attr={**cluster_attr("#fffaf5", "#e8833a"),
                                         "style": "rounded,dashed"}):
                    auth = Fargate("Auth Service\n/api/v1/auth")
                    orders = Fargate("Orders Service\n/api/v1/orders")
                    pharmacy = Fargate("Pharmacy Service\n/api/v1/pharmacies")

                with Cluster("Async Workers (Fargate tasks · Multi-AZ)",
                             graph_attr={**cluster_attr("#fdf2f8", "#be185d"),
                                         "style": "rounded,dashed"}):
                    worker = Fargate("Worker Tasks\nSQS consumers")

            # Path-based routing (synchronous)
            ingress >> Edge(label="/api/v1/auth", **SYNC) >> auth
            ingress >> Edge(label="/api/v1/orders", **SYNC) >> orders
            ingress >> Edge(label="/api/v1/pharmacies", **SYNC) >> pharmacy

            # ── Shared cache / session store ─────────────────────────
            with Cluster("Shared Data & Cache",
                         graph_attr=cluster_attr("#eef6ff", "#2563eb")):
                redis = ElastiCache("ElastiCache (Redis)\nshared cache")
                dynamo = Dynamodb("DynamoDB\nsessions · state")

            for svc in (auth, orders, pharmacy):
                svc >> Edge(**DATA) >> redis
            auth >> Edge(**DATA) >> dynamo
            orders >> Edge(**DATA) >> dynamo

            # ── Async queue: services publish, workers consume ───────
            sqs = SQS("Amazon SQS\nwork queue")
            orders >> Edge(label="publish job", **ASYNC) >> sqs
            pharmacy >> Edge(label="publish job", **ASYNC) >> sqs
            sqs >> Edge(label="poll / consume", **ASYNC) >> worker

            # ── Database-per-service (isolated RDS instances) ────────
            with Cluster("Database-per-Service — Amazon RDS",
                         graph_attr=cluster_attr("#f5f0ff", "#7c3aed")):
                auth_db = RDS("Auth DB\nRDS PostgreSQL\nMulti-AZ")
                orders_db = RDS("Orders DB\nRDS PostgreSQL\nMulti-AZ")
                pharmacy_db = RDS("Pharmacy DB\nRDS MySQL\nMulti-AZ")

            auth >> Edge(label="owns", **DATA) >> auth_db
            orders >> Edge(label="owns", **DATA) >> orders_db
            pharmacy >> Edge(label="owns", **DATA) >> pharmacy_db
            worker >> Edge(label="write results", **DATA) >> pharmacy_db

            # ── Observability & configuration ────────────────────────
            with Cluster("Observability & Ops",
                         graph_attr=cluster_attr("#fdeef0", "#be123c")):
                cw = Cloudwatch("CloudWatch\nlogs · metrics · alarms")
                ssm = SystemsManager("Systems Manager\nparams · secrets")

            pharmacy >> Edge(label="logs · metrics", **OBS) >> cw
            worker >> Edge(**OBS) >> cw
            ssm >> Edge(label="config · secrets", **OBS) >> auth
