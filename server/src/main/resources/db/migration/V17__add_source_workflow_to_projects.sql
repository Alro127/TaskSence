ALTER TABLE projects ADD COLUMN source_workflow_id BIGINT;
ALTER TABLE projects ADD CONSTRAINT fk_projects_source_workflow FOREIGN KEY (source_workflow_id) REFERENCES workflows(id) ON DELETE SET NULL;
