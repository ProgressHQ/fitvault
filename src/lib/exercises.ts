import { getPool } from "./db";
import type { ExerciseRow, Lang } from "./types";
import { localize, localizeArray } from "./types";

export interface ListExercisesOptions {
  cursor?: string;
  limit?: number;
  lang?: Lang;
  q?: string;
  muscle_groups?: string[];
  equipment?: string[];
  difficulty?: string;
  movement_pattern?: string;
}

export interface ExerciseSummary {
  id: string;
  name: string;
  difficulty: string;
  muscle_groups: string[];
  equipment: string[];
  movement_pattern: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  video_url: string | null;
  duration_seconds: number | null;
}

export interface ExerciseDetail extends ExerciseSummary {
  description: string;
  instructions: string[];
  contributor_id: string | null;
  status: string;
  created_at: string;
}

function thumbnailUrl(key: string | null): string | null {
  if (!key) return null;
  const base = process.env["CLOUDFRONT_BASE_URL"];
  return base ? `${base}/${key}` : null;
}

function previewUrl(key: string | null): string | null {
  if (!key) return null;
  const base = process.env["CLOUDFRONT_BASE_URL"];
  return base ? `${base}/${key}` : null;
}

function toSummary(row: ExerciseRow, lang: Lang): ExerciseSummary {
  return {
    id: row.id,
    name: localize(row.name, lang),
    difficulty: row.difficulty,
    muscle_groups: row.muscle_groups,
    equipment: row.equipment,
    movement_pattern: row.movement_pattern,
    thumbnail_url: thumbnailUrl(row.thumbnail_s3_key),
    preview_url: previewUrl(row.preview_clip_s3_key),
    video_url: row.video_url ?? null,
    duration_seconds: row.duration_seconds,
  };
}

function toDetail(row: ExerciseRow, lang: Lang): ExerciseDetail {
  return {
    ...toSummary(row, lang),
    description: localize(row.description, lang),
    instructions: localizeArray(row.instructions, lang),
    contributor_id: row.contributor_id,
    status: row.status,
    created_at: row.created_at,
  };
}

export async function listExercises(opts: ListExercisesOptions): Promise<{
  exercises: ExerciseSummary[];
  nextCursor: string | null;
}> {
  const pool = getPool();
  const lang: Lang = opts.lang ?? "en";
  const limit = Math.min(opts.limit ?? 20, 100);

  const params: unknown[] = ["APPROVED"];
  const conditions: string[] = ["e.status = $1"];
  let i = 2;

  if (opts.cursor) {
    params.push(opts.cursor);
    conditions.push(`e.id > $${i++}`);
  }
  if (opts.q) {
    const q = `%${opts.q}%`;
    params.push(q);
    conditions.push(
      `(e.name->>'${lang}' ILIKE $${i} OR e.name->>'en' ILIKE $${i} OR e.description->>'${lang}' ILIKE $${i} OR e.description->>'en' ILIKE $${i})`
    );
    i++;
  }
  if (opts.muscle_groups && opts.muscle_groups.length > 0) {
    params.push(opts.muscle_groups);
    conditions.push(`e.muscle_groups && $${i++}`);
  }
  if (opts.equipment && opts.equipment.length > 0) {
    params.push(opts.equipment);
    conditions.push(`e.equipment && $${i++}`);
  }
  if (opts.difficulty) {
    params.push(opts.difficulty);
    conditions.push(`e.difficulty = $${i++}`);
  }
  if (opts.movement_pattern) {
    params.push(opts.movement_pattern);
    conditions.push(`e.movement_pattern = $${i++}`);
  }

  params.push(limit + 1);
  const sql = `
    SELECT e.*
    FROM fitvault_exercises e
    WHERE ${conditions.join(" AND ")}
    ORDER BY e.id
    LIMIT $${i}
  `;

  const result = await pool.query<ExerciseRow>(sql, params);
  const rows = result.rows;
  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;

  return {
    exercises: slice.map((r) => toSummary(r, lang)),
    nextCursor: hasMore && slice.length > 0 ? (slice[slice.length - 1]!.id) : null,
  };
}

export async function getExercise(
  id: string,
  lang: Lang = "en",
  includeNonApproved = false
): Promise<ExerciseDetail | null> {
  const pool = getPool();
  const statusClause = includeNonApproved ? "" : "AND e.status = 'APPROVED'";
  const result = await pool.query<ExerciseRow>(
    `SELECT * FROM fitvault_exercises e WHERE e.id = $1 ${statusClause} LIMIT 1`,
    [id]
  );
  const row = result.rows[0];
  return row ? toDetail(row, lang) : null;
}

export async function listPendingReview(): Promise<ExerciseDetail[]> {
  const pool = getPool();
  const result = await pool.query<ExerciseRow>(
    `SELECT * FROM fitvault_exercises WHERE status = 'PENDING_REVIEW' ORDER BY created_at ASC`
  );
  return result.rows.map((r) => toDetail(r, "en"));
}

export async function updateExerciseStatus(
  id: string,
  status: string,
  reviewerId: string
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE fitvault_exercises
     SET status = $1, reviewer_id = $2, reviewed_at = now(), updated_at = now()
     WHERE id = $3`,
    [status, reviewerId, id]
  );
}

export async function createExerciseDraft(
  contributorId: string,
  data: {
    name: Record<string, string>;
    description?: Record<string, string>;
    muscle_groups: string[];
    equipment: string[];
    difficulty: string;
    movement_pattern?: string;
    instructions?: Record<string, string[]>;
  }
): Promise<string> {
  const pool = getPool();
  const result = await pool.query<{ id: string }>(
    `INSERT INTO fitvault_exercises
       (name, description, muscle_groups, equipment, difficulty, movement_pattern, instructions, contributor_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DRAFT')
     RETURNING id`,
    [
      JSON.stringify(data.name),
      data.description ? JSON.stringify(data.description) : null,
      data.muscle_groups,
      data.equipment,
      data.difficulty,
      data.movement_pattern ?? null,
      data.instructions ? JSON.stringify(data.instructions) : null,
      contributorId,
    ]
  );
  const row = result.rows[0];
  if (!row) throw new Error("Failed to create exercise draft");
  return row.id;
}

export async function setExerciseVideoKeys(
  id: string,
  keys: {
    full_video_s3_key?: string;
    preview_clip_s3_key?: string;
    thumbnail_s3_key?: string;
  }
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE fitvault_exercises
     SET full_video_s3_key = COALESCE($2, full_video_s3_key),
         preview_clip_s3_key = COALESCE($3, preview_clip_s3_key),
         thumbnail_s3_key = COALESCE($4, thumbnail_s3_key),
         status = 'PENDING_REVIEW',
         updated_at = now()
     WHERE id = $1`,
    [id, keys.full_video_s3_key ?? null, keys.preview_clip_s3_key ?? null, keys.thumbnail_s3_key ?? null]
  );
}
