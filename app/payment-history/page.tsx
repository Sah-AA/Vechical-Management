"use client";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCcw,
  Search,
  Copy,
  Check,
  TrendingUp,
  IndianRupee,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { subscriptionsApi, type PaymentHistoryRow } from "../../lib/api/subscriptions";
import { getErrorMessage } from "../../lib/api/client";
import { useAuthStore } from "../../lib/store/authStore";
import { useRouter } from "next/navigation";

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmountInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function statusMeta(status: PaymentHistoryRow["status"]) {
  switch (status) {
    case "paid":
      return { label: "Paid", color: "#059669", bg: "rgba(5,150,105,0.1)", Icon: CheckCircle2 };
    case "failed":
      return { label: "Failed", color: "#DC2626", bg: "rgba(220,38,38,0.1)", Icon: XCircle };
    case "refunded":
      return { label: "Refunded", color: "#7C3AED", bg: "rgba(124,58,237,0.1)", Icon: RefreshCcw };
    default:
      return { label: "Pending", color: "#D97706", bg: "rgba(217,119,6,0.1)", Icon: Clock };
  }
}

/* ─── Copy button ───────────────────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return (
    <button
      onClick={handleCopy}
      title="Copy"
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "2px 4px",
        borderRadius: 4,
        color: copied ? "#059669" : "var(--foreground-subtle)",
        transition: "color 0.15s",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

/* ─── Stat card ─────────────────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  sub,
  Icon,
  accent,
  bg,
}: {
  label: string;
  value: string;
  sub?: string;
  Icon: React.FC<{ size?: number; style?: React.CSSProperties }>;
  accent: string;
  bg: string;
}) {
  return (
    <div
      className="card animate-fade-up"
      style={{ padding: "20px 22px", display: "flex", alignItems: "center", gap: 16 }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={20} style={{ color: accent }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 12, color: "var(--foreground-subtle)", marginBottom: 2 }}>
          {label}
        </p>
        <p
          style={{
            fontFamily: "Syne,sans-serif",
            fontWeight: 700,
            fontSize: 22,
            color: "var(--foreground)",
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          {value}
        </p>
        {sub && (
          <p style={{ fontSize: 11, color: "var(--foreground-subtle)", marginTop: 2 }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Truncated ID cell ─────────────────────────────────────────────────── */
function IdCell({ id }: { id: string | null }) {
  if (!id) return <span style={{ color: "var(--foreground-subtle)", fontSize: 12 }}>—</span>;
  const short = id.length > 22 ? `${id.slice(0, 10)}…${id.slice(-6)}` : id;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      <span
        style={{
          fontFamily: "monospace",
          fontSize: 11,
          color: "var(--foreground-subtle)",
        }}
        title={id}
      >
        {short}
      </span>
      <CopyButton text={id} />
    </span>
  );
}

/* ─── Sort helper ────────────────────────────────────────────────────────── */
type SortKey = "createdAt" | "amount" | "status" | "plan" | "user";
type SortDir = "asc" | "desc";

