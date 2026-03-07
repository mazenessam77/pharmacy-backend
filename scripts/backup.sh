#!/bin/bash
# Backs up MongoDB data
# Usage: ./scripts/backup.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

mkdir -p $BACKUP_DIR

docker compose exec -T mongodb mongodump \
  --username=$MONGO_USER \
  --password=$MONGO_PASSWORD \
  --authenticationDatabase=admin \
  --db=pharma_db \
  --archive \
  --gzip > "$BACKUP_DIR/pharma_db_$TIMESTAMP.gz"

echo "Backup saved to $BACKUP_DIR/pharma_db_$TIMESTAMP.gz"
