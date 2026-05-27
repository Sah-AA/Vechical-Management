"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import {
  ClipboardList,
  IndianRupee,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  Eye,
  Trash2,
  X,
  Printer,
  MessageCircle,
  Phone,
  Car,
  UserRound,
  UserCog,
  CalendarDays,
  FileText,
  Send,
  Loader2,
  FileDown,
} from "lucide-react";
import {
  WorkEntry,
  CreateWorkEntryInput,
  WorkEntryStatus,
  workEntriesApi,
  type WorkEntryQuery,
} from "../../lib/api/workEntries";
import { planEntitlementsApi } from "../../lib/api/planEntitlements";
import type { PlanEntitlementsSnapshot } from "../../lib/api/planEntitlements";
import { useWorkEntriesStore } from "../../lib/store/workEntriesStore";
import { useVehiclesStore } from "../../lib/store/vehiclesStore";
import { useCustomersStore } from "../../lib/store/customersStore";
import { useDriversStore } from "../../lib/store/driversStore";
import { useToast } from "../../components/ui/ToastProvider";
import { useConfirm } from "../../components/ui/ConfirmProvider";
import { LoadingUI } from "../../components/ui/LoadingUI";
import { useAuthStore } from "../../lib/store/authStore";
import { parseWorkEntryForm } from "../../lib/validation/workEntries";

const avatarColors = [
  "#F59E0B",
  "#EA580C",
  "#0EA5E9",
  "#8B5CF6",
  "#059669",
  "#EC4899",
];

/* ─── Bill Preview Modal ─── */
function BillModal({
  entry,
  onClose,
}: {
  entry: WorkEntry;
  onClose: () => void;
}) {
  const billNo = `JCB-${String(entry.id).padStart(4, "0")}`;
  const customerName = entry.customer?.name ?? "—";
  const customerMobile = entry.customer?.phone ?? "";
  const vehicleName = entry.vehicle?.name ?? "—";
  const vehicleNumber = entry.vehicle?.number ?? "";
  const driverName = entry.driver?.name ?? "—";
  const date = entry.date.slice(0, 10);

  function handleWhatsApp() {
    const msg = `*JCB Admin - Work Bill*\n\nBill No: ${billNo}\nDate: ${date}\nCustomer: ${customerName}\nVehicle: ${vehicleName} (${vehicleNumber})\nDriver: ${driverName}\nHours: ${entry.hours}h @ ₹${entry.ratePerHour}/h\nAmount: ₹${entry.amount.toLocaleString()}\nStatus: ${entry.status}\n\nThank you for your business!`;
    const url = `https://wa.me/91${customerMobile}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  }

  function handleSMS() {
    const msg = `JCB Work Bill ${billNo}: ${customerName}, ${vehicleName}, ${entry.hours}h, Amt: Rs.${entry.amount}. Status: ${entry.status}. -JCB Admin`;
    const url = `sms:${customerMobile}?body=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
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
        background: "rgba(20,18,16,0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="card animate-fade-up"
        style={{ width: 520, padding: "0", overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bill Header */}
        <div
          style={{
            background: "linear-gradient(135deg,#F59E0B,#D97706)",
            padding: "24px 28px",
            color: "#141210",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "Syne,sans-serif",
                  fontWeight: 800,
                  fontSize: 20,
                  letterSpacing: "-0.02em",
                }}
              >
                WORK BILL
              </h2>
              <p style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                JCB / Tractor Management
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  fontFamily: "Syne,sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {billNo}
              </p>
              <p style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{date}</p>
            </div>
          </div>
        </div>

        {/* Bill Body */}
        <div style={{ padding: "22px 28px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--foreground-subtle)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 6,
                }}
              >
                Bill To
              </p>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--foreground)",
                }}
              >
                {customerName}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--foreground-muted)",
                  marginTop: 2,
                }}
              >
                📱 {customerMobile}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--foreground-subtle)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 6,
                }}
              >
                Work Details
              </p>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  color: "var(--foreground)",
                }}
              >
                {vehicleName}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--foreground-muted)",
                  marginTop: 1,
                }}
              >
                {vehicleNumber}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--foreground-muted)",
                  marginTop: 1,
                }}
              >
                Driver: {driverName}
              </p>
            </div>
          </div>

          {entry.notes && (
            <div
              style={{
                background: "#FAFAF8",
                borderRadius: 9,
                padding: "10px 14px",
                marginBottom: 16,
                border: "1px solid var(--card-border)",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--foreground-subtle)",
                  marginBottom: 3,
                }}
              >
                Work Notes
              </p>
              <p style={{ fontSize: 13, color: "var(--foreground-muted)" }}>
                {entry.notes}
              </p>
            </div>
          )}

          <div
            style={{
              border: "1px solid var(--card-border)",
              borderRadius: 10,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FAFAF8" }}>
                  <th
                    style={{
                      padding: "8px 14px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--foreground-subtle)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      borderBottom: "1px solid var(--card-border)",
                    }}
                  >
                    Description
                  </th>
                  <th
                    style={{
                      padding: "8px 14px",
                      textAlign: "right",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--foreground-subtle)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      borderBottom: "1px solid var(--card-border)",
                    }}
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px 14px",
                      fontSize: 13,
                      color: "var(--foreground-muted)",
                      borderBottom: "1px solid #F0EEE9",
                    }}
                  >
                    {entry.hours} hours × ₹{entry.ratePerHour}/hr
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      textAlign: "right",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    ₹{entry.amount.toLocaleString()}
                  </td>
                </tr>
                <tr style={{ background: "var(--amber-glow)" }}>
                  <td
                    style={{
                      padding: "12px 14px",
                      fontFamily: "Syne,sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      color: "var(--foreground)",
                    }}
                  >
                    Total
                  </td>
                  <td
                    style={{
                      padding: "12px 14px",
                      textAlign: "right",
                      fontFamily: "Syne,sans-serif",
                      fontWeight: 800,
                      fontSize: 18,
                      color: "var(--amber-dark)",
                    }}
                  >
                    ₹{entry.amount.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <span
              className={`badge ${entry.status === "Paid" ? "badge-active" : "badge-pending"}`}
              style={{ fontSize: 13 }}
            >
              {entry.status === "Paid" ? (
                <CheckCircle2 size={12} />
              ) : (
                <Clock size={12} />
              )}
              Payment {entry.status}
            </span>
            <p style={{ fontSize: 11, color: "var(--foreground-subtle)" }}>
              Generated by JCB Admin Panel
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn btn-ghost"
              onClick={onClose}
              style={{ flex: 1, justifyContent: "center" }}
            >
              <X size={13} /> Close
            </button>
            <button
              onClick={handleSMS}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 9,
                border: "1px solid #3B82F6",
                background: "rgba(59,130,246,0.08)",
                color: "#2563EB",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "DM Sans,sans-serif",
                transition: "all 0.15s",
              }}
            >
              <Phone size={13} /> Send SMS
            </button>
            <button
              onClick={handleWhatsApp}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 9,
                border: "1px solid #22C55E",
                background: "rgba(34,197,94,0.08)",
                color: "#16A34A",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "DM Sans,sans-serif",
                transition: "all 0.15s",
              }}
            >
              <MessageCircle size={13} /> WhatsApp
            </button>
            <button
              className="btn btn-primary"
              onClick={() => window.print()}
              style={{ flex: 1, justifyContent: "center" }}
            >
              <Printer size={13} /> Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Work Entry Form Modal ─── */
function WorkEntryModal({
  onClose,
  onSave,
  saving,
  error,
  vehicles,
  customers,
  drivers,
}: {
  onClose: () => void;
  onSave: (input: CreateWorkEntryInput) => Promise<void>;
  saving: boolean;
  error: string | null;
  vehicles: { id: number; name: string; number: string }[];
  customers: { id: number; name: string; phone: string }[];
  drivers: { id: number; name: string }[];
}) {
  const hasOptions =
    vehicles.length > 0 && customers.length > 0 && drivers.length > 0;
  const [form, setForm] = useState({
    vehicleId: vehicles[0]?.id ?? 0,
    customerId: customers[0]?.id ?? 0,
    driverId: drivers[0]?.id ?? 0,
    date: new Date().toISOString().slice(0, 10),
    hours: 0,
    ratePerHour: 1000,
    notes: "",
    status: "Pending" as WorkEntryStatus,
  });
  const [clientFormError, setClientFormError] = useState<string | null>(null);

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);
  const selectedCustomer = customers.find((c) => c.id === form.customerId);
  const selectedDriver = drivers.find((d) => d.id === form.driverId);
  const amount = form.hours * form.ratePerHour;

  async function handleSave() {
    if (!hasOptions) return;
    setClientFormError(null);
    const parsed = parseWorkEntryForm(form);
    if (!parsed.success) {
      const msg =
        parsed.formError ??
        (Object.values(parsed.fieldErrors).find(Boolean) as string | undefined);
      setClientFormError(msg ?? "Please check your inputs.");
      return;
    }
    await onSave(parsed.data);
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
        style={{
          width: 560,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "28px 28px 24px",
        }}
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
              New Work Entry
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "var(--foreground-subtle)",
                marginTop: 2,
              }}
            >
              Log a job and auto-generate bill
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

        {!hasOptions && (
          <div
            role="alert"
            style={{
              background: "#FFF7ED",
              color: "#C2410C",
              border: "1px solid rgba(234,88,12,0.20)",
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: 12.5,
              marginBottom: 14,
            }}
          >
            Please add at least one vehicle, customer, and driver before
            creating a work entry.
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--foreground-subtle)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginBottom: 6,
              }}
            >
              <Car size={11} /> Vehicle
            </label>
            <select
              className="input"
              style={{ cursor: "pointer", fontSize: 12.5 }}
              value={form.vehicleId}
              disabled={!hasOptions || saving}
              onChange={(e) =>
                setForm((f) => ({ ...f, vehicleId: Number(e.target.value) }))
              }
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--foreground-subtle)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginBottom: 6,
              }}
            >
              <UserRound size={11} /> Customer
            </label>
            <select
              className="input"
              style={{ cursor: "pointer", fontSize: 12.5 }}
              value={form.customerId}
              disabled={!hasOptions || saving}
              onChange={(e) =>
                setForm((f) => ({ ...f, customerId: Number(e.target.value) }))
              }
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--foreground-subtle)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginBottom: 6,
              }}
            >
              <UserCog size={11} /> Driver
            </label>
            <select
              className="input"
              style={{ cursor: "pointer", fontSize: 12.5 }}
              value={form.driverId}
              disabled={!hasOptions || saving}
              onChange={(e) =>
                setForm((f) => ({ ...f, driverId: Number(e.target.value) }))
              }
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--foreground-subtle)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginBottom: 6,
              }}
            >
              <CalendarDays size={11} /> Date
            </label>
            <input
              className="input"
              type="date"
              value={form.date}
              style={{ fontSize: 12.5 }}
              disabled={saving}
              onChange={(e) =>
                setForm((f) => ({ ...f, date: e.target.value }))
              }
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--foreground-subtle)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginBottom: 6,
              }}
            >
              <Clock size={11} /> Hours
            </label>
            <input
              className="input"
              type="number"
              placeholder="e.g. 4"
              value={form.hours || ""}
              style={{ fontSize: 12.5 }}
              disabled={saving}
              onChange={(e) =>
                setForm((f) => ({ ...f, hours: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--foreground-subtle)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginBottom: 6,
              }}
            >
              <IndianRupee size={11} /> Rate/hr
            </label>
            <input
              className="input"
              type="number"
              placeholder="e.g. 1000"
              value={form.ratePerHour || ""}
              style={{ fontSize: 12.5 }}
              disabled={saving}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  ratePerHour: Number(e.target.value),
                }))
              }
            />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--foreground-subtle)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginBottom: 6,
            }}
          >
            <FileText size={11} /> Work Notes
          </label>
          <input
            className="input"
            placeholder="e.g. Land levelling, North field"
            value={form.notes}
            disabled={saving}
            onChange={(e) =>
              setForm((f) => ({ ...f, notes: e.target.value }))
            }
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--foreground-subtle)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 6,
              display: "block",
            }}
          >
            Payment Status
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["Pending", "Paid"] as const).map((s) => (
              <button
                key={s}
                disabled={saving}
                onClick={() => setForm((f) => ({ ...f, status: s }))}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  borderRadius: 9,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  fontFamily: "DM Sans,sans-serif",
                  background:
                    form.status === s
                      ? s === "Paid"
                        ? "var(--emerald)"
                        : "#EA580C"
                      : "var(--input-bg)",
                  color: form.status === s ? "#fff" : "var(--foreground-muted)",
                  outline: "none",
                  borderStyle: "solid",
                  borderWidth: 1,
                  borderColor:
                    form.status === s ? "transparent" : "var(--input-border)",
                  transition: "all 0.15s",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {amount > 0 && hasOptions && (
          <div
            style={{
              background: "var(--amber-glow)",
              border: "1px solid rgba(245,158,11,0.22)",
              borderRadius: 12,
              padding: "14px 18px",
              marginBottom: 16,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--foreground-subtle)",
                marginBottom: 8,
              }}
            >
              AUTO-GENERATED BILL PREVIEW
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <p style={{ fontSize: 12.5, color: "var(--foreground-muted)" }}>
                  {selectedVehicle?.name} • {selectedCustomer?.name} •{" "}
                  {form.hours}h @ ₹{form.ratePerHour}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--foreground-subtle)",
                    marginTop: 3,
                  }}
                >
                  {selectedDriver?.name} · {form.date}
                </p>
              </div>
              <p
                style={{
                  fontFamily: "Syne,sans-serif",
                  fontWeight: 800,
                  fontSize: 22,
                  color: "var(--amber-dark)",
                }}
              >
                ₹{amount.toLocaleString()}
              </p>
            </div>
          </div>
        )}

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
              marginBottom: 14,
            }}
          >
            {error ?? clientFormError}
          </div>
        )}

        <div
          style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
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
            onClick={handleSave}
            disabled={saving || !hasOptions}
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (
              <Loader2
                size={13}
                style={{ animation: "spin 0.9s linear infinite" }}
              />
            ) : (
              <Send size={13} />
            )}{" "}
            Save & Generate Bill
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
export default function WorkEntriesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const entries = useWorkEntriesStore((s) => s.items);
  const stats = useWorkEntriesStore((s) => s.stats);
  const loading = useWorkEntriesStore((s) => s.loading);
  const error = useWorkEntriesStore((s) => s.error);
  const fetchEntries = useWorkEntriesStore((s) => s.fetch);
  const createEntry = useWorkEntriesStore((s) => s.create);
  const toggleStatus = useWorkEntriesStore((s) => s.toggleStatus);
  const removeEntry = useWorkEntriesStore((s) => s.remove);

  const vehicles = useVehiclesStore((s) => s.items);
  const fetchVehicles = useVehiclesStore((s) => s.fetch);
  const customers = useCustomersStore((s) => s.items);
  const fetchCustomers = useCustomersStore((s) => s.fetch);
  const drivers = useDriversStore((s) => s.items);
  const fetchDrivers = useDriversStore((s) => s.fetch);

  const [search, setSearch] = useState("");
  const [searchFocused, setFocused] = useState(false);
  const [filterStatus, setFilter] = useState<"All" | WorkEntryStatus>("All");
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [entitlements, setEntitlements] = useState<PlanEntitlementsSnapshot | null>(
    null,
  );
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    if (!user || user.role === "admin") {
      setEntitlements(null);
      return;
    }
    let cancelled = false;
    planEntitlementsApi
      .getCurrent()
      .then((e) => {
        if (!cancelled) setEntitlements(e);
      })
      .catch(() => {
        if (!cancelled) setEntitlements(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const atWorkEntryLimit =
    entitlements?.limits?.workEntries != null &&
    entitlements.counts != null &&
    entitlements.counts.workEntries >= entitlements.limits.workEntries;

  const canAddWorkEntry = user?.role === "admin" || !atWorkEntryLimit;
  const showPdfExport =
    user?.role !== "admin" && Boolean(entitlements?.plan?.pdfExportEnabled);

  useEffect(() => {
    fetchEntries();
    fetchVehicles();
    fetchCustomers();
    fetchDrivers();
  }, [fetchEntries, fetchVehicles, fetchCustomers, fetchDrivers]);

  const filterTabs: ("All" | WorkEntryStatus)[] = ["All", "Pending", "Paid"];

  const filtered = useMemo(
    () =>
      entries.filter((e) => {
        const matchStatus =
          filterStatus === "All" || e.status === filterStatus;
        const q = search.toLowerCase();
        const matchSearch =
          (e.customer?.name ?? "").toLowerCase().includes(q) ||
          (e.vehicle?.name ?? "").toLowerCase().includes(q) ||
          (e.driver?.name ?? "").toLowerCase().includes(q);
        return matchStatus && matchSearch;
      }),
    [entries, filterStatus, search],
  );

  const totalRevenue = stats?.totalRevenue ?? 0;
  const paidRevenue = stats?.paidRevenue ?? 0;
  const pendingAmount = stats?.pendingAmount ?? 0;
  const totalHours = stats?.totalHours ?? 0;

  const statCards = [
    {
      label: "Total Jobs",
      value: String(stats?.totalJobs ?? entries.length),
      icon: ClipboardList,
      accent: "#F59E0B",
      bg: "rgba(245,158,11,0.08)",
    },
    {
      label: "Total Hours",
      value: `${totalHours}h`,
      icon: Clock,
      accent: "#0EA5E9",
      bg: "rgba(14,165,233,0.08)",
    },
    {
      label: "Received",
      value: `₹${(paidRevenue / 1000).toFixed(1)}K`,
      icon: CheckCircle2,
      accent: "#059669",
      bg: "rgba(5,150,105,0.08)",
    },
    {
      label: "Pending",
      value: `₹${(pendingAmount / 1000).toFixed(1)}K`,
      icon: IndianRupee,
      accent: "#EA580C",
      bg: "rgba(234,88,12,0.08)",
    },
  ];

  async function handleAdd(input: CreateWorkEntryInput) {
    setSaving(true);
    setModalError(null);
    try {
      await createEntry(input);
      setShowAdd(false);
      showToast({
        title: "Work entry created",
        message: "New job entry has been added successfully.",
        variant: "success",
      });
    } catch (err) {
      setModalError((err as Error).message);
      showToast({
        title: "Failed to create entry",
        message: (err as Error).message,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry: WorkEntry) {
    const confirmed = await confirm({
      title: "Delete Work Entry",
      description: "Remove this job entry and its bill permanently?",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      destructive: true,
    });

    if (!confirmed) return;

    try {
      await removeEntry(entry.id);
      showToast({
        title: "Entry deleted",
        message: "The work entry was removed successfully.",
        variant: "success",
      });
    } catch (err) {
      showToast({
        title: "Unable to delete entry",
        message: (err as Error).message,
        variant: "error",
      });
    }
  }

  function handleToggle(id: number) {
    toggleStatus(id)
      .then(() => {
        showToast({
          title: "Status updated",
          message: "Payment status has been toggled.",
          variant: "success",
        });
      })
      .catch((err) => {
        showToast({
          title: "Failed to update status",
          message: (err as Error).message,
          variant: "error",
        });
      });
  }

  async function handleDownloadPdf() {
    setPdfBusy(true);
    try {
      const query: WorkEntryQuery = {};
      if (filterStatus !== "All") query.status = filterStatus;
      if (search.trim()) query.search = search.trim();
      const blob = await workEntriesApi.downloadExportPdf(query);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "work-entries.pdf";
      a.click();
      URL.revokeObjectURL(url);
      showToast({
        title: "PDF ready",
        message: "Your export has been downloaded.",
        variant: "success",
      });
    } catch (err) {
      showToast({
        title: "Export failed",
        message: (err as Error).message,
        variant: "error",
      });
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar
        title="Work Entries"
        subtitle="Track jobs, generate bills & send to customers"
      />

      {showAdd && (
        <WorkEntryModal
          onClose={() => {
            setShowAdd(false);
            setModalError(null);
          }}
          onSave={handleAdd}
          saving={saving}
          error={modalError}
          vehicles={vehicles}
          customers={customers.map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
          }))}
          drivers={drivers}
        />
      )}
      {saving && <LoadingUI overlay label="Saving work entry..." />}

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
          {statCards.map(({ label, value, icon: Icon, accent, bg }, i) => (
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
                  Job Entries
                </h2>
                <p style={{ color: "var(--foreground-subtle)", fontSize: 12 }}>
                  All work orders with auto-generated bills
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
                    placeholder="Search jobs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{
                      outline: "none",
                      background: "transparent",
                      fontSize: 13,
                      color: "var(--foreground)",
                      width: 150,
                      fontFamily: "DM Sans,sans-serif",
                    }}
                  />
                </div>
                {showPdfExport && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: 13 }}
                    disabled={pdfBusy}
                    onClick={() => void handleDownloadPdf()}
                  >
                    {pdfBusy ? (
                      <Loader2
                        size={14}
                        style={{ animation: "spin 0.9s linear infinite" }}
                      />
                    ) : (
                      <FileDown size={14} />
                    )}{" "}
                    Download PDF
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  style={{
                    fontSize: 13,
                    opacity: canAddWorkEntry ? 1 : 0.55,
                  }}
                  disabled={!canAddWorkEntry}
                  title={
                    !canAddWorkEntry
                      ? "Your plan has reached the maximum number of work entries. Upgrade on Plans."
                      : undefined
                  }
                  onClick={() => {
                    if (!canAddWorkEntry) return;
                    setModalError(null);
                    setShowAdd(true);
                  }}
                >
                  <Plus size={14} /> New Work Entry
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 2 }}>
              {filterTabs.map((tab) => {
                const count =
                  tab === "All"
                    ? entries.length
                    : entries.filter((e) => e.status === tab).length;
                const isActive = filterStatus === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
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
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Hours</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Work Notes</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && entries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "var(--foreground-subtle)",
                      }}
                    >
                      <LoadingUI label="Loading work entries..." />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "var(--foreground-subtle)",
                        fontStyle: "italic",
                      }}
                    >
                      No work entries found
                    </td>
                  </tr>
                ) : (
                  filtered.map((e, i) => (
                    <tr key={e.id}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12.5,
                          }}
                        >
                          <CalendarDays
                            size={11}
                            style={{ color: "var(--foreground-subtle)" }}
                          />
                          {e.date.slice(0, 10)}
                        </div>
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
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background:
                                avatarColors[i % avatarColors.length],
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontFamily: "Syne,sans-serif",
                              fontWeight: 700,
                              fontSize: 11,
                              color: "#141210",
                              flexShrink: 0,
                            }}
                          >
                            {(e.customer?.name ?? "?")[0]}
                          </div>
                          <div>
                            <p
                              style={{
                                fontWeight: 600,
                                fontSize: 13,
                                color: "var(--foreground)",
                              }}
                            >
                              {e.customer?.name ?? "—"}
                            </p>
                            <p
                              style={{
                                fontSize: 10.5,
                                color: "var(--foreground-subtle)",
                              }}
                            >
                              {e.customer?.phone ?? ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            color: "var(--foreground)",
                          }}
                        >
                          {e.vehicle?.name ?? "—"}
                        </p>
                        <p
                          style={{
                            fontSize: 10.5,
                            color: "var(--foreground-subtle)",
                            fontFamily: "monospace",
                          }}
                        >
                          {e.vehicle?.number ?? ""}
                        </p>
                      </td>
                      <td
                        style={{
                          fontSize: 13,
                          color: "var(--foreground-muted)",
                        }}
                      >
                        {e.driver?.name ?? "—"}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: "var(--foreground)",
                          fontSize: 13,
                        }}
                      >
                        {e.hours}h
                      </td>
                      <td
                        style={{
                          fontFamily: "Syne,sans-serif",
                          fontWeight: 700,
                          fontSize: 14,
                          color: "var(--amber-dark)",
                        }}
                      >
                        ₹{e.amount.toLocaleString()}
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggle(e.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                          }}
                          title="Click to toggle status"
                        >
                          <span
                            className={`badge ${e.status === "Paid" ? "badge-active" : "badge-pending"}`}
                          >
                            {e.status === "Paid" ? (
                              <CheckCircle2 size={9} />
                            ) : (
                              <Clock size={9} />
                            )}
                            {e.status}
                          </span>
                        </button>
                      </td>
                      <td
                        style={{
                          fontSize: 12,
                          color: "var(--foreground-subtle)",
                          maxWidth: 160,
                        }}
                      >
                        {e.notes || "—"}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: 4,
                          }}
                        >
                          <button
                            className="btn-icon"
                            style={{
                              padding: 5,
                              border: "none",
                              borderRadius: 7,
                            }}
                            title="Open Customer Details"
                            onClick={() => {
                              if (!e.customer?.id) {
                                showToast({
                                  title: "Customer not found",
                                  message: "This work entry has no linked customer.",
                                  variant: "error",
                                });
                                return;
                              }
                              router.push(`/customers/${e.customer.id}`);
                            }}
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            onClick={() => {
                              const phone = e.customer?.phone ?? "";
                              const msg = `Work Bill: ${e.customer?.name ?? ""}, ${e.vehicle?.name ?? ""}, ${e.hours}h, Rs.${e.amount}. Status: ${e.status}. -JCB Admin`;
                              window.open(
                                `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`,
                                "_blank",
                              );
                            }}
                            style={{
                              padding: 5,
                              border: "1px solid #22C55E",
                              borderRadius: 7,
                              background: "rgba(34,197,94,0.08)",
                              color: "#16A34A",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.15s",
                            }}
                            title="Send WhatsApp"
                          >
                            <MessageCircle size={12} />
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
                            onClick={() => handleDelete(e)}
                          >
                            <Trash2 size={12} />
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
              <strong>{entries.length}</strong> entries
            </p>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ fontSize: 12, color: "var(--foreground-subtle)" }}>
                Total Revenue:{" "}
                <strong style={{ color: "var(--foreground)" }}>
                  ₹{totalRevenue.toLocaleString()}
                </strong>
              </span>
              <span style={{ fontSize: 12, color: "var(--foreground-subtle)" }}>
                Pending:{" "}
                <strong style={{ color: "#EA580C" }}>
                  ₹{pendingAmount.toLocaleString()}
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
