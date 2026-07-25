ALTER TABLE fitvault_exercises
    ADD COLUMN aliases JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX fitvault_exercises_aliases_idx
    ON fitvault_exercises USING GIN (aliases);
