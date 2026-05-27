"use client";

import { useState, useEffect } from "react";
import type { ExerciseDetail } from "@/lib/exercises";

const ACTION_COLOUR: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CHANGES_REQUESTED: "bg-yellow-100 text-yellow-800",
};

export default function AdminPage() {
  const [exercises, setExercises] = useState<ExerciseDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, { action: string; note: string }>>({});
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/exercises/pending");
    if (res.ok) {
      const data = (await res.json()) as ExerciseDetail[];
      setExercises(data);
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function submitReview(id: string) {
    const f = form[id];
    if (!f?.action) return;
    setReviewing(id);

    const res = await fetch(`/api/admin/exercises/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: f.action, note: f.note }),
    });

    if (res.ok) {
      setMessage(`✓ Exercise ${id.slice(0, 8)}… ${f.action.toLowerCase()}`);
      await load();
    } else {
      const data = (await res.json()) as { error: string };
      setMessage(`Error: ${data.error}`);
    }
    setReviewing(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Moderation Queue</h1>
        {message && (
          <span className="text-sm text-indigo-600 font-medium">{message}</span>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : exercises.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg font-medium">Queue is empty</p>
          <p className="text-sm mt-1">All submissions have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {exercises.map((ex) => (
            <div
              key={ex.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
            >
              <div className="flex items-start gap-4">
                {ex.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ex.thumbnail_url}
                    alt={ex.name}
                    className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{ex.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {ex.difficulty} · {ex.muscle_groups.join(", ")}
                  </p>
                  {ex.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ex.description}</p>
                  )}
                  {ex.preview_url && (
                    <a
                      href={ex.preview_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-600 hover:underline mt-1 inline-block"
                    >
                      Preview video ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Review form */}
              <div className="mt-4 flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Decision</label>
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form[ex.id]?.action ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [ex.id]: { ...f[ex.id]!, action: e.target.value, note: f[ex.id]?.note ?? "" } }))
                    }
                  >
                    <option value="">Select…</option>
                    {["APPROVED", "REJECTED", "CHANGES_REQUESTED"].map((a) => (
                      <option key={a} value={a}>{a.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-48">
                  <label className="block text-xs text-gray-500 mb-1">Note (required for reject/changes)</label>
                  <input
                    type="text"
                    placeholder="Reviewer note…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form[ex.id]?.note ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [ex.id]: { action: f[ex.id]?.action ?? "", note: e.target.value } }))
                    }
                  />
                </div>
                <button
                  onClick={() => void submitReview(ex.id)}
                  disabled={!form[ex.id]?.action || reviewing === ex.id}
                  className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {reviewing === ex.id ? "Submitting…" : "Submit"}
                </button>
                {form[ex.id]?.action && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ACTION_COLOUR[form[ex.id]!.action] ?? ""}`}>
                    {form[ex.id]!.action.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
