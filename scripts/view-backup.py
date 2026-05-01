#!/usr/bin/env python3
"""
View MongoDB backup data straight from S3.

Usage:
  view-backup                       # list available backups
  view-backup latest                # download latest, show collection summary
  view-backup latest <collection>   # download latest, dump that collection as JSON
  view-backup <key>                 # any specific S3 key

Examples:
  view-backup latest
  view-backup latest sideeffectreports
  view-backup latest users 5            # limit to first 5 docs
"""

import sys
import json
import tarfile
import tempfile
from pathlib import Path

import boto3
import bson

BUCKET = "pharma-mongo-backups-541405370428"
REGION = "eu-west-2"


def list_backups(s3):
    objs = sorted(
        s3.list_objects_v2(Bucket=BUCKET).get("Contents", []),
        key=lambda o: o["LastModified"],
    )
    if not objs:
        print("No backups found.")
        return
    print(f"{'Date':<20}  {'Size':>10}  Key")
    for o in objs:
        size_kb = o["Size"] / 1024
        print(f"{o['LastModified']:%Y-%m-%d %H:%M}     {size_kb:>7.1f} KB  {o['Key']}")


def download_and_extract(s3, key, tmpdir):
    archive = Path(tmpdir) / "backup.tar.gz"
    s3.download_file(BUCKET, key, str(archive))
    with tarfile.open(archive, "r:gz") as tar:
        tar.extractall(tmpdir)
    # Find the deepest directory that contains the .bson files
    for p in Path(tmpdir).rglob("*.bson"):
        return p.parent
    raise RuntimeError("No .bson files found in backup")


def show_summary(data_dir):
    print(f"\n{'Collection':<25} {'Docs':>8} {'Size':>10}")
    print("-" * 50)
    total_docs = 0
    for f in sorted(data_dir.glob("*.bson")):
        with f.open("rb") as fh:
            docs = bson.decode_all(fh.read())
        total_docs += len(docs)
        size_kb = f.stat().st_size / 1024
        print(f"{f.stem:<25} {len(docs):>8} {size_kb:>7.1f} KB")
    print("-" * 50)
    print(f"{'TOTAL':<25} {total_docs:>8}")


def show_collection(data_dir, name, limit=None):
    bson_file = data_dir / f"{name}.bson"
    if not bson_file.exists():
        print(f"Collection '{name}' not found. Available:")
        for f in sorted(data_dir.glob("*.bson")):
            print(f"  - {f.stem}")
        sys.exit(1)
    with bson_file.open("rb") as f:
        docs = bson.decode_all(f.read())
    if limit:
        docs = docs[:limit]
    for doc in docs:
        print(json.dumps(doc, default=str, indent=2))


def main():
    args = sys.argv[1:]
    s3 = boto3.client("s3", region_name=REGION)

    if not args:
        list_backups(s3)
        return

    # Resolve "latest" or use literal key
    if args[0] == "latest":
        objs = sorted(
            s3.list_objects_v2(Bucket=BUCKET).get("Contents", []),
            key=lambda o: o["LastModified"],
        )
        if not objs:
            print("No backups available.")
            return
        key = objs[-1]["Key"]
        print(f"Using latest: {key}\n")
        args = args[1:]
    else:
        key = args[0]
        args = args[1:]

    with tempfile.TemporaryDirectory() as tmp:
        data_dir = download_and_extract(s3, key, tmp)
        if not args:
            show_summary(data_dir)
        else:
            collection = args[0]
            limit = int(args[1]) if len(args) > 1 else None
            show_collection(data_dir, collection, limit)


if __name__ == "__main__":
    main()