function sortRows(
  rows: PaymentHistoryRow[],
  key: SortKey,
  dir: SortDir,
): PaymentHistoryRow[] {
  return [...rows].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "createdAt":
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "amount":
        cmp = a.amount - b.amount;
        break;
      case "status":
        cmp = a.status.localeCompare(b.status);
        break;
      case "plan":
        cmp = (a.plan?.name ?? "").localeCompare(b.plan?.name ?? "");
        break;
      case "user": {
        const aUser = (a as unknown as { user?: { name?: string } }).user?.name ?? "";
        const bUser = (b as unknown as { user?: { name?: string } }).user?.name ?? "";
        cmp = aUser.localeCompare(bUser);
        break;
      }
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

/* ─── Extended row type (admin includes user) ────────────────────────────── */
interface AdminPaymentRow extends PaymentHistoryRow {
  user?: { id: number; name: string; email: string };
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function PaymentHistoryPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const [rows, setRows] = useState<AdminPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/");
    }
  }, [user, router]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await subscriptionsApi.getAdminPaymentHistory();
        setRows(data as AdminPaymentRow[]);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load payment history"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const paid = rows.filter((r) => r.status === "paid");
    const failed = rows.filter((r) => r.status === "failed");
    const pending = rows.filter((r) => r.status === "created");
    const revenue = paid.reduce((s, r) => s + r.amount, 0);
    return { total: rows.length, paid: paid.length, failed: failed.length, pending: pending.length, revenue };
  }, [rows]);

  /* ── Filtered + sorted rows ── */
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let filtered = rows;
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }
    if (q) {
      filtered = filtered.filter((r) => {
        const u = r as AdminPaymentRow;
        return (
          u.user?.name?.toLowerCase().includes(q) ||
          u.user?.email?.toLowerCase().includes(q) ||
          r.plan?.name?.toLowerCase().includes(q) ||
          r.razorpayOrderId.toLowerCase().includes(q) ||
          (r.razorpayPaymentId ?? "").toLowerCase().includes(q)
        );
      });
    }
    return sortRows(filtered, sortKey, sortDir);
  }, [rows, search, statusFilter, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronDown size={13} style={{ opacity: 0.3 }} />;
    return sortDir === "asc"
      ? <ChevronUp size={13} style={{ color: "#F59E0B" }} />
      : <ChevronDown size={13} style={{ color: "#F59E0B" }} />;
  }

  const thStyle: React.CSSProperties = {
    padding: "11px 16px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--foreground-subtle)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    whiteSpace: "nowrap",
    cursor: "pointer",
    userSelect: "none",
  };

  const tdStyle: React.CSSProperties = {
    padding: "14px 16px",
    fontSize: 13,
    color: "var(--foreground)",
    verticalAlign: "middle",
    borderTop: "1px solid var(--card-border)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px 48px" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(245,158,11,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CreditCard size={18} style={{ color: "#F59E0B" }} />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "Syne,sans-serif",
                  fontWeight: 700,
                  fontSize: 22,
                  color: "var(--foreground)",
                  letterSpacing: "-0.03em",
                }}
              >
                Payment History
              </h1>
              <p style={{ fontSize: 12, color: "var(--foreground-subtle)" }}>
                All Razorpay transactions across all owners
              </p>
            </div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
            gap: 14,
            marginBottom: 24,
          }}
        >
          <StatCard
            label="Total Revenue"
            value={formatAmountInr(stats.revenue)}
            sub={`from ${stats.paid} paid transaction${stats.paid !== 1 ? "s" : ""}`}
            Icon={IndianRupee}
            accent="#F59E0B"
            bg="rgba(245,158,11,0.1)"
          />
          <StatCard
            label="Successful Payments"
            value={String(stats.paid)}
            Icon={TrendingUp}
            accent="#059669"
            bg="rgba(5,150,105,0.1)"
          />
          <StatCard
            label="Failed Payments"
            value={String(stats.failed)}
            Icon={AlertTriangle}
            accent="#DC2626"
            bg="rgba(220,38,38,0.1)"
          />
          <StatCard
            label="Pending / Initiated"
            value={String(stats.pending)}
            Icon={Clock}
            accent="#D97706"
            bg="rgba(217,119,6,0.1)"
          />
        </div>

        {/* ── Filters ── */}
        <div
          className="card animate-fade-up"
          style={{ padding: "14px 18px", marginBottom: 14 }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
            }}
          >
            {/* Search */}
            <div
              style={{
                flex: "1 1 260px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--card-bg)",
                border: "1px solid var(--card-border)",
                borderRadius: 8,
                padding: "7px 12px",
              }}
            >
              <Search size={14} style={{ color: "var(--foreground-subtle)", flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by owner, plan, order ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  color: "var(--foreground)",
                  width: "100%",
                }}
              />
            </div>

            {/* Status filter */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["all", "paid", "created", "failed", "refunded"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: "6px 13px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    border: "1px solid",
                    transition: "all 0.15s",
                    ...(statusFilter === s
                      ? {
                          background: "#F59E0B",
                          borderColor: "#F59E0B",
                          color: "#fff",
                        }
                      : {
                          background: "transparent",
                          borderColor: "var(--card-border)",
                          color: "var(--foreground-subtle)",
                        }),
                  }}
                >
                  {s === "created" ? "Pending" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            <p style={{ fontSize: 12, color: "var(--foreground-subtle)", marginLeft: "auto" }}>
              {visible.length} record{visible.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="card animate-fade-up stagger-2" style={{ overflow: "hidden" }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "60px 0",
                color: "var(--foreground-subtle)",
              }}
            >
              <Loader2 size={18} className="animate-spin" />
              <span style={{ fontSize: 14 }}>Loading payment history…</span>
            </div>
          ) : error ? (
            <div
              style={{
                padding: "32px 24px",
                textAlign: "center",
                color: "#DC2626",
                fontSize: 14,
              }}
            >
              {error}
            </div>
          ) : visible.length === 0 ? (
            <div
              style={{
                padding: "60px 24px",
                textAlign: "center",
                color: "var(--foreground-subtle)",
              }}
            >
              <CreditCard size={36} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>No payment records found</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>
                {search || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No Razorpay transactions yet"}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--card-bg)" }}>
                    <th style={thStyle} onClick={() => handleSort("user")}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        Owner <SortIcon col="user" />
                      </span>
                    </th>
                    <th style={thStyle} onClick={() => handleSort("plan")}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        Plan <SortIcon col="plan" />
                      </span>
                    </th>
                    <th style={thStyle} onClick={() => handleSort("amount")}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        Amount <SortIcon col="amount" />
                      </span>
                    </th>
                    <th style={thStyle} onClick={() => handleSort("status")}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        Status <SortIcon col="status" />
                      </span>
                    </th>
                    <th style={{ ...thStyle, cursor: "default" }}>Order ID</th>
                    <th style={{ ...thStyle, cursor: "default" }}>Payment ID</th>
                    <th style={thStyle} onClick={() => handleSort("createdAt")}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        Date <SortIcon col="createdAt" />
                      </span>
                    </th>
                    <th style={{ ...thStyle, cursor: "default" }}>Subscription</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => {
                    const meta = statusMeta(row.status);
                    const adminRow = row as AdminPaymentRow;
                    return (
                      <tr
                        key={row.id}
                        style={{ transition: "background 0.1s" }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLTableRowElement).style.background =
                            "var(--card-bg)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLTableRowElement).style.background = "")
                        }
                      >
                        {/* Owner */}
                        <td style={tdStyle}>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: 13 }}>
                              {adminRow.user?.name ?? `User #${row.userId}`}
                            </p>
                            <p
                              style={{
                                fontSize: 11,
                                color: "var(--foreground-subtle)",
                                marginTop: 1,
                              }}
                            >
                              {adminRow.user?.email ?? ""}
                            </p>
                          </div>
                        </td>

                        {/* Plan */}
                        <td style={tdStyle}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 9px",
                              borderRadius: 20,
                              background: "rgba(245,158,11,0.1)",
                              color: "#D97706",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {row.plan?.name ?? `Plan #${row.planId}`}
                          </span>
                        </td>

                        {/* Amount */}
                        <td style={{ ...tdStyle, fontWeight: 700, fontFamily: "Syne,sans-serif" }}>
                          {formatAmountInr(row.amount)}
                        </td>

                        {/* Status */}
                        <td style={tdStyle}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "4px 10px",
                              borderRadius: 20,
                              background: meta.bg,
                              color: meta.color,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            <meta.Icon size={11} />
                            {meta.label}
                          </span>
                          {row.errorDescription && (
                            <p
                              style={{
                                fontSize: 10,
                                color: "#DC2626",
                                marginTop: 3,
                                maxWidth: 160,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={row.errorDescription}
                            >
                              {row.errorDescription}
                            </p>
                          )}
                        </td>

                        {/* Order ID */}
                        <td style={tdStyle}>
                          <IdCell id={row.razorpayOrderId} />
                        </td>

                        {/* Payment ID */}
                        <td style={tdStyle}>
                          <IdCell id={row.razorpayPaymentId} />
                        </td>

                        {/* Date */}
                        <td style={{ ...tdStyle, whiteSpace: "nowrap", fontSize: 12 }}>
                          {formatDate(row.createdAt)}
                        </td>

                        {/* Subscription */}
                        <td style={tdStyle}>
                          {row.subscription ? (
                            <div>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "2px 8px",
                                  borderRadius: 20,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  background:
                                    row.subscription.status === "active"
                                      ? "rgba(5,150,105,0.1)"
                                      : "rgba(100,100,100,0.1)",
                                  color:
                                    row.subscription.status === "active"
                                      ? "#059669"
                                      : "var(--foreground-subtle)",
                                }}
                              >
                                {row.subscription.status}
                              </span>
                              <p
                                style={{
                                  fontSize: 10,
                                  color: "var(--foreground-subtle)",
                                  marginTop: 2,
                                }}
                              >
                                ends{" "}
                                {new Date(row.subscription.endDate).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          ) : (
                            <span style={{ color: "var(--foreground-subtle)", fontSize: 12 }}>
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
