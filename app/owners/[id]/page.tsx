"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Crown,
  CheckCircle2,
  AlertCircle,
  Car,
  UserCog,
  Users,
  IndianRupee,
  CalendarDays,
  Tractor,
  Shield,
  Clock,
  Wrench,
  Activity,
} from "lucide-react";
import { ownerAvatarColors, planBadge } from "../../../lib/ownerData";
import { ownersApi, type Owner } from "../../../lib/api/owners";

const planColor: Record<string, string> = {
  Free: "#9CA3AF",
  Bronze: "#B45309",
  Silver: "#64748B",
  Gold: "#F59E0B",
  Diamond: "#0EA5E9",
  Premium: "#8B5CF6",
};

const vehicleStatusStyle: Record<string, { bg: string; color: string }> = {
  Active: { bg: "rgba(5,150,105,0.10)", color: "#059669" },
  Idle: { bg: "rgba(245,158,11,0.10)", color: "#D97706" },
  Service: { bg: "rgba(234,88,12,0.10)", color: "#EA580C" },
};

const subStatusStyle: Record<
  string,
  { bg: string; color: string; badge: string }
> = {
  Paid: { bg: "rgba(5,150,105,0.08)", color: "#059669", badge: "badge-active" },
  Pending: {
    bg: "rgba(245,158,11,0.08)",
    color: "#D97706",
    badge: "badge-pending",
  },
  Expired: {
    bg: "rgba(156,163,175,0.10)",
    color: "#9CA3AF",
    badge: "badge-free",
  },
};

// Map backend VehicleStatus enum -> frontend label
const vehicleStatusLabel = (s: string) =>
  s === "Under_Service" ? "Service" : s;

// Build a friendly subscription-history row from the backend Subscription record
const buildSubRow = (s: NonNullable<Owner["subscriptions"]>[number]) => {
  const planName = s.plan?.name || "—";
  const start = s.startDate ? new Date(s.startDate) : null;
  const end = s.endDate ? new Date(s.endDate) : null;
  const fmt = (d: Date | null) =>
    d ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const duration = s.plan?.validity || (start && end ? `${fmt(start)} → ${fmt(end)}` : "—");

  let display: "Paid" | "Pending" | "Expired" = "Pending";
  if (s.paymentStatus === "paid") display = "Paid";
  else if (s.status === "expired" || s.status === "cancelled") display = "Expired";
  else display = "Pending";

  return {
    id: s.id,
    plan: planName,
    duration,
    amount: s.amount || 0,
    date: fmt(start),
    status: display,
  };
};

