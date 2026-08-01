"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import DashboardContent, { TABLE_TITLES } from "../../components/DashboardContent";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function DashboardPageInner() {
  const searchParams = useSearchParams();
  const table = searchParams.get("table");
  const email = searchParams.get("email");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!table || !email) {
      setError("Missing table or email in the link.");
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/api/analytics/${table}?email=${encodeURIComponent(email)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.detail || "Couldn't load analytics.");
        setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [table, email]);

  return (
    <motion.main
      className="min-h-screen px-6 py-10 md:px-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 18 }}
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold gradient-text mb-8">
          {data ? TABLE_TITLES[data.table] : "Loading your analytics…"}
        </h1>

        {loading && (
          <div className="glass-card p-10 text-center text-slate-500">Crunching your data…</div>
        )}
        {error && <div className="glass-card p-10 text-center text-rose-500">{error}</div>}
        {data && !loading && <DashboardContent data={data} />}
      </div>
    </motion.main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageInner />
    </Suspense>
  );
}
