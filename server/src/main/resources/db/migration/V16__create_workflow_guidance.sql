CREATE TABLE workflow_guidance (
    id BIGSERIAL PRIMARY KEY,
    workflow_id BIGINT NOT NULL,
    publication_version INT NOT NULL,
    raw_json JSONB NOT NULL,
    summary_json JSONB,
    generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_user_edited BOOLEAN NOT NULL DEFAULT FALSE,
    edited_by BIGINT,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE (workflow_id, publication_version)
);

CREATE INDEX idx_workflow_guidance_workflow_id ON workflow_guidance(workflow_id);
