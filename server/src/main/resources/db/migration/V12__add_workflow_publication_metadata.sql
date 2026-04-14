ALTER TABLE workflows
    ADD COLUMN published_at TIMESTAMPTZ,
    ADD COLUMN publication_version INT NOT NULL DEFAULT 1;

CREATE INDEX idx_workflows_status_published_at ON workflows(status, published_at DESC);
CREATE INDEX idx_workflows_status ON workflows(status);
