"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardContent, { TABLE_TITLES } from "./DashboardContent";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function AnalyticsDashboard() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [params, setParams] = useState(null);

  const loadDashboard = useCallback(async (table, email) => {
    setParams({ table, email });
    setOpen(true);
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/analytics/${table}?email=${encodeURIComponent(email)}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Couldn't load analytics.");
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const { table, email } = e.detail || {};
      if (!table || !email) return;
      loadDashboard(table, email);
    };
    window.addEventListener("ai-voice-support:show-dashboard", handler);
    return () => window.removeEventListener("ai-voice-support:show-dashboard", handler);
  }, [loadDashboard]);

  const openInNewTab = () => {
    if (!params) return;
    window.open(
      `/dashboard?table=${params.table}&email=${encodeURIComponent(params.email)}`,
      "_blank"
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="min-h-screen px-6 py-10 md:px-16"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          >
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl md:text-3xl font-bold gradient-text">
                  {data ? TABLE_TITLES[data.table] : "Loading your analytics…"}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={openInNewTab}
                    disabled={!data}
                    className="px-4 py-2 rounded-xl bg-radiant-600 hover:bg-radiant-700 text-white text-sm font-medium shadow-glow transition-colors disabled:opacity-40"
                  >
                    Open in New Tab ↗
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-600 text-sm font-medium shadow-sm transition-colors"
                  >
                    Close ✕
                  </button>
                </div>
              </div>

              {loading && (
                <div className="glass-card p-10 text-center text-slate-500">
                  Crunching your data…
                </div>
              )}

              {error && (
                <div className="glass-card p-10 text-center text-rose-500">{error}</div>
              )}

              {data && !loading && <DashboardContent data={data} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
