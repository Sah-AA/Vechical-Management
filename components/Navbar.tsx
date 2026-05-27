"use client";
import { Bell, ChevronDown, Clock, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "../lib/store/authStore";
import {
  notificationsApi,
  type NotificationRow,
} from "../lib/api/notifications";

interface NavbarProps {
  title?: string;
  subtitle?: string;
}

function formatRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const sec = Math.round((Date.now() - t) / 1000);
  if (sec < 45) return "Just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Navbar({ title, subtitle }: NavbarProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [feed, setFeed] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);

  /* Load feed on mount */
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    notificationsApi
      .feed()
      .then((rows) => { if (!cancelled) setFeed(rows); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id]);

  /* Refresh when popover opens */
  useEffect(() => {
    if (!showNotif || !user?.id) return;
    let cancelled = false;
    notificationsApi
      .feed()
      .then((rows) => { if (!cancelled) setFeed(rows); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [showNotif, user?.id]);

  /* Close on outside click or Escape */
  useEffect(() => {
    if (!showNotif) return;
    const onDown = (e: MouseEvent) => {
      if (!notifRef.current?.contains(e.target as Node)) setShowNotif(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowNotif(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [showNotif]);

  const routeMeta: Array<{
    test: (path: string) => boolean;
    title: string;
    subtitle: string;
  }> = [
    {
      test: (path) => path === "/",
      title: "Dashboard",
      subtitle: user?.name ? `Welcome back, ${user.name}` : "Welcome back",
    },
    {
      test: (path) => path === "/owners",
      title: "Owners",
      subtitle: "Manage all business owners",
    },
    {
      test: (path) => path.startsWith("/owners/"),
      title: "Owner Details",
      subtitle: "View owner profile and related records",
    },
    {
      test: (path) => path === "/customers",
      title: "Customers",
      subtitle: "Manage customer records and activity",
    },
    {
      test: (path) => path.startsWith("/customers/"),
      title: "Customer Details",
      subtitle: "View customer profile and work entries",
    },
    {
      test: (path) => path === "/drivers",
      title: "Drivers",
      subtitle: "Manage drivers, advances, and salaries",
    },
    {
      test: (path) => path.startsWith("/drivers/"),
      title: "Driver Details",
      subtitle: "View detailed driver profile and salary history",
    },
    {
      test: (path) => path === "/vehicles",
      title: "Vehicles",
      subtitle: "Manage fleet, fuel, and service records",
    },
    {
      test: (path) => path === "/work-entries",
      title: "Work Entries",
      subtitle: "Track jobs, payments, and pending amounts",
    },
    {
      test: (path) => path === "/plans",
      title: "Plans",
      subtitle: "Manage subscription plans and pricing",
    },
    {
      test: (path) => path === "/plans/add-plan",
      title: "Plan Form",
      subtitle: "Create or update subscription plan",
    },
    {
      test: (path) => path === "/settings",
      title: "Settings",
      subtitle: "Manage your admin preferences and platform configuration",
    },
    {
      test: (path) => path === "/notifications",
      title: "Notifications",
      subtitle: "Stay updated with all system alerts and activity",
    },
    {
      test: (path) => path === "/managers",
      title: "Managers",
      subtitle: "View and manage owner-assigned managers",
    },
  ];

  const fallback = routeMeta.find((entry) => entry.test(pathname ?? "")) ?? {
    title: "JCB Admin",
    subtitle: "Management dashboard",
  };
  const resolvedTitle = title ?? fallback.title;
  const resolvedSubtitle = subtitle ?? fallback.subtitle;
  const displayName = user?.name?.trim() || "Admin";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const preview = feed.slice(0, 5);
  const badge = feed.length > 99 ? "99+" : feed.length > 0 ? String(feed.length) : null;

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between"
      style={{
        height: 64,
        padding: "0 28px",
        backgroundColor: "rgba(245,244,240,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--card-border)",
      }}
    >
      {/* Left — page title */}
      <div>
        <h1
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: 19,
            color: "var(--foreground)",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          {resolvedTitle}
        </h1>
        {resolvedSubtitle && (
          <p
            style={{
              color: "var(--foreground-subtle)",
              fontSize: 12,
              marginTop: 1,
            }}
          >
            {resolvedSubtitle}
          </p>
        )}
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

        {/* ── Notification bell + popover ── */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={showNotif}
            aria-haspopup="dialog"
            onClick={() => setShowNotif((p) => !p)}
            className="btn-icon"
            style={{ position: "relative" }}
          >
            <Bell size={16} />
            {badge && (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  minWidth: 16,
                  height: 16,
                  padding: "0 4px",
                  borderRadius: 99,
                  background: "var(--orange, #F97316)",
                  border: "2px solid var(--background, #F5F4F0)",
                  fontSize: 9,
                  fontWeight: 800,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                {badge}
              </span>
            )}
          </button>

          {/* Popover */}
          {showNotif && (
            <div
              role="dialog"
              aria-label="Notifications panel"
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                right: 0,
                width: 360,
                borderRadius: 14,
                background: "var(--card-bg, #fff)",
                border: "1px solid var(--card-border)",
                boxShadow:
                  "0 16px 48px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.07)",
                overflow: "hidden",
                zIndex: 200,
                display: "flex",
                flexDirection: "column",
                maxHeight: 440,
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "14px 16px 12px",
                  borderBottom: "1px solid var(--card-border)",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "Syne, sans-serif",
                      fontWeight: 700,
                      fontSize: 14,
                      color: "var(--foreground)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Notifications
                  </p>
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: 11.5,
                      color: "var(--foreground-subtle)",
                    }}
                  >
                    {feed.length === 0
                      ? "No notifications yet"
                      : `${feed.length} total · showing latest 5`}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close notifications"
                  onClick={() => setShowNotif(false)}
                  style={{
                    flexShrink: 0,
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    border: "1px solid var(--card-border)",
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--foreground-muted)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "rgba(245,158,11,0.10)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "transparent")
                  }
                >
                  <X size={14} strokeWidth={2.2} />
                </button>
              </div>

              {/* List */}
              <div
                style={{
                  overflowY: "auto",
                  flex: 1,
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {loading && preview.length === 0 ? (
                  <p
                    style={{
                      padding: "28px 16px",
                      margin: 0,
                      textAlign: "center",
                      fontSize: 13,
                      color: "var(--foreground-subtle)",
                    }}
                  >
                    Loading…
                  </p>
                ) : preview.length === 0 ? (
                  <div
                    style={{
                      padding: "32px 20px",
                      textAlign: "center",
                    }}
                  >
                    <Bell
                      size={32}
                      style={{
                        color: "var(--foreground-muted)",
                        marginBottom: 10,
                        opacity: 0.5,
                      }}
                    />
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "var(--foreground)",
                      }}
                    >
                      All quiet here
                    </p>
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: 12,
                        color: "var(--foreground-subtle)",
                        lineHeight: 1.45,
                      }}
                    >
                      Subscription purchases and new registrations will appear here.
                    </p>
                  </div>
                ) : (
                  preview.map((item, idx) => (
                    <Link
                      key={item.id}
                      href="/notifications"
                      onClick={() => setShowNotif(false)}
                      style={{ textDecoration: "none", display: "block" }}
                    >
                      <div
                        style={{
                          padding: "12px 16px",
                          borderBottom:
                            idx < preview.length - 1
                              ? "1px solid var(--card-border)"
                              : "none",
                          transition: "background 0.13s",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.background =
                            "rgba(245,158,11,0.06)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.background =
                            "transparent")
                        }
                      >
                        {/* Dot + title */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              marginTop: 5,
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              flexShrink: 0,
                              background: "#F59E0B",
                              boxShadow: "0 0 0 2px rgba(245,158,11,0.22)",
                            }}
                          />
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--foreground)",
                              lineHeight: 1.35,
                            }}
                          >
                            {item.title}
                          </p>
                        </div>
                        {/* Message */}
                        <p
                          style={{
                            margin: "5px 0 0 15px",
                            fontSize: 12,
                            color: "var(--foreground-subtle)",
                            lineHeight: 1.45,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.message}
                        </p>
                        {/* Time */}
                        <p
                          style={{
                            margin: "6px 0 0 15px",
                            fontSize: 11,
                            color: "var(--foreground-muted)",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Clock size={10} />
                          {formatRelativeTime(item.createdAt)}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              {/* Footer — View all */}
              <div
                style={{
                  flexShrink: 0,
                  borderTop: "1px solid var(--card-border)",
                  background: "rgba(245,158,11,0.04)",
                }}
              >
                <Link
                  href="/notifications"
                  onClick={() => setShowNotif(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "12px 16px",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--amber, #F59E0B)",
                    transition: "background 0.13s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "rgba(245,158,11,0.09)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "rgba(245,158,11,0.04)")
                  }
                >
                  View all notifications
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 99,
                      background: "rgba(245,158,11,0.15)",
                      color: "var(--amber, #F59E0B)",
                      fontWeight: 700,
                    }}
                  >
                    {feed.length}
                  </span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Admin info chip */}
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px 6px 8px",
            borderRadius: 10,
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.borderColor = "#CCC8C0")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.borderColor =
              "var(--card-border)")
          }
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "var(--amber)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: "#141210",
            }}
          >
            {avatarLetter}
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--foreground)",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            {displayName}
          </span>
          <ChevronDown size={13} style={{ color: "var(--foreground-muted)" }} />
        </button>
      </div>
    </header>
  );
}
