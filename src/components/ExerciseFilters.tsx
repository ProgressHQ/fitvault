const MUSCLE_GROUPS = ["CHEST","BACK","SHOULDERS","BICEPS","TRICEPS","QUADS","HAMSTRINGS","GLUTES","CALVES","CORE","FULL_BODY"];
const EQUIPMENT_OPTIONS = ["BARBELL","DUMBBELL","KETTLEBELL","CABLE","MACHINE","BODYWEIGHT","BANDS","BENCH"];
const DIFFICULTIES = ["BEGINNER","INTERMEDIATE","ADVANCED"];
const MOVEMENT_PATTERNS = ["PUSH","PULL","HINGE","SQUAT","CARRY","ROTATION","GAIT"];

interface SearchParams {
  q?: string;
  muscle_groups?: string | string[];
  equipment?: string | string[];
  difficulty?: string;
  movement_pattern?: string;
  lang?: string;
}

function active(value: string | string[] | undefined, item: string): boolean {
  if (!value) return false;
  return Array.isArray(value) ? value.includes(item) : value === item;
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <p className="filter-group-title">{title}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>{children}</div>
    </div>
  );
}

export default function ExerciseFilters({ current }: { current: SearchParams }) {
  return (
    <form method="GET" style={{ fontSize: "0.875rem" }}>
      {current.q && <input type="hidden" name="q" value={current.q} />}
      {current.lang && <input type="hidden" name="lang" value={current.lang} />}

      <FilterGroup title="Difficulty">
        {DIFFICULTIES.map((d) => (
          <label key={d} className="filter-check-row">
            <input type="checkbox" name="difficulty" value={d} defaultChecked={active(current.difficulty, d)} />
            {d}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Movement">
        {MOVEMENT_PATTERNS.map((mp) => (
          <label key={mp} className="filter-check-row">
            <input type="checkbox" name="movement_pattern" value={mp} defaultChecked={active(current.movement_pattern, mp)} />
            {mp}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Muscles">
        {MUSCLE_GROUPS.map((mg) => (
          <label key={mg} className="filter-check-row">
            <input type="checkbox" name="muscle_groups" value={mg} defaultChecked={active(current.muscle_groups, mg)} />
            {mg}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Equipment">
        {EQUIPMENT_OPTIONS.map((eq) => (
          <label key={eq} className="filter-check-row">
            <input type="checkbox" name="equipment" value={eq} defaultChecked={active(current.equipment, eq)} />
            {eq}
          </label>
        ))}
      </FilterGroup>

      <button type="submit" className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center" }}>
        Apply
      </button>
      <a href="/" style={{ display: "block", textAlign: "center", fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.6rem" }}>
        Clear filters
      </a>
    </form>
  );
}
