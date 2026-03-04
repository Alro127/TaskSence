CREATE TABLE workspace_invites (
       id BIGSERIAL PRIMARY KEY,

       workspace_id BIGINT NOT NULL,

       email VARCHAR(255) NOT NULL,

       role VARCHAR(100) NOT NULL
           CHECK (role IN ('OWNER', 'MANAGER', 'MEMBER', 'VIEWER')),

       token VARCHAR(255) NOT NULL UNIQUE,

       status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
           CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')),

       invited_by BIGINT NOT NULL,

       invited_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

       expired_at TIMESTAMPTZ NOT NULL,

       accepted_at TIMESTAMPTZ,

       created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
       deleted_at TIMESTAMPTZ,

       CONSTRAINT fk_workspace_invites_workspace
           FOREIGN KEY (workspace_id)
               REFERENCES workspaces(id)
               ON DELETE CASCADE,

       CONSTRAINT fk_workspace_invites_invited_by
           FOREIGN KEY (invited_by)
               REFERENCES users(id)
               ON DELETE CASCADE
);

CREATE UNIQUE INDEX ux_workspace_invites_pending
    ON workspace_invites (workspace_id, email)
    WHERE status = 'PENDING' AND deleted_at IS NULL;

CREATE INDEX idx_workspace_invites_workspace_id
    ON workspace_invites (workspace_id);

CREATE INDEX idx_workspace_invites_email
    ON workspace_invites (email);

CREATE INDEX idx_workspace_invites_token
    ON workspace_invites (token);

