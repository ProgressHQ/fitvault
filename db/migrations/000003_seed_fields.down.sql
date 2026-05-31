ALTER TABLE fitvault_exercises
    DROP COLUMN IF EXISTS external_id,
    DROP COLUMN IF EXISTS video_url;
