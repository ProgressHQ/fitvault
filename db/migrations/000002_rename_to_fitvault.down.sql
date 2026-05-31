DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fitvault_exercises') THEN
    ALTER TABLE fitvault_exercises RENAME TO video_library_exercises;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fitvault_products') THEN
    ALTER TABLE fitvault_products RENAME TO video_library_products;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fitvault_contributors') THEN
    ALTER TABLE fitvault_contributors RENAME TO ppv_contributors;
  END IF;
END $$;
