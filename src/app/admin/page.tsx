"use client";

import { useState, useEffect } from "react";
import type { ExerciseDetail } from "@/lib/exercises";

const ACTION_BADGE: Record<string, string> = {
  APPROVED:          "badge-green",
  REJECTED:          "badge-red",
  CHANGES_REQUESTED: "badge-amber",
};

export default function AdminPage() {
  const [exercises, setExercises] = useState<ExerciseDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, { action: string; note: string }>>({});
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

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
      setMessage({ text: `Exercise ${id.slice(0, 8)}… ${f.action.toLowerCase().replace("_", " ")}`, ok: true });
      await load();
    } else {
      const data = (await res.json()) as { error: string };
      setMessage({ text: data.error, ok: false });
    }
    setReviewing(null);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900 }}>Moderation Queue</h1>
        {message && (
          <span
            style={{
              fontSize: "0.82rem", fontWeight: 600,
              color: message.ok ? "var(--accent)" : "var(--red)",
            }}
          >
            {message.ok ? "✓ " : "✗ "}{message.text}
          </span>
        )}
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      ) : exercises.length === 0 ? (
        <div className="empty-state">
          <p>Queue is empty</p>
          <p>All submissions have been reviewed.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {exercises.map((ex) => (
            <div key={ex.id} className="card">
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                {ex.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ex.thumbnail_url}
                    alt={ex.name}
                    style={{ width: 80, height: 56, objectFit: "cover", borderRadius: "var(--r-md)", flexShrink: 0, border: "1px solid var(--border)" }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", color: "var(--text)" }}>
                    {ex.name}
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "2px" }}>
                    {ex.difficulty} · {ex.muscle_groups.join(", ")}
                  </p>
                  {ex.description && (
                    <p style={{ fontSize: "0.82rem", color: "var(--text-2)", marginTop: "4px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {ex.description}
                    </p>
                  )}
                  {ex.preview_url && (
                    <a
                      href={ex.preview_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: "0.75rem", color: "var(--accent)", marginTop: "4px", display: "inline-block" }}
                    >
                      Preview video ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Review form */}
              <div
                style={{
                  marginTop: "1rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  alignItems: "flex-end",
                }}
              >
                <div className="field-group" style={{ minWidth: "160px" }}>
                  <label>Decision</label>
                  <select
                    className="input"
                    value={form[ex.id]?.action ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [ex.id]: { ...f[ex.id]!, action: e.target.value, note: f[ex.id]?.note ?? "" } }))
                    }
                  >
                    <option value="">Select…</option>
                    {["APPROVED", "REJECTED", "CHANGES_REQUESTED"].map((a) => (
                      <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>

                <div className="field-group" style={{ flex: 1, minWidth: "200px" }}>
                  <label>Note (required for reject / changes)</label>
                  <input
                    type="text"
                    placeholder="Reviewer note…"
                    className="input"
                    value={form[ex.id]?.note ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [ex.id]: { action: f[ex.id]?.action ?? "", note: e.target.value } }))
                    }
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <button
                    onClick={() => void submitReview(ex.id)}
                    disabled={!form[ex.id]?.action || reviewing === ex.id}
                    className="btn btn-primary btn-sm"
                  >
                    {reviewing === ex.id ? "Submitting…" : "Submit"}
                  </button>
                  {form[ex.id]?.action && (
                    <span className={`badge ${ACTION_BADGE[form[ex.id]!.action] ?? "badge-muted"}`}>
                      {form[ex.id]!.action.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
