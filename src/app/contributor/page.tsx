"use client";

import { useState, useEffect } from "react";
import type { EarningsSummary } from "@/lib/earnings";

const MUSCLE_GROUPS = ["CHEST","BACK","SHOULDERS","BICEPS","TRICEPS","QUADS","HAMSTRINGS","GLUTES","CALVES","CORE","FULL_BODY"];
const EQUIPMENT_OPTIONS = ["BARBELL","DUMBBELL","KETTLEBELL","CABLE","MACHINE","BODYWEIGHT","BANDS","BENCH"];
const DIFFICULTIES = ["BEGINNER","INTERMEDIATE","ADVANCED"];
const MOVEMENT_PATTERNS = ["PUSH","PULL","HINGE","SQUAT","CARRY","ROTATION","GAIT"];

const PAYOUT_COLOUR: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  WITHHELD: "bg-red-100 text-red-800",
};

export default function ContributorPage() {
  const [earnings, setEarnings] = useState<EarningsSummary[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    difficulty: "",
    movement_pattern: "",
    muscle_groups: [] as string[],
    equipment: [] as string[],
  });

  useEffect(() => {
    fetch("/api/contributor/earnings")
      .then((r) => r.ok ? r.json() : [])
      .then((data: EarningsSummary[]) => setEarnings(data))
      .finally(() => setEarningsLoading(false));
  }, []);

  function toggleMulti(field: "muscle_groups" | "equipment", value: string) {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter((v) => v !== value)
        : [...f[field], value],
    }));
  }

  async function startUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.difficulty || !form.muscle_groups.length) {
      setMessage("Name, difficulty, and at least one muscle group are required.");
      return;
    }
    setUploading(true);
    setMessage(null);

    const res = await fetch("/api/contributor/upload-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const data = (await res.json()) as { exercise_id: string; upload_url: string; expires_at: string };
      setMessage(
        `✓ Exercise draft created (ID: ${data.exercise_id.slice(0, 8)}…). Upload your video to the provided S3 URL before ${new Date(data.expires_at).toLocaleTimeString()}, then call finalize.`
      );
      console.log("Upload URL:", data.upload_url);
    } else {
      const data = (await res.json()) as { error: string };
      setMessage(`Error: ${data.error}`);
    }
    setUploading(false);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Contributor Dashboard</h1>

      {/* Upload form */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">Submit an exercise video</h2>

        {message && (
          <div className="bg-indigo-50 text-indigo-800 text-sm px-4 py-3 rounded-lg mb-5">
            {message}
          </div>
        )}

        <form onSubmit={(e) => void startUpload(e)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exercise name (EN) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Barbell Back Squat"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (EN)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Brief overview of the exercise…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty <span className="text-red-500">*</span>
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select…</option>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Movement pattern</label>
              <select
                value={form.movement_pattern}
                onChange={(e) => setForm((f) => ({ ...f, movement_pattern: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select…</option>
                {MOVEMENT_PATTERNS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Muscle groups <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map((mg) => (
                <button
                  key={mg}
                  type="button"
                  onClick={() => toggleMulti("muscle_groups", mg)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    form.muscle_groups.includes(mg)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
                  }`}
                >
                  {mg}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Equipment</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => toggleMulti("equipment", eq)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    form.equipment.includes(eq)
                      ? "bg-gray-700 text-white border-gray-700"
                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? "Starting upload…" : "Start upload session"}
          </button>
        </form>
      </section>

      {/* Earnings */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">Earnings</h2>

        {earningsLoading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : earnings.length === 0 ? (
          <p className="text-gray-500 text-sm">No earnings yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">Period</th>
                <th className="pb-2 font-medium text-right">Earnings</th>
                <th className="pb-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((e) => (
                <tr key={e.period_month} className="border-b border-gray-50">
                  <td className="py-2 text-gray-700">{e.period_month}</td>
                  <td className="py-2 text-right text-gray-900 font-medium">
                    ${(e.total_earnings_cents / 100).toFixed(2)}
                  </td>
                  <td className="py-2 text-right">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PAYOUT_COLOUR[e.payout_status] ?? "bg-gray-100 text-gray-600"}`}>
                      {e.payout_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
