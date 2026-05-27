"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import {
  Users,
  UserCheck,
  IndianRupee,
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Crown,
  Zap,
  Car,
  UserCog,
  ClipboardList,
  UserRound,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { useAuthStore } from "../lib/store/authStore";
import { useOwnersStore } from "../lib/store/ownersStore";
import { useVehiclesStore } from "../lib/store/vehiclesStore";
import { useDriversStore } from "../lib/store/driversStore";
import { useCustomersStore } from "../lib/store/customersStore";
import { useManagersStore } from "../lib/store/managersStore";
import { useWorkEntriesStore } from "../lib/store/workEntriesStore";
import { plansApi, type Plan } from "../lib/api/plans";
import { subscriptionsApi, type AdminSubscriptionRow } from "../lib/api/subscriptions";
import { pickActiveSubscription } from "../lib/subscriptionPick";

/* ─── Utilities ─── */
const avatarColors = ["#F59E0B", "#EA580C", "#0EA5E9", "#8B5CF6", "#059669"];


function buildMonthlyRevenue(
  entries: { date: string; status: string; amount: number }[],
  customerPayments: { paidAt: string; amount: number }[] = [],
  windowMonths = 6,
): MonthlyPoint[] {
  const now = new Date();
  const ordered: string[] = [];
  const map: Record<string, MonthlyPoint> = {};

  // 1. Pre-seed last N months with zeros.
  for (let i = windowMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("en-US", { month: "short" });
    if (!map[key]) {
      map[key] = { month: key, revenue: 0, pending: 0 };
      ordered.push(key);
    }
  }

  // 2. Tally work entry amounts per month.
  const billedByMonth: Record<string, { totalBilled: number; jobPaid: number }> = {};
  entries.forEach((e) => {
    const key = new Date(e.date).toLocaleDateString("en-US", { month: "short" });
    if (!billedByMonth[key]) billedByMonth[key] = { totalBilled: 0, jobPaid: 0 };
    billedByMonth[key].totalBilled += e.amount;
    if (e.status === "Paid") billedByMonth[key].jobPaid += e.amount;
    if (!map[key]) { map[key] = { month: key, revenue: 0, pending: 0 }; ordered.push(key); }
  });

  // 3. Tally customer payment records per month.
  const paymentsByMonth: Record<string, number> = {};
  customerPayments.forEach((p) => {
    const key = new Date(p.paidAt).toLocaleDateString("en-US", { month: "short" });
    paymentsByMonth[key] = (paymentsByMonth[key] ?? 0) + p.amount;
  });

  // 4. Compute effective paid / pending per month (same formula as backend stats).
  ordered.forEach((key) => {
    const { totalBilled = 0, jobPaid = 0 } = billedByMonth[key] ?? {};
    const payments = paymentsByMonth[key] ?? 0;
    const jobPending = totalBilled - jobPaid;
    const appliedToPending = Math.min(payments, jobPending);
    map[key].revenue = jobPaid + appliedToPending;
    map[key].pending = Math.max(0, jobPending - payments);
  });

  return ordered.map((k) => map[k]);
}

/** Paid subscription amounts grouped by `startDate` month (admin revenue trend). */
function buildSubscriptionPaidByMonth(
  subs: { startDate: string; paymentStatus: string; amount: number }[],
  windowMonths = 6,
): MonthlyPoint[] {
  const now = new Date();
  const ordered: string[] = [];
  const map: Record<string, MonthlyPoint> = {};

  for (let i = windowMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("en-US", { month: "short" });
    if (!map[key]) {
      map[key] = { month: key, revenue: 0, pending: 0 };
      ordered.push(key);
    }
  }

  subs.forEach((s) => {
    if (s.paymentStatus !== "paid") return;
    const key = new Date(s.startDate).toLocaleDateString("en-US", {
      month: "short",
    });
    if (!map[key]) {
      map[key] = { month: key, revenue: 0, pending: 0 };
      ordered.push(key);
    }
    map[key].revenue += Number(s.amount) || 0;
  });

  return ordered.map((k) => map[k]);
}

