"use client";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import {
  UserRound,
  IndianRupee,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  Eye,
  X,
  Wallet,
  Loader2,
} from "lucide-react";
import { useCustomersStore } from "../../lib/store/customersStore";
import { useWorkEntriesStore } from "../../lib/store/workEntriesStore";
import {
  Customer,
  CreateCustomerInput,
  CustomerStatus,
} from "../../lib/api/customers";
import { getErrorMessage } from "../../lib/api/client";
import { useConfirm } from "../../components/ui/ConfirmProvider";
import { useToast } from "../../components/ui/ToastProvider";
import { LoadingUI } from "../../components/ui/LoadingUI";
import { parseCustomerForm } from "../../lib/validation/customers";

const fieldErrStyle: CSSProperties = {
  fontSize: 11.5,
  color: "var(--red)",
  marginTop: 4,
  fontWeight: 500,
};

const avatarColors = [
  "#F59E0B",
  "#EA580C",
  "#0EA5E9",
  "#8B5CF6",
  "#059669",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

type AccountStatus = "Paid" | "Pending";

interface CustomerForm {
  name: string;
  mobile: string;
  address: string;
  accountStatus: AccountStatus;
}

const statusFromBackend: Record<CustomerStatus, AccountStatus> = {
  Active: "Paid",
  Inactive: "Pending",
};

/* ─── Add / Edit Modal ─── */
function CustomerModal({
  customer,
  onClose,
  onSave,
  saving,
  error,
  onDismissApiError,
}: {
  customer: Customer | null;
  onClose: () => void;
  onSave: (c: CreateCustomerInput) => void | Promise<void>;
  saving: boolean;
  error: string | null;
  onDismissApiError?: () => void;
}) {
  const [form, setForm] = useState<CustomerForm>({
    name: customer?.name ?? "",
    mobile: customer?.phone ?? "",
    address: customer?.address ?? "",
    accountStatus: customer ? statusFromBackend[customer.status] : "Pending",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"name" | "mobile" | "address" | "accountStatus", string>>
  >({});
  const [clientFormError, setClientFormError] = useState<string | null>(null);

  function touchField<K extends keyof CustomerForm>(key: K) {
    onDismissApiError?.();
    setClientFormError(null);
    if (Object.prototype.hasOwnProperty.call(fieldErrors, key)) {
      setFieldErrors((fe) => {
        const next = { ...fe };
        delete next[key];
        return next;
      });
    }
  }

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
        style={{ width: 480, padding: "28px 28px 24px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 22,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "Syne,sans-serif",
                fontWeight: 700,
                fontSize: 17,
                color: "var(--foreground)",
              }}
            >
              {customer ? "Edit Customer" : "Add New Customer"}
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "var(--foreground-subtle)",
                marginTop: 2,
              }}
            >
              Fill in the customer details below
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ padding: 6, border: "none", borderRadius: 8 }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { label: "Full Name", key: "name", ph: "e.g. Ramesh Patel" },
            { label: "Mobile Number", key: "mobile", ph: "10-digit mobile" },
            {
              label: "Address",
              key: "address",
              ph: "Village / Town, District, State",
            },
          ].map(({ label, key, ph }) => (
            <div key={key}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--foreground-muted)",
                  display: "block",
                  marginBottom: 5,
                }}
              >
                {label}
              </label>
              <input
                className="input"
                placeholder={ph}
                value={(form[key as "name" | "mobile" | "address"] ?? "")}
                onChange={(e) => {
                  touchField(key as keyof CustomerForm);
                  setForm((f) => ({ ...f, [key]: e.target.value }));
                }}
                disabled={saving}
              />
              {fieldErrors[key as "name" | "mobile" | "address"] ? (
                <p style={fieldErrStyle}>{fieldErrors[key as "name" | "mobile" | "address"]}</p>
              ) : null}
            </div>
          ))}
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--foreground-muted)",
                display: "block",
                marginBottom: 5,
              }}
            >
              Account Status
            </label>
            <select
              className="input"
              style={{ cursor: "pointer" }}
              value={form.accountStatus}
              onChange={(e) => {
                touchField("accountStatus");
                setForm((f) => ({
                  ...f,
                  accountStatus: e.target.value as AccountStatus,
                }));
              }}
              disabled={saving}
            >
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
            {fieldErrors.accountStatus ? (
              <p style={fieldErrStyle}>{fieldErrors.accountStatus}</p>
            ) : null}
          </div>
        </div>

        {(error || clientFormError) && (
          <div
            role="alert"
            style={{
              background: "var(--red-light)",
              color: "var(--red)",
              border: "1px solid rgba(220,38,38,0.18)",
              padding: "8px 12px",
              borderRadius: 9,
              fontSize: 12.5,
              marginTop: 14,
            }}
          >
            {error ?? clientFormError}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 22,
            justifyContent: "flex-end",
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={async () => {
              const parsed = parseCustomerForm(form);
              if (!parsed.success) {
                setFieldErrors(parsed.fieldErrors);
                setClientFormError(parsed.formError ?? null);
                return;
              }
              setFieldErrors({});
              setClientFormError(null);
              await onSave(parsed.data);
            }}
            disabled={saving}
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (
              <Loader2
                size={13}
                style={{ animation: "spin 0.9s linear infinite" }}
              />
            ) : null}
            {customer ? "Save Changes" : "Add Customer"}
          </button>
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

/* ─── Page ─── */
export default function CustomersPage() {
  const customers = useCustomersStore((s) => s.items);
  const customersLoading = useCustomersStore((s) => s.loading);
  const customersError = useCustomersStore((s) => s.error);
  const fetchCustomers = useCustomersStore((s) => s.fetch);
  const createCustomer = useCustomersStore((s) => s.create);
  const updateCustomer = useCustomersStore((s) => s.update);
  const removeCustomer = useCustomersStore((s) => s.remove);

  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const workEntries = useWorkEntriesStore((s) => s.items);
  const fetchWorkEntries = useWorkEntriesStore((s) => s.fetch);

  const [search, setSearch] = useState("");
  const [searchFocused, setFocused] = useState(false);
  const [filterTab, setFilterTab] = useState<"All" | AccountStatus>("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editCustomer, setEdit] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
    fetchWorkEntries();
  }, [fetchCustomers, fetchWorkEntries]);

  const filterTabs: ("All" | AccountStatus)[] = ["All", "Paid", "Pending"];

  // Per-customer work-entry aggregates (totals by work-entry status field)
  const workAggregates = useMemo(() => {
    const map = new Map<
      number,
      { totalJobs: number; totalBilled: number; jobPaidTotal: number }
    >();
    for (const entry of workEntries) {
      const cur = map.get(entry.customerId) ?? {
        totalJobs: 0,
        totalBilled: 0,
        jobPaidTotal: 0,
      };
      cur.totalJobs += 1;
      cur.totalBilled += entry.amount;
      if (entry.status === "Paid") cur.jobPaidTotal += entry.amount;
      map.set(entry.customerId, cur);
    }
    return map;
  }, [workEntries]);

 
  const enriched = useMemo(
    () =>
      customers.map((c) => {
        const agg = workAggregates.get(c.id) ?? {
          totalJobs: 0,
          totalBilled: 0,
          jobPaidTotal: 0,
        };

        const paymentsTotal = (c.payments ?? []).reduce(
          (sum, p) => sum + p.amount,
          0,
        );
        const jobPendingTotal = agg.totalBilled - agg.jobPaidTotal;
        const appliedToPending = Math.min(paymentsTotal, jobPendingTotal);
        const balanceDue = Math.max(0, jobPendingTotal - paymentsTotal);
        const totalCollected = Math.min(
          agg.totalBilled,
          agg.jobPaidTotal + appliedToPending,
        );

        const accountStatus: AccountStatus = balanceDue > 0 ? "Pending" : "Paid";

        return {
          ...c,
          totalJobs: agg.totalJobs,
          paid: totalCollected,
          pending: balanceDue,
          accountStatus,
        };
      }),
    [customers, workAggregates],
  );

  const filtered = enriched.filter((c) => {
    const matchTab = filterTab === "All" || c.accountStatus === filterTab;
    const q = search.toLowerCase();
    const matchSearch =
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.address ?? "").toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const totalPaid = enriched.filter(
    (c) => c.accountStatus === "Paid",
  ).length;
  const totalPending = enriched.filter(
    (c) => c.accountStatus === "Pending",
  ).length;
  const totalRevenue = enriched.reduce((a, c) => a + c.paid, 0);

  const stats = [
    {
      label: "Total Customers",
      value: String(customers.length),
      icon: UserRound,
      accent: "#F59E0B",
      bg: "rgba(245,158,11,0.08)",
    },
    {
      label: "Paid Accounts",
      value: String(totalPaid),
      icon: CheckCircle2,
      accent: "#059669",
      bg: "rgba(5,150,105,0.08)",
    },
    {
      label: "Pending Accounts",
      value: String(totalPending),
      icon: Clock,
      accent: "#EA580C",
      bg: "rgba(234,88,12,0.08)",
    },
    {
      label: "Total Received",
      value: `₹${(totalRevenue / 1000).toFixed(0)}K`,
      icon: IndianRupee,
      accent: "#8B5CF6",
      bg: "rgba(139,92,246,0.08)",
    },
  ];

  async function handleAdd(data: CreateCustomerInput) {
    setSaving(true);
    setModalError(null);
    try {
      await createCustomer(data);
      setShowAdd(false);
    } catch (err) {
      setModalError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(data: CreateCustomerInput) {
    if (!editCustomer) return;
    setSaving(true);
    setModalError(null);
    try {
      await updateCustomer(editCustomer.id, data);
      setEdit(null);
    } catch (err) {
      setModalError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function requestDeleteCustomer(c: Customer) {
    const ok = await confirm({
      title: "Delete customer?",
      description: `“${c.name}” will be permanently removed. This cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      destructive: true,
    });
    if (!ok) return;
    setDeletingId(c.id);
    try {
      await removeCustomer(c.id);
      showToast({ title: "Customer deleted", variant: "success" });
    } catch (err) {
      showToast({
        title: "Could not delete customer",
        message: getErrorMessage(err, "Try again."),
        variant: "error",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar
        title="Customers"
        subtitle="Manage customers, accounts & work history"
      />

      {showAdd && (
        <CustomerModal
          key="customer-add"
          customer={null}
          onClose={() => {
            setShowAdd(false);
            setModalError(null);
          }}
          onSave={handleAdd}
          saving={saving}
          error={modalError}
          onDismissApiError={() => setModalError(null)}
        />
      )}
      {editCustomer && (
        <CustomerModal
          key={`customer-edit-${editCustomer.id}`}
          customer={editCustomer}
          onClose={() => {
            setEdit(null);
            setModalError(null);
          }}
          onSave={handleEdit}
          saving={saving}
          error={modalError}
          onDismissApiError={() => setModalError(null)}
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
        {/* Stats */}
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

        {customersError && (
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
            {customersError}
          </div>
        )}

        {/* Table Card */}
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
                  Customer Directory
                </h2>
                <p style={{ color: "var(--foreground-subtle)", fontSize: 12 }}>
                  Click the{" "}
                  <Eye
                    size={11}
                    style={{ display: "inline", verticalAlign: "middle" }}
                  />{" "}
                  icon to open full customer profile
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
                    placeholder="Search customers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
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
                <button
                  className="btn btn-primary"
                  style={{ fontSize: 13 }}
                  onClick={() => {
                    setModalError(null);
                    setShowAdd(true);
                  }}
                >
                  <Plus size={14} /> Add Customer
                </button>
              </div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 2 }}>
              {filterTabs.map((tab) => {
                const count =
                  tab === "All"
                    ? enriched.length
                    : enriched.filter((c) => c.accountStatus === tab).length;
                const isActive = filterTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    style={{
                      padding: "7px 14px",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "DM Sans,sans-serif",
                      fontSize: 12.5,
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
                    {tab}
                    <span
                      style={{
                        marginLeft: 5,
                        fontSize: 11,
                        background: isActive ? "var(--amber-glow)" : "#F0EEE9",
                        color: isActive
                          ? "var(--amber-dark)"
                          : "var(--foreground-subtle)",
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

          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: "center" }}>S.No</th>
                  <th>Customer</th>
                  <th>Mobile</th>
                  <th>Address</th>
                  <th>Jobs</th>
                  <th>Paid</th>
                  <th>Pending</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customersLoading && customers.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "40px 20px" }}>
                      <LoadingUI label="Loading customers..." />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        color: "var(--foreground-subtle)",
                        fontStyle: "italic",
                      }}
                    >
                      No customers found
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, i) => (
                    <tr key={c.id}>
                      <td
                        style={{
                          fontWeight: 600,
                          color: "var(--foreground-muted)",
                          textAlign: "center",
                          fontSize: 13,
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
                            {c.name[0]}
                          </div>
                          <div>
                            <p
                              style={{
                                fontWeight: 600,
                                fontSize: 13.5,
                                color: "var(--foreground)",
                              }}
                            >
                              {c.name}
                            </p>
                            <p
                              style={{
                                fontSize: 11,
                                color: "var(--foreground-subtle)",
                                marginTop: 1,
                              }}
                            >
                              Customer
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
                          {c.phone}
                        </div>
                      </td>
                      <td
                        style={{
                          color: "var(--foreground-muted)",
                          fontSize: 12,
                          maxWidth: 160,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 5,
                          }}
                        >
                          <MapPin
                            size={11}
                            style={{ marginTop: 2, flexShrink: 0 }}
                          />
                          {c.address ?? "—"}
                        </div>
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: "var(--foreground)",
                        }}
                      >
                        {c.totalJobs}
                      </td>
                      <td style={{ color: "var(--emerald)", fontWeight: 600 }}>
                        ₹{c.paid.toLocaleString()}
                      </td>
                      <td
                        style={{
                          color:
                            c.pending > 0
                              ? "#EA580C"
                              : "var(--foreground-muted)",
                          fontWeight: c.pending > 0 ? 600 : 400,
                        }}
                      >
                        {c.pending > 0 ? `₹${c.pending.toLocaleString()}` : "—"}
                      </td>
                      <td>
                        <span
                          className={`badge ${c.accountStatus === "Paid" ? "badge-active" : "badge-pending"}`}
                        >
                          {c.accountStatus === "Paid" ? (
                            <CheckCircle2 size={9} />
                          ) : (
                            <Clock size={9} />
                          )}
                          {c.accountStatus}
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
                          <Link
                            href={`/customers/${c.id}`}
                            style={{ textDecoration: "none" }}
                          >
                            <button
                              className="btn-icon"
                              style={{
                                padding: 5,
                                border: "none",
                                borderRadius: 7,
                              }}
                              title="View Full Profile"
                            >
                              <Eye size={13} />
                            </button>
                          </Link>
                          <button
                            className="btn-icon"
                            style={{
                              padding: 5,
                              border: "none",
                              borderRadius: 7,
                            }}
                            title="Edit"
                            onClick={() => {
                              setModalError(null);
                              setEdit(c);
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn-icon"
                            style={{
                              padding: 5,
                              border: "none",
                              borderRadius: 7,
                              color: "#DC2626",
                            }}
                            title="Delete"
                            onClick={() => void requestDeleteCustomer(c)}
                            disabled={deletingId !== null}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
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
            }}
          >
            <p style={{ fontSize: 12, color: "var(--foreground-subtle)" }}>
              Showing <strong>{filtered.length}</strong> of{" "}
              <strong>{customers.length}</strong> customers
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Wallet
                size={13}
                style={{ color: "var(--foreground-subtle)" }}
              />
              <span style={{ fontSize: 12, color: "var(--foreground-subtle)" }}>
                Total pending:{" "}
                <strong style={{ color: "#EA580C" }}>
                  ₹
                  {enriched
                    .reduce((a, c) => a + c.pending, 0)
                    .toLocaleString()}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {deletingId !== null && (
        <LoadingUI overlay label="Deleting customer..." />
      )}

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
