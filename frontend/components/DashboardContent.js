"use client";

import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const PALETTE = ["#7c3ff2", "#5da8ff", "#4fe0c5", "#ff8fd6", "#ffd166", "#b394ff"];

export const TABLE_TITLES = {
  orders: "Orders Analytics",
  payments: "Payments Analytics",
  support_tickets: "Support Tickets Analytics",
  customers: "Account Overview",
};

export function KpiRing({ value, label, accent = "#7c3ff2" }) {
  return (
    <div className="relative flex flex-col items-center justify-center" style={{ perspective: 800 }}>
      <motion.div
        className="w-28 h-28 rounded-full flex items-center justify-center"
        style={{
          background: `conic-gradient(${accent} 0deg, ${accent}33 220deg, transparent 360deg)`,
          transformStyle: "preserve-3d",
        }}
        animate={{ rotateY: [0, 360] }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-[86px] h-[86px] rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-inner">
          <span className="text-xl font-bold text-slate-800">{value}</span>
        </div>
      </motion.div>
      <p className="text-xs text-slate-500 mt-2 text-center uppercase tracking-wide">{label}</p>
    </div>
  );
}

export function KpiCard({ label, value }) {
  return (
    <div className="glass-card p-4 text-center">
      <p className="text-2xl font-bold gradient-text">{value}</p>
      <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">{label}</p>
    </div>
  );
}

export function ChartCard({ title, children }) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold text-radiant-700 mb-4">{title}</h3>
      <div style={{ width: "100%", height: 260 }}>{children}</div>
    </div>
  );
}

export default function DashboardContent({ data }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {data.table === "orders" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
            <KpiRing value={data.total_orders} label="Total Orders" accent="#7c3ff2" />
            <KpiCard label="Total Spent" value={`$${data.total_spent}`} />
            <KpiCard label="Avg Order Value" value={`$${data.avg_order_value}`} />
            <KpiCard label="Statuses" value={data.status_breakdown.length} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Orders by Status">
              <ResponsiveContainer>
                <BarChart data={data.status_breakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {data.status_breakdown.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Spend Over Time">
              <ResponsiveContainer>
                <LineChart data={data.spend_over_time}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="amount" stroke="#7c3ff2" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}

      {data.table === "payments" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
            <KpiRing value={data.total_payments} label="Total Payments" accent="#5da8ff" />
            <KpiCard label="Total Paid" value={`$${data.total_paid}`} />
            <KpiCard label="Methods Used" value={data.method_breakdown.length} />
            <KpiCard label="Statuses" value={data.status_breakdown.length} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Payment Status Breakdown">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data.status_breakdown}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {data.status_breakdown.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Amount Paid Over Time">
              <ResponsiveContainer>
                <LineChart data={data.amount_over_time}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="amount" stroke="#5da8ff" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}

      {data.table === "support_tickets" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
            <KpiRing value={data.total_tickets} label="Total Tickets" accent="#4fe0c5" />
            <KpiCard label="Open" value={data.open_count} />
            <KpiCard label="Resolved" value={data.resolved_count} />
            <KpiCard label="Priorities" value={data.priority_breakdown.length} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Tickets by Priority">
              <ResponsiveContainer>
                <BarChart data={data.priority_breakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {data.priority_breakdown.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Tickets Filed Over Time">
              <ResponsiveContainer>
                <LineChart data={data.tickets_over_time}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#4fe0c5" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}

      {data.table === "customers" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-center mb-6">
            <KpiRing value={data.account_status} label="Account Status" accent="#ff8fd6" />
            <KpiCard label="Member Since" value={new Date(data.member_since).toLocaleDateString()} />
            <KpiCard label="Total Spent" value={`$${data.total_spent}`} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Total Orders" value={data.total_orders} />
            <KpiCard label="Total Tickets" value={data.total_tickets} />
            <KpiCard label="Open Tickets" value={data.open_tickets} />
            <KpiCard label="Payments Made" value={data.total_payments} />
          </div>
        </>
      )}
    </div>
  );
}
