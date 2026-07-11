-- Migration 003: Add is_active column to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);
