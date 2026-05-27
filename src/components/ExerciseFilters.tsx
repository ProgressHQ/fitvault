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

export default function ExerciseFilters({ current }: { current: SearchParams }) {
  return (
    <form method="GET" className="space-y-5 text-sm">
      {/* Hidden preserved params */}
      {current.q && <input type="hidden" name="q" value={current.q} />}
      {current.lang && <input type="hidden" name="lang" value={current.lang} />}

      {/* Difficulty */}
      <div>
        <p className="font-semibold text-gray-700 mb-2">Difficulty</p>
        <div className="space-y-1">
          {DIFFICULTIES.map((d) => (
            <label key={d} className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-gray-900">
              <input
                type="checkbox"
                name="difficulty"
                value={d}
                defaultChecked={active(current.difficulty, d)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              {d}
            </label>
          ))}
        </div>
      </div>

      {/* Movement Pattern */}
      <div>
        <p className="font-semibold text-gray-700 mb-2">Movement</p>
        <div className="space-y-1">
          {MOVEMENT_PATTERNS.map((mp) => (
            <label key={mp} className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-gray-900">
              <input
                type="checkbox"
                name="movement_pattern"
                value={mp}
                defaultChecked={active(current.movement_pattern, mp)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              {mp}
            </label>
          ))}
        </div>
      </div>

      {/* Muscle Groups */}
      <div>
        <p className="font-semibold text-gray-700 mb-2">Muscle groups</p>
        <div className="space-y-1">
          {MUSCLE_GROUPS.map((mg) => (
            <label key={mg} className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-gray-900">
              <input
                type="checkbox"
                name="muscle_groups"
                value={mg}
                defaultChecked={active(current.muscle_groups, mg)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              {mg}
            </label>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div>
        <p className="font-semibold text-gray-700 mb-2">Equipment</p>
        <div className="space-y-1">
          {EQUIPMENT_OPTIONS.map((eq) => (
            <label key={eq} className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-gray-900">
              <input
                type="checkbox"
                name="equipment"
                value={eq}
                defaultChecked={active(current.equipment, eq)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              {eq}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        Apply
      </button>
      <a href="/" className="block text-center text-xs text-gray-400 hover:text-gray-600">
        Clear filters
      </a>
    </form>
  );
}
