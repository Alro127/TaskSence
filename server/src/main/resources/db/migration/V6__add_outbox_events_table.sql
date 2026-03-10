DROP TABLE IF EXISTS outbox_events CASCADE;

CREATE TABLE outbox_events (
       id BIGSERIAL PRIMARY KEY,
       event_type VARCHAR(50) NOT NULL,
       entity_type VARCHAR(50),
       entity_id BIGINT,
       payload JSONB NOT NULL,
       delivery_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
           CHECK (delivery_status IN ('PENDING', 'SUCCESS', 'FAILED')),
       retry_count INT NOT NULL DEFAULT 0,
       created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
       published_at TIMESTAMPTZ
);

CREATE INDEX idx_outbox_events_pending
    ON outbox_events (created_at)
    WHERE delivery_status = 'PENDING';