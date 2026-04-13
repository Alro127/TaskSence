CREATE TABLE workflow_comments (
    id BIGSERIAL PRIMARY KEY,
    parent_comment_id BIGINT,
    workflow_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (parent_comment_id) REFERENCES workflow_comments(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE workflow_comment_mentions (
    id BIGSERIAL PRIMARY KEY,
    comment_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    UNIQUE (comment_id, user_id),
    FOREIGN KEY (comment_id) REFERENCES workflow_comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE workflow_comment_reactions (
    id BIGSERIAL PRIMARY KEY,
    comment_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    UNIQUE (comment_id, user_id, icon),
    FOREIGN KEY (comment_id) REFERENCES workflow_comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflow_comments_workflow_id ON workflow_comments(workflow_id);
CREATE INDEX idx_workflow_comments_parent_id ON workflow_comments(parent_comment_id);

CREATE INDEX idx_workflow_comment_mentions_user_id ON workflow_comment_mentions(user_id);

CREATE INDEX idx_workflow_comment_reactions_comment_id ON workflow_comment_reactions(comment_id);
