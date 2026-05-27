"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import {
  Users,
  Crown,
  Tractor,
  UserCheck,
  Search,
  Phone,
  MapPin,
  CheckCircle2,
  Eye,
  X,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useOwnersStore } from "../../lib/store/ownersStore";
import { Owner } from "../../lib/api/owners";

const avatarColors = [
  "#F59E0B",
  "#EA580C",
  "#0EA5E9",
  "#8B5CF6",
  "#059669",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#6366F1",
  "#10B981",
];

function ViewOwnerModal({
  owner,
  idx,
  onClose,
}: {
  owner: Owner;
  idx: number;
  onClose: () => void;
}) {
  const counts = owner._count;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(20,18,16,0.55)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="card animate-fade-up"
        style={{ width: 460, padding: "28px 28px 24px", position: "relative" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: avatarColors[idx % avatarColors.length],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Syne,sans-serif",
                fontWeight: 800,
                fontSize: 20,
                color: "#141210",
              }}
            >
              {owner.name[0]}
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "Syne,sans-serif",
                  fontWeight: 700,
                  fontSize: 17,
                  color: "var(--foreground)",
                }}
              >
                {owner.name}
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--foreground-subtle)",
                  marginTop: 2,
                }}
              >
                {owner.businessName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ padding: 6, border: "none", borderRadius: 8 }}
          >
            <X size={16} />
          </button>
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {[
            ["Mobile", owner.phone],
            ["Email", owner.email],
            ["State", owner.state],
            ["Pincode", owner.pincode],
            ["Vehicles", String(counts?.vehicles ?? 0)],
            ["Drivers", String(counts?.drivers ?? 0)],
            ["Customers", String(counts?.customers ?? 0)],
            ["Managers", String(counts?.managers ?? 0)],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                background: "#FAFAF8",
                borderRadius: 10,
                padding: "10px 14px",
                border: "1px solid var(--card-border)",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: "var(--foreground-subtle)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {k}
              </p>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--foreground)",
                  marginTop: 3,
                }}
              >
                {v}
              </p>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 14,
            background: "#FAFAF8",
            borderRadius: 10,
            padding: "10px 14px",
            border: "1px solid var(--card-border)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "var(--foreground-subtle)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Address
          </p>
          <p
            style={{
              fontSize: 13,
              color: "var(--foreground)",
              marginTop: 3,
            }}
          >
            {owner.address}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 20,
            justifyContent: "flex-end",
          }}
        >
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
          <Link
            href={`/owners/${owner.id}`}
            style={{ textDecoration: "none" }}
            onClick={onClose}
          >
            <button className="btn btn-primary" style={{ gap: 5 }}>
              <ExternalLink size={13} /> Full Profile
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 10;

