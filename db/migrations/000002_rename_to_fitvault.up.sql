DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'video_library_exercises') THEN
    ALTER TABLE video_library_exercises RENAME TO fitvault_exercises;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'video_library_products') THEN
    ALTER TABLE video_library_products RENAME TO fitvault_products;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ppv_contributors') THEN
    ALTER TABLE ppv_contributors RENAME TO fitvault_contributors;
  END IF;
END $$;
