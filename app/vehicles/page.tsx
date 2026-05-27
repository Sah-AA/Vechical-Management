"use client";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import {
  Car,
  Fuel,
  Wrench,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  Droplets,
  CalendarDays,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useVehiclesStore } from "../../lib/store/vehiclesStore";
import { useAuthStore } from "../../lib/store/authStore";
import {
  Vehicle,
  VehicleStatus,
  CreateVehicleInput,
  CreateFuelInput,
  CreateServiceInput,
  FuelEntry,
  ServiceEntry,
} from "../../lib/api/vehicles";
import {
  parseFuelEntryForm,
  parseServiceEntryForm,
  parseVehicleForm,
} from "../../lib/validation/vehicles";

type VehicleType = "Tractor" | "JCB" | "Other";

interface VehicleForm {
  name: string;
  number: string;
  type: VehicleType;
  status: VehicleStatus;
}

const vehicleTypeColors: Record<string, { bg: string; color: string }> = {
  JCB: { bg: "rgba(245,158,11,0.10)", color: "#B45309" },
  Tractor: { bg: "rgba(5,150,105,0.10)", color: "#065F46" },
  Other: { bg: "rgba(14,165,233,0.10)", color: "#0369A1" },
};

const statusBadge: Record<VehicleStatus, string> = {
  Active: "badge-active",
  Under_Service: "badge-pending",
  Idle: "badge-free",
};

const statusLabel: Record<VehicleStatus, string> = {
  Active: "Active",
  Under_Service: "Under Service",
  Idle: "Idle",
};

const avatarColors = ["#F59E0B", "#EA580C", "#0EA5E9", "#8B5CF6", "#059669"];

/* ─── Vehicle Modal ─── */
function VehicleModal({
  vehicle,
  onClose,
  onSave,
  saving,
  error,
  onDismissApiError,
}: {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSave: (v: CreateVehicleInput) => Promise<void>;
  saving: boolean;
  error: string | null;
  onDismissApiError?: () => void;
}) {
  const [form, setForm] = useState<VehicleForm>({
    name: vehicle?.name ?? "",
    number: vehicle?.number ?? "",
    type: ((vehicle?.type as VehicleType) ?? "Tractor") as VehicleType,
    status: vehicle?.status ?? "Active",
  });
  const [clientFormError, setClientFormError] = useState<string | null>(null);

  function touch() {
    onDismissApiError?.();
    setClientFormError(null);
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
        style={{ width: 500, padding: "28px 28px 24px" }}
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
              {vehicle ? "Edit Vehicle" : "Add New Vehicle"}
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "var(--foreground-subtle)",
                marginTop: 2,
              }}
            >
              Fill in vehicle details
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
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
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
              Vehicle Name
            </label>
            <input
              className="input"
              placeholder="e.g. JCB JX90"
              value={form.name}
              disabled={saving}
              onChange={(e) => {
                touch();
                setForm((f) => ({ ...f, name: e.target.value }));
              }}
            />
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
              Vehicle Number
            </label>
            <input
              className="input"
              placeholder="e.g. GJ-01-AB-1234"
              value={form.number}
              disabled={saving}
              onChange={(e) => {
                touch();
                setForm((f) => ({ ...f, number: e.target.value }));
              }}
            />
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
              Type
            </label>
            <select
              className="input"
              style={{ cursor: "pointer" }}
              value={form.type}
              disabled={saving}
              onChange={(e) => {
                touch();
                setForm((f) => ({ ...f, type: e.target.value as VehicleType }));
              }}
            >
              <option value="Tractor">Tractor</option>
              <option value="JCB">JCB</option>
              <option value="Other">Other</option>
            </select>
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
                touch();
                setForm((f) => ({
                  ...f,
                  status: e.target.value as VehicleStatus,
                }));
              }}
            >
              <option value="Active">Active</option>
              <option value="Under_Service">Under Service</option>
              <option value="Idle">Idle</option>
            </select>
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
              const parsed = parseVehicleForm(form);
              if (!parsed.success) {
                const msg =
                  parsed.formError ??
                  (Object.values(parsed.fieldErrors).find(Boolean) as string | undefined);
                setClientFormError(msg ?? "Please check vehicle details.");
                return;
              }
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
            {vehicle ? "Save Changes" : "Add Vehicle"}
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

