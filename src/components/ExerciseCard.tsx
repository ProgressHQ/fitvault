import type { ExerciseSummary } from "@/lib/exercises";

const DIFF_BADGE: Record<string, string> = {
  BEGINNER:     "badge-green",
  INTERMEDIATE: "badge-amber",
  ADVANCED:     "badge-red",
};

interface Props {
  exercise: ExerciseSummary;
  lang: "en" | "pl";
}

export default function ExerciseCard({ exercise }: Props) {
  const diffClass = DIFF_BADGE[exercise.difficulty] ?? "badge-muted";

  return (
    <a href={`/exercises/${exercise.id}`} className="ex-card">
      <div className="ex-thumb">
        {exercise.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={exercise.thumbnail_url} alt={exercise.name} />
        ) : (
          <div className="ex-thumb-empty">No preview</div>
        )}
        <span className={`badge ${diffClass}`} style={{ position: "absolute", top: 8, right: 8 }}>
          {exercise.difficulty}
        </span>
      </div>
      <div className="ex-info">
        <p className="ex-name">{exercise.name}</p>
        {exercise.muscle_groups.length > 0 && (
          <p className="ex-muscles">
            {exercise.muscle_groups.slice(0, 3).join(" · ")}
            {exercise.muscle_groups.length > 3 ? " …" : ""}
          </p>
        )}
        {exercise.duration_seconds && (
          <p className="ex-duration">{Math.round(exercise.duration_seconds / 60)} min</p>
        )}
      </div>
    </a>
  );
}
