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
      {subProduct && (
        <div className="sub-banner">
          <div>
            <p className="sub-banner-title">Unlock the full library</p>
            <p className="sub-banner-sub">
              {subProduct.title} — from {(subProduct.price_cents / 100).toFixed(2)} {subProduct.currency}/mo
            </p>
          </div>
          <a
            href={`/exercises?subscribe=1&productId=${subProduct.id}`}
            className="btn btn-primary btn-sm"
          >
            Subscribe
          </a>
        </div>
      )}

      <div style={{ display: "flex", gap: "2.5rem" }}>
        {/* Filters sidebar */}
        <aside style={{ width: "200px", flexShrink: 0 }} className="hidden lg:block">
          <ExerciseFilters current={sp} />
        </aside>

        {/* Main */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Search */}
          <form method="GET" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                name="q"
                defaultValue={sp.q}
                placeholder="Search exercises…"
                className="input"
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Search
              </button>
            </div>
          </form>

          {exercises.length === 0 ? (
            <div className="empty-state">
              <p>No exercises found</p>
              <p>Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "1rem",
                }}
              >
                {exercises.map((ex) => (
                  <ExerciseCard key={ex.id} exercise={ex} lang={lang} />
                ))}
              </div>
              {nextCursor && (
                <div style={{ marginTop: "2rem", textAlign: "center" }}>
                  <a
                    href={`/?${new URLSearchParams({ ...flatSearchParams(sp), cursor: nextCursor }).toString()}`}
                    className="btn btn-ghost"
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
