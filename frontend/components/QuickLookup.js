"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const TABS = [
  { key: "order", label: "Order Status", endpoint: "/api/order-status", field: "order_number", placeholder: "ORD-1001" },
  { key: "ticket", label: "Ticket Status", endpoint: "/api/ticket-status", field: "ticket_number", placeholder: "TCK-5001" },
  { key: "account", label: "Account", endpoint: "/api/account-details", field: "email", placeholder: "madhur@example.com" },
  { key: "payment", label: "Payment", endpoint: "/api/verify-payment", field: "order_number", placeholder: "ORD-1001" },
];

export default function QuickLookup() {
  const [tab, setTab] = useState(TABS[0]);
  const [value, setValue] = useState("");
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}${tab.endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [tab.field]: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Lookup failed");
      setResult(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold text-radiant-700 mb-4">
        Quick Lookup (test without voice)
      </h2>

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t);
              setValue("");
              setResult(null);
              setErr(null);
            }}
            className={`px-3 py-1.5 rounded-full text-sm transition-all ${
              tab.key === t.key
                ? "bg-radiant-500 text-white shadow-glow"
                : "bg-white/60 text-slate-600 hover:bg-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={tab.placeholder}
          className="flex-1 rounded-xl bg-white/80 border border-white/90 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-radiant-400"
        />
        <button
          onClick={handleLookup}
          disabled={!value || loading}
          className="px-5 py-2 rounded-xl bg-radiant-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-radiant-700 transition-colors"
        >
          {loading ? "…" : "Look up"}
        </button>
      </div>

      {err && <p className="text-sm text-rose-500 mt-3">{err}</p>}
      {result && (
        <pre className="mt-4 text-xs bg-slate-900/90 text-emerald-300 rounded-xl p-4 overflow-x-auto">
{JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
