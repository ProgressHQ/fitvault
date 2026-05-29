import { notFound } from "next/navigation";
import { getExercise } from "@/lib/exercises";
import { listActiveProducts } from "@/lib/products";
import PurchasePrompt from "@/components/PurchasePrompt";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}

const DIFF_BADGE: Record<string, string> = {
  BEGINNER:     "badge-green",
  INTERMEDIATE: "badge-amber",
  ADVANCED:     "badge-red",
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

  const diffClass = DIFF_BADGE[exercise.difficulty] ?? "badge-muted";

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
      <a
        href="/"
        style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}
      >
        ← Back to library
      </a>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Video area */}
        <div
          style={{
            background: "var(--bg-4)",
            aspectRatio: "16/9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {exercise.preview_url ? (
            <video
              src={exercise.preview_url}
              controls
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              poster={exercise.thumbnail_url ?? undefined}
            />
          ) : exercise.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={exercise.thumbnail_url}
              alt={exercise.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
            />
          ) : (
            <span style={{ color: "var(--dim)", fontSize: "0.85rem" }}>No preview available</span>
          )}
        </div>

        <div style={{ padding: "1.5rem 2rem 2rem" }}>
          {/* Title + difficulty */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1rem" }}>
            <h1 style={{ flex: 1, fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800 }}>{exercise.name}</h1>
            <span className={`badge ${diffClass}`}>{exercise.difficulty}</span>
          </div>

          {/* Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "1.25rem" }}>
            {exercise.muscle_groups.map((mg) => (
              <span key={mg} className="badge badge-accent">{mg}</span>
            ))}
            {exercise.equipment.map((eq) => (
              <span key={eq} className="badge badge-muted">{eq}</span>
            ))}
            {exercise.movement_pattern && (
              <span className="badge badge-purple">{exercise.movement_pattern}</span>
            )}
          </div>

          {/* Description */}
          {exercise.description && (
            <p style={{ fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
              {exercise.description}
            </p>
          )}

          {/* Instructions */}
          {exercise.instructions && exercise.instructions.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "0.75rem" }}>
                Instructions
              </h2>
              <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {exercise.instructions.map((step, i) => (
                  <li key={i} style={{ display: "flex", gap: "0.75rem", fontSize: "0.875rem" }}>
                    <span
                      style={{
                        width: 24, height: 24, borderRadius: "50%",
                        background: "var(--accent-glow)", border: "1px solid rgba(0,212,194,.25)",
                        color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, fontSize: "0.7rem", fontWeight: 700, fontFamily: "var(--font-mono)",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ color: "var(--text-2)", lineHeight: 1.65 }}>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

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
