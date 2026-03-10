ALTER TABLE tasks
    DROP CONSTRAINT IF EXISTS tasks_due_date_check;

ALTER TABLE tasks
    ALTER COLUMN start_date TYPE TIMESTAMPTZ USING start_date::TIMESTAMPTZ,
    ALTER COLUMN due_date   TYPE TIMESTAMPTZ USING due_date::TIMESTAMPTZ;

ALTER TABLE tasks
    ADD CONSTRAINT tasks_due_date_check
        CHECK (due_date IS NULL OR start_date IS NULL OR due_date >= start_date);
