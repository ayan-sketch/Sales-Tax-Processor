-- ============================================================================
-- Migration 004: Document Module Enhancements
-- Adds metadata, classification, compliance, activity logging, and search
-- ============================================================================

-- ============================================================================
-- 1. NEW ENUM TYPES
-- ============================================================================

-- Document categories for tax compliance
DO $$ BEGIN
    CREATE TYPE document_category AS ENUM (
        'Sales Tax Return', '236H', '153', 'KPRA', 
        'Income Tax Return', 'Working File', 'Notice', 'Other'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Document filing status (extends existing filing_status for documents)
DO $$ BEGIN
    CREATE TYPE doc_filing_status AS ENUM (
        'Filed', 'Pending', 'Not Filed', 'Overdue', 'Missing', 'Uploaded'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Activity types for document tracking
DO $$ BEGIN
    CREATE TYPE document_activity_type AS ENUM (
        'view', 'download', 'print', 'preview', 'upload', 'delete',
        'rename', 'move', 'copy', 'restore', 'share'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. ADD COLUMNS TO DOCUMENTS TABLE
-- ============================================================================

-- Classification columns
ALTER TABLE documents ADD COLUMN IF NOT EXISTS doc_category document_category;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS classification_method VARCHAR(50);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS classification_confidence REAL DEFAULT 0.0;

-- Tax period columns
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tax_year INTEGER;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tax_month INTEGER;

-- Compliance columns
ALTER TABLE documents ADD COLUMN IF NOT EXISTS filing_status doc_filing_status;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_missing BOOLEAN DEFAULT FALSE;

-- Date columns
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_date DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Audit columns
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Version control
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL;

-- Metadata columns
ALTER TABLE documents ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE documents ADD COLUMN IF NOT EXISTS custom_metadata JSONB DEFAULT '{}';

-- Batch tracking
ALTER TABLE documents ADD COLUMN IF NOT EXISTS batch_id UUID;

-- Checksum for file integrity
ALTER TABLE documents ADD COLUMN IF NOT EXISTS checksum VARCHAR(64);

-- Timestamps
ALTER TABLE documents ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ============================================================================
-- 3. NEW TABLES
-- ============================================================================

-- Document Activity Log
CREATE TABLE IF NOT EXISTS document_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    activity_type document_activity_type NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Saved Filter Presets
CREATE TABLE IF NOT EXISTS saved_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    filter_config JSONB NOT NULL,
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

-- Classification indexes
CREATE INDEX IF NOT EXISTS idx_documents_doc_category ON documents(doc_category);
CREATE INDEX IF NOT EXISTS idx_documents_filing_status ON documents(filing_status);

-- Tax period indexes
CREATE INDEX IF NOT EXISTS idx_documents_tax_year_month ON documents(tax_year, tax_month);
CREATE INDEX IF NOT EXISTS idx_documents_tax_year ON documents(tax_year);
CREATE INDEX IF NOT EXISTS idx_documents_tax_month ON documents(tax_month);

-- Compliance indexes
CREATE INDEX IF NOT EXISTS idx_documents_is_missing ON documents(is_missing) WHERE is_missing = TRUE;
CREATE INDEX IF NOT EXISTS idx_documents_compliance_check ON documents(client_id, doc_category, tax_year, tax_month, filing_status);
CREATE INDEX IF NOT EXISTS idx_documents_compliance_missing ON documents(client_id, is_missing, doc_category) WHERE is_deleted = FALSE;

-- Audit indexes
CREATE INDEX IF NOT EXISTS idx_documents_is_deleted ON documents(is_deleted) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON documents(deleted_at);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date_desc ON documents(upload_date DESC);

-- Metadata indexes
CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_documents_batch_id ON documents(batch_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_date ON documents(document_date);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_documents_custom_metadata ON documents USING GIN(custom_metadata);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_documents_client_date ON documents(client_id, upload_date DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_documents_client_category ON documents(client_id, doc_category) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_documents_category_year ON documents(doc_category, tax_year);
CREATE INDEX IF NOT EXISTS idx_documents_active ON documents(is_deleted, upload_date DESC);

-- Full-text search
ALTER TABLE documents ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING GIN(search_vector);

-- Trigram indexes for fuzzy search
CREATE INDEX IF NOT EXISTS idx_documents_file_name_trgm ON documents USING GIN(file_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_original_name_trgm ON documents USING GIN(original_file_name gin_trgm_ops);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_doc_activity_document ON document_activity_log(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_activity_user ON document_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_activity_type ON document_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_doc_activity_date ON document_activity_log(created_at DESC);

-- Saved filters indexes
CREATE INDEX IF NOT EXISTS idx_saved_filters_user ON saved_filters(user_id);

-- ============================================================================
-- 5. SEARCH TRIGGER
-- ============================================================================

-- Function to update search vector on documents
CREATE OR REPLACE FUNCTION documents_search_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.file_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.original_file_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'C');
    IF NEW.doc_category IS NOT NULL THEN
        NEW.search_vector := NEW.search_vector ||
            setweight(to_tsvector('english', COALESCE(NEW.doc_category::text, '')), 'B');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS trg_documents_search ON documents;
CREATE TRIGGER trg_documents_search
    BEFORE INSERT OR UPDATE OF file_name, original_file_name, doc_category, notes
    ON documents
    FOR EACH ROW
    EXECUTE FUNCTION documents_search_update();

-- ============================================================================
-- 6. DATA MIGRATION
-- ============================================================================

-- Set created_at = upload_date for existing records
UPDATE documents SET created_at = upload_date WHERE created_at IS NULL;
UPDATE documents SET updated_at = upload_date WHERE updated_at IS NULL;

-- ============================================================================
-- 7. VIEWS (optional, for performance)
-- ============================================================================

-- View: documents with client data for search
CREATE OR REPLACE VIEW v_documents_with_client AS
SELECT 
    d.*,
    c.client_name,
    c.ntn,
    c.strn,
    c.cnic,
    c.sales_tax_registered,
    c.withholding_registered
FROM documents d
LEFT JOIN clients c ON d.client_id = c.id;