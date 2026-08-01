"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function RecentCalls() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE}/api/recent-calls?limit=8`)
      .then((r) => r.json())
      .then((data) => mounted && setCalls(Array.isArray(data) ? data : []))
      .catch((e) => mounted && setError(e.message))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold text-radiant-700 mb-4">
        Recent Voice Interactions
      </h2>

      {loading && <p className="text-slate-400 text-sm">Loading…</p>}
      {error && (
        <p className="text-sm text-rose-500">
          Couldn't reach the backend ({error}). Is it running on {API_BASE}?
        </p>
      )}
      {!loading && !error && calls.length === 0 && (
        <p className="text-slate-400 text-sm">
          No calls logged yet — interactions will appear here once your agent
          calls the <code>log_call</code> tool.
        </p>
      )}

      <ul className="space-y-3">
        {calls.map((c) => (
          <li
            key={c.id}
            className="rounded-2xl bg-white/70 border border-white/80 p-4 shadow-sm"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-sm font-medium text-slate-700">
                {c.customers?.full_name || "Unknown caller"}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  c.resolved
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {c.resolved ? "Resolved" : "Open"}
              </span>
            </div>
            <p className="text-sm text-slate-500">{c.query_text}</p>
            <p className="text-xs text-slate-400 mt-1">
              {new Date(c.created_at).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
