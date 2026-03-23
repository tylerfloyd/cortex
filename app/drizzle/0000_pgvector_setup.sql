-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Full-text search index on items
CREATE INDEX IF NOT EXISTS idx_items_fts
  ON items
  USING gin(to_tsvector('english',
    coalesce(title, '') || ' ' ||
    coalesce(raw_content, '') || ' ' ||
    coalesce(summary, '')
  ));

-- IVFFlat index for cosine similarity search on embeddings
-- Note: this index requires the table to contain data before it is useful.
-- Run AFTER the base schema migration has applied the items table.
CREATE INDEX IF NOT EXISTS idx_items_embedding
  ON items
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Auto-update updated_at on items table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index for looking up job history by item
CREATE INDEX IF NOT EXISTS idx_job_log_item_id ON job_log(item_id);
CREATE INDEX IF NOT EXISTS idx_job_log_status ON job_log(status);
