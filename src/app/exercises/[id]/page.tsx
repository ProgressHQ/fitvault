import { notFound } from "next/navigation";
import { getExercise } from "@/lib/exercises";
import { listActiveProducts } from "@/lib/products";
import PurchasePrompt from "@/components/PurchasePrompt";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}

const DIFFICULTY_COLOUR: Record<string, string> = {
  BEGINNER: "bg-green-100 text-green-800",
  INTERMEDIATE: "bg-yellow-100 text-yellow-800",
  ADVANCED: "bg-red-100 text-red-800",
};

export default async function ExercisePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { lang: langParam } = await searchParams;
  const lang = (langParam ?? "en") as "en" | "pl";

  const exercise = await getExercise(id, lang);
  if (!exercise) notFound();

  const products = await listActiveProducts();
  const singleProduct = products.find((p) => p.type === "SINGLE_VIDEO");
  const subProduct = products.find(
    (p) => p.type === "SUBSCRIPTION_MONTHLY" || p.type === "SUBSCRIPTION_ANNUAL"
  );

  const diffColour = DIFFICULTY_COLOUR[exercise.difficulty] ?? "bg-gray-100 text-gray-700";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <a href="/" className="text-sm text-indigo-600 hover:underline mb-4 inline-block">
        ← Back to library
      </a>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Video area */}
        <div className="bg-gray-900 aspect-video flex items-center justify-center relative">
          {exercise.preview_url ? (
            <video
              src={exercise.preview_url}
              controls
              className="w-full h-full object-contain"
              poster={exercise.thumbnail_url ?? undefined}
            />
          ) : (
            <div className="text-gray-500 text-sm">No preview available</div>
          )}
          {!exercise.preview_url && exercise.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={exercise.thumbnail_url}
              alt={exercise.name}
              className="w-full h-full object-cover absolute inset-0"
            />
          )}
        </div>

        <div className="p-6">
          {/* Title + badges */}
          <div className="flex flex-wrap items-start gap-3 mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex-1">{exercise.name}</h1>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${diffColour}`}>
              {exercise.difficulty}
            </span>
          </div>

          {/* Muscle groups + equipment chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {exercise.muscle_groups.map((mg) => (
              <span key={mg} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                {mg}
              </span>
            ))}
            {exercise.equipment.map((eq) => (
              <span key={eq} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {eq}
              </span>
            ))}
            {exercise.movement_pattern && (
              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                {exercise.movement_pattern}
              </span>
            )}
          </div>

          {/* Description */}
          {exercise.description && (
            <p className="text-gray-600 text-sm leading-relaxed mb-6">{exercise.description}</p>
          )}

          {/* Instructions */}
          {exercise.instructions && exercise.instructions.length > 0 && (
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-800 mb-3">Instructions</h2>
              <ol className="space-y-2">
                {exercise.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Purchase prompt */}
          <PurchasePrompt
            exerciseId={id}
            singleProduct={singleProduct ?? null}
            subProduct={subProduct ?? null}
          />
        </div>
      </div>
    </div>
  );
}
