"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  UserCog,
  Settings,
  LogOut,
  ChevronRight,
  Tractor,
  UserRound,
  Car,
  ClipboardList,
  Receipt,
  BarChart3,
} from "lucide-react";
import { useAuthStore } from "../lib/store/authStore";
import { ownersApi, type Owner } from "../lib/api/owners";
import { planAllowsEmployedManagers } from "../lib/subscriptionPick";
import { useBranding, splitAppNameTitle } from "../lib/branding/BrandingContext";

/* ─── Navigation definitions by role ─── */
type NavItem = {
  label: string;
  href: string;
  icon: React.FC<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;
};

const allMainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Owners", href: "/owners", icon: Users },
  { label: "Customers", href: "/customers", icon: UserRound },
  { label: "Drivers", href: "/drivers", icon: UserCog },
  { label: "Vehicles", href: "/vehicles", icon: Car },
  { label: "Work Entries", href: "/work-entries", icon: ClipboardList },
];

const allSystemNavItems: NavItem[] = [
  { label: "Plans", href: "/plans", icon: CreditCard },
  { label: "Payment History", href: "/payment-history", icon: Receipt },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: BarChart3 },
  { label: "Managers", href: "/managers", icon: Tractor },
  { label: "Settings", href: "/settings", icon: Settings },
];

const adminOnlyNavItems = new Set(["/payment-history", "/admin/subscriptions"]);

function getNavItems(
  role: string | undefined,
  ownerShowEmployedManagersNav: boolean,
) {
  if (role === "admin") {
    return {
      main: allMainNavItems,
      system: allSystemNavItems,
    };
  }
  const nonAdminSystem = allSystemNavItems.filter(
    (i) => !adminOnlyNavItems.has(i.href),
  );
  if (role === "owner") {
    return {
      main: allMainNavItems.filter((i) => i.href !== "/owners"),
      system: ownerShowEmployedManagersNav
        ? nonAdminSystem
        : nonAdminSystem.filter((i) => i.href !== "/managers"),
    };
  }
  // manager: no owners list, no plans, no managers management
  return {
    main: allMainNavItems.filter((i) => i.href !== "/owners"),
    system: nonAdminSystem.filter(
      (i) => i.href !== "/plans" && i.href !== "/managers",
    ),
  };
}