export default function OwnersPage() {
  const owners = useOwnersStore((s) => s.items);
  const loading = useOwnersStore((s) => s.loading);
  const error = useOwnersStore((s) => s.error);
  const fetchOwners = useOwnersStore((s) => s.fetch);

  const [search, setSearch] = useState("");
  const [searchFocused, setFocused] = useState(false);
  const [viewOwner, setViewOwner] = useState<{
    owner: Owner;
    idx: number;
  } | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  const filtered = useMemo(
    () =>
      owners.filter((o) => {
        const q = search.toLowerCase();
        return (
          o.name.toLowerCase().includes(q) ||
          o.phone.includes(q) ||
          (o.businessName ?? "").toLowerCase().includes(q) ||
          (o.state ?? "").toLowerCase().includes(q)
        );
      }),
    [owners, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const totalVehicles = owners.reduce(
    (a, o) => a + (o._count?.vehicles ?? 0),
    0,
  );
  const totalCustomers = owners.reduce(
    (a, o) => a + (o._count?.customers ?? 0),
    0,
  );
  const ownersWithSubscription = owners.filter(
    (o) => (o._count?.subscriptions ?? 0) > 0,
  ).length;

  const stats = [
    {
      label: "Total Owners",
      value: String(owners.length),
      icon: Users,
      accent: "#F59E0B",
      bg: "rgba(245,158,11,0.08)",
    },
    {
      label: "With Subscription",
      value: String(ownersWithSubscription),
      icon: Crown,
      accent: "#F59E0B",
      bg: "rgba(245,158,11,0.08)",
    },
    {
      label: "Total Customers",
      value: String(totalCustomers),
      icon: UserCheck,
      accent: "#059669",
      bg: "rgba(5,150,105,0.08)",
    },
    {
      label: "Total Vehicles",
      value: String(totalVehicles),
      icon: Tractor,
      accent: "#EA580C",
      bg: "rgba(234,88,12,0.08)",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar
        title="Owners"
        subtitle="Manage all registered tractor & JCB owners"
      />

      {viewOwner && (
        <ViewOwnerModal
          owner={viewOwner.owner}
          idx={viewOwner.idx}
          onClose={() => setViewOwner(null)}
        />
      )}

      <div
        style={{
          padding: "28px 28px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 16,
          }}
        >
          {stats.map(({ label, value, icon: Icon, accent, bg }, i) => (
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
                    {value}
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

        {error && (
          <div
            role="alert"
            style={{
              background: "var(--red-light)",
              color: "var(--red)",
              border: "1px solid rgba(220,38,38,0.18)",
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <div
          className="card animate-fade-up stagger-3"
          style={{ overflow: "hidden" }}
        >
          <div
            style={{
              padding: "18px 24px 0",
              borderBottom: "1px solid var(--card-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
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
                  Owner Directory
                </h2>
                <p style={{ color: "var(--foreground-subtle)", fontSize: 12 }}>
                  All registered tractor & JCB owners
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 12px",
                    borderRadius: 9,
                    background: "var(--input-bg)",
                    border: `1px solid ${searchFocused ? "var(--amber)" : "var(--input-border)"}`,
                    boxShadow: searchFocused
                      ? "0 0 0 3px rgba(245,158,11,0.10)"
                      : "none",
                    transition: "all 0.15s",
                  }}
                >
                  <Search
                    size={13}
                    style={{ color: "var(--foreground-subtle)" }}
                  />
                  <input
                    type="text"
                    placeholder="Search owners..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{
                      outline: "none",
                      background: "transparent",
                      fontSize: 13,
                      color: "var(--foreground)",
                      width: 165,
                      fontFamily: "DM Sans,sans-serif",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>S.No</th>
                  <th>Owner</th>
                  <th>Mobile</th>
                  <th>State</th>
                  <th>Business</th>
                  <th>Vehicles</th>
                  <th>Customers</th>
                  <th>Managers</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && owners.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "var(--foreground-subtle)",
                      }}
                    >
                      <Loader2
                        size={16}
                        style={{
                          animation: "spin 0.9s linear infinite",
                          display: "inline-block",
                          marginRight: 8,
                          verticalAlign: "middle",
                        }}
                      />
                      Loading owners...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        color: "var(--foreground-subtle)",
                        fontStyle: "italic",
                      }}
                    >
                      No owners found
                    </td>
                  </tr>
                ) : (
                  paginated.map((o, i) => {
                    const rowNum = (currentPage - 1) * PAGE_SIZE + i + 1;
                    const counts = o._count;
                    return (
                      <tr key={o.id}>
                        <td
                          style={{
                            color: "var(--foreground-subtle)",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {rowNum}
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
                                  avatarColors[i % avatarColors.length],
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
                              {o.name[0]}
                            </div>
                            <div>
                              <p
                                style={{
                                  fontWeight: 600,
                                  fontSize: 13.5,
                                  color: "var(--foreground)",
                                }}
                              >
                                {o.name}
                              </p>
                              <p
                                style={{
                                  fontSize: 11,
                                  color: "var(--foreground-subtle)",
                                  marginTop: 1,
                                }}
                              >
                                {o.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              color: "var(--foreground-muted)",
                              fontSize: 13,
                            }}
                          >
                            <Phone size={12} />
                            {o.phone}
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
                            <MapPin size={11} />
                            {o.state}
                          </div>
                        </td>
                        <td
                          style={{
                            color: "var(--foreground-muted)",
                            fontSize: 13,
                            maxWidth: 160,
                          }}
                        >
                          {o.businessName}
                        </td>
                        <td
                          style={{
                            fontWeight: 600,
                            color: "var(--foreground)",
                          }}
                        >
                          {counts?.vehicles ?? 0}
                        </td>
                        <td style={{ color: "var(--foreground-muted)" }}>
                          {counts?.customers ?? 0}
                        </td>
                        <td style={{ color: "var(--foreground-muted)" }}>
                          {counts?.managers ?? 0}
                        </td>
                        <td>
                          <span
                            className={`badge ${(counts?.subscriptions ?? 0) > 0 ? "badge-active" : "badge-free"}`}
                          >
                            <CheckCircle2 size={9} />
                            {(counts?.subscriptions ?? 0) > 0
                              ? "Subscribed"
                              : "Free"}
                          </span>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              gap: 5,
                            }}
                          >
                            <button
                              className="btn-icon"
                              style={{
                                padding: 5,
                                border: "none",
                                borderRadius: 7,
                              }}
                              title="View"
                              onClick={() =>
                                setViewOwner({ owner: o, idx: rowNum - 1 })
                              }
                            >
                              <Eye size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              padding: "12px 24px",
              borderTop: "1px solid var(--card-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <p style={{ fontSize: 12, color: "var(--foreground-subtle)" }}>
              Showing{" "}
              <strong>
                {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)}
              </strong>{" "}
              of <strong>{filtered.length}</strong> owners
            </p>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button
                className="btn btn-ghost"
                style={{ padding: "5px 11px", fontSize: 12 }}
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className="btn btn-ghost"
                  style={{
                    padding: "5px 10px",
                    fontSize: 12,
                    minWidth: 32,
                    ...(pg === currentPage
                      ? {
                          background: "var(--amber-glow)",
                          border: "1px solid rgba(245,158,11,0.2)",
                          color: "var(--amber-dark)",
                          fontWeight: 700,
                        }
                      : {}),
                  }}
                >
                  {pg}
                </button>
              ))}
              <button
                className="btn btn-ghost"
                style={{ padding: "5px 11px", fontSize: 12 }}
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
