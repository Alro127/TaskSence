CREATE TABLE project_guidance_progress (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL UNIQUE,
    workflow_guidance_id BIGINT NOT NULL,
    current_step_id VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_guidance_id) REFERENCES workflow_guidance(id) ON DELETE CASCADE
);

CREATE TABLE project_guidance_completed_steps (
    progress_id BIGINT NOT NULL,
    step_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (progress_id, step_id),
    FOREIGN KEY (progress_id) REFERENCES project_guidance_progress(id) ON DELETE CASCADE
);

CREATE TABLE project_guidance_target (
    id BIGSERIAL PRIMARY KEY,
    progress_id BIGINT NOT NULL,
    step_id VARCHAR(255) NOT NULL,
    target_type VARCHAR(255) NOT NULL,
    required_count INT NOT NULL DEFAULT 1,
    current_count INT NOT NULL DEFAULT 0,
    target_metadata JSONB,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (progress_id) REFERENCES project_guidance_progress(id) ON DELETE CASCADE
);

CREATE INDEX idx_project_guidance_progress_project_id ON project_guidance_progress(project_id);
CREATE INDEX idx_project_guidance_target_progress_id ON project_guidance_target(progress_id);
