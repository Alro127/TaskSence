DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
       id BIGSERIAL PRIMARY KEY,

       receiver_id BIGINT NOT NULL,
       actor_id BIGINT,

       type VARCHAR(50) NOT NULL,

       reference_type VARCHAR(50),
       reference_id BIGINT,

       payload JSONB,

       read_at TIMESTAMPTZ,
       created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

       CONSTRAINT fk_notification_receiver
           FOREIGN KEY (receiver_id)
               REFERENCES users(id)
               ON DELETE CASCADE
);

-- Index tối ưu query
CREATE INDEX idx_notifications_receiver_created
    ON notifications(receiver_id, created_at DESC);

CREATE INDEX idx_notifications_receiver_unread
    ON notifications(receiver_id)
    WHERE read_at IS NULL;