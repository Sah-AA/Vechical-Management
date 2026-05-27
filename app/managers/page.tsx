"use client";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import {
  UserCog,
  IndianRupee,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  Phone,
  Edit2,
  Trash2,
  X,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";
import { useManagersStore } from "../../lib/store/managersStore";
import {
  Manager,
  ManagerStatus,
  CreateManagerInput,
  UpdateManagerInput,
} from "../../lib/api/managers";
import { useAuthStore } from "../../lib/store/authStore";
import { ownersApi, type Owner } from "../../lib/api/owners";
import { planAllowsEmployedManagers } from "../../lib/subscriptionPick";
import type { ParsedManagerFormFields } from "../../lib/validation/managers";
import { parseManagerForm } from "../../lib/validation/managers";
import {
  parseAdvanceAmountString,
  parseSalaryPayAmount,
} from "../../lib/validation/amounts";

const fieldErrStyle: CSSProperties = {
  fontSize: 11.5,
  color: "var(--red)",
  marginTop: 4,
  fontWeight: 500,
};

const managerAvatarColors = [
  "#F59E0B",
  "#0EA5E9",
  "#059669",
  "#8B5CF6",
  "#EC4899",
  "#EA580C",
];

interface ManagerForm {
  name: string;
  mobile: string;
  email: string;
  password: string;
  joiningDate: string;
  monthlySalary: number;
  status: ManagerStatus;
}

/* ─── Add / Edit Modal ─── */
function ManagerModal({
  manager,
  onClose,
  onSave,
  saving,
  error,
  onDismissApiError,
}: {
  manager: Manager | null;
  onClose: () => void;
  onSave: (d: CreateManagerInput | UpdateManagerInput) => Promise<void>;
  saving: boolean;
  error: string | null;
  onDismissApiError?: () => void;
}) {
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState<ManagerForm>(() => ({
    name: manager?.name ?? "",
    mobile: manager?.mobile ?? "",
    email: manager?.email ?? "",
    password: "",
    joiningDate: manager ? manager.joiningDate.slice(0, 10) : "",
    monthlySalary: manager?.monthlySalary ?? 10000,
    status: manager?.status ?? "Active",
  }));
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ParsedManagerFormFields, string>>
  >({});
  const [clientFormError, setClientFormError] = useState<string | null>(null);

  function touchField<K extends keyof ManagerForm>(key: K) {
    onDismissApiError?.();
    setClientFormError(null);
    if (Object.prototype.hasOwnProperty.call(fieldErrors, key)) {
      setFieldErrors((fe) => {
        const next = { ...fe };
        delete next[key as keyof ParsedManagerFormFields];
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
              {manager ? "Edit Manager" : "Add New Manager"}
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "var(--foreground-subtle)",
                marginTop: 2,
              }}
            >
              Login email, payroll and contact details for this employed manager.
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
            {
              label: "Full Name",
              key: "name" as const,
              ph: "e.g. Sunil Kumar",
              type: "text",
            },
            {
              label: "Mobile Number",
              key: "mobile" as const,
              ph: "10-digit mobile",
              type: "tel",
            },
            {
              label: "Email (login)",
              key: "email" as const,
              ph: "manager@example.com",
              type: "email",
            },
            {
              label: "Joining Date",
              key: "joiningDate" as const,
              ph: "",
              type: "date",
            },
          ].map(({ label, key, ph, type }) => (
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
                type={type}
                value={form[key] as string}
                disabled={saving}
                onChange={(e) => {
                  touchField(key);
                  setForm((f) => ({ ...f, [key]: e.target.value }));
                }}
              />
              {fieldErrors[key] ? (
                <p style={fieldErrStyle}>{fieldErrors[key]}</p>
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
              Temporary password {!manager ? "(required)" : "(leave blank to keep)"}
            </label>
            <div style={{ position: "relative" }}>
              <input
                className="input"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder={manager ? "••••••••" : "At least 6 characters"}
                value={form.password}
                disabled={saving}
                onChange={(e) => {
                  touchField("password");
                  setForm((f) => ({ ...f, password: e.target.value }));
                }}
                style={{ paddingRight: 38 }}
              />
              <button
                type="button"
                aria-label={showPw ? "Hide password" : "Show password"}
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: "absolute",
                  top: "50%",
                  right: 8,
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--foreground-subtle)",
                  padding: 4,
                }}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {fieldErrors.password ? (
              <p style={fieldErrStyle}>{fieldErrors.password}</p>
            ) : null}
          </div>
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
              Monthly Salary (₹)
            </label>
            <input
              className="input"
              type="number"
              placeholder="e.g. 14000"
              value={Number.isFinite(form.monthlySalary) ? form.monthlySalary : ""}
              disabled={saving}
              onChange={(e) => {
                touchField("monthlySalary");
                const v = e.target.value;
                setForm((f) => ({
                  ...f,
                  monthlySalary: v === "" ? NaN : Number(v),
                }));
              }}
            />
            {fieldErrors.monthlySalary ? (
              <p style={fieldErrStyle}>{fieldErrors.monthlySalary}</p>
            ) : null}
          </div>
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
              Status
            </label>
            <select
              className="input"
              style={{ cursor: "pointer" }}
              value={form.status}
              disabled={saving}
              onChange={(e) => {
                touchField("status");
                setForm((f) => ({
                  ...f,
                  status: e.target.value as ManagerStatus,
                }));
              }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            {fieldErrors.status ? (
              <p style={fieldErrStyle}>{fieldErrors.status}</p>
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
            disabled={saving}
            style={{ opacity: saving ? 0.7 : 1 }}
            onClick={async () => {
              const parsed = parseManagerForm(form, { creating: !manager });
              if (!parsed.success) {
                setFieldErrors(parsed.fieldErrors);
                setClientFormError(parsed.formError ?? null);
                return;
              }
              setFieldErrors({});
              setClientFormError(null);
              await onSave(parsed.data);
            }}
          >
            {saving ? (
              <Loader2
                size={13}
                style={{ animation: "spin 0.9s linear infinite" }}
              />
            ) : null}
            {manager ? "Save Changes" : "Add Manager"}
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

/* ─── Advance Modal ─── */
function AdvanceModal({
  manager,
  onClose,
  onSave,
  saving,
  error,
  onDismissApiError,
}: {
  manager: Manager;
  onClose: () => void;
  onSave: (amount: number, type: "advance" | "repay") => Promise<void>;
  saving: boolean;
  error: string | null;
  onDismissApiError?: () => void;
}) {
  const [amountStr, setAmountStr] = useState("");
  const [type, setType] = useState<"advance" | "repay">("advance");
  const [clientError, setClientError] = useState<string | null>(null);

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
        style={{ width: 400, padding: "28px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
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
              Advance / Repay
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "var(--foreground-subtle)",
                marginTop: 2,
              }}
            >
              {manager.name}
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
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["advance", "repay"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setClientError(null);
                setType(t);
              }}
              disabled={saving}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 9,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
                fontFamily: "DM Sans,sans-serif",
                background:
                  type === t
                    ? t === "advance"
                      ? "var(--amber)"
                      : "var(--emerald)"
                    : "var(--input-bg)",
                color: type === t ? "#141210" : "var(--foreground-muted)",
                outline: "none",
                borderStyle: "solid",
                borderWidth: 1,
                borderColor: type === t ? "transparent" : "var(--input-border)",
                transition: "all 0.15s",
              }}
            >
              {t === "advance" ? "Give Advance" : "Record Repayment"}
            </button>
          ))}
        </div>
        <div
          style={{
            background: "#FAFAF8",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 14,
            border: "1px solid var(--card-border)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "var(--foreground-subtle)",
              marginBottom: 2,
            }}
          >
            Current Advance Balance
          </p>
          <p
            style={{
              fontSize: 18,
              fontWeight: 800,
              fontFamily: "Syne,sans-serif",
              color: manager.advanceBalance > 0 ? "#EA580C" : "var(--emerald)",
            }}
          >
            ₹{manager.advanceBalance.toLocaleString()}
          </p>
        </div>
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
            Amount (₹)
          </label>
          <input
            className="input"
            type="text"
            inputMode="numeric"
            placeholder="Enter amount"
            value={amountStr}
            disabled={saving}
            onChange={(e) => {
              onDismissApiError?.();
              setClientError(null);
              setAmountStr(e.target.value);
            }}
          />
        </div>

        {(error || clientError) && (
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
            {error ?? clientError}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 20,
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
              const parsed = parseAdvanceAmountString(amountStr);
              if (!parsed.ok) {
                setClientError(parsed.message);
                return;
              }
              setClientError(null);
              await onSave(parsed.amount, type);
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
            Confirm
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


/* ─── Salary Pay Modal ─── */
function SalaryPayModal({
  manager,
  onClose,
  onSubmit,
  busy,
  error,
}: {
  manager: Manager;
  onClose: () => void;
  onSubmit: (amount?: number) => Promise<void>;
  busy: boolean;
  error: string | null;
}) {
  const [amount, setAmount] = useState<string>("");
  const [clientError, setClientError] = useState<string | null>(null);

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
        style={{ width: 420, padding: "28px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h2 style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 17, color: "var(--foreground)" }}>
              Pay Salary
            </h2>
            <p style={{ fontSize: 12, color: "var(--foreground-subtle)", marginTop: 2 }}>
              {manager.name} · Monthly salary ₹{manager.monthlySalary.toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ padding: 6, border: "none", borderRadius: 8 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ background: "#FAFAF8", border: "1px solid var(--card-border)", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
          <p style={{ fontSize: 11, color: "var(--foreground-subtle)" }}>
            Leave amount empty to pay full remaining salary for this month.
          </p>
        </div>

        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground-muted)", display: "block", marginBottom: 5 }}>
          Amount to pay (optional)
        </label>
        <input
          className="input"
          type="number"
          inputMode="decimal"
          placeholder="e.g. 20000"
          value={amount}
          disabled={busy}
          onChange={(e) => {
            setClientError(null);
            setAmount(e.target.value);
          }}
        />

        {error || clientError ? (
          <div role="alert" style={{ background: "var(--red-light)", color: "var(--red)", border: "1px solid rgba(220,38,38,0.18)", padding: "8px 12px", borderRadius: 9, fontSize: 12.5, marginTop: 14 }}>
            {error ?? clientError}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={async () => {
              const r = parseSalaryPayAmount(amount);
              if (!r.ok) {
                setClientError(r.message);
                return;
              }
              setClientError(null);
              await onSubmit(r.amount);
            }}
            disabled={busy}
            style={{ opacity: busy ? 0.7 : 1 }}
          >
            {busy ? <Loader2 size={13} style={{ animation: "spin 0.9s linear infinite" }} /> : null}
            Pay now
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

/* ─── Delete Modal ─── */
function DeleteModal({
  name,
  onClose,
  onConfirm,
  busy,
}: {
  name: string;
  onClose: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
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
        style={{ width: 360, padding: "28px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "#FEE2E2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <Trash2 size={20} style={{ color: "#DC2626" }} />
          </div>
          <h2
            style={{
              fontFamily: "Syne,sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: "var(--foreground)",
              marginBottom: 6,
            }}
          >
            Delete Manager
          </h2>
          <p style={{ fontSize: 13, color: "var(--foreground-muted)" }}>
            Are you sure you want to remove <strong>{name}</strong>?
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            style={{ background: "#DC2626", opacity: busy ? 0.7 : 1 }}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 10;

/* ─── Page ─── */
export default function ManagersPage() {
  const managers = useManagersStore((s) => s.items);
  const loading = useManagersStore((s) => s.loading);
  const error = useManagersStore((s) => s.error);
  const fetchManagers = useManagersStore((s) => s.fetch);
  const createManager = useManagersStore((s) => s.create);
  const updateManager = useManagersStore((s) => s.update);
  const removeManager = useManagersStore((s) => s.remove);
  const createAdvance = useManagersStore((s) => s.createAdvance);
  const paySalary = useManagersStore((s) => s.paySalary);

  const [search, setSearch] = useState("");
  const [searchFocused, setFocused] = useState(false);
  const [filterTab, setFilterTab] = useState<"All" | ManagerStatus>("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editManager, setEdit] = useState<Manager | null>(null);
  const [advManager, setAdvManager] = useState<Manager | null>(null);
  const [deleteTarget, setDelete] = useState<Manager | null>(null);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [advSaving, setAdvSaving] = useState(false);
  const [payingManagerId, setPayingManagerId] = useState<number | null>(null);
  const [payTarget, setPayTarget] = useState<Manager | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [advError, setAdvError] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);
  const [billingOwner, setBillingOwner] = useState<Owner | null>(null);
  const [billingLoaded, setBillingLoaded] = useState(false);

  useEffect(() => {
    if (!user || user.role === "admin") {
      setBillingOwner(null);
      setBillingLoaded(true);
      return;
    }
    let cancelled = false;
    setBillingLoaded(false);
    (async () => {
      try {
        const self = await ownersApi.getOne(user.id);
        if (cancelled) return;
        if (user.role === "manager" && self.managerOfId) {
          setBillingOwner(await ownersApi.getOne(self.managerOfId));
        } else {
          setBillingOwner(self);
        }
      } catch {
        if (!cancelled) setBillingOwner(null);
      } finally {
        if (!cancelled) setBillingLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const canAddEmployedManager =
    user?.role === "admin" ||
    (billingLoaded && planAllowsEmployedManagers(billingOwner));

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const filterTabs: ("All" | ManagerStatus)[] = ["All", "Active", "Inactive"];

  const filtered = useMemo(
    () =>
      managers.filter((d) => {
        const matchTab = filterTab === "All" || d.status === filterTab;
        const q = search.toLowerCase();
        const matchSearch =
          d.name.toLowerCase().includes(q) ||
          d.mobile.includes(q) ||
          d.email.toLowerCase().includes(q);
        return matchTab && matchSearch;
      }),
    [managers, filterTab, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const totalSalary = managers.reduce((a, d) => a + d.monthlySalary, 0);
  const totalAdvances = managers.reduce((a, d) => a + d.advanceBalance, 0);
  const activeCount = managers.filter((d) => d.status === "Active").length;

  const stats = [
    {
      label: "Total Managers",
      value: String(managers.length),
      icon: UserCog,
      accent: "#F59E0B",
      bg: "rgba(245,158,11,0.08)",
    },
    {
      label: "Active Managers",
      value: String(activeCount),
      icon: CheckCircle2,
      accent: "#059669",
      bg: "rgba(5,150,105,0.08)",
    },
    {
      label: "Monthly Payroll",
      value: `₹${(totalSalary / 1000).toFixed(0)}K`,
      icon: IndianRupee,
      accent: "#0EA5E9",
      bg: "rgba(14,165,233,0.08)",
    },
    {
      label: "Total Advances",
      value: `₹${totalAdvances.toLocaleString()}`,
      icon: Wallet,
      accent: "#EA580C",
      bg: "rgba(234,88,12,0.08)",
    },
  ];

  async function handleManagerSave(d: CreateManagerInput | UpdateManagerInput) {
    setSaving(true);
    setModalError(null);
    try {
      if (editManager) {
        await updateManager(editManager.id, d as UpdateManagerInput);
        setEdit(null);
      } else {
        await createManager(d as CreateManagerInput);
        setShowAdd(false);
      }
    } catch (err) {
      setModalError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAdvance(amount: number, type: "advance" | "repay") {
    if (!advManager) return;
    setAdvSaving(true);
    setAdvError(null);
    try {
      await createAdvance(advManager.id, { amount, type });
      setAdvManager(null);
    } catch (err) {
      setAdvError((err as Error).message);
    } finally {
      setAdvSaving(false);
    }
  }

  async function handlePaySalary(m: Manager) {
    setPayTarget(m);
    setPayError(null);
  }

  async function submitSalaryPayment(amount?: number) {
    if (!payTarget) return;

    setPayingManagerId(payTarget.id);
    setPayError(null);
    try {
      await paySalary(payTarget.id, undefined, amount);
      setPayTarget(null);
    } catch (err) {
      setPayError((err as Error).message);
    } finally {
      setPayingManagerId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeManager(deleteTarget.id);
      setDelete(null);
    } catch {
      // store captures error
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar
        title="Managers"
        subtitle="Employed managers: salary, advances & payroll"
      />

      {showAdd && (
        <ManagerModal
          key="manager-add"
          manager={null}
          onClose={() => {
            setShowAdd(false);
            setModalError(null);
          }}
          onSave={handleManagerSave}
          saving={saving}
          error={modalError}
          onDismissApiError={() => setModalError(null)}
        />
      )}
      {editManager && (
        <ManagerModal
          key={`manager-edit-${editManager.id}`}
          manager={editManager}
          onClose={() => {
            setEdit(null);
            setModalError(null);
          }}
          onSave={handleManagerSave}
          saving={saving}
          error={modalError}
          onDismissApiError={() => setModalError(null)}
        />
      )}
      {advManager && (
        <AdvanceModal
          key={`mgr-advance-${advManager.id}`}
          manager={advManager}
          onClose={() => {
            setAdvManager(null);
            setAdvError(null);
          }}
          onSave={handleAdvance}
          saving={advSaving}
          error={advError}
          onDismissApiError={() => setAdvError(null)}
        />
      )}
            {payTarget && (
        <SalaryPayModal
          key={`mgr-pay-${payTarget.id}`}
          manager={payTarget}
          onClose={() => {
            if (!payingManagerId) {
              setPayTarget(null);
              setPayError(null);
            }
          }}
          onSubmit={submitSalaryPayment}
          busy={payingManagerId === payTarget.id}
          error={payError}
        />
      )}
{deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onClose={() => setDelete(null)}
          onConfirm={handleDelete}
          busy={deleting}
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
        {billingLoaded &&
          user?.role !== "admin" &&
          !canAddEmployedManager && (
            <div
              role="status"
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                fontSize: 13,
                lineHeight: 1.45,
                border: "1px solid rgba(245,158,11,0.35)",
                background: "rgba(245,158,11,0.08)",
                color: "var(--foreground)",
              }}
            >
              Your current plan does not include employing managers (salary staff).
              Upgrade to a plan with Manager Access to add people here, or remove
              managers you no longer need.{" "}
              <Link
                href="/plans"
                style={{
                  color: "var(--amber-dark)",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                View plans
              </Link>
            </div>
          )}

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

        {/* Full-width Table Card */}
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
                  Manager Directory
                </h2>
                <p style={{ color: "var(--foreground-subtle)", fontSize: 12 }}>
                  Click{" "}
                  <FileText
                    size={11}
                    style={{ display: "inline", verticalAlign: "middle" }}
                  />{" "}
                  to open full salary report & chart
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
                    transition: "all 0.15s",
                  }}
                >
                  <Search
                    size={13}
                    style={{ color: "var(--foreground-subtle)" }}
                  />
                  <input
                    type="text"
                    placeholder="Search managers by name, mobile or email…"
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
                      width: 160,
                      fontFamily: "DM Sans,sans-serif",
                    }}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  style={{
                    fontSize: 13,
                    opacity: canAddEmployedManager ? 1 : 0.55,
                  }}
                  disabled={!canAddEmployedManager}
                  title={
                    !canAddEmployedManager
                      ? "Your plan does not include employing managers. Open Plans to upgrade."
                      : undefined
                  }
                  onClick={() => {
                    if (!canAddEmployedManager) return;
                    setModalError(null);
                    setShowAdd(true);
                  }}
                >
                  <Plus size={14} /> Add Manager
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 2 }}>
              {filterTabs.map((tab) => {
                const count =
                  tab === "All"
                    ? managers.length
                    : managers.filter((d) => d.status === tab).length;
                const isActive = filterTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setFilterTab(tab);
                      setPage(1);
                    }}
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
                  <th style={{ width: 44 }}>S.No</th>
                  <th>Manager</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Joining Date</th>
                  <th>Salary/mo</th>
                  <th>Advance Balance</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && managers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        textAlign: "center",
                        padding: "40px 20px",
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
                      Loading managers...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
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
                      No managers found
                    </td>
                  </tr>
                ) : (
                  paginated.map((d, i) => {
                    const rowNum = (currentPage - 1) * PAGE_SIZE + i + 1;
                    return (
                      <tr key={d.id}>
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
                                width: 34,
                                height: 34,
                                borderRadius: 9,
                                background:
                                  managerAvatarColors[
                                    i % managerAvatarColors.length
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
                              {d.name[0]}
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
                            {d.mobile}
                          </div>
                        </td>
                        <td
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 13,
                            color: "var(--foreground-muted)",
                          }}
                        >
                          <Mail size={11} />
                          {d.email}
                        </td>
                        <td
                          style={{
                            fontSize: 13,
                            color: "var(--foreground-muted)",
                          }}
                        >
                          {d.joiningDate.slice(0, 10)}
                        </td>
                        <td
                          style={{
                            fontWeight: 700,
                            color: "var(--foreground)",
                            fontSize: 13.5,
                          }}
                        >
                          ₹{d.monthlySalary.toLocaleString()}
                        </td>
                        <td
                          style={{
                            color:
                              d.advanceBalance > 0
                                ? "#EA580C"
                                : "var(--foreground-subtle)",
                            fontWeight: d.advanceBalance > 0 ? 700 : 400,
                            fontSize: 13.5,
                          }}
                        >
                          {d.advanceBalance > 0
                            ? `₹${d.advanceBalance.toLocaleString()}`
                            : "—"}
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
                              href={`/managers/${d.id}`}
                              style={{ textDecoration: "none" }}
                            >
                              <button
                                className="btn-icon"
                                style={{
                                  padding: 5,
                                  border: "none",
                                  borderRadius: 7,
                                }}
                                title="View Full Report"
                              >
                                <FileText size={13} />
                              </button>
                            </Link>
                            <button
                              className="btn-icon"
                              style={{
                                padding: 5,
                                border: "none",
                                borderRadius: 7,
                              }}
                              title="Pay Current Month Salary"
                              onClick={() => handlePaySalary(d)}
                              disabled={payingManagerId === d.id}
                            >
                              <IndianRupee size={13} />
                            </button>
                            <button
                              className="btn-icon"
                              style={{
                                padding: 5,
                                border: "none",
                                borderRadius: 7,
                              }}
                              title="Advance / Repay"
                              onClick={() => {
                                setAdvError(null);
                                setAdvManager(d);
                              }}
                            >
                              <Wallet size={13} />
                            </button>
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
                                setEdit(d);
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
                              onClick={() => setDelete(d)}
                            >
                              <Trash2 size={13} />
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
                {paginated.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)}
              </strong>{" "}
              of <strong>{filtered.length}</strong> managers
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
          <div
            style={{
              padding: "0 24px 12px",
              display: "flex",
              gap: 16,
              justifyContent: "flex-end",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <ArrowUpRight size={12} style={{ color: "#F59E0B" }} />
              <span
                style={{ fontSize: 11.5, color: "var(--foreground-subtle)" }}
              >
                Payroll:{" "}
                <strong style={{ color: "var(--foreground)" }}>
                  ₹{totalSalary.toLocaleString()}
                </strong>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <ArrowDownLeft size={12} style={{ color: "#EA580C" }} />
              <span
                style={{ fontSize: 11.5, color: "var(--foreground-subtle)" }}
              >
                Advances:{" "}
                <strong style={{ color: "#EA580C" }}>
                  ₹{totalAdvances.toLocaleString()}
                </strong>
              </span>
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
