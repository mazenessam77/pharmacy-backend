#!/usr/bin/env python3
"""
MongoDB → S3 daily backup.

- Runs `mongodump` inside the pharma-mongodb container
- gzip-tars the dump
- Uploads to s3://pharma-mongo-backups-541405370428/ with date-stamped key
- Cleans up local files
- Logs to /var/log/pharma-backup.log

Designed to run via cron as root. Uses the EC2 instance role for S3 (no keys).
S3 bucket has a 30-day lifecycle rule, so old backups are removed automatically.
"""

import os
import sys
import shutil
import logging
import subprocess
import tarfile
from datetime import datetime, timezone
from pathlib import Path

import boto3
from botocore.exceptions import BotoCoreError, ClientError


BUCKET = "pharma-mongo-backups-541405370428"
REGION = "eu-west-2"
CONTAINER = "pharma-mongodb"
DB_NAME = "pharma_db"
ENV_FILE = "/opt/pharma-app/.env"
WORK_DIR = "/tmp/pharma-backup"
LOG_FILE = "/var/log/pharma-backup.log"


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler(LOG_FILE), logging.StreamHandler()],
)
log = logging.getLogger(__name__)


def read_mongo_password() -> str:
    """Read MONGO_PASSWORD from the production .env (root-readable)."""
    for line in Path(ENV_FILE).read_text().splitlines():
        if line.startswith("MONGO_PASSWORD="):
            return line.split("=", 1)[1].strip()
    raise RuntimeError(f"MONGO_PASSWORD not found in {ENV_FILE}")


def run(cmd: list[str], **kwargs) -> subprocess.CompletedProcess:
    """Run a command and raise on non-zero exit."""
    log.info("$ %s", " ".join(cmd))
    return subprocess.run(cmd, check=True, **kwargs)


def main() -> int:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    work_path = Path(WORK_DIR) / timestamp
    archive = Path(WORK_DIR) / f"pharma-mongo-{timestamp}.tar.gz"

    try:
        log.info("=== Backup start: %s ===", timestamp)
        work_path.mkdir(parents=True, exist_ok=True)

        password = read_mongo_password()

        
        run([
            "docker", "exec", CONTAINER, "mongodump",
            "--username", "admin",
            "--password", password,
            "--authenticationDatabase", "admin",
            "--db", DB_NAME,
            "--out", "/tmp/dump",
            "--quiet",
        ])
        run(["docker", "cp", f"{CONTAINER}:/tmp/dump/.", str(work_path)])
        run(["docker", "exec", CONTAINER, "rm", "-rf", "/tmp/dump"])

 
        log.info("Compressing → %s", archive)
        with tarfile.open(archive, "w:gz") as tar:
            tar.add(work_path, arcname=DB_NAME)
        size_mb = archive.stat().st_size / 1024 / 1024
        log.info("Archive size: %.2f MB", size_mb)


        s3_key = f"{timestamp[:10]}/pharma-mongo-{timestamp}.tar.gz"
        log.info("Uploading → s3://%s/%s", BUCKET, s3_key)
        s3 = boto3.client("s3", region_name=REGION)
        s3.upload_file(
            str(archive), BUCKET, s3_key,
            ExtraArgs={
                "StorageClass": "STANDARD_IA",
                "ServerSideEncryption": "AES256",
            },
        )
        log.info("Upload complete: s3://%s/%s", BUCKET, s3_key)
        return 0

    except subprocess.CalledProcessError as e:
        log.error("Command failed (exit %s): %s", e.returncode, e.cmd)
        return 2
    except (BotoCoreError, ClientError) as e:
        log.error("S3 error: %s", e)
        return 3
    except Exception:
        log.exception("Unexpected error")
        return 1
    finally:

        shutil.rmtree(work_path, ignore_errors=True)
        archive.unlink(missing_ok=True)
        log.info("=== Backup end ===\n")


if __name__ == "__main__":
    sys.exit(main())