export default function OwnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "vehicles" | "drivers" | "managers" | "subscription"
  >("vehicles");

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setError("Invalid owner id");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    ownersApi
      .getOne(id)
      .then((data) => {
        if (cancelled) return;
        setOwner(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg =
          (err as { response?: { data?: { message?: string } }; message?: string })
            ?.response?.data?.message ||
          (err as { message?: string })?.message ||
          "Failed to load owner";
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--background)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ fontSize: 15, color: "var(--foreground-muted)" }}>
          Loading owner…
        </p>
      </div>
    );
  }

  if (error || !owner) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--background)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "var(--foreground-muted)" }}>
            {error || "Owner not found."}
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => router.push("/owners")}
          >
            <ArrowLeft size={14} /> Back to Owners
          </button>
        </div>
      </div>
    );
  }

  // Derived collections from backend response
  const vehicles = owner.vehicles ?? [];
  const drivers = owner.drivers ?? [];
  const managers = owner.managers ?? [];
  const subscriptions = (owner.subscriptions ?? []).map(buildSubRow);

  const avatarColor =
    ownerAvatarColors[Math.abs(owner.id) % ownerAvatarColors.length];

  const activeVehicles = vehicles.filter((v) => v.status === "Active").length;
  const activeDrivers = drivers.filter((d) => d.status === "Active").length;
  const activeManagers = managers.length; // all listed managers are considered active

  const totalSubSpent = subscriptions
    .filter((s) => s.status === "Paid")
    .reduce((a, s) => a + s.amount, 0);
  const pendingSub = subscriptions.find((s) => s.status === "Pending");

  // current/most-recent plan from latest subscription (already ordered desc by startDate)
  const currentSubRaw = owner.subscriptions?.[0];
  const currentPlanName = currentSubRaw?.plan?.name || "Free";
  const currentPlanAmount = currentSubRaw?.plan?.price ?? 0;
  const currentPlanColor = planColor[currentPlanName] || "#9CA3AF";
  const currentPlanBadgeClass = planBadge[currentPlanName] || "badge-free";
  const ownerStatus = currentSubRaw?.status === "active" ? "Active" : "Inactive";

  const tenureMonths = Math.floor(
    (Date.now() - new Date(owner.createdAt).getTime()) /
      (1000 * 60 * 60 * 24 * 30),
  );
  const joinedLabel = new Date(owner.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const tabs = [
    {
      key: "vehicles",
      label: "Vehicles",
      count: vehicles.length,
      icon: Tractor,
    },
    {
      key: "drivers",
      label: "Drivers",
      count: drivers.length,
      icon: UserCog,
    },
    {
      key: "managers",
      label: "Managers",
      count: managers.length,
      icon: Users,
    },
    {
      key: "subscription",
      label: "Subscription",
      count: subscriptions.length,
      icon: Shield,
    },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar
        title="Owner Details"
        subtitle={`Full profile for ${owner.name}`}
      />

      <div
        style={{
          padding: "28px 28px 48px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Back */}
        <div>
          <button
            className="btn btn-ghost"
            style={{ gap: 7, fontSize: 13 }}
            onClick={() => router.push("/owners")}
          >
            <ArrowLeft size={14} /> Back to Owners
          </button>
        </div>

        {/* ── Profile Header ── */}
        <div
          className="card animate-fade-up stagger-1"
          style={{ padding: "28px 30px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  background: avatarColor,
                  boxShadow: `0 4px 18px ${avatarColor}55`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Syne,sans-serif",
                  fontWeight: 800,
                  fontSize: 26,
                  color: "#141210",
                  flexShrink: 0,
                }}
              >
                {owner.name?.[0] ?? "?"}
              </div>
              <div>
                <h1
                  style={{
                    fontFamily: "Syne,sans-serif",
                    fontWeight: 800,
                    fontSize: 22,
                    color: "var(--foreground)",
                    letterSpacing: "-0.02em",
                    marginBottom: 6,
                  }}
                >
                  {owner.name}
                </h1>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 13,
                      color: "var(--foreground-muted)",
                    }}
                  >
                    <Phone size={13} />
                    {owner.phone}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 13,
                      color: "var(--foreground-muted)",
                    }}
                  >
                    <MapPin size={13} />
                    {owner.state}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 13,
                      color: "var(--foreground-muted)",
                    }}
                  >
                    <CalendarDays size={13} />
                    Joined {joinedLabel} · {tenureMonths}m
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span
                    className={`badge ${currentPlanBadgeClass}`}
                    style={{ fontSize: 12.5 }}
                  >
                    {currentPlanName === "Gold" && <Crown size={9} />}
                    {currentPlanName} Plan
                  </span>
                  <span
                    className={`badge ${ownerStatus === "Active" ? "badge-active" : "badge-pending"}`}
                    style={{ fontSize: 12.5 }}
                  >
                    {ownerStatus === "Active" ? (
                      <CheckCircle2 size={9} />
                    ) : (
                      <Clock size={9} />
                    )}
                    {ownerStatus}
                  </span>
                  {pendingSub && (
                    <span
                      className="badge badge-pending"
                      style={{ fontSize: 12.5 }}
                    >
                      <AlertCircle size={9} /> Payment Pending
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Plan highlight */}
            <div
              style={{
                textAlign: "right",
                padding: "16px 20px",
                borderRadius: 14,
                background: `${currentPlanColor}12`,
                border: `1px solid ${currentPlanColor}30`,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: currentPlanColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 4,
                }}
              >
                Current Plan
              </p>
              <p
                style={{
                  fontFamily: "Syne,sans-serif",
                  fontWeight: 800,
                  fontSize: 26,
                  color: currentPlanColor,
                  letterSpacing: "-0.02em",
                }}
              >
                {currentPlanName}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--foreground-subtle)",
                  marginTop: 2,
                }}
              >
                {currentPlanAmount > 0
                  ? `₹${currentPlanAmount.toLocaleString()}/yr`
                  : "Free tier"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Key Metrics ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 16,
          }}
        >
          {[
            {
              label: "Total Vehicles",
              value: vehicles.length,
              sub: `${activeVehicles} active`,
              accent: "#0EA5E9",
              bg: "rgba(14,165,233,0.08)",
              icon: Car,
            },
            {
              label: "Total Drivers",
              value: drivers.length,
              sub: `${activeDrivers} active`,
              accent: "#F59E0B",
              bg: "rgba(245,158,11,0.08)",
              icon: UserCog,
            },
            {
              label: "Total Managers",
              value: managers.length,
              sub: `${activeManagers} active`,
              accent: "#059669",
              bg: "rgba(5,150,105,0.08)",
              icon: Users,
            },
            {
              label: "Total Spent",
              value: `₹${totalSubSpent.toLocaleString()}`,
              sub: "on subscriptions",
              accent: "#EA580C",
              bg: "rgba(234,88,12,0.08)",
              icon: IndianRupee,
            },
          ].map(({ label, value, sub, accent, bg, icon: Icon }, i) => (
            <div
              key={label}
              className={`card card-hover animate-fade-up stagger-${i + 1}`}
              style={{
                padding: "18px 20px",
                position: "relative",
                overflow: "hidden",
              }}
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
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p
                    style={{
                      color: "var(--foreground-subtle)",
                      fontSize: 11.5,
                      fontWeight: 500,
                      marginBottom: 5,
                    }}
                  >
                    {label}
                  </p>
                  <p
                    style={{
                      fontFamily: "Syne,sans-serif",
                      fontWeight: 800,
                      fontSize: 24,
                      color: "var(--foreground)",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {value}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--foreground-subtle)",
                      marginTop: 3,
                    }}
                  >
                    {sub}
                  </p>
                </div>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={17} style={{ color: accent }} strokeWidth={2} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabbed Detail Cards ── */}
        <div
          className="card animate-fade-up stagger-4"
          style={{ overflow: "hidden" }}
        >
          {/* Tab Bar */}
          <div
            style={{
              borderBottom: "1px solid var(--card-border)",
              padding: "0 24px",
              display: "flex",
              gap: 2,
            }}
          >
            {tabs.map(({ key, label, count, icon: Icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "14px 16px",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "DM Sans,sans-serif",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    background: "transparent",
                    color: isActive
                      ? "var(--amber-dark)"
                      : "var(--foreground-subtle)",
                    borderBottom: isActive
                      ? "2px solid var(--amber)"
                      : "2px solid transparent",
                    borderRadius: "8px 8px 0 0",
                    transition: "all 0.15s",
                    marginBottom: -1,
                  }}
                >
                  <Icon size={13} />
                  {label}
                  <span
                    style={{
                      fontSize: 11,
                      padding: "1px 6px",
                      borderRadius: 99,
                      background: isActive ? "var(--amber-glow)" : "#F0EEE9",
                      color: isActive
                        ? "var(--amber-dark)"
                        : "var(--foreground-subtle)",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Vehicles Tab ── */}
          {activeTab === "vehicles" &&
            (vehicles.length === 0 ? (
              <div
                style={{
                  padding: "48px",
                  textAlign: "center",
                  color: "var(--foreground-subtle)",
                  fontStyle: "italic",
                }}
              >
                No vehicles registered.
              </div>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 44 }}>#</th>
                        <th>Registration</th>
                        <th>Type</th>
                        <th>Model</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles.map((v, i) => {
                        const label = vehicleStatusLabel(v.status);
                        const st =
                          vehicleStatusStyle[label] ||
                          vehicleStatusStyle.Active;
                        return (
                          <tr key={v.id}>
                            <td
                              style={{
                                color: "var(--foreground-subtle)",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              {i + 1}
                            </td>
                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 9,
                                    background: "rgba(14,165,233,0.08)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {v.type === "JCB" ? (
                                    <Wrench
                                      size={14}
                                      style={{ color: "#0EA5E9" }}
                                    />
                                  ) : (
                                    <Tractor
                                      size={14}
                                      style={{ color: "#0EA5E9" }}
                                    />
                                  )}
                                </div>
                                <span
                                  style={{
                                    fontFamily: "DM Sans,sans-serif",
                                    fontWeight: 600,
                                    fontSize: 13,
                                    color: "var(--foreground)",
                                    letterSpacing: "0.03em",
                                  }}
                                >
                                  {v.number}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  padding: "3px 8px",
                                  borderRadius: 6,
                                  background:
                                    v.type === "JCB"
                                      ? "rgba(14,165,233,0.08)"
                                      : "rgba(245,158,11,0.08)",
                                  color:
                                    v.type === "JCB" ? "#0EA5E9" : "#D97706",
                                }}
                              >
                                {v.type}
                              </span>
                            </td>
                            <td
                              style={{
                                fontSize: 13,
                                color: "var(--foreground)",
                                fontWeight: 500,
                              }}
                            >
                              {v.name}
                            </td>
                            <td>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  padding: "3px 9px",
                                  borderRadius: 99,
                                  background: st.bg,
                                  color: st.color,
                                }}
                              >
                                <Activity size={9} />
                                {label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div
                  style={{
                    padding: "12px 24px",
                    borderTop: "1px solid var(--card-border)",
                    display: "flex",
                    gap: 16,
                    background: "#FAFAF8",
                  }}
                >
                  {["Active", "Idle", "Service"].map((s) => {
                    const cnt = vehicles.filter(
                      (v) => vehicleStatusLabel(v.status) === s,
                    ).length;
                    const st = vehicleStatusStyle[s];
                    return (
                      <span
                        key={s}
                        style={{
                          fontSize: 12,
                          color: "var(--foreground-subtle)",
                        }}
                      >
                        <strong style={{ color: st.color }}>{cnt}</strong> {s}
                      </span>
                    );
                  })}
                </div>
              </>
            ))}

          {/* ── Drivers Tab ── */}
          {activeTab === "drivers" &&
            (drivers.length === 0 ? (
              <div
                style={{
                  padding: "48px",
                  textAlign: "center",
                  color: "var(--foreground-subtle)",
                  fontStyle: "italic",
                }}
              >
                No drivers assigned.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>#</th>
                      <th>Driver</th>
                      <th>Mobile</th>
                      <th>Since</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map((d, i) => (
                      <tr key={d.id}>
                        <td
                          style={{
                            color: "var(--foreground-subtle)",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {i + 1}
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 33,
                                height: 33,
                                borderRadius: 9,
                                background:
                                  ownerAvatarColors[
                                    d.id % ownerAvatarColors.length
                                  ],
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontFamily: "Syne,sans-serif",
                                fontWeight: 700,
                                fontSize: 13,
                                color: "#141210",
                                flexShrink: 0,
                              }}
                            >
                              {d.name?.[0] ?? "?"}
                            </div>
                            <div>
                              <p
                                style={{
                                  fontWeight: 600,
                                  fontSize: 13.5,
                                  color: "var(--foreground)",
                                }}
                              >
                                {d.name}
                              </p>
                              <p
                                style={{
                                  fontSize: 11,
                                  color: "var(--foreground-subtle)",
                                  marginTop: 1,
                                }}
                              >
                                Driver
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              color: "var(--foreground-muted)",
                              fontSize: 13,
                            }}
                          >
                            <Phone size={11} />
                            {d.mobile}
                          </div>
                        </td>
                        <td
                          style={{
                            fontSize: 13,
                            color: "var(--foreground-muted)",
                          }}
                        >
                          {new Date(d.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td>
                          <span
                            className={`badge ${d.status === "Active" ? "badge-active" : "badge-free"}`}
                          >
                            {d.status === "Active" ? (
                              <CheckCircle2 size={9} />
                            ) : (
                              <AlertCircle size={9} />
                            )}
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {/* ── Managers Tab ── */}
          {activeTab === "managers" &&
            (managers.length === 0 ? (
              <div
                style={{
                  padding: "48px",
                  textAlign: "center",
                  color: "var(--foreground-subtle)",
                  fontStyle: "italic",
                }}
              >
                No managers assigned.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>#</th>
                      <th>Manager</th>
                      <th>Mobile</th>
                      <th>Since</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managers.map((m, i) => (
                      <tr key={m.id}>
                        <td
                          style={{
                            color: "var(--foreground-subtle)",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {i + 1}
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 33,
                                height: 33,
                                borderRadius: 9,
                                background:
                                  ownerAvatarColors[
                                    (m.id + 3) % ownerAvatarColors.length
                                  ],
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontFamily: "Syne,sans-serif",
                                fontWeight: 700,
                                fontSize: 13,
                                color: "#141210",
                                flexShrink: 0,
                              }}
                            >
                              {m.name?.[0] ?? "?"}
                            </div>
                            <div>
                              <p
                                style={{
                                  fontWeight: 600,
                                  fontSize: 13.5,
                                  color: "var(--foreground)",
                                }}
                              >
                                {m.name}
                              </p>
                              <p
                                style={{
                                  fontSize: 11,
                                  color: "var(--foreground-subtle)",
                                  marginTop: 1,
                                }}
                              >
                                Manager
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              color: "var(--foreground-muted)",
                              fontSize: 13,
                            }}
                          >
                            <Phone size={11} />
                            {m.phone}
                          </div>
                        </td>
                        <td
                          style={{
                            fontSize: 13,
                            color: "var(--foreground-muted)",
                          }}
                        >
                          {new Date(m.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td>
                          <span className="badge badge-active">
                            <CheckCircle2 size={9} />
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {/* ── Subscription Tab ── */}
          {activeTab === "subscription" &&
            (subscriptions.length === 0 ? (
              <div
                style={{
                  padding: "48px",
                  textAlign: "center",
                  color: "var(--foreground-subtle)",
                  fontStyle: "italic",
                }}
              >
                No subscription history.
              </div>
            ) : (
              <>
                {/* Current plan highlight */}
                <div
                  style={{
                    padding: "20px 26px",
                    borderBottom: "1px solid var(--card-border)",
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: 14,
                  }}
                >
                  {[
                    {
                      label: "Current Plan",
                      value: currentPlanName,
                      color: currentPlanColor,
                    },
                    {
                      label: "Annual Cost",
                      value:
                        currentPlanAmount > 0
                          ? `₹${currentPlanAmount.toLocaleString()}`
                          : "Free",
                      color: "#F59E0B",
                    },
                    {
                      label: "Total Invested",
                      value: `₹${totalSubSpent.toLocaleString()}`,
                      color: "#059669",
                    },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      style={{
                        background: "#FAFAF8",
                        borderRadius: 12,
                        padding: "14px 16px",
                        border: "1px solid var(--card-border)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: "var(--foreground-subtle)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginBottom: 6,
                        }}
                      >
                        {label}
                      </p>
                      <p
                        style={{
                          fontFamily: "Syne,sans-serif",
                          fontWeight: 800,
                          fontSize: 20,
                          color,
                        }}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 44 }}>S.No</th>
                        <th>Plan</th>
                        <th>Duration</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.map((s, i) => {
                        const st =
                          subStatusStyle[s.status] || subStatusStyle.Pending;
                        const planClr = planColor[s.plan] || "#9CA3AF";
                        const badgeCls =
                          planBadge[s.plan] || "badge-free";
                        return (
                          <tr key={s.id}>
                            <td
                              style={{
                                color: "var(--foreground-subtle)",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              {i + 1}
                            </td>
                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 8,
                                    background: `${planClr}15`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {s.plan === "Gold" || s.plan === "Silver" ? (
                                    <Crown
                                      size={13}
                                      style={{ color: planClr }}
                                    />
                                  ) : (
                                    <Shield
                                      size={13}
                                      style={{ color: planClr }}
                                    />
                                  )}
                                </div>
                                <span className={`badge ${badgeCls}`}>
                                  {s.plan === "Gold" && <Crown size={9} />}
                                  {s.plan}
                                </span>
                              </div>
                            </td>
                            <td
                              style={{
                                fontSize: 13,
                                color: "var(--foreground-muted)",
                              }}
                            >
                              {s.duration}
                            </td>
                            <td>
                              <span
                                style={{
                                  fontFamily: "Syne,sans-serif",
                                  fontWeight: 700,
                                  fontSize: 15,
                                  color:
                                    s.amount > 0
                                      ? "var(--amber-dark)"
                                      : "var(--foreground-subtle)",
                                }}
                              >
                                {s.amount > 0
                                  ? `₹${s.amount.toLocaleString()}`
                                  : "—"}
                              </span>
                            </td>
                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                  fontSize: 13,
                                  color: "var(--foreground-muted)",
                                }}
                              >
                                <CalendarDays size={12} />
                                {s.date}
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${st.badge}`}>
                                {s.status === "Paid" ? (
                                  <CheckCircle2 size={9} />
                                ) : s.status === "Pending" ? (
                                  <Clock size={9} />
                                ) : (
                                  <AlertCircle size={9} />
                                )}
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div
                  style={{
                    padding: "12px 24px",
                    borderTop: "1px solid var(--card-border)",
                    background: "#FAFAF8",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <p style={{ fontSize: 12, color: "var(--foreground-subtle)" }}>
                    {subscriptions.filter((s) => s.status === "Paid").length}{" "}
                    paid ·{" "}
                    {
                      subscriptions.filter((s) => s.status === "Pending").length
                    }{" "}
                    pending ·{" "}
                    {
                      subscriptions.filter((s) => s.status === "Expired").length
                    }{" "}
                    expired
                  </p>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--foreground-subtle)",
                    }}
                  >
                    Total:{" "}
                    <strong style={{ color: "#059669" }}>
                      ₹{totalSubSpent.toLocaleString()}
                    </strong>
                  </span>
                </div>
              </>
            ))}
        </div>
      </div>
    </div>
  );
}
