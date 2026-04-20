#!/bin/bash
# Cortex automated backup script
# Backs up PostgreSQL data and optionally uploads to S3-compatible storage
#
# Usage:
#   ./scripts/backup.sh                    # Local backup only
#   ./scripts/backup.sh --upload           # Local + upload to S3
#
# Crontab example (daily at 3am):
#   0 3 * * * /opt/cortex/scripts/backup.sh --upload >> /var/log/cortex-backup.log 2>&1

set -euo pipefail

# --- Configuration ---
BACKUP_DIR="${BACKUP_DIR:-/opt/cortex/backups}"
KEEP_DAYS="${KEEP_DAYS:-7}"
COMPOSE_FILE="${COMPOSE_FILE:-/opt/cortex/docker-compose.prod.yml}"
DB_CONTAINER="$(docker compose -f "$COMPOSE_FILE" ps -q db)"

# S3 upload settings (optional)
S3_BUCKET="${S3_BUCKET:-}"
S3_ENDPOINT="${S3_ENDPOINT:-}"  # e.g., https://fsn1.your-objectstorage.com for Hetzner

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="cortex_backup_${TIMESTAMP}.sql.gz"

# --- Create backup directory ---
mkdir -p "$BACKUP_DIR"

# --- Dump database ---
echo "[$(date)] Starting backup..."
docker exec "$DB_CONTAINER" pg_dump \
  -U reader \
  -d reader_organizer \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

FILESIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
echo "[$(date)] Backup created: ${BACKUP_FILE} (${FILESIZE})"

# --- Upload to S3 (if configured and --upload flag passed) ---
if [[ "${1:-}" == "--upload" ]] && [[ -n "$S3_BUCKET" ]]; then
  echo "[$(date)] Uploading to S3..."
  if command -v aws &> /dev/null; then
    ENDPOINT_FLAG=""
    [[ -n "$S3_ENDPOINT" ]] && ENDPOINT_FLAG="--endpoint-url $S3_ENDPOINT"
    aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "s3://${S3_BUCKET}/cortex/${BACKUP_FILE}" $ENDPOINT_FLAG
    echo "[$(date)] Upload complete."
  else
    echo "[$(date)] WARNING: aws CLI not found, skipping upload."
  fi
fi

# --- Prune old backups ---
echo "[$(date)] Pruning backups older than ${KEEP_DAYS} days..."
find "$BACKUP_DIR" -name "cortex_backup_*.sql.gz" -mtime "+${KEEP_DAYS}" -delete

REMAINING=$(find "$BACKUP_DIR" -name "cortex_backup_*.sql.gz" | wc -l)
echo "[$(date)] Backup complete. ${REMAINING} backups retained."
