import type { ExerciseSummary } from "@/lib/exercises";

const DIFF_COLOUR: Record<string, string> = {
  BEGINNER: "bg-green-100 text-green-700",
  INTERMEDIATE: "bg-yellow-100 text-yellow-700",
  ADVANCED: "bg-red-100 text-red-700",
};

interface Props {
  exercise: ExerciseSummary;
  lang: "en" | "pl";
}

export default function ExerciseCard({ exercise }: Props) {
  return (
    <a
      href={`/exercises/${exercise.id}`}
      className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
    >
      {/* Thumbnail */}
      <div className="bg-gray-100 aspect-video overflow-hidden relative">
        {exercise.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={exercise.thumbnail_url}
            alt={exercise.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            No thumbnail
          </div>
        )}
        <span
          className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${DIFF_COLOUR[exercise.difficulty] ?? "bg-gray-100 text-gray-600"}`}
        >
          {exercise.difficulty}
        </span>
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col">
        <p className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-indigo-600 transition-colors">
          {exercise.name}
        </p>
        {exercise.muscle_groups.length > 0 && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
            {exercise.muscle_groups.slice(0, 3).join(" · ")}
            {exercise.muscle_groups.length > 3 ? " …" : ""}
          </p>
        )}
        {exercise.duration_seconds && (
          <p className="text-xs text-gray-400 mt-auto pt-2">
            {Math.round(exercise.duration_seconds / 60)} min
          </p>
        )}
      </div>
    </a>
  );
}