function fmt(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ─── Shared: Custom tooltip ─── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#141210",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 12,
        color: "#F5F4F0",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      <p
        style={{
          fontWeight: 700,
          marginBottom: 4,
          fontFamily: "Syne, sans-serif",
          fontSize: 13,
        }}
      >
        {label}
      </p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color || "var(--amber)" }}>
          {p.name}:{" "}
          <strong>
            {typeof p.value === "number" &&
            (p.name.toLowerCase().includes("revenue") ||
              p.name.toLowerCase().includes("paid") ||
              p.name.toLowerCase().includes("pending") ||
              p.name.includes("₹"))
              ? fmt(p.value)
              : p.value}
          </strong>
        </p>
      ))}
    </div>
  );
}

/* ─── Shared: Stat Card ─── */
interface StatCardProps {
  label: string;
  value: string;
  icon: React.FC<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;
  accent: string;
  accentBg: string;
  sub: string;
  idx: number;
  loading?: boolean;
}
function StatCard({ label, value, icon: Icon, accent, accentBg, sub, idx, loading }: StatCardProps) {
  return (
    <div
      className={`card card-hover animate-fade-up stagger-${idx + 1}`}
      style={{ padding: "20px 22px", position: "relative", overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accent,
          opacity: 0.8,
          borderRadius: "16px 16px 0 0",
        }}
      />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ color: "var(--foreground-subtle)", fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
            {label}
          </p>
          {loading ? (
            <Loader2
              size={20}
              style={{ color: accent, animation: "spin 0.9s linear infinite", marginTop: 4 }}
            />
          ) : (
            <p
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 800,
                fontSize: 26,
                color: "var(--foreground)",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {value}
            </p>
          )}
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            background: accentBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={18} style={{ color: accent }} strokeWidth={2} />
        </div>
      </div>
      <p style={{ color: "var(--foreground-subtle)", fontSize: 11.5, marginTop: 12 }}>{sub}</p>
    </div>
  );
}

/* ─── Shared: Revenue chart + summary side-card ─── */
interface MonthlyPoint {
  month: string;
  revenue: number;
  pending: number;
}

