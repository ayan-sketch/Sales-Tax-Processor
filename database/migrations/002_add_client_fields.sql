-- ============================================================================
-- Migration 002: Add additional client fields
-- ============================================================================

-- Contact Person fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_person_designation VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_person_phone VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_person_email VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS secondary_phone VARCHAR(50);

-- Address breakdown
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS province VARCHAR(100);

-- Business classification
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_type VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_type VARCHAR(50);

-- Tax registration metadata
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sales_tax_material_status VARCHAR(10) NOT NULL DEFAULT 'NIL';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS withholding_236_applied BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS withholding_236_prepared_by_us BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS withholding_153_applicable BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS withholding_153_prepared_by_us BOOLEAN NOT NULL DEFAULT false;

-- Tax details
ALTER TABLE clients ADD COLUMN IF NOT EXISTS registration_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tax_period VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS fbr_office VARCHAR(255);

-- ============================================================================
-- Indexes for new searchable fields
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_clients_contact_person ON clients(contact_person);
CREATE INDEX IF NOT EXISTS idx_clients_city ON clients(city);
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_business_type ON clients(business_type);