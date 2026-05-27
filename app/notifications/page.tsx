"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  IndianRupee,
  UserPlus,
  Tractor,
  Wrench,
  X,
  Check,
  Trash2,
  Filter,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "../../lib/store/authStore";
import { notificationsApi } from "../../lib/api/notifications";
import { getErrorMessage } from "../../lib/api/client";

type NotifType = "payment" | "alert" | "driver" | "vehicle" | "system";

interface UiNotification {
  id: number;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  date: string;
  read: boolean;
  createdAt: string;
}

const typeConfig: Record<
  NotifType,
  { icon: React.FC<{ size?: number; style?: React.CSSProperties; strokeWidth?: number }>; accent: string; bg: string; label: string }
> = {
  payment: {
    icon: IndianRupee,
    accent: "#059669",
    bg: "rgba(5,150,105,0.10)",
    label: "Payment",
  },
  alert: {
    icon: AlertCircle,
    accent: "#EA580C",
    bg: "rgba(234,88,12,0.10)",
    label: "Alert",
  },
  driver: {
    icon: UserPlus,
    accent: "#0EA5E9",
    bg: "rgba(14,165,233,0.10)",
    label: "Driver",
  },
  vehicle: {
    icon: Tractor,
    accent: "#8B5CF6",
    bg: "rgba(139,92,246,0.10)",
    label: "Vehicle",
  },
  system: {
    icon: Wrench,
    accent: "#F59E0B",
    bg: "rgba(245,158,11,0.10)",
    label: "System",
  },
};

const filterTabs: Array<"All" | NotifType> = ["All", "payment", "alert", "driver", "vehicle", "system"];

/** Prefer persisted `event` from API — avoids mis-tagging e.g. “Server maintenance” as vehicle. */
function inferNotifTypeFromEvent(event: string | null | undefined): NotifType | null {
  if (event == null || event === "") return null;
  if (event.startsWith("bulk_")) return "system";
  switch (event) {
    case "subscription_activated":
    case "subscription_purchase_admin":
    case "customer_payment":
      return "payment";
    case "driver_created":
    case "driver_salary_paid":
      return "driver";
    case "manager_created":
    case "manager_updated":
    case "manager_salary_paid":
    case "customer_created":
    case "owner_welcome":
    case "owner_registered_admin":
      return "system";
    case "work_entry_created":
    case "work_entry_status_changed":
      return "alert";
    default:
      return null;
  }
}

function inferNotifType(title: string, message: string, event?: string | null): NotifType {
  const fromEvent = inferNotifTypeFromEvent(event);
  if (fromEvent) return fromEvent;

  const t = `${title} ${message}`.toLowerCase();
  if (/payment|₹|rupee|invoice|advance|salary|paid|subscription/.test(t)) return "payment";

  // Platform / infra (before loose “vehicle” keywords — “maintenance” matched vehicle before)
  if (
    /\bserver\s+maintenance\b|scheduled\s+(?:server\s+)?maintenance|\bdowntime\b|\bbroadcast\b|the\s+app\s+may|may\s+be\s+(?:briefly\s+)?unavailable|we\s+will\s+be\s+performing|system\s+(?:wide\s+)?(?:notification|alert|update)|\bplatform\s+update\b/.test(
      t,
    )
  )
    return "system";

  // Explicit vehicle/fleet maintenance (not generic “maintenance” alone)
  if (
    /\b(?:vehicle|fleet|tractor|jcb)\s+maintenance\b|maintenance\s+(?:for|on)\s+(?:your\s+)?(?:vehicle|fleet|tractor)/.test(t)
  )
    return "vehicle";

  if (/\b(?:vehicle|tractor|jcb)s?\b|\bfleet\b/.test(t)) return "vehicle";
  if (/\bdriver\b/.test(t)) return "driver";
  if (/\bmanager\b/.test(t)) return "system";
  if (/alert|warning|overdue|critical|expir/.test(t)) return "alert";
  return "system";
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (hrs < 24) return `${hrs} hr ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function dateDividerLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dDay = start(d);
  if (dDay === start(today)) return "Today";
  if (dDay === start(yesterday)) return "Yesterday";
  const weekAgo = start(today) - 6 * 86400000;
  if (dDay >= weekAgo) return "This week";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function loadUiState(userId: number): { readIds: number[]; dismissedIds: number[] } {
  if (typeof window === "undefined") return { readIds: [], dismissedIds: [] };
  try {
    const raw = localStorage.getItem(`jcb_notif_ui_${userId}`);
    if (!raw) return { readIds: [], dismissedIds: [] };
    const parsed = JSON.parse(raw) as { readIds?: number[]; dismissedIds?: number[] };
    return {
      readIds: parsed.readIds ?? [],
      dismissedIds: parsed.dismissedIds ?? [],
    };
  } catch {
    return { readIds: [], dismissedIds: [] };
  }
}

function saveUiState(userId: number, readIds: number[], dismissedIds: number[]) {
  localStorage.setItem(
    `jcb_notif_ui_${userId}`,
    JSON.stringify({ readIds, dismissedIds }),
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const [rows, setRows] = useState<Awaited<ReturnType<typeof notificationsApi.feed>>>([]);
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "error">("idle");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [readIds, setReadIds] = useState<number[]>([]);
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);

  const [activeTab, setActiveTab] = useState<"All" | NotifType>("All");
  const [showUnread, setShowUnread] = useState(false);
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user?.id) return;
    const ui = loadUiState(user.id);
    setReadIds(ui.readIds);
    setDismissedIds(ui.dismissedIds);
  }, [hasHydrated, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    saveUiState(user.id, readIds, dismissedIds);
  }, [user?.id, readIds, dismissedIds]);

  useEffect(() => {
    if (!hasHydrated || !user?.id) return;

    let cancelled = false;
    setLoadStatus("loading");
    setLoadError(null);

    notificationsApi
      .feed()
      .then((data) => {
        if (!cancelled) {
          setRows(data);
          setLoadStatus("idle");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(getErrorMessage(err));
          setLoadStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, user?.id, feedRefreshKey]);

  function refreshFeed() {
    setFeedRefreshKey((k) => k + 1);
  }

  useEffect(() => {
    if (!hasHydrated || user) return;
    router.replace("/login");
  }, [hasHydrated, user, router]);

  const notifs: UiNotification[] = useMemo(() => {
    return rows
      .filter((r) => !dismissedIds.includes(r.id))
      .map((r) => ({
        id: r.id,
        type: inferNotifType(r.title, r.message, r.event),
        title: r.title,
        message: r.message,
        time: formatRelativeTime(r.createdAt),
        date: dateDividerLabel(r.createdAt),
        read: readIds.includes(r.id),
        createdAt: r.createdAt,
      }));
  }, [rows, dismissedIds, readIds]);

  const filtered = notifs.filter((n) => {
    const matchTab = activeTab === "All" || n.type === activeTab;
    const matchUnread = !showUnread || !n.read;
    return matchTab && matchUnread;
  });

  const unreadCount = notifs.filter((n) => !n.read).length;

  function markAllRead() {
    const ids = new Set(readIds);
    notifs.forEach((n) => ids.add(n.id));
    setReadIds([...ids]);
  }

  function markRead(id: number) {
    if (readIds.includes(id)) return;
    setReadIds([...readIds, id]);
  }

  function dismiss(id: number) {
    if (dismissedIds.includes(id)) return;
    setDismissedIds([...dismissedIds, id]);
  }

  function clearAll() {
    const all = rows.map((r) => r.id);
    setDismissedIds([...new Set([...dismissedIds, ...all])]);
  }

  if (!hasHydrated) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--background)" }}>
        <Navbar title="Notifications" subtitle="Stay updated with alerts & activity" />
        <div style={{ padding: 48, display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
          <Loader2 className="animate-spin" size={22} style={{ color: "var(--amber)" }} />
          <span style={{ color: "var(--foreground-subtle)" }}>Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--background)" }}>
        <Navbar title="Notifications" subtitle="Stay updated with alerts & activity" />
        <div style={{ padding: 48, textAlign: "center", color: "var(--foreground-subtle)", fontSize: 14 }}>
          Redirecting to sign in…
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar title="Notifications" subtitle="Stay updated with all system alerts & activity" />

      <div style={{ padding: "28px 28px 48px", display: "flex", flexDirection: "column", gap: 20 }}>

        {loadStatus === "error" && (
          <div
            className="card"
            style={{
              padding: "16px 20px",
              borderLeft: "3px solid #DC2626",
              color: "var(--foreground)",
              fontSize: 13,
            }}
          >
            {loadError ?? "Could not load notifications."}
          </div>
        )}

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          {[
            {
              label: "Total",
              value: notifs.length,
              accent: "#F59E0B",
              bg: "rgba(245,158,11,0.08)",
              icon: Bell,
            },
            {
              label: "Unread",
              value: unreadCount,
              accent: "#EA580C",
              bg: "rgba(234,88,12,0.08)",
              icon: AlertCircle,
            },
            {
              label: "Payments",
              value: notifs.filter((n) => n.type === "payment").length,
              accent: "#059669",
              bg: "rgba(5,150,105,0.08)",
              icon: IndianRupee,
            },
            {
              label: "Alerts",
              value: notifs.filter((n) => n.type === "alert").length,
              accent: "#0EA5E9",
              bg: "rgba(14,165,233,0.08)",
              icon: AlertCircle,
            },
          ].map(({ label, value, accent, bg, icon: Icon }, i) => (
            <div
              key={label}
              className={`card card-hover animate-fade-up stagger-${i + 1}`}
              style={{ padding: "18px 20px", position: "relative", overflow: "hidden" }}
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
                  <p
                    style={{
                      color: "var(--foreground-subtle)",
                      fontSize: 11.5,
                      fontWeight: 500,
                      marginBottom: 7,
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
                    {loadStatus === "loading" ? "—" : value}
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

        {/* Main Card */}
        <div className="card animate-fade-up stagger-3" style={{ overflow: "hidden" }}>

          {/* Header */}
          <div style={{ padding: "18px 24px 0", borderBottom: "1px solid var(--card-border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <h2
                  style={{
                    fontFamily: "Syne,sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                    color: "var(--foreground)",
                    marginBottom: 2,
                  }}
                >
                  All Notifications
                  {unreadCount > 0 && (
                    <span
                      style={{
                        marginLeft: 8,
                        background: "#EA580C",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 99,
                      }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </h2>
                <p style={{ color: "var(--foreground-subtle)", fontSize: 12 }}>
                  Recent system activity and alerts
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: 12, gap: 5, padding: "6px 12px" }}
                  onClick={() => refreshFeed()}
                  disabled={loadStatus === "loading"}
                  title="Reload notifications from server"
                >
                  <RefreshCw
                    size={13}
                    className={loadStatus === "loading" ? "animate-spin" : undefined}
                  />
                  Refresh
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: 12, gap: 5, padding: "6px 12px" }}
                  onClick={() => setShowUnread(!showUnread)}
                >
                  <Filter size={13} />
                  {showUnread ? "Show All" : "Unread Only"}
                </button>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: 12, gap: 5, padding: "6px 12px" }}
                    onClick={markAllRead}
                  >
                    <Check size={13} /> Mark All Read
                  </button>
                )}
                {notifs.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: 12, gap: 5, padding: "6px 12px", color: "#DC2626" }}
                    onClick={clearAll}
                  >
                    <Trash2 size={13} /> Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Type tabs */}
            <div style={{ display: "flex", gap: 2, overflowX: "auto" }}>
              {filterTabs.map((tab) => {
                const count =
                  tab === "All" ? notifs.length : notifs.filter((n) => n.type === tab).length;
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: "7px 14px",
                      border: "none",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      fontFamily: "DM Sans,sans-serif",
                      fontSize: 12.5,
                      fontWeight: isActive ? 600 : 400,
                      background: "transparent",
                      color: isActive ? "var(--amber-dark)" : "var(--foreground-subtle)",
                      borderBottom: isActive ? "2px solid var(--amber)" : "2px solid transparent",
                      borderRadius: "8px 8px 0 0",
                      transition: "all 0.15s",
                      marginBottom: -1,
                    }}
                  >
                    {tab === "All" ? "All" : typeConfig[tab].label}
                    <span
                      style={{
                        marginLeft: 5,
                        fontSize: 11,
                        background: isActive ? "var(--amber-glow)" : "#F0EEE9",
                        color: isActive ? "var(--amber-dark)" : "var(--foreground-subtle)",
                        padding: "1px 6px",
                        borderRadius: 99,
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notification List */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {loadStatus === "loading" ? (
              <div style={{ padding: "60px 24px", textAlign: "center" }}>
                <Loader2
                  className="animate-spin"
                  size={28}
                  style={{ color: "var(--amber)", margin: "0 auto 12px", display: "block" }}
                />
                <p style={{ fontSize: 13, color: "var(--foreground-subtle)" }}>Loading notifications…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "60px 24px", textAlign: "center" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: "rgba(245,158,11,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 14px",
                  }}
                >
                  <Bell size={24} style={{ color: "var(--amber)" }} />
                </div>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--foreground)",
                    fontFamily: "Syne,sans-serif",
                    marginBottom: 6,
                  }}
                >
                  No notifications
                </p>
                <p style={{ fontSize: 13, color: "var(--foreground-subtle)" }}>
                  {showUnread ? "No unread notifications right now." : "You're all caught up!"}
                </p>
              </div>
            ) : (
              filtered.map((notif, idx) => {
                const cfg = typeConfig[notif.type];
                const Icon = cfg.icon;
                const showDateDivider = idx === 0 || filtered[idx - 1].date !== notif.date;
                return (
                  <div key={notif.id}>
                    {showDateDivider && (
                      <div style={{ padding: "10px 24px 4px", display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--foreground-subtle)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {notif.date}
                        </span>
                        <div style={{ flex: 1, height: 1, background: "var(--card-border)" }} />
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                        padding: "14px 24px",
                        background: notif.read ? "transparent" : "rgba(245,158,11,0.03)",
                        borderLeft: notif.read ? "3px solid transparent" : "3px solid var(--amber)",
                        transition: "background 0.15s",
                        borderBottom: "1px solid var(--card-border)",
                        cursor: notif.read ? "default" : "pointer",
                      }}
                      onClick={() => !notif.read && markRead(notif.id)}
                      onKeyDown={(e) => {
                        if (!notif.read && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          markRead(notif.id);
                        }
                      }}
                      role={notif.read ? undefined : "button"}
                      tabIndex={notif.read ? undefined : 0}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 11,
                          flexShrink: 0,
                          background: cfg.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon size={17} style={{ color: cfg.accent }} strokeWidth={2} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span
                            style={{
                              fontFamily: "Syne,sans-serif",
                              fontWeight: 700,
                              fontSize: 13.5,
                              color: "var(--foreground)",
                            }}
                          >
                            {notif.title}
                          </span>
                          {!notif.read && (
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: "#EA580C",
                                flexShrink: 0,
                                boxShadow: "0 0 6px rgba(234,88,12,0.6)",
                              }}
                            />
                          )}
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 600,
                              padding: "2px 7px",
                              borderRadius: 6,
                              background: cfg.bg,
                              color: cfg.accent,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <p style={{ fontSize: 12.5, color: "var(--foreground-muted)", lineHeight: 1.5 }}>
                          {notif.message}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: "var(--foreground-subtle)",
                            marginTop: 5,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Clock size={10} /> {notif.time}
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                        {!notif.read && (
                          <button
                            type="button"
                            className="btn-icon"
                            style={{ padding: 6, borderRadius: 7, border: "none" }}
                            title="Mark as read"
                            onClick={(e) => {
                              e.stopPropagation();
                              markRead(notif.id);
                            }}
                          >
                            <CheckCircle2 size={13} style={{ color: "#059669" }} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ padding: 6, borderRadius: 7, border: "none" }}
                          title="Dismiss"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismiss(notif.id);
                          }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {filtered.length > 0 && loadStatus !== "loading" && (
            <div
              style={{
                padding: "12px 24px",
                borderTop: "1px solid var(--card-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <p style={{ fontSize: 12, color: "var(--foreground-subtle)" }}>
                Showing <strong>{filtered.length}</strong> of <strong>{notifs.length}</strong> notifications
                {unreadCount > 0 && (
                  <>
                    {" "}
                    · <strong style={{ color: "#EA580C" }}>{unreadCount} unread</strong>
                  </>
                )}
              </p>
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={markAllRead}>
                <Check size={12} /> Mark all as read
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