/* ─── Shared active nav item styles ─── */
function NavItem({
  label,
  href,
  icon: Icon,
  active,
  showDesc,
}: {
  label: string;
  href: string;
  icon: React.FC<{
    size?: number;
    strokeWidth?: number;
    style?: React.CSSProperties;
  }>;
  active: boolean;
  showDesc?: boolean;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "10px 11px",
          borderRadius: 11,
          cursor: "pointer",
          transition: "all 0.18s ease",
          background: active
            ? "linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.08) 100%)"
            : "transparent",
          border: active
            ? "1px solid rgba(245,158,11,0.20)"
            : "1px solid transparent",
        }}
        onMouseEnter={(e) => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(255,255,255,0.04)";
            (e.currentTarget as HTMLElement).style.borderColor =
              "rgba(255,255,255,0.06)";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.borderColor = "transparent";
          }
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: active
              ? "rgba(245,158,11,0.22)"
              : "rgba(255,255,255,0.07)",
            boxShadow: active ? "0 2px 10px rgba(245,158,11,0.28)" : "none",
            transition: "all 0.18s",
          }}
        >
          <Icon
            size={16}
            strokeWidth={active ? 2.5 : 1.8}
            style={{ color: active ? "#F59E0B" : "#D1D5DB" }}
          />
        </div>
        <p
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: 13.5,
            flex: 1,
            fontWeight: active ? 600 : 400,
            color: active ? "#FBBF24" : "#E5E7EB",
            transition: "color 0.15s",
          }}
        >
          {label}
        </p>
        {active && (
          <ChevronRight
            size={13}
            style={{ color: "#F59E0B", opacity: 0.7, flexShrink: 0 }}
          />
        )}
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const branding = useBranding();
  const { head: brandHead, tail: brandTail } = splitAppNameTitle(branding.appName);

  const [ownerBilling, setOwnerBilling] = useState<Owner | null>(null);
  const [ownerBillingLoaded, setOwnerBillingLoaded] = useState(false);

  useEffect(() => {
    if (user?.role !== "owner" || !user.id) {
      setOwnerBilling(null);
      setOwnerBillingLoaded(Boolean(user && user.role !== "owner"));
      return;
    }
    let cancelled = false;
    setOwnerBillingLoaded(false);
    (async () => {
      try {
        const o = await ownersApi.getOne(user.id);
        if (!cancelled) setOwnerBilling(o);
      } catch {
        if (!cancelled) setOwnerBilling(null);
      } finally {
        if (!cancelled) setOwnerBillingLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  const ownerShowEmployedManagersNav =
    user?.role !== "owner" ||
    (ownerBillingLoaded && planAllowsEmployedManagers(ownerBilling));

  const { main: desktopMain, system: desktopSystem } = getNavItems(
    user?.role,
    ownerShowEmployedManagersNav,
  );
  const navItems = [...desktopMain, ...desktopSystem];

  const roleLabel =
    user?.role === "admin" ? "Admin" : user?.role === "owner" ? "Owner" : "Manager";
  const displayName = user?.name || roleLabel;
  const displayEmail = user?.email || "user@jcbpanel.in";
  const displayInitial = (user?.name || roleLabel).charAt(0).toUpperCase();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <>
      {/* ══════════════════════════════════════
          DESKTOP SIDEBAR  (hidden on mobile)
      ══════════════════════════════════════ */}
      <aside
        className="sidebar-desktop"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: 260,
          zIndex: 50,
          flexDirection: "column",
          background:
            "linear-gradient(180deg, #212121 0%, #1A1A1A 60%, #141414 100%)",
          borderRight: "1px solid rgba(245,158,11,0.10)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.40)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "22px 20px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -30,
              left: -20,
              width: 140,
              height: 140,
              background:
                "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              position: "relative",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                flexShrink: 0,
                background: branding.logoSrc
                  ? "transparent"
                  : "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                boxShadow: branding.logoSrc
                  ? "0 4px 16px rgba(0,0,0,0.25)"
                  : "0 4px 16px rgba(245,158,11,0.45), 0 0 0 1px rgba(245,158,11,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {branding.logoSrc ? (
                <img
                  src={branding.logoSrc}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <Tractor size={21} color="#111" strokeWidth={2.5} />
              )}
            </div>
            <div>
              <p
                style={{
                  color: "#FFFFFF",
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 800,
                  fontSize: 16,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                }}
              >
                {brandTail ? (
                  <>
                    {brandHead}{" "}
                    <span style={{ color: "#F59E0B" }}>{brandTail}</span>
                  </>
                ) : (
                  brandHead
                )}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  marginTop: 4,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#22C55E",
                    boxShadow: "0 0 6px rgba(34,197,94,0.9)",
                    display: "inline-block",
                  }}
                />
                <p
                  style={{
                    color: "#9CA3AF",
                    fontSize: 10.5,
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                  }}
                >
                  MANAGEMENT PANEL
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            overflowY: "auto",
          }}
        >
          <p
            style={{
              color: "#6B7280",
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              padding: "0 10px 10px",
            }}
          >
            Main Menu
          </p>
          {desktopMain.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={pathname === item.href}
            />
          ))}

          <div
            style={{
              height: 1,
              margin: "14px 6px 10px",
              background:
                "linear-gradient(90deg, transparent, rgba(245,158,11,0.20), transparent)",
            }}
          />

          <p
            style={{
              color: "#6B7280",
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              padding: "0 10px 10px",
            }}
          >
            System
          </p>
          {desktopSystem.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={pathname === item.href}
            />
          ))}
        </nav>

        {/* Admin footer */}
        <div
          style={{
            padding: "12px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              height: 1,
              marginBottom: 10,
              background:
                "linear-gradient(90deg, transparent, rgba(245,158,11,0.25), transparent)",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                flexShrink: 0,
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                boxShadow: "0 2px 10px rgba(245,158,11,0.40)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Syne, sans-serif",
                fontWeight: 800,
                fontSize: 15,
                color: "#111",
              }}
            >
              {displayInitial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <p
                  style={{
                    color: "#F3F4F6",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "DM Sans, sans-serif",
                    lineHeight: 1.2,
                  }}
                >
                  {displayName}
                </p>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 5,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.06em",
                    background:
                      user?.role === "admin"
                        ? "rgba(239,68,68,0.18)"
                        : user?.role === "owner"
                          ? "rgba(245,158,11,0.20)"
                          : "rgba(14,165,233,0.18)",
                    color:
                      user?.role === "admin"
                        ? "#F87171"
                        : user?.role === "owner"
                          ? "#FBBF24"
                          : "#38BDF8",
                    flexShrink: 0,
                  }}
                >
                  {roleLabel}
                </span>
              </div>
              <p
                style={{
                  color: "#9CA3AF",
                  fontSize: 10.5,
                  marginTop: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {displayEmail}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.10)",
                cursor: "pointer",
                color: "#9CA3AF",
                padding: "6px",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(239,68,68,0.15)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(239,68,68,0.30)";
                (e.currentTarget as HTMLElement).style.color = "#EF4444";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(255,255,255,0.10)";
                (e.currentTarget as HTMLElement).style.color = "#9CA3AF";
              }}
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════
          MOBILE BOTTOM NAV  (hidden on desktop)
      ══════════════════════════════════════ */}
      <nav
        className="sidebar-mobile-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "linear-gradient(180deg, #212121 0%, #1A1A1A 100%)",
          borderTop: "1px solid rgba(245,158,11,0.12)",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch" as any,
          scrollbarWidth: "none" as any,
        }}
      >
        <div
          style={{
            display: "flex",
            minWidth: "max-content",
            padding: "0 8px",
            gap: 2,
          }}
        >
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    padding: "10px 18px 12px",
                    minWidth: 72,
                    position: "relative",
                    cursor: "pointer",
                    transition: "all 0.18s",
                  }}
                >
                  {/* Active top indicator */}
                  {active && (
                    <span
                      style={{
                        position: "absolute",
                        top: 0,
                        left: "20%",
                        right: "20%",
                        height: 2.5,
                        borderRadius: "0 0 4px 4px",
                        background: "linear-gradient(90deg, #F59E0B, #D97706)",
                        boxShadow: "0 0 8px rgba(245,158,11,0.6)",
                      }}
                    />
                  )}

                  {/* Icon container */}
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 11,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: active
                        ? "linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(245,158,11,0.10) 100%)"
                        : "transparent",
                      border: active
                        ? "1px solid rgba(245,158,11,0.22)"
                        : "1px solid transparent",
                      boxShadow: active
                        ? "0 2px 10px rgba(245,158,11,0.22)"
                        : "none",
                      transition: "all 0.18s",
                    }}
                  >
                    <Icon
                      size={18}
                      strokeWidth={active ? 2.5 : 1.8}
                      style={{ color: active ? "#F59E0B" : "#D1D5DB" }}
                    />
                  </div>

                  {/* Label */}
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: active ? 700 : 400,
                      fontFamily: "DM Sans, sans-serif",
                      color: active ? "#F59E0B" : "#D1D5DB",
                      letterSpacing: "0.01em",
                      whiteSpace: "nowrap",
                      transition: "color 0.15s",
                    }}
                  >
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