/* ─── Fuel Entry Modal ─── */
function FuelModal({
  vehicles,
  onClose,
  onSave,
  saving,
  error,
}: {
  vehicles: Vehicle[];
  onClose: () => void;
  onSave: (input: CreateFuelInput) => Promise<void>;
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState({
    vehicleId: vehicles[0]?.id ?? 0,
    date: new Date().toISOString().slice(0, 10),
    litres: 0,
    pricePerLitre: 95,
    notes: "",
  });
  const [clientFuelError, setClientFuelError] = useState<string | null>(null);
  const hasOptions = vehicles.length > 0;

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
              Add Fuel Entry
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "var(--foreground-subtle)",
                marginTop: 2,
              }}
            >
              Record diesel/fuel fill-up
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
            Please add a vehicle before recording fuel.
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
              Vehicle
            </label>
            <select
              className="input"
              style={{ cursor: "pointer" }}
              value={form.vehicleId}
              disabled={!hasOptions || saving}
              onChange={(e) =>
                setForm((f) => ({ ...f, vehicleId: Number(e.target.value) }))
              }
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.number})
                </option>
              ))}
            </select>
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
              Date
            </label>
            <input
              className="input"
              type="date"
              value={form.date}
              disabled={saving}
              onChange={(e) =>
                setForm((f) => ({ ...f, date: e.target.value }))
              }
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
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
                Litres
              </label>
              <input
                className="input"
                type="number"
                placeholder="e.g. 40"
                value={form.litres || ""}
                disabled={saving}
                onChange={(e) =>
                  setForm((f) => ({ ...f, litres: Number(e.target.value) }))
                }
              />
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
                Price/Litre (₹)
              </label>
              <input
                className="input"
                type="number"
                placeholder="e.g. 95"
                value={form.pricePerLitre || ""}
                disabled={saving}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    pricePerLitre: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>
          {form.litres > 0 && form.pricePerLitre > 0 && (
            <div
              style={{
                background: "var(--amber-glow)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: 9,
                padding: "10px 14px",
              }}
            >
              <p style={{ fontSize: 12, color: "var(--foreground-muted)" }}>
                Total Amount
              </p>
              <p
                style={{
                  fontFamily: "Syne,sans-serif",
                  fontWeight: 800,
                  fontSize: 20,
                  color: "var(--amber-dark)",
                }}
              >
                ₹{(form.litres * form.pricePerLitre).toLocaleString()}
              </p>
            </div>
          )}
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
              Notes (optional)
            </label>
            <input
              className="input"
              placeholder="e.g. Full tank fill"
              value={form.notes}
              disabled={saving}
              onChange={(e) => {
                setClientFuelError(null);
                setForm((f) => ({ ...f, notes: e.target.value }));
              }}
            />
          </div>
        </div>

        {(error || clientFuelError) && (
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
            {error ?? clientFuelError}
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
              const parsed = parseFuelEntryForm(form);
              if (!parsed.success) {
                const msg =
                  parsed.formError ??
                  (Object.values(parsed.fieldErrors).find(Boolean) as string | undefined);
                setClientFuelError(msg ?? "Please check fuel entry.");
                return;
              }
              setClientFuelError(null);
              await onSave(parsed.data);
            }}
            disabled={saving || !hasOptions}
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (
              <Loader2
                size={13}
                style={{ animation: "spin 0.9s linear infinite" }}
              />
            ) : null}
            Add Entry
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

/* ─── Service Entry Modal ─── */
function ServiceModal({
  vehicles,
  onClose,
  onSave,
  saving,
  error,
}: {
  vehicles: Vehicle[];
  onClose: () => void;
  onSave: (input: CreateServiceInput) => Promise<void>;
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState({
    vehicleId: vehicles[0]?.id ?? 0,
    date: new Date().toISOString().slice(0, 10),
    description: "",
    cost: 0,
    status: "Pending" as "Pending" | "Completed",
  });
  const [clientSvcError, setClientSvcError] = useState<string | null>(null);
  const hasOptions = vehicles.length > 0;

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
              Add Service Entry
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "var(--foreground-subtle)",
                marginTop: 2,
              }}
            >
              Record maintenance / service work
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
            Please add a vehicle before recording a service.
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
              Vehicle
            </label>
            <select
              className="input"
              style={{ cursor: "pointer" }}
              value={form.vehicleId}
              disabled={!hasOptions || saving}
              onChange={(e) =>
                setForm((f) => ({ ...f, vehicleId: Number(e.target.value) }))
              }
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.number})
                </option>
              ))}
            </select>
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
              Date
            </label>
            <input
              className="input"
              type="date"
              value={form.date}
              disabled={saving}
              onChange={(e) =>
                setForm((f) => ({ ...f, date: e.target.value }))
              }
            />
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
              Description
            </label>
            <input
              className="input"
              placeholder="e.g. Oil change & filter replacement"
              value={form.description}
              disabled={saving}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
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
                Cost (₹)
              </label>
              <input
                className="input"
                type="number"
                placeholder="e.g. 3500"
                value={form.cost || ""}
                disabled={saving}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cost: Number(e.target.value) }))
                }
              />
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
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as "Pending" | "Completed",
                  }))
                }
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {(error || clientSvcError) && (
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
            {error ?? clientSvcError}
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
              const parsed = parseServiceEntryForm(form);
              if (!parsed.success) {
                const msg =
                  parsed.formError ??
                  (Object.values(parsed.fieldErrors).find(Boolean) as string | undefined);
                setClientSvcError(msg ?? "Please check service entry.");
                return;
              }
              setClientSvcError(null);
              await onSave(parsed.data);
            }}
            disabled={saving || !hasOptions}
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (
              <Loader2
                size={13}
                style={{ animation: "spin 0.9s linear infinite" }}
              />
            ) : null}
            Add Service
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

function DeleteVehicleModal({
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
            Remove Vehicle
          </h2>
          <p style={{ fontSize: 13, color: "var(--foreground-muted)" }}>
            Remove <strong>{name}</strong> from the fleet?
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
            {busy ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function VehiclesPage() {
  const vehicles = useVehiclesStore((s) => s.items);
  const loading = useVehiclesStore((s) => s.loading);
  const error = useVehiclesStore((s) => s.error);
  const fetchVehicles = useVehiclesStore((s) => s.fetch);
  const createVehicle = useVehiclesStore((s) => s.create);
  const updateVehicle = useVehiclesStore((s) => s.update);
  const removeVehicle = useVehiclesStore((s) => s.remove);
  const createFuel = useVehiclesStore((s) => s.createFuel);
  const createService = useVehiclesStore((s) => s.createService);

  const ownerName = useAuthStore((s) => s.user?.name ?? "—");

  const [activeTab, setActiveTab] = useState<"vehicles" | "fuel" | "service">(
    "vehicles",
  );
  const [search, setSearch] = useState("");
  const [searchFocused, setFocused] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"All" | VehicleType>("All");

  const [showAddVehicle, setAddVeh] = useState(false);
  const [editVehicle, setEditVeh] = useState<Vehicle | null>(null);
  const [deleteVehicle, setDelVeh] = useState<Vehicle | null>(null);
  const [showAddFuel, setAddFuel] = useState(false);
  const [showAddService, setAddSvc] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const typeFilters: ("All" | VehicleType)[] = [
    "All",
    "Tractor",
    "JCB",
    "Other",
  ];

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter((v) => {
        const matchType = typeFilter === "All" || v.type === typeFilter;
        const q = search.toLowerCase();
        const matchSearch =
          v.name.toLowerCase().includes(q) ||
          v.number.toLowerCase().includes(q);
        return matchType && matchSearch;
      }),
    [vehicles, typeFilter, search],
  );

  // Flatten fuel/service entries across vehicles
  const fuelEntries: (FuelEntry & { vehicleName: string })[] = useMemo(
    () =>
      vehicles
        .flatMap((v) =>
          (v.fuelEntries ?? []).map((e) => ({ ...e, vehicleName: v.name })),
        )
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    [vehicles],
  );
  const serviceEntries: (ServiceEntry & { vehicleName: string })[] = useMemo(
    () =>
      vehicles
        .flatMap((v) =>
          (v.serviceEntries ?? []).map((e) => ({ ...e, vehicleName: v.name })),
        )
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    [vehicles],
  );

  const totalFuel = fuelEntries.reduce((a, e) => a + e.amount, 0);
  const totalService = serviceEntries.reduce((a, e) => a + e.cost, 0);

  const stats = [
    {
      label: "Total Vehicles",
      value: String(vehicles.length),
      icon: Car,
      accent: "#F59E0B",
      bg: "rgba(245,158,11,0.08)",
    },
    {
      label: "Active",
      value: String(vehicles.filter((v) => v.status === "Active").length),
      icon: CheckCircle2,
      accent: "#059669",
      bg: "rgba(5,150,105,0.08)",
    },
    {
      label: "Total Fuel Cost",
      value: `₹${(totalFuel / 1000).toFixed(1)}K`,
      icon: Fuel,
      accent: "#0EA5E9",
      bg: "rgba(14,165,233,0.08)",
    },
    {
      label: "Service Cost",
      value: `₹${(totalService / 1000).toFixed(1)}K`,
      icon: Wrench,
      accent: "#8B5CF6",
      bg: "rgba(139,92,246,0.08)",
    },
  ];

  async function handleVehicleSave(d: CreateVehicleInput) {
    setSaving(true);
    setModalError(null);
    try {
      if (editVehicle) {
        await updateVehicle(editVehicle.id, d);
        setEditVeh(null);
      } else {
        await createVehicle(d);
        setAddVeh(false);
      }
    } catch (err) {
      setModalError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteVehicle() {
    if (!deleteVehicle) return;
    setDeleting(true);
    try {
      await removeVehicle(deleteVehicle.id);
      setDelVeh(null);
    } catch {
      // store captures error
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddFuel(input: CreateFuelInput) {
    setSaving(true);
    setModalError(null);
    try {
      await createFuel(input);
      setAddFuel(false);
    } catch (err) {
      setModalError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddService(input: CreateServiceInput) {
    setSaving(true);
    setModalError(null);
    try {
      await createService(input);
      setAddSvc(false);
    } catch (err) {
      setModalError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { key: "vehicles", label: "Vehicles", icon: Car },
    { key: "fuel", label: "Fuel History", icon: Fuel },
    { key: "service", label: "Service Records", icon: Wrench },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar
        title="Vehicles"
        subtitle="Manage fleet, fuel & service records"
      />

      {showAddVehicle && (
        <VehicleModal
          key="vehicle-add"
          vehicle={null}
          onClose={() => {
            setAddVeh(false);
            setModalError(null);
          }}
          onSave={handleVehicleSave}
          saving={saving}
          error={modalError}
          onDismissApiError={() => setModalError(null)}
        />
      )}
      {editVehicle && (
        <VehicleModal
          key={`vehicle-edit-${editVehicle.id}`}
          vehicle={editVehicle}
          onClose={() => {
            setEditVeh(null);
            setModalError(null);
          }}
          onSave={handleVehicleSave}
          saving={saving}
          error={modalError}
          onDismissApiError={() => setModalError(null)}
        />
      )}
      {deleteVehicle && (
        <DeleteVehicleModal
          name={deleteVehicle.name}
          onClose={() => setDelVeh(null)}
          onConfirm={handleDeleteVehicle}
          busy={deleting}
        />
      )}
      {showAddFuel && (
        <FuelModal
          vehicles={vehicles}
          onClose={() => {
            setAddFuel(false);
            setModalError(null);
          }}
          onSave={handleAddFuel}
          saving={saving}
          error={modalError}
        />
      )}
      {showAddService && (
        <ServiceModal
          vehicles={vehicles}
          onClose={() => {
            setAddSvc(false);
            setModalError(null);
          }}
          onSave={handleAddService}
          saving={saving}
          error={modalError}
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

        {/* Main Card */}
        <div
          className="card animate-fade-up stagger-3"
          style={{ overflow: "hidden" }}
        >
          {/* Tab bar + actions */}
          <div
            style={{
              padding: "16px 24px 0",
              borderBottom: "1px solid var(--card-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div style={{ display: "flex", gap: 2 }}>
                {tabs.map(({ key, label, icon: Icon }) => {
                  const isActive = activeTab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 14px",
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
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {activeTab === "vehicles" && (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 10px",
                        borderRadius: 9,
                        background: "var(--input-bg)",
                        border: `1px solid ${searchFocused ? "var(--amber)" : "var(--input-border)"}`,
                        transition: "all 0.15s",
                      }}
                    >
                      <Search
                        size={12}
                        style={{ color: "var(--foreground-subtle)" }}
                      />
                      <input
                        type="text"
                        placeholder="Search vehicles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        style={{
                          outline: "none",
                          background: "transparent",
                          fontSize: 12.5,
                          color: "var(--foreground)",
                          width: 140,
                          fontFamily: "DM Sans,sans-serif",
                        }}
                      />
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: 12.5 }}
                      onClick={() => {
                        setModalError(null);
                        setAddVeh(true);
                      }}
                    >
                      <Plus size={13} /> Add Vehicle
                    </button>
                  </>
                )}
                {activeTab === "fuel" && (
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: 12.5 }}
                    onClick={() => {
                      setModalError(null);
                      setAddFuel(true);
                    }}
                  >
                    <Plus size={13} /> Add Fuel Entry
                  </button>
                )}
                {activeTab === "service" && (
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: 12.5 }}
                    onClick={() => {
                      setModalError(null);
                      setAddSvc(true);
                    }}
                  >
                    <Plus size={13} /> Add Service
                  </button>
                )}
              </div>
            </div>

            {activeTab === "vehicles" && (
              <div style={{ display: "flex", gap: 2 }}>
                {typeFilters.map((t) => {
                  const count =
                    t === "All"
                      ? vehicles.length
                      : vehicles.filter((v) => v.type === t).length;
                  const isActive = typeFilter === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      style={{
                        padding: "5px 12px",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "DM Sans,sans-serif",
                        fontSize: 12,
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
                      {t}
                      <span
                        style={{
                          marginLeft: 5,
                          fontSize: 10.5,
                          background: isActive
                            ? "var(--amber-glow)"
                            : "#F0EEE9",
                          color: isActive
                            ? "var(--amber-dark)"
                            : "var(--foreground-subtle)",
                          padding: "1px 5px",
                          borderRadius: 99,
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Vehicles Table ── */}
          {activeTab === "vehicles" && (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: "center" }}>S.No</th>
                    <th>Vehicle</th>
                    <th>Number</th>
                    <th>Type</th>
                    <th>Owner</th>
                    <th>Fuel Cost</th>
                    <th>Service Cost</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && vehicles.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
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
                        Loading vehicles...
                      </td>
                    </tr>
                  ) : filteredVehicles.length === 0 ? (
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
                        No vehicles found
                      </td>
                    </tr>
                  ) : (
                    filteredVehicles.map((v, i) => {
                      const tc =
                        vehicleTypeColors[v.type] ?? vehicleTypeColors.Other;
                      return (
                        <tr key={v.id}>
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
                                  width: 34,
                                  height: 34,
                                  borderRadius: 9,
                                  background:
                                    avatarColors[i % avatarColors.length],
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <Car size={16} style={{ color: "#141210" }} />
                              </div>
                              <div>
                                <p
                                  style={{
                                    fontWeight: 600,
                                    fontSize: 13.5,
                                    color: "var(--foreground)",
                                  }}
                                >
                                  {v.name}
                                </p>
                                <p
                                  style={{
                                    fontSize: 11,
                                    color: "var(--foreground-subtle)",
                                  }}
                                >
                                  Diesel
                                </p>
                              </div>
                            </div>
                          </td>
                          <td
                            style={{
                              fontFamily: "monospace",
                              fontSize: 12.5,
                              color: "var(--foreground-muted)",
                            }}
                          >
                            {v.number}
                          </td>
                          <td>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "3px 10px",
                                borderRadius: 99,
                                fontSize: 11.5,
                                fontWeight: 600,
                                background: tc.bg,
                                color: tc.color,
                              }}
                            >
                              {v.type}
                            </span>
                          </td>
                          <td
                            style={{
                              fontSize: 13,
                              color: "var(--foreground-muted)",
                            }}
                          >
                            {ownerName}
                          </td>
                          <td
                            style={{
                              fontWeight: 600,
                              color: "#0EA5E9",
                              fontSize: 13,
                            }}
                          >
                            ₹{v.totalFuelCost.toLocaleString()}
                          </td>
                          <td
                            style={{
                              fontWeight: 600,
                              color: "#8B5CF6",
                              fontSize: 13,
                            }}
                          >
                            ₹{v.totalServiceCost.toLocaleString()}
                          </td>
                          <td>
                            <span className={`badge ${statusBadge[v.status]}`}>
                              {v.status === "Active" ? (
                                <CheckCircle2 size={9} />
                              ) : v.status === "Under_Service" ? (
                                <Wrench size={9} />
                              ) : (
                                <Clock size={9} />
                              )}
                              {statusLabel[v.status]}
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
                                title="Edit"
                                onClick={() => {
                                  setModalError(null);
                                  setEditVeh(v);
                                }}
                              >
                                <Edit2 size={12} />
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
                                onClick={() => setDelVeh(v)}
                              >
                                <Trash2 size={12} />
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
          )}

          {/* ── Fuel History Table ── */}
          {activeTab === "fuel" && (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: "center" }}>S.No</th>
                    <th>Date</th>
                    <th>Vehicle</th>
                    <th>Litres</th>
                    <th>Price/L</th>
                    <th>Total Amount</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelEntries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign: "center",
                          padding: "40px",
                          color: "var(--foreground-subtle)",
                          fontStyle: "italic",
                        }}
                      >
                        No fuel entries yet
                      </td>
                    </tr>
                  ) : (
                    fuelEntries.map((e, i) => (
                      <tr key={e.id}>
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
                              gap: 6,
                              fontSize: 13,
                            }}
                          >
                            <CalendarDays
                              size={12}
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
                              gap: 7,
                            }}
                          >
                            <div
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 7,
                                background:
                                  avatarColors[i % avatarColors.length],
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Car size={12} style={{ color: "#141210" }} />
                            </div>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "var(--foreground)",
                              }}
                            >
                              {e.vehicleName}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              fontSize: 13,
                            }}
                          >
                            <Droplets size={12} style={{ color: "#0EA5E9" }} />
                            {e.litres} L
                          </div>
                        </td>
                        <td
                          style={{
                            fontSize: 13,
                            color: "var(--foreground-muted)",
                          }}
                        >
                          ₹{e.pricePerLitre}/L
                        </td>
                        <td
                          style={{
                            fontWeight: 700,
                            color: "#0EA5E9",
                            fontSize: 14,
                          }}
                        >
                          ₹{e.amount.toLocaleString()}
                        </td>
                        <td
                          style={{
                            fontSize: 12,
                            color: "var(--foreground-muted)",
                            fontStyle: e.notes ? "normal" : "italic",
                          }}
                        >
                          {e.notes || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
                  {fuelEntries.length} entries
                </p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0EA5E9" }}>
                  Total: ₹{totalFuel.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* ── Service Records Table ── */}
          {activeTab === "service" && (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: "center" }}>S.No</th>
                    <th>Date</th>
                    <th>Vehicle</th>
                    <th>Description</th>
                    <th>Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceEntries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          textAlign: "center",
                          padding: "40px",
                          color: "var(--foreground-subtle)",
                          fontStyle: "italic",
                        }}
                      >
                        No service records yet
                      </td>
                    </tr>
                  ) : (
                    serviceEntries.map((e, i) => (
                      <tr key={e.id}>
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
                              gap: 6,
                              fontSize: 13,
                            }}
                          >
                            <CalendarDays
                              size={12}
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
                              gap: 7,
                            }}
                          >
                            <div
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 7,
                                background:
                                  avatarColors[i % avatarColors.length],
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Car size={12} style={{ color: "#141210" }} />
                            </div>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "var(--foreground)",
                              }}
                            >
                              {e.vehicleName}
                            </span>
                          </div>
                        </td>
                        <td
                          style={{
                            fontSize: 13,
                            color: "var(--foreground-muted)",
                            maxWidth: 240,
                          }}
                        >
                          {e.description}
                        </td>
                        <td
                          style={{
                            fontWeight: 700,
                            color: "#8B5CF6",
                            fontSize: 14,
                          }}
                        >
                          ₹{e.cost.toLocaleString()}
                        </td>
                        <td>
                          <span
                            className={`badge ${e.status === "Completed" ? "badge-active" : "badge-pending"}`}
                          >
                            {e.status === "Completed" ? (
                              <CheckCircle2 size={9} />
                            ) : (
                              <AlertCircle size={9} />
                            )}
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
                  {serviceEntries.length} records
                </p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#8B5CF6" }}>
                  Total Cost: ₹{totalService.toLocaleString()}
                </p>
              </div>
            </div>
          )}
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
