-- Migration 005: Desktop Sync System
-- Date: 2026-07-01
-- Description: Add desktop synchronization configuration and tracking

-- Create sync configuration table
CREATE TABLE IF NOT EXISTS sync_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    desktop_base_path TEXT NOT NULL DEFAULT 'Desktop/SaleTaxSoftware',
    sync_enabled BOOLEAN DEFAULT true,
    sync_direction TEXT DEFAULT 'software_to_desktop' CHECK(sync_direction IN ('software_to_desktop', 'desktop_to_software', 'bidirectional')),
    auto_sync BOOLEAN DEFAULT true,
    sync_on_startup BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add desktop sync tracking columns to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS desktop_synced BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS desktop_path TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS desktop_synced_at TIMESTAMP;

-- Add document_id foreign key to withholding_records
ALTER TABLE withholding_records ADD COLUMN IF NOT EXISTS document_id TEXT;
ALTER TABLE withholding_records ADD FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;

-- Add document_id foreign key to sales_tax_records
ALTER TABLE sales_tax_records ADD COLUMN IF NOT EXISTS document_id TEXT;
ALTER TABLE sales_tax_records ADD FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;

-- Insert default sync configuration
INSERT INTO sync_config (id, desktop_base_path, sync_enabled, sync_direction, auto_sync, sync_on_startup)
VALUES ('default', 'Desktop/SaleTaxSoftware', true, 'software_to_desktop', true, true)
ON CONFLICT(id) DO NOTHING;

-- Create index for faster desktop sync queries
CREATE INDEX IF NOT EXISTS idx_documents_desktop_synced ON documents(desktop_synced);
CREATE INDEX IF NOT EXISTS idx_documents_desktop_path ON documents(desktop_path);
CREATE INDEX IF NOT EXISTS idx_withholding_document_id ON withholding_records(document_id);
CREATE INDEX IF NOT EXISTS idx_sales_tax_document_id ON sales_tax_records(document_id);