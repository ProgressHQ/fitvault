"use client";

import { useState, useEffect } from "react";
import type { EarningsSummary } from "@/lib/earnings";

const MUSCLE_GROUPS = ["CHEST","BACK","SHOULDERS","BICEPS","TRICEPS","QUADS","HAMSTRINGS","GLUTES","CALVES","CORE","FULL_BODY"];
const EQUIPMENT_OPTIONS = ["BARBELL","DUMBBELL","KETTLEBELL","CABLE","MACHINE","BODYWEIGHT","BANDS","BENCH"];
const DIFFICULTIES = ["BEGINNER","INTERMEDIATE","ADVANCED"];
const MOVEMENT_PATTERNS = ["PUSH","PULL","HINGE","SQUAT","CARRY","ROTATION","GAIT"];

const PAYOUT_BADGE: Record<string, string> = {
  PENDING:  "badge-amber",
  PAID:     "badge-green",
  WITHHELD: "badge-red",
};

export default function ContributorPage() {
  const [earnings, setEarnings] = useState<EarningsSummary[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

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
      setMessage({ text: "Name, difficulty, and at least one muscle group are required.", ok: false });
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
      setMessage({
        text: `Exercise draft created (ID: ${data.exercise_id.slice(0, 8)}…). Upload your video before ${new Date(data.expires_at).toLocaleTimeString()}, then call finalize.`,
        ok: true,
      });
      console.log("Upload URL:", data.upload_url);
    } else {
      const data = (await res.json()) as { error: string };
      setMessage({ text: data.error, ok: false });
    }
    setUploading(false);
  }

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 900, marginBottom: "2rem" }}>
        Contributor Dashboard
      </h1>

      {/* Upload form */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Submit an exercise video</h2>

        {message && (
          <div
            style={{
              background: message.ok ? "var(--accent-glow)" : "var(--red-glow)",
              border: `1px solid ${message.ok ? "rgba(0,212,194,.2)" : "rgba(239,68,68,.2)"}`,
              borderRadius: "var(--r-md)",
              padding: "0.75rem 1rem",
              fontSize: "0.85rem",
              color: message.ok ? "var(--accent)" : "var(--red)",
              marginBottom: "1.25rem",
            }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={(e) => void startUpload(e)} style={{ display: "grid", gap: "1rem" }}>
          <div className="field-group">
            <label>Exercise name (EN)<span className="field-required">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input"
              placeholder="e.g. Barbell Back Squat"
            />
          </div>

          <div className="field-group">
            <label>Description (EN)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="input"
              style={{ resize: "vertical" }}
              placeholder="Brief overview of the exercise…"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="field-group">
              <label>Difficulty<span className="field-required">*</span></label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                className="input"
              >
                <option value="">Select…</option>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label>Movement pattern</label>
              <select
                value={form.movement_pattern}
                onChange={(e) => setForm((f) => ({ ...f, movement_pattern: e.target.value }))}
                className="input"
              >
                <option value="">Select…</option>
                {MOVEMENT_PATTERNS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="field-group">
            <label>Muscle groups<span className="field-required">*</span></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
              {MUSCLE_GROUPS.map((mg) => (
                <button
                  key={mg}
                  type="button"
                  onClick={() => toggleMulti("muscle_groups", mg)}
                  className={`badge ${form.muscle_groups.includes(mg) ? "badge-accent" : "badge-muted"}`}
                  style={{ cursor: "pointer", border: form.muscle_groups.includes(mg) ? undefined : "1px solid var(--border-2)" }}
                >
                  {mg}
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <label>Equipment</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => toggleMulti("equipment", eq)}
                  className={`badge ${form.equipment.includes(eq) ? "badge-muted" : ""}`}
                  style={{
                    cursor: "pointer",
                    background: form.equipment.includes(eq) ? "var(--bg-4)" : "transparent",
                    border: "1px solid var(--border-2)",
                    color: form.equipment.includes(eq) ? "var(--text)" : "var(--muted)",
                  }}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>

          <div>
            <button type="submit" disabled={uploading} className="btn btn-primary">
              {uploading ? "Starting upload…" : "Start upload session"}
            </button>
          </div>
        </form>
      </div>

      {/* Earnings */}
      <div className="card">
        <h2 className="section-title" style={{ marginBottom: "1.25rem" }}>Earnings</h2>

        {earningsLoading ? (
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Loading…</p>
        ) : earnings.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>No earnings yet.</p>
        ) : (
          <table className="ppv-table">
            <thead>
              <tr>
                <th>Period</th>
                <th style={{ textAlign: "right" }}>Earnings</th>
                <th style={{ textAlign: "right" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((e) => (
                <tr key={e.period_month}>
                  <td className="mono-val">{e.period_month}</td>
                  <td style={{ textAlign: "right", color: "var(--text)", fontFamily: "var(--font-mono)" }}>
                    ${(e.total_earnings_cents / 100).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className={`badge ${PAYOUT_BADGE[e.payout_status] ?? "badge-muted"}`}>
                      {e.payout_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
