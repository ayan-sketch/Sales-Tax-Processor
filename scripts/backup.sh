#!/bin/bash
# Backup Automation Script for Tax Compliance Management System
# Usage: ./scripts/backup.sh [daily|weekly|monthly]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_BASE="$PROJECT_DIR/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_TYPE="${1:-daily}"

case "$BACKUP_TYPE" in
  daily)   BACKUP_DIR="$BACKUP_BASE/daily" ;;
  weekly)  BACKUP_DIR="$BACKUP_BASE/weekly" ;;
  monthly) BACKUP_DIR="$BACKUP_BASE/monthly" ;;
  *)       echo "Unknown backup type: $BACKUP_TYPE. Use daily|weekly|monthly"; exit 1 ;;
esac

mkdir -p "$BACKUP_DIR"

echo "=== Tax Compliance Backup: $BACKUP_TYPE ($TIMESTAMP) ==="

# 1. Database backup
DB_FILE="$PROJECT_DIR/tax_compliance.db"
if [ -f "$DB_FILE" ]; then
  DB_BACKUP="$BACKUP_DIR/db_${TIMESTAMP}.sqlite"
  cp "$DB_FILE" "$DB_BACKUP"
  echo "Database backed up: $DB_BACKUP ($(du -h "$DB_BACKUP" | cut -f1))"
else
  echo "Warning: Database file not found at $DB_FILE"
fi

# 2. Environment file backup
ENV_FILE="$PROJECT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "$BACKUP_DIR/env_${TIMESTAMP}.env"
  echo "Environment file backed up"
fi

# 3. User data backup (uploads, exports)
STORAGE_DIR="$PROJECT_DIR/storage"
if [ -d "$STORAGE_DIR" ]; then
  STORAGE_BACKUP="$BACKUP_DIR/storage_${TIMESTAMP}.tar.gz"
  tar -czf "$STORAGE_BACKUP" -C "$PROJECT_DIR" storage/ 2>/dev/null || echo "Note: storage backup skipped (empty or missing)"
  if [ -f "$STORAGE_BACKUP" ]; then
    echo "Storage backed up: $STORAGE_BACKUP ($(du -h "$STORAGE_BACKUP" | cut -f1))"
  fi
fi

# 4. Retention cleanup (keep last 30 daily, 12 weekly, 24 monthly)
case "$BACKUP_TYPE" in
  daily)
    ls -t "$BACKUP_DIR"/db_*.sqlite 2>/dev/null | tail -n +31 | xargs -r rm -f
    ;;
  weekly)
    ls -t "$BACKUP_DIR"/db_*.sqlite 2>/dev/null | tail -n +13 | xargs -r rm -f
    ;;
  monthly)
    ls -t "$BACKUP_DIR"/db_*.sqlite 2>/dev/null | tail -n +25 | xargs -r rm -f
    ;;
esac

echo "Backup complete: $BACKUP_TYPE ($TIMESTAMP)"
echo "Backup location: $BACKUP_DIR"