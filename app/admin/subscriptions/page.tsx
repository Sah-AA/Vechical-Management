"use client";

import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../../../components/Navbar";
import {
  subscriptionsApi,
  AdminOverviewResult,
  OwnerPlanRow,
} from "../../../lib/api/subscriptions";
import { useToast } from "../../../components/ui/ToastProvider";
import { getErrorMessage } from "../../../lib/api/client";
import {
  Users,
  Crown,
  Zap,
  Clock,
  UserX,
  Search,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  Calendar,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";

/* ─── helpers ─── */
const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const relativeTime = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

/**
 * True when a PAID subscription's endDate has already passed.
 * Free-tier plans with endDate 100 years out are intentionally excluded (price === 0).
 */
const isActuallyExpired = (row: OwnerPlanRow): boolean => {
  const sub = row.subscription;
  if (!sub || sub.planPrice === 0) return false;
  return new Date(sub.endDate) < new Date();
};

const statusMeta = (row: OwnerPlanRow) => {
  if (!row.subscription)
    return { label: "No Plan", color: "#9CA3AF", bg: "#F3F4F6" };
  const s = row.subscription.status;
  const p = row.subscription.planPrice;

  // Treat as expired if the DB hasn't synced yet (endDate already passed for paid plan)
  if (s === "expired" || isActuallyExpired(row))
    return { label: "Expired", color: "#DC2626", bg: "#FEE2E2" };
  if (s === "active" && p === 0)
    return { label: "Free", color: "#6B7280", bg: "#F9FAFB" };
  if (s === "active" && p > 0)
    return { label: "Paid", color: "#059669", bg: "#D1FAE5" };
  if (s === "cancelled")
    return { label: "Cancelled", color: "#D97706", bg: "#FEF3C7" };
  if (s === "pending")
    return { label: "Pending", color: "#7C3AED", bg: "#EDE9FE" };
  return { label: s, color: "#6B7280", bg: "#F3F4F6" };
};

const planBadgeMeta = (badge: string | null) => {
  const b = (badge ?? "").toLowerCase();
  if (b.includes("gold") || b.includes("premium"))
    return { color: "#D97706", bg: "#FEF3C7" };
  if (b.includes("silver")) return { color: "#6B7280", bg: "#F3F4F6" };
  if (b.includes("free")) return { color: "#9CA3AF", bg: "#F9FAFB" };
  return { color: "#2563EB", bg: "#EFF6FF" };
};

type SortKey = "name" | "plan" | "status" | "joined" | "expires";
type SortDir = "asc" | "desc";
type FilterTab = "all" | "free" | "paid" | "expired" | "no_plan";

function SortIcon({
  col,
  active,
  dir,
}: {
  col: string;
  active: boolean;
  dir: SortDir;
}) {
  if (!active) return <ChevronsUpDown size={12} style={{ opacity: 0.35 }} />;
  return dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
}

/* ─── stat card ─── */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 130,
        background: active ? color + "18" : "var(--card)",
        border: `1.5px solid ${active ? color : "var(--card-border)"}`,
        borderRadius: 12,
        padding: "16px 18px",
        cursor: onClick ? "pointer" : "default",
        textAlign: "left",
        transition: "all 0.18s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: color + "22",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={14} color={color} strokeWidth={2.2} />
        </span>
        <span
          style={{
            fontSize: 11,
            color: "var(--foreground-subtle)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: active ? color : "var(--foreground)",
          fontFamily: "Syne,sans-serif",
        }}
      >
        {value}
      </span>
    </button>
  );
}

/* ─── main page ─── */
export default function AdminSubscriptionsPage() {
  const [data, setData] = useState<AdminOverviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "joined",
    dir: "desc",
  });
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await subscriptionsApi.adminOverview();
      setData(res);
    } catch (err) {
      showToast({
        title: "Failed to load overview",
        message: getErrorMessage(err, ""),
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = data.rows;

    // tab filter — use isActuallyExpired so a stale "active" paid row is counted correctly
    if (filterTab === "free")
      rows = rows.filter(
        (r) =>
          r.subscription &&
          r.subscription.planPrice === 0 &&
          r.subscription.status === "active",
      );
    else if (filterTab === "paid")
      rows = rows.filter(
        (r) =>
          r.subscription &&
          r.subscription.planPrice > 0 &&
          r.subscription.status === "active" &&
          !isActuallyExpired(r),
      );
    else if (filterTab === "expired")
      rows = rows.filter(
        (r) => r.subscription?.status === "expired" || isActuallyExpired(r),
      );
    else if (filterTab === "no_plan")
      rows = rows.filter((r) => !r.subscription);

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.businessName ?? "").toLowerCase().includes(q) ||
          (r.phone ?? "").includes(q) ||
          (r.subscription?.planName ?? "").toLowerCase().includes(q),
      );
    }

    // sort
    rows = [...rows].sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";
      if (sort.key === "name") {
        va = a.name;
        vb = b.name;
      } else if (sort.key === "plan") {
        va = a.subscription?.planName ?? "";
        vb = b.subscription?.planName ?? "";
      } else if (sort.key === "status") {
        va = a.subscription?.status ?? "";
        vb = b.subscription?.status ?? "";
      } else if (sort.key === "joined") {
        va = a.joinedAt;
        vb = b.joinedAt;
      } else if (sort.key === "expires") {
        va = a.subscription?.endDate ?? "";
        vb = b.subscription?.endDate ?? "";
      }

      if (va < vb) return sort.dir === "asc" ? -1 : 1;
      if (va > vb) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [data, filterTab, search, sort]);

  // Recompute client-side counts using isActuallyExpired for accuracy
  const clientStats = useMemo(() => {
    if (!data) return null;
    const rows = data.rows;
    return {
      total: rows.length,
      paid: rows.filter(
        (r) =>
          r.subscription &&
          r.subscription.planPrice > 0 &&
          r.subscription.status === "active" &&
          !isActuallyExpired(r),
      ).length,
      free: rows.filter(
        (r) =>
          r.subscription &&
          r.subscription.planPrice === 0 &&
          r.subscription.status === "active",
      ).length,
      expired: rows.filter(
        (r) => r.subscription?.status === "expired" || isActuallyExpired(r),
      ).length,
      noPlan: rows.filter((r) => !r.subscription).length,
    };
  }, [data]);

  const filterTabs: { id: FilterTab; label: string; count: number }[] =
    clientStats
      ? [
          { id: "all", label: "All", count: clientStats.total },
          { id: "paid", label: "Paid", count: clientStats.paid },
          { id: "free", label: "Free Tier", count: clientStats.free },
          { id: "expired", label: "Expired", count: clientStats.expired },
          { id: "no_plan", label: "No Plan", count: clientStats.noPlan },
        ]
      : [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar
        title="Subscription Overview"
        subtitle="All owners and their current plan status"
      />

      <div style={{ padding: "28px 28px 60px" }}>
        {/* ── Stats Strip ── */}
        {clientStats && (
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            <StatCard
              icon={Users}
              label="Total Owners"
              value={clientStats.total}
              color="#2563EB"
              active={filterTab === "all"}
              onClick={() => setFilterTab("all")}
            />
            <StatCard
              icon={Zap}
              label="Paid Active"
              value={clientStats.paid}
              color="#059669"
              active={filterTab === "paid"}
              onClick={() => setFilterTab("paid")}
            />
            <StatCard
              icon={Crown}
              label="Free Tier"
              value={clientStats.free}
              color="#D97706"
              active={filterTab === "free"}
              onClick={() => setFilterTab("free")}
            />
            <StatCard
              icon={Clock}
              label="Expired"
              value={clientStats.expired}
              color="#DC2626"
              active={filterTab === "expired"}
              onClick={() => setFilterTab("expired")}
            />
            <StatCard
              icon={UserX}
              label="No Plan"
              value={clientStats.noPlan}
              color="#9CA3AF"
              active={filterTab === "no_plan"}
              onClick={() => setFilterTab("no_plan")}
            />
          </div>
        )}

        {/* ── Filter + Search bar ── */}
        <div
          className="card"
          style={{
            padding: "14px 18px",
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {/* Pill tabs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {filterTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterTab(t.id)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 99,
                  fontSize: 12.5,
                  fontWeight: filterTab === t.id ? 700 : 500,
                  border:
                    filterTab === t.id
                      ? "1.5px solid var(--amber)"
                      : "1.5px solid var(--card-border)",
                  background:
                    filterTab === t.id ? "var(--amber-glow)" : "transparent",
                  color:
                    filterTab === t.id
                      ? "var(--amber-dark)"
                      : "var(--foreground-muted)",
                  cursor: "pointer",
                }}
              >
                {t.label}
                <span style={{ marginLeft: 5, fontSize: 11, opacity: 0.7 }}>
                  ({t.count})
                </span>
              </button>
            ))}
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 220,
              position: "relative",
              marginLeft: "auto",
            }}
          >
            <Search
              size={13}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--foreground-subtle)",
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search owner, email, plan…"
              style={{
                width: "100%",
                paddingLeft: 30,
                paddingRight: 10,
                paddingTop: 7,
                paddingBottom: 7,
                fontSize: 13,
                borderRadius: 8,
                border: "1.5px solid var(--card-border)",
                background: "var(--input-bg)",
                color: "var(--foreground)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            onClick={load}
            title="Refresh"
            style={{
              padding: "7px 10px",
              borderRadius: 8,
              border: "1.5px solid var(--card-border)",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <RefreshCw
              size={14}
              color="var(--foreground-muted)"
              style={{ display: "block" }}
            />
          </button>
        </div>

        {/* ── Table ── */}
        <div className="card" style={{ overflow: "hidden" }}>
          {loading ? (
            <div
              style={{
                padding: "60px 0",
                textAlign: "center",
                color: "var(--foreground-subtle)",
                fontSize: 14,
              }}
            >
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: "60px 0",
                textAlign: "center",
                color: "var(--foreground-subtle)",
                fontSize: 14,
              }}
            >
              No owners match the current filter.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      background: "#FAFAF8",
                      borderBottom: "1.5px solid var(--card-border)",
                    }}
                  >
                    {(
                      [
                        { key: "name", label: "Owner" },
                        { key: "plan", label: "Plan" },
                        { key: "status", label: "Status" },
                        { key: "joined", label: "Joined" },
                        { key: "expires", label: "Expires" },
                      ] as { key: SortKey; label: string }[]
                    ).map(({ key, label }) => (
                      <th
                        key={key}
                        onClick={() => toggleSort(key)}
                        style={{
                          padding: "11px 16px",
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "var(--foreground-subtle)",
                          textAlign: "left",
                          cursor: "pointer",
                          userSelect: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {label}
                          <SortIcon
                            col={key}
                            active={sort.key === key}
                            dir={sort.dir}
                          />
                        </span>
                      </th>
                    ))}
                    <th
                      style={{
                        padding: "11px 16px",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--foreground-subtle)",
                        textAlign: "left",
                      }}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => {
                    const sm = statusMeta(row);
                    const isExpanded = expandedRow === row.userId;
                    const bm = planBadgeMeta(
                      row.subscription?.planBadge ?? null,
                    );
                    return (
                      <React.Fragment key={row.userId}>
                        <tr
                          onClick={() =>
                            setExpandedRow(isExpanded ? null : row.userId)
                          }
                          style={{
                            borderBottom: "1px solid var(--card-border)",
                            cursor: "pointer",
                            background: isExpanded
                              ? "var(--amber-glow)"
                              : "transparent",
                            transition: "background 0.12s",
                          }}
                          onMouseEnter={(e) => {
                            if (!isExpanded)
                              (
                                e.currentTarget as HTMLElement
                              ).style.background = "#FAFAF8";
                          }}
                          onMouseLeave={(e) => {
                            if (!isExpanded)
                              (
                                e.currentTarget as HTMLElement
                              ).style.background = "transparent";
                          }}
                        >
                          {/* Owner */}
                          <td style={{ padding: "14px 16px" }}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 13.5,
                                color: "var(--foreground)",
                              }}
                            >
                              {row.name}
                            </div>
                            <div
                              style={{
                                fontSize: 11.5,
                                color: "var(--foreground-subtle)",
                                marginTop: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Building2 size={10} />
                              {row.businessName || "—"}
                            </div>
                          </td>

                          {/* Plan */}
                          <td style={{ padding: "14px 16px" }}>
                            {row.subscription?.planName ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                  padding: "3px 10px",
                                  borderRadius: 99,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: bm.color,
                                  background: bm.bg,
                                }}
                              >
                                {row.subscription.planPrice > 0 && (
                                  <Crown size={10} />
                                )}
                                {row.subscription.planName}
                              </span>
                            ) : (
                              <span
                                style={{
                                  color: "var(--foreground-subtle)",
                                  fontSize: 12,
                                }}
                              >
                                —
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td style={{ padding: "14px 16px" }}>
                            <span
                              style={{
                                padding: "3px 10px",
                                borderRadius: 99,
                                fontSize: 12,
                                fontWeight: 700,
                                color: sm.color,
                                background: sm.bg,
                              }}
                            >
                              {sm.label}
                            </span>
                          </td>

                          {/* Joined */}
                          <td
                            style={{
                              padding: "14px 16px",
                              fontSize: 12.5,
                              color: "var(--foreground-muted)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {fmt(row.joinedAt)}
                          </td>

                          {/* Expires */}
                          <td
                            style={{
                              padding: "14px 16px",
                              fontSize: 12.5,
                              color: "var(--foreground-muted)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.subscription?.endDate ? (
                              <span>
                                {fmt(row.subscription.endDate)}
                                <span
                                  style={{
                                    marginLeft: 5,
                                    fontSize: 11,
                                    color: "var(--foreground-subtle)",
                                  }}
                                >
                                  ({relativeTime(row.subscription.endDate)})
                                </span>
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          {/* Amount */}
                          <td
                            style={{
                              padding: "14px 16px",
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--foreground)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.subscription ? (
                              row.subscription.planPrice === 0 ? (
                                <span style={{ color: "#9CA3AF" }}>Free</span>
                              ) : (
                                `₹${row.subscription.amount.toLocaleString("en-IN")}`
                              )
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>

                        {/* Expanded detail row */}
                        {isExpanded && (
                          <tr
                            style={{
                              background: "var(--amber-glow)",
                              borderBottom: "1.5px solid var(--card-border)",
                            }}
                          >
                            <td
                              colSpan={6}
                              style={{ padding: "0 16px 16px 16px" }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: 24,
                                  flexWrap: "wrap",
                                  paddingTop: 4,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    fontSize: 12.5,
                                    color: "var(--foreground-muted)",
                                  }}
                                >
                                  <Mail size={12} />
                                  {row.email}
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    fontSize: 12.5,
                                    color: "var(--foreground-muted)",
                                  }}
                                >
                                  <Phone size={12} />
                                  {row.phone || "—"}
                                </div>
                                {row.subscription && (
                                  <>
                                    <div
                                      style={{
                                        fontSize: 12.5,
                                        color: "var(--foreground-muted)",
                                      }}
                                    >
                                      Payment:{" "}
                                      <strong
                                        style={{
                                          color:
                                            row.subscription.paymentStatus ===
                                            "paid"
                                              ? "#059669"
                                              : "#D97706",
                                        }}
                                      >
                                        {row.subscription.paymentStatus}
                                      </strong>
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 12.5,
                                        color: "var(--foreground-muted)",
                                      }}
                                    >
                                      Start: {fmt(row.subscription.startDate)}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 12.5,
                                        color: "var(--foreground-muted)",
                                      }}
                                    >
                                      Validity:{" "}
                                      {row.subscription.planValidity ?? "—"}
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {!loading && filtered.length > 0 && (
          <p
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "var(--foreground-subtle)",
              textAlign: "right",
            }}
          >
            Showing {filtered.length} of {clientStats?.total ?? 0} owners
          </p>
        )}
      </div>
    </div>
  );
}
