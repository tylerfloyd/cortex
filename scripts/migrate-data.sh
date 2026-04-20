#!/bin/bash
# Cortex data migration script
# Exports data from your local Postgres and imports it into the production server
#
# Usage:
#   Step 1 (on your local machine):
#     ./scripts/migrate-data.sh export
#
#   Step 2 (copy the dump to your server):
#     scp cortex_export.sql.gz user@your-server:/opt/cortex/
#
#   Step 3 (on your server):
#     ./scripts/migrate-data.sh import /opt/cortex/cortex_export.sql.gz

set -euo pipefail

ACTION="${1:-}"

case "$ACTION" in
  export)
    echo "=== Exporting local Cortex database ==="
    echo ""

    # Try docker compose first, fall back to local pg_dump
    if docker compose ps db &>/dev/null 2>&1; then
      DB_CONTAINER=$(docker compose ps -q db)
      echo "Found database in Docker container: ${DB_CONTAINER:0:12}"
      echo "Dumping data (schema + data, no ownership info)..."
      docker exec "$DB_CONTAINER" pg_dump \
        -U reader \
        -d reader_organizer \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        | gzip > cortex_export.sql.gz
    else
      echo "No Docker container found, using local pg_dump..."
      echo "Using DATABASE_URL from .env..."

      if [[ -f .env ]]; then
        source <(grep DATABASE_URL .env)
      fi

      pg_dump \
        "${DATABASE_URL:-postgresql://reader:password@localhost:5432/reader_organizer}" \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        | gzip > cortex_export.sql.gz
    fi

    FILESIZE=$(du -h cortex_export.sql.gz | cut -f1)
    echo ""
    echo "Export complete: cortex_export.sql.gz (${FILESIZE})"
    echo ""
    echo "Next steps:"
    echo "  1. Copy to your server:  scp cortex_export.sql.gz user@YOUR_SERVER_IP:/opt/cortex/"
    echo "  2. On the server, run:   ./scripts/migrate-data.sh import /opt/cortex/cortex_export.sql.gz"
    ;;

  import)
    DUMP_FILE="${2:-}"
    if [[ -z "$DUMP_FILE" ]]; then
      echo "Usage: $0 import <path-to-dump.sql.gz>"
      exit 1
    fi

    if [[ ! -f "$DUMP_FILE" ]]; then
      echo "Error: File not found: $DUMP_FILE"
      exit 1
    fi

    COMPOSE_FILE="${COMPOSE_FILE:-/opt/cortex/docker-compose.prod.yml}"

    echo "=== Importing data into production Cortex database ==="
    echo "File: $DUMP_FILE"
    echo ""

    # Make sure services are up
    if ! docker compose -f "$COMPOSE_FILE" ps db | grep -q "running"; then
      echo "Starting database..."
      docker compose -f "$COMPOSE_FILE" up db -d
      echo "Waiting for database to be ready..."
      sleep 5
    fi

    DB_CONTAINER=$(docker compose -f "$COMPOSE_FILE" ps -q db)

    echo "Importing data (this may take a moment)..."
    gunzip -c "$DUMP_FILE" | docker exec -i "$DB_CONTAINER" psql \
      -U reader \
      -d reader_organizer \
      --single-transaction

    echo ""
    echo "Import complete. Verifying..."

    # Quick sanity check
    ITEM_COUNT=$(docker exec "$DB_CONTAINER" psql -U reader -d reader_organizer -tAc "SELECT COUNT(*) FROM items;")
    CAT_COUNT=$(docker exec "$DB_CONTAINER" psql -U reader -d reader_organizer -tAc "SELECT COUNT(*) FROM categories;")
    TAG_COUNT=$(docker exec "$DB_CONTAINER" psql -U reader -d reader_organizer -tAc "SELECT COUNT(*) FROM tags;")

    echo "  Items:      ${ITEM_COUNT}"
    echo "  Categories: ${CAT_COUNT}"
    echo "  Tags:       ${TAG_COUNT}"
    echo ""
    echo "Migration complete! You can now start all services:"
    echo "  docker compose -f $COMPOSE_FILE up -d"
    ;;

  *)
    echo "Cortex Data Migration"
    echo ""
    echo "Usage:"
    echo "  $0 export                    Export local database to cortex_export.sql.gz"
    echo "  $0 import <file.sql.gz>      Import dump into production database"
    ;;
esac
