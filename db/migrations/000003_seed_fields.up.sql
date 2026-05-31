ALTER TABLE fitvault_exercises
    ADD COLUMN external_id TEXT UNIQUE,
    ADD COLUMN video_url   TEXT;
