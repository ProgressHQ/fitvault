/**
 * Seed the fitvault_exercises table from trainely_exercises.json.
 * Run: DATABASE_URL=... npm run seed
 */

import { readFileSync } from "fs";
import { join } from "path";
import { Pool } from "pg";

interface BlobExercise {
  id: string;
  name: string;
  level: string;
  force: string | null;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  category: string;
  instructions: { en?: string[]; pl?: string[] } | string[];
  video?: string;
  aliases?: { en?: string[]; pl?: string[] };
}

// ── field mappings ─────────────────────────────────────────────────────────

const LEVEL_MAP: Record<string, string> = {
  beginner: "BEGINNER",
  intermediate: "INTERMEDIATE",
  advanced: "ADVANCED",
};

const EQUIPMENT_MAP: Record<string, string> = {
  "body only": "BODYWEIGHT",
  "barbell": "BARBELL",
  "dumbbell": "DUMBBELL",
  "kettlebells": "KETTLEBELL",
  "cable": "CABLE",
  "machine": "MACHINE",
  "bands": "BANDS",
  "bench": "BENCH",
  "e-z curl bar": "BARBELL",
  "exercise ball": "BODYWEIGHT",
  "foam roll": "BODYWEIGHT",
  "medicine ball": "BODYWEIGHT",
  "other": "BODYWEIGHT",
};

const MUSCLE_MAP: Record<string, string> = {
  "abdominals": "CORE",
  "abductors": "GLUTES",
  "adductors": "GLUTES",
  "biceps": "BICEPS",
  "calves": "CALVES",
  "chest": "CHEST",
  "forearms": "BICEPS",
  "glutes": "GLUTES",
  "hamstrings": "HAMSTRINGS",
  "hip flexors": "CORE",
  "lats": "BACK",
  "lower back": "BACK",
  "middle back": "BACK",
  "traps": "BACK",
  "neck": "SHOULDERS",
  "quadriceps": "QUADS",
  "shoulders": "SHOULDERS",
  "triceps": "TRICEPS",
  "full body": "FULL_BODY",
};

const FORCE_MAP: Record<string, string> = {
  push: "PUSH",
  pull: "PULL",
  static: "CARRY",
};

function mapEquipment(eq: string | null): string {
  if (!eq) return "BODYWEIGHT";
  return EQUIPMENT_MAP[eq.toLowerCase()] ?? "BODYWEIGHT";
}

function mapMuscles(muscles: string[]): string[] {
  const out = new Set<string>();
  for (const m of muscles) {
    const mapped = MUSCLE_MAP[m.toLowerCase()];
    if (mapped) out.add(mapped);
  }
  return Array.from(out);
}

function mapForce(force: string | null): string | null {
  if (!force) return null;
  return FORCE_MAP[force.toLowerCase()] ?? null;
}

function normalizeInstructions(raw: BlobExercise["instructions"]): { en?: string[]; pl?: string[] } | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return raw.length > 0 ? { en: raw as string[] } : null;
  }
  return Object.keys(raw).length > 0 ? raw : null;
}

// ── main ──────────────────────────────────────────────────────────────────

async function main() {
  const dbUrl = process.env["DATABASE_URL"];
  if (!dbUrl) throw new Error("DATABASE_URL is required");

  const pool = new Pool({ connectionString: dbUrl });

  const blobPath = join(__dirname, "../trainely_exercises.json");
  const raw = readFileSync(blobPath, "utf-8");
  const exercises: BlobExercise[] = JSON.parse(raw) as BlobExercise[];

  console.log(`Seeding ${exercises.length} exercises…`);

  let inserted = 0;
  let skipped = 0;

  for (const ex of exercises) {
    const name = { en: ex.name };
    const muscleGroups = mapMuscles(ex.primaryMuscles);
    const equipment = [mapEquipment(ex.equipment)];
    const difficulty = LEVEL_MAP[ex.level] ?? "BEGINNER";
    const movementPattern = mapForce(ex.force);
    const instructions = normalizeInstructions(ex.instructions);
    const videoUrl = ex.video && ex.video.trim() !== "" ? ex.video.trim() : null;
    const aliases = ex.aliases ?? (ex.id === "Romanian_Deadlift"
      ? { en: ["RDL"], pl: ["rumuński martwy ciąg"] }
      : ex.id === "Dumbbell_Shoulder_Press"
        ? { en: ["Shoulder press", "DB shoulder press"], pl: ["wyciskanie hantli nad głowę"] }
        : {});

    if (!muscleGroups.length) muscleGroups.push("CORE");

    try {
      await pool.query(
        `INSERT INTO fitvault_exercises
           (external_id, name, muscle_groups, equipment, difficulty, movement_pattern, instructions, video_url, aliases, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'APPROVED')
         ON CONFLICT (external_id) DO UPDATE SET aliases = EXCLUDED.aliases`,
        [
          ex.id,
          JSON.stringify(name),
          muscleGroups,
          equipment,
          difficulty,
          movementPattern,
          instructions ? JSON.stringify(instructions) : null,
          videoUrl,
          JSON.stringify(aliases),
        ]
      );
      inserted++;
    } catch (err) {
      console.error(`Failed to insert "${ex.name}":`, err);
      skipped++;
    }

    if (inserted % 100 === 0 && inserted > 0) {
      process.stdout.write(`  ${inserted}/${exercises.length}\r`);
    }
  }

  await pool.end();
  console.log(`\nDone. Inserted: ${inserted}, skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