function RevenueSection({
  data,
  loading,
  paidRevenue,
  pendingAmount,
  totalRevenue,
  totalJobs,
  totalHours,
}: {
  data: MonthlyPoint[];
  loading: boolean;
  paidRevenue: number;
  pendingAmount: number;
  totalRevenue: number;
  totalJobs: number;
  totalHours: number;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
      {/* Area Chart */}
      <div className="card animate-fade-up stagger-3" style={{ padding: "22px 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: "var(--foreground)",
                marginBottom: 3,
              }}
            >
              Revenue Overview
            </h2>
            <p style={{ color: "var(--foreground-subtle)", fontSize: 12 }}>
              Monthly work entry earnings
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 8,
              background: "var(--amber-glow)",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >
            <Zap size={12} style={{ color: "var(--amber)" }} />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--amber-dark)" }}>Live</span>
          </div>
        </div>

        {loading ? (
          <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader2
              size={28}
              style={{ color: "var(--foreground-subtle)", animation: "spin 1s linear infinite" }}
            />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE4" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11.5, fill: "#A09890", fontFamily: "DM Sans, sans-serif" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11.5, fill: "#A09890", fontFamily: "DM Sans, sans-serif" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#059669"
                strokeWidth={2.5}
                fill="url(#paidGrad)"
                name="Paid (₹)"
                dot={false}
                activeDot={{ r: 5, fill: "#059669", stroke: "#fff", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="pending"
                stroke="#F59E0B"
                strokeWidth={2}
                fill="url(#pendingGrad)"
                name="Pending (₹)"
                dot={false}
                activeDot={{ r: 5, fill: "#F59E0B", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Revenue Summary */}
      <div
        className="card animate-fade-up stagger-4"
        style={{ padding: "22px 24px", display: "flex", flexDirection: "column" }}
      >
        <h2
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: 16,
            color: "var(--foreground)",
            marginBottom: 4,
          }}
        >
          Revenue Summary
        </h2>
        <p style={{ color: "var(--foreground-subtle)", fontSize: 12, marginBottom: 20 }}>
          All-time earnings
        </p>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
            <Loader2
              size={24}
              style={{ color: "var(--foreground-subtle)", animation: "spin 1s linear infinite" }}
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            {[
              { label: "Paid Revenue", value: fmt(paidRevenue), color: "#059669", bg: "rgba(5,150,105,0.08)" },
              { label: "Pending Amount", value: fmt(pendingAmount), color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
              { label: "Total Revenue", value: fmt(totalRevenue), color: "#0EA5E9", bg: "rgba(14,165,233,0.08)" },
              { label: "Total Jobs", value: totalJobs.toString(), color: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
              { label: "Total Hours", value: `${totalHours}h`, color: "#EA580C", bg: "rgba(234,88,12,0.08)" },
            ].map(({ label, value, color, bg }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 14px",
                  borderRadius: 10,
                  background: bg,
                }}
              >
                <span style={{ fontSize: 12.5, color: "var(--foreground-muted)" }}>{label}</span>
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color,
                    fontFamily: "Syne, sans-serif",
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Shared: Work Entries Table ─── */
function WorkEntriesTable({ entries, loading }: { entries: any[]; loading: boolean }) {
  return (
    <div className="card animate-fade-up stagger-5" style={{ overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 24px 16px",
          borderBottom: "1px solid var(--card-border)",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: "var(--foreground)",
              marginBottom: 2,
            }}
          >
            Recent Work Entries
          </h2>
          <p style={{ color: "var(--foreground-subtle)", fontSize: 12 }}>Latest field jobs</p>
        </div>
        <a
          href="/work-entries"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--amber-dark)",
            textDecoration: "none",
            padding: "6px 14px",
            borderRadius: 8,
            background: "var(--amber-glow)",
            border: "1px solid rgba(245,158,11,0.2)",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          View All
          <ArrowUpRight size={13} />
        </a>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Customer</th>
              <th>Driver</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  style={{ textAlign: "center", padding: "24px", color: "var(--foreground-subtle)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <Loader2 size={16} style={{ animation: "spin 0.9s linear infinite" }} />
                    Loading entries…
                  </div>
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{ textAlign: "center", padding: "24px", color: "var(--foreground-subtle)" }}
                >
                  No work entries yet
                </td>
              </tr>
            ) : (
              entries.slice(0, 6).map((e, i) => (
                <tr key={e.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: avatarColors[i % avatarColors.length],
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Car size={14} style={{ color: "#141210" }} />
                      </div>
                      <div>
                        <p
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            color: "var(--foreground)",
                            fontFamily: "DM Sans, sans-serif",
                          }}
                        >
                          {e.vehicle?.name ?? "—"}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--foreground-subtle)", marginTop: 1 }}>
                          {e.vehicle?.number}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--foreground-muted)" }}>{e.customer?.name ?? "—"}</td>
                  <td style={{ color: "var(--foreground-muted)" }}>{e.driver?.name ?? "—"}</td>
                  <td style={{ color: "var(--foreground-muted)" }}>{fmtDate(e.date)}</td>
                  <td style={{ fontWeight: 600, color: "var(--foreground)" }}>{fmt(e.amount)}</td>
                  <td>
                    <span
                      className={`badge ${e.status === "Paid" ? "badge-active" : "badge-pending"}`}
                    >
                      {e.status === "Paid" ? (
                        <CheckCircle2 size={10} style={{ marginRight: 2 }} />
                      ) : (
                        <Clock size={10} style={{ marginRight: 2 }} />
                      )}
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function sortPlansByPriceAscLocal(plans: Plan[]): Plan[] {
  return [...plans].sort((a, b) => {
    if (a.price !== b.price) return a.price - b.price;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

/** Saturated bar fills — plan `color` is often a pale card tint and disappears on white. */
const PLAN_SPLIT_BAR_HEX: Record<string, string> = {
  free: "#57534E",
  bronze: "#B45309",
  silver: "#64748B",
  gold: "#D97706",
  diamond: "#0F766E",
  premium: "#6D28D9",
};

function planChartBarColor(planName: string, index: number): string {
  const k = planName.trim().toLowerCase();
  if (PLAN_SPLIT_BAR_HEX[k]) return PLAN_SPLIT_BAR_HEX[k];
  const alt = ["#0369A1", "#7C3AED", "#15803D", "#C2410C", "#BE185D"];
  return alt[index % alt.length];
}

/* ══════════════════════════════════════════════════════════
   ADMIN DASHBOARD
══════════════════════════════════════════════════════════ */
function AdminDashboard() {
  const fetchOwners = useOwnersStore((s) => s.fetch);
  const owners = useOwnersStore((s) => s.items);
  const ownersLoading = useOwnersStore((s) => s.loading);

  const fetchManagers = useManagersStore((s) => s.fetch);
  const managers = useManagersStore((s) => s.items);

  const [planRows, setPlanRows] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [adminSubs, setAdminSubs] = useState<AdminSubscriptionRow[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);

  useEffect(() => {
    void fetchOwners({ limit: 200 });
    void fetchManagers();
    (async () => {
      setPlansLoading(true);
      try {
        const res = await plansApi.list({ offset: 0, limit: 50 });
        const rows = Array.isArray(res.data) ? res.data : [];
        setPlanRows(sortPlansByPriceAscLocal(rows));
      } catch {
        setPlanRows([]);
      } finally {
        setPlansLoading(false);
      }
    })();
    (async () => {
      setSubsLoading(true);
      try {
        const res = await subscriptionsApi.listAll({ offset: 0, limit: 500 });
        setAdminSubs(Array.isArray(res.data) ? res.data : []);
      } catch {
        setAdminSubs([]);
      } finally {
        setSubsLoading(false);
      }
    })();
  }, [fetchOwners, fetchManagers]);

  const activeManagers = managers.filter((m) => m.status === "Active").length;

  const totalFleetVehicles = useMemo(
    () => owners.reduce((s, o) => s + (o._count?.vehicles ?? 0), 0),
    [owners],
  );

  const subscriptionRevenueTotal = useMemo(
    () => planRows.reduce((s, p) => s + (p.totalRevenue ?? 0), 0),
    [planRows],
  );

  const paidSubRows = useMemo(
    () => adminSubs.filter((s) => s.paymentStatus === "paid").length,
    [adminSubs],
  );

  const monthlyRevenue = useMemo<MonthlyPoint[]>(
    () => buildSubscriptionPaidByMonth(adminSubs, 6),
    [adminSubs],
  );

  const planData = useMemo(() => {
    if (!planRows.length) return [];
    const counts = new Map<string, number>();
    for (const p of planRows) counts.set(p.name, 0);
    const freeName = planRows.find((p) => p.price === 0)?.name ?? "Free";
    for (const o of owners) {
      const sub = pickActiveSubscription(o.subscriptions);
      const name = sub?.plan?.name ?? freeName;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return planRows.map((p, i) => ({
      plan: p.name,
      count: counts.get(p.name) ?? 0,
      color: planChartBarColor(p.name, i),
    }));
  }, [owners, planRows]);

  const stats = [
    {
      label: "Total Owners",
      value: owners.length.toString(),
      icon: Users,
      accent: "#F59E0B",
      accentBg: "rgba(245,158,11,0.08)",
      sub: "Registered on platform",
      loading: ownersLoading,
    },
    {
      label: "Total Vehicles",
      value: totalFleetVehicles.toString(),
      icon: Car,
      accent: "#EA580C",
      accentBg: "rgba(234,88,12,0.08)",
      sub: "Fleet across all owners (from owner records)",
      loading: ownersLoading,
    },
    {
      label: "Active Managers",
      value: activeManagers.toString(),
      icon: UserCheck,
      accent: "#0EA5E9",
      accentBg: "rgba(14,165,233,0.08)",
      sub: `${managers.length} total managers`,
      loading: false,
    },
    {
      label: "Platform Revenue",
      value: fmt(subscriptionRevenueTotal),
      icon: IndianRupee,
      accent: "#059669",
      accentBg: "rgba(5,150,105,0.08)",
      sub: `${paidSubRows} paid subscription rows · plans total`,
      loading: plansLoading,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar title="Dashboard" subtitle="Admin — Full Platform Overview" />

      <div
        style={{
          padding: "28px 28px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {stats.map((s, i) => (
            <StatCard key={s.label} {...s} idx={i} />
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
          {/* Revenue Chart */}
          <div className="card animate-fade-up stagger-3" style={{ padding: "22px 24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                    color: "var(--foreground)",
                    marginBottom: 3,
                  }}
                >
                  Revenue Overview
                </h2>
                <p style={{ color: "var(--foreground-subtle)", fontSize: 12 }}>
                  Paid subscription amounts by start month
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  borderRadius: 8,
                  background: "var(--amber-glow)",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                <Zap size={12} style={{ color: "var(--amber)" }} />
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "var(--amber-dark)",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  Live
                </span>
              </div>
            </div>

            {subsLoading ? (
              <div
                style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Loader2
                  size={28}
                  style={{ color: "var(--foreground-subtle)", animation: "spin 1s linear infinite" }}
                />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyRevenue} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="revGradAdmin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE4" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11.5, fill: "#A09890", fontFamily: "DM Sans, sans-serif" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11.5, fill: "#A09890", fontFamily: "DM Sans, sans-serif" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    fill="url(#revGradAdmin)"
                    name="Revenue (₹)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#F59E0B", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Plan Distribution */}
          <div
            className="card animate-fade-up stagger-4"
            style={{ padding: "22px 24px", display: "flex", flexDirection: "column" }}
          >
            <div style={{ marginBottom: 16 }}>
              <h2
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "var(--foreground)",
                  marginBottom: 3,
                }}
              >
                Plan Split
              </h2>
              <p style={{ color: "var(--foreground-subtle)", fontSize: 12 }}>
                Owners by subscription
              </p>
            </div>
            {plansLoading ? (
              <div
                style={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--foreground-subtle)",
                  fontSize: 13,
                }}
              >
                <Loader2 size={22} style={{ animation: "spin 1s linear infinite", marginRight: 8 }} />
                Loading plans…
              </div>
            ) : planData.length === 0 ? (
              <div
                style={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--foreground-subtle)",
                  fontSize: 13,
                }}
              >
                No plans configured
              </div>
            ) : (
            <div
              style={{
                background:
                  "linear-gradient(180deg, rgba(250,249,247,1) 0%, rgba(232,228,220,0.92) 100%)",
                borderRadius: 12,
                padding: "12px 8px 6px",
                border: "1px solid rgba(20, 18, 16, 0.1)",
              }}
            >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={planData}
                barSize={44}
                maxBarSize={56}
                margin={{ top: 8, right: 8, bottom: 4, left: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,18,16,0.12)" vertical={false} />
                <XAxis
                  dataKey="plan"
                  tick={{ fontSize: 12, fill: "#44403C", fontFamily: "DM Sans, sans-serif", fontWeight: 600 }}
                  axisLine={{ stroke: "rgba(20,18,16,0.15)" }}
                  tickLine={false}
                />
                <YAxis
                  width={36}
                  allowDecimals={false}
                  tick={{ fontSize: 11.5, fill: "#57534E", fontFamily: "DM Sans, sans-serif" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(245,158,11,0.12)" }} />
                <Bar dataKey="count" name="Owners" radius={[8, 8, 0, 0]}>
                  {planData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.color}
                      stroke="rgba(20, 18, 16, 0.45)"
                      strokeWidth={1.5}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
            )}
            {!plansLoading && planData.length > 0 && (
            <div
              style={{
                marginTop: "auto",
                paddingTop: 16,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px 12px",
              }}
            >
              {planData.map((p) => (
                <div key={p.plan} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 3,
                      background: p.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--foreground-muted)",
                      fontFamily: "DM Sans, sans-serif",
                    }}
                  >
                    {p.plan}{" "}
                    <strong style={{ color: "var(--foreground)" }}>{p.count}</strong>
                  </span>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>

        {/* Recent Owners Table */}
        <div className="card animate-fade-up stagger-5" style={{ overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 24px 16px",
              borderBottom: "1px solid var(--card-border)",
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "var(--foreground)",
                  marginBottom: 2,
                }}
              >
                Recent Owners
              </h2>
              <p style={{ color: "var(--foreground-subtle)", fontSize: 12 }}>
                Latest registered accounts
              </p>
            </div>
            <a
              href="/owners"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--amber-dark)",
                textDecoration: "none",
                padding: "6px 14px",
                borderRadius: 8,
                background: "var(--amber-glow)",
                border: "1px solid rgba(245,158,11,0.2)",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              View All
              <ArrowUpRight size={13} />
            </a>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Owner</th>
                  <th>Phone</th>
                  <th>Business</th>
                  <th>State</th>
                  <th>Managers</th>
                  <th>Vehicles</th>
                </tr>
              </thead>
              <tbody>
                {ownersLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: "24px",
                        color: "var(--foreground-subtle)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                        }}
                      >
                        <Loader2 size={16} style={{ animation: "spin 0.9s linear infinite" }} />
                        Loading owners…
                      </div>
                    </td>
                  </tr>
                ) : owners.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: "24px",
                        color: "var(--foreground-subtle)",
                      }}
                    >
                      No owners found
                    </td>
                  </tr>
                ) : (
                  owners.slice(0, 6).map((o, i) => (
                    <tr key={o.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 33,
                              height: 33,
                              borderRadius: 9,
                              background: avatarColors[i % avatarColors.length],
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontFamily: "Syne, sans-serif",
                              fontWeight: 700,
                              fontSize: 13,
                              color: "#141210",
                              flexShrink: 0,
                            }}
                          >
                            {o.name[0]}
                          </div>
                          <div>
                            <p
                              style={{
                                fontWeight: 600,
                                fontSize: 13.5,
                                color: "var(--foreground)",
                                fontFamily: "DM Sans, sans-serif",
                              }}
                            >
                              {o.name}
                            </p>
                            <p
                              style={{
                                fontSize: 11.5,
                                color: "var(--foreground-subtle)",
                                marginTop: 1,
                              }}
                            >
                              {o.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--foreground-muted)" }}>{o.phone}</td>
                      <td style={{ color: "var(--foreground-muted)" }}>{o.businessName}</td>
                      <td style={{ color: "var(--foreground-muted)" }}>{o.state}</td>
                      <td style={{ fontWeight: 600, color: "var(--foreground)" }}>
                        {o._count?.managers ?? 0}
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--foreground)" }}>
                        {o._count?.vehicles ?? 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   OWNER DASHBOARD
══════════════════════════════════════════════════════════ */
function OwnerDashboard() {
  const user = useAuthStore((s) => s.user);

  const fetchVehicles = useVehiclesStore((s) => s.fetch);
  const vehicles = useVehiclesStore((s) => s.items);

  const fetchDrivers = useDriversStore((s) => s.fetch);
  const drivers = useDriversStore((s) => s.items);

  const fetchCustomers = useCustomersStore((s) => s.fetch);
  const customers = useCustomersStore((s) => s.items);

  const fetchManagers = useManagersStore((s) => s.fetch);
  const managers = useManagersStore((s) => s.items);

  const fetchWork = useWorkEntriesStore((s) => s.fetch);
  const workEntries = useWorkEntriesStore((s) => s.items);
  const workStats = useWorkEntriesStore((s) => s.stats);
  const workLoading = useWorkEntriesStore((s) => s.loading);

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
    fetchCustomers();
    fetchManagers();
    fetchWork();
  }, [fetchVehicles, fetchDrivers, fetchCustomers, fetchManagers, fetchWork]);

  const activeVehicles = vehicles.filter((v) => v.status === "Active").length;
  const activeDrivers = drivers.filter((d) => d.status === "Active").length;
  const activeManagers = managers.filter((m) => m.status === "Active").length;

  // Flatten all customer payment records (amount + paidAt) for the chart adjustment.
  const allCustomerPayments = useMemo(
    () => customers.flatMap((c) => c.payments ?? []).map((p) => ({ amount: p.amount, paidAt: p.paidAt })),
    [customers],
  );

  const monthlyRevenue = useMemo<MonthlyPoint[]>(
    () => buildMonthlyRevenue(workEntries, allCustomerPayments),
    [workEntries, allCustomerPayments],
  );

  const stats = [
    {
      label: "My Vehicles",
      value: vehicles.length.toString(),
      icon: Car,
      accent: "#EA580C",
      accentBg: "rgba(234,88,12,0.08)",
      sub: `${activeVehicles} active`,
      loading: false,
    },
    {
      label: "My Drivers",
      value: drivers.length.toString(),
      icon: UserCog,
      accent: "#0EA5E9",
      accentBg: "rgba(14,165,233,0.08)",
      sub: `${activeDrivers} active`,
      loading: false,
    },
    {
      label: "My Customers",
      value: customers.length.toString(),
      icon: UserRound,
      accent: "#8B5CF6",
      accentBg: "rgba(139,92,246,0.08)",
      sub: "Total customers",
      loading: false,
    },
    {
      label: "My Managers",
      value: managers.length.toString(),
      icon: UserCheck,
      accent: "#059669",
      accentBg: "rgba(5,150,105,0.08)",
      sub: `${activeManagers} active`,
      loading: false,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar title="Dashboard" subtitle={`Welcome back, ${user?.name ?? "Owner"}`} />

      <div
        style={{ padding: "28px 28px 40px", display: "flex", flexDirection: "column", gap: 24 }}
      >
        {/* Role chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 14px",
            borderRadius: 10,
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.20)",
            width: "fit-content",
          }}
        >
          <TrendingUp size={13} style={{ color: "var(--amber)" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--amber-dark)" }}>
            Owner View — manage your fleet, staff &amp; work entries
          </span>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {stats.map((s, i) => (
            <StatCard key={s.label} {...s} idx={i} />
          ))}
        </div>

        {/* Revenue section */}
        <RevenueSection
          data={monthlyRevenue}
          loading={workLoading}
          paidRevenue={workStats?.paidRevenue ?? 0}
          pendingAmount={workStats?.pendingAmount ?? 0}
          totalRevenue={workStats?.totalRevenue ?? 0}
          totalJobs={workStats?.totalJobs ?? 0}
          totalHours={workStats?.totalHours ?? 0}
        />

        {/* Work Entries table */}
        <WorkEntriesTable entries={workEntries} loading={workLoading} />

        {/* Quick links */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Manage Vehicles", href: "/vehicles", icon: Car, color: "#EA580C" },
            { label: "Manage Drivers", href: "/drivers", icon: UserCog, color: "#0EA5E9" },
            { label: "Manage Customers", href: "/customers", icon: UserRound, color: "#8B5CF6" },
            { label: "Manage Managers", href: "/managers", icon: UserCheck, color: "#059669" },
          ].map(({ label, href, icon: Icon, color }) => (
            <a
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 16px",
                borderRadius: 12,
                background: "var(--card-bg)",
                border: "1px solid var(--card-border)",
                textDecoration: "none",
                transition: "all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = color;
                (e.currentTarget as HTMLElement).style.background = `${color}0d`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--card-border)";
                (e.currentTarget as HTMLElement).style.background = "var(--card-bg)";
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `${color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={16} style={{ color }} strokeWidth={2} />
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--foreground)",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                {label}
              </span>
              <ArrowUpRight size={13} style={{ color: "var(--foreground-subtle)", marginLeft: "auto" }} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MANAGER DASHBOARD
══════════════════════════════════════════════════════════ */
function ManagerDashboard() {
  const user = useAuthStore((s) => s.user);

  const fetchVehicles = useVehiclesStore((s) => s.fetch);
  const vehicles = useVehiclesStore((s) => s.items);

  const fetchDrivers = useDriversStore((s) => s.fetch);
  const drivers = useDriversStore((s) => s.items);

  const fetchCustomers = useCustomersStore((s) => s.fetch);
  const customers = useCustomersStore((s) => s.items);

  const fetchWork = useWorkEntriesStore((s) => s.fetch);
  const workEntries = useWorkEntriesStore((s) => s.items);
  const workStats = useWorkEntriesStore((s) => s.stats);
  const workLoading = useWorkEntriesStore((s) => s.loading);

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
    fetchCustomers();
    fetchWork();
  }, [fetchVehicles, fetchDrivers, fetchCustomers, fetchWork]);

  const activeVehicles = vehicles.filter((v) => v.status === "Active").length;
  const activeDrivers = drivers.filter((d) => d.status === "Active").length;

  const allCustomerPayments = useMemo(
    () => customers.flatMap((c) => c.payments ?? []).map((p) => ({ amount: p.amount, paidAt: p.paidAt })),
    [customers],
  );

  const monthlyRevenue = useMemo<MonthlyPoint[]>(
    () => buildMonthlyRevenue(workEntries, allCustomerPayments),
    [workEntries, allCustomerPayments],
  );

  const stats = [
    {
      label: "Vehicles",
      value: vehicles.length.toString(),
      icon: Car,
      accent: "#EA580C",
      accentBg: "rgba(234,88,12,0.08)",
      sub: `${activeVehicles} active`,
      loading: false,
    },
    {
      label: "Drivers",
      value: drivers.length.toString(),
      icon: UserCog,
      accent: "#0EA5E9",
      accentBg: "rgba(14,165,233,0.08)",
      sub: `${activeDrivers} active`,
      loading: false,
    },
    {
      label: "Customers",
      value: customers.length.toString(),
      icon: UserRound,
      accent: "#8B5CF6",
      accentBg: "rgba(139,92,246,0.08)",
      sub: "Total customers",
      loading: false,
    },
    {
      label: "Work Entries",
      value: (workStats?.totalJobs ?? 0).toString(),
      icon: ClipboardList,
      accent: "#059669",
      accentBg: "rgba(5,150,105,0.08)",
      sub: `${fmt(workStats?.totalRevenue ?? 0)} revenue`,
      loading: workLoading && !workStats,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar title="Dashboard" subtitle={`Welcome, ${user?.name ?? "Manager"}`} />

      <div
        style={{ padding: "28px 28px 40px", display: "flex", flexDirection: "column", gap: 24 }}
      >
        {/* Role chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 14px",
            borderRadius: 10,
            background: "rgba(14,165,233,0.08)",
            border: "1px solid rgba(14,165,233,0.18)",
            width: "fit-content",
          }}
        >
          <ShieldCheck size={13} style={{ color: "#0EA5E9" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#0EA5E9" }}>
            Manager View — contact your owner to manage subscriptions &amp; plans
          </span>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {stats.map((s, i) => (
            <StatCard key={s.label} {...s} idx={i} />
          ))}
        </div>

        {/* Revenue section */}
        <RevenueSection
          data={monthlyRevenue}
          loading={workLoading}
          paidRevenue={workStats?.paidRevenue ?? 0}
          pendingAmount={workStats?.pendingAmount ?? 0}
          totalRevenue={workStats?.totalRevenue ?? 0}
          totalJobs={workStats?.totalJobs ?? 0}
          totalHours={workStats?.totalHours ?? 0}
        />

        {/* Work Entries table */}
        <WorkEntriesTable entries={workEntries} loading={workLoading} />

        {/* Quick links (no managers, no subscription) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Manage Vehicles", href: "/vehicles", icon: Car, color: "#EA580C" },
            { label: "Manage Drivers", href: "/drivers", icon: UserCog, color: "#0EA5E9" },
            { label: "Manage Customers", href: "/customers", icon: UserRound, color: "#8B5CF6" },
          ].map(({ label, href, icon: Icon, color }) => (
            <a
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 16px",
                borderRadius: 12,
                background: "var(--card-bg)",
                border: "1px solid var(--card-border)",
                textDecoration: "none",
                transition: "all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = color;
                (e.currentTarget as HTMLElement).style.background = `${color}0d`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--card-border)";
                (e.currentTarget as HTMLElement).style.background = "var(--card-bg)";
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `${color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={16} style={{ color }} strokeWidth={2} />
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--foreground)",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                {label}
              </span>
              <ArrowUpRight size={13} style={{ color: "var(--foreground-subtle)", marginLeft: "auto" }} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT — route by role
══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const role = useAuthStore((s) => s.user?.role);

  if (role === "admin") return <AdminDashboard />;
  if (role === "manager") return <ManagerDashboard />;
  return <OwnerDashboard />;
}
