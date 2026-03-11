
ALTER TABLE comment_mentions
DROP CONSTRAINT comment_mentions_pkey;

ALTER TABLE comment_mentions
    ADD COLUMN id BIGSERIAL PRIMARY KEY;

ALTER TABLE comment_mentions
    ADD CONSTRAINT uq_comment_mentions UNIQUE (comment_id, user_id);


ALTER TABLE comment_reactions
DROP CONSTRAINT comment_reactions_pkey;

ALTER TABLE comment_reactions
    ADD COLUMN id BIGSERIAL PRIMARY KEY;

ALTER TABLE comment_reactions
    ADD CONSTRAINT uq_comment_reactions UNIQUE (comment_id, user_id, icon);

CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);

CREATE INDEX idx_comment_mentions_user_id ON comment_mentions(user_id);

CREATE INDEX idx_comment_reactions_comment_id ON comment_reactions(comment_id);