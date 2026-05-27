import { listExercises } from "@/lib/exercises";
import { listActiveProducts } from "@/lib/products";
import ExerciseCard from "@/components/ExerciseCard";
import ExerciseFilters from "@/components/ExerciseFilters";

interface SearchParams {
  q?: string;
  muscle_groups?: string | string[];
  equipment?: string | string[];
  difficulty?: string;
  movement_pattern?: string;
  cursor?: string;
  lang?: string;
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const lang = (sp.lang ?? "en") as "en" | "pl";

  const toArray = (v: string | string[] | undefined): string[] | undefined =>
    v ? (Array.isArray(v) ? v : [v]) : undefined;

  const { exercises, nextCursor } = await listExercises({
    lang,
    q: sp.q,
    muscle_groups: toArray(sp.muscle_groups),
    equipment: toArray(sp.equipment),
    difficulty: sp.difficulty,
    movement_pattern: sp.movement_pattern,
    cursor: sp.cursor,
    limit: 24,
  });

  const products = await listActiveProducts();
  const subProduct = products.find(
    (p) => p.type === "SUBSCRIPTION_MONTHLY" || p.type === "SUBSCRIPTION_ANNUAL"
  );

  return (
    <div>
      {/* Hero banner */}
      {subProduct && (
        <div className="bg-indigo-600 text-white rounded-2xl p-6 mb-8 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">Unlock the full library</p>
            <p className="text-indigo-200 text-sm mt-1">
              {subProduct.title} — from {(subProduct.price_cents / 100).toFixed(2)} {subProduct.currency}/mo
            </p>
          </div>
          <a
            href={`/exercises?subscribe=1&productId=${subProduct.id}`}
            className="bg-white text-indigo-600 font-semibold px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors text-sm"
          >
            Subscribe
          </a>
        </div>
      )}

      <div className="flex gap-8">
        {/* Filters sidebar */}
        <aside className="w-56 flex-shrink-0 hidden lg:block">
          <ExerciseFilters current={sp} />
        </aside>

        {/* Exercise grid */}
        <div className="flex-1">
          {/* Search */}
          <form method="GET" className="mb-6">
            <div className="flex gap-2">
              <input
                name="q"
                defaultValue={sp.q}
                placeholder="Search exercises…"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {exercises.length === 0 ? (
            <p className="text-gray-500 text-center py-16">No exercises found.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {exercises.map((ex) => (
                  <ExerciseCard key={ex.id} exercise={ex} lang={lang} />
                ))}
              </div>
              {nextCursor && (
                <div className="mt-8 text-center">
                  <a
                    href={`/?${new URLSearchParams({ ...flatSearchParams(sp), cursor: nextCursor }).toString()}`}
                    className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-6 py-2 rounded-lg transition-colors"
                  >
                    Load more
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function flatSearchParams(sp: SearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  if (sp.q) out["q"] = sp.q;
  if (sp.difficulty) out["difficulty"] = sp.difficulty;
  if (sp.movement_pattern) out["movement_pattern"] = sp.movement_pattern;
  if (sp.lang) out["lang"] = sp.lang;
  return out;
}
