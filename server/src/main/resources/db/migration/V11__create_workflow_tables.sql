CREATE TABLE workflows (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'PUBLIC')),
    generation_source VARCHAR(50) NOT NULL DEFAULT 'RULE_BASED'
        CHECK (generation_source IN ('RULE_BASED', 'AI_REFINED')),
    ai_refinement_requested BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE workflow_steps (
    id BIGSERIAL PRIMARY KEY,
    workflow_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position INT NOT NULL DEFAULT 0,
    source_type VARCHAR(50) NOT NULL DEFAULT 'RULE',
    source_sprint_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    UNIQUE (workflow_id, position),
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (source_sprint_id) REFERENCES sprints(id) ON DELETE SET NULL
);

CREATE TABLE workflow_step_tasks (
    id BIGSERIAL PRIMARY KEY,
    workflow_step_id BIGINT NOT NULL,
    task_id BIGINT NOT NULL,
    UNIQUE (workflow_step_id, task_id),
    FOREIGN KEY (workflow_step_id) REFERENCES workflow_steps(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflows_project_id ON workflows(project_id);
CREATE INDEX idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX idx_workflow_step_tasks_workflow_step_id ON workflow_step_tasks(workflow_step_id);
CREATE INDEX idx_workflow_step_tasks_task_id ON workflow_step_tasks(task_id);
