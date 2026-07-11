-- Tax Compliance Management System - Database Initialization
-- This script runs on first PostgreSQL container startup

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enum types
DO $$ BEGIN
    CREATE TYPE filing_status AS ENUM ('filed', 'pending', 'not_filed', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE withholding_type AS ENUM ('236H', '153');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'consultant', 'compliance_officer', 'data_entry');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for search optimization (will be applied after tables created)
-- These are noted here for reference
-- CREATE INDEX idx_clients_name_trgm ON clients USING gin (name gin_trgm_ops);
-- CREATE INDEX idx_clients_ntn_trgm ON clients USING gin (ntn gin_trgm_ops);
-- CREATE INDEX idx_clients_cnic_trgm ON clients USING gin (cnic gin_trgm_ops);

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE tax_compliance TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;