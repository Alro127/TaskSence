CREATE TABLE sprints (
                         id BIGSERIAL PRIMARY KEY,
                         project_id BIGINT NOT NULL,
                         name VARCHAR(255) NOT NULL,
                         goal TEXT,
                         status VARCHAR(50) NOT NULL DEFAULT 'PLANNING'
                             CHECK (status IN ('PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
                         start_date DATE NOT NULL,
                         end_date DATE NOT NULL,
                         created_by BIGINT NOT NULL,
                         created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                         deleted_at TIMESTAMPTZ,

                         CHECK (end_date >= start_date),

                         FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                         FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_sprints_project_id ON sprints(project_id);

ALTER TABLE tasks
    ADD COLUMN sprint_id BIGINT;

ALTER TABLE tasks
    ADD CONSTRAINT fk_tasks_sprint
        FOREIGN KEY (sprint_id)
            REFERENCES sprints(id)
            ON DELETE SET NULL;

ALTER TABLE workspaces
    ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE workspace_join_requests (
                                         id BIGSERIAL PRIMARY KEY,
                                         workspace_id BIGINT NOT NULL,
                                         user_id BIGINT NOT NULL,
                                         status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
                                             CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
                                         message TEXT,
                                         reviewed_by BIGINT,
                                         reviewed_at TIMESTAMPTZ,
                                         created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                                         updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                                         UNIQUE (workspace_id, user_id),

                                         FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
                                         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                         FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_workspace_join_requests_workspace_id
    ON workspace_join_requests(workspace_id);

CREATE TABLE project_join_requests (
                                       id BIGSERIAL PRIMARY KEY,
                                       project_id BIGINT NOT NULL,
                                       user_id BIGINT NOT NULL,
                                       status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
                                           CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
                                       message TEXT,
                                       reviewed_by BIGINT,
                                       reviewed_at TIMESTAMPTZ,
                                       created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                                       updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                                       UNIQUE (project_id, user_id),

                                       FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                                       FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                       FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_project_join_requests_project_id
    ON project_join_requests(project_id);