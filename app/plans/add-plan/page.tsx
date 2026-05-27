"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Navbar from "../../../components/Navbar";
import {
  ArrowLeft, Plus, CheckCircle2, Crown,
  Zap, Tractor, Users, IndianRupee, Car, UserCog,
  Wrench, Shield, Wifi, BarChart2, MessageSquare,
  Clock, Star, AlertCircle, Save,
} from "lucide-react";
import {
  planColorPresets,
} from "../../../lib/planData";
import { formatCollectedRevenueInr, formatPlanPriceInrPerMo } from "../../../lib/planFormat";
import { getErrorMessage } from "../../../lib/api/client";
import { Plan, plansApi } from "../../../lib/api/plans";
import { useConfirm } from "../../../components/ui/ConfirmProvider";
import { useToast } from "../../../components/ui/ToastProvider";
import { LoadingUI } from "../../../components/ui/LoadingUI";
import { useAuthStore } from "../../../lib/store/authStore";
import {
  buildAutoPlanFeatureLines,
  formatSupportFeatureLine,
  partitionStoredPlanFeatures,
  planCapSummary,
  planDriverSummary,
  toBackendMaxDrivers,
  toBackendResourceCap,
} from "../../../lib/planAutoFeatures";

type PlanFormValues = Pick<
  Plan,
  | "name"
  | "price"
  | "validity"
  | "maxVehicles"
  | "maxCustomers"
  | "maxDrivers"
  | "maxWorkEntries"
  | "managerAccess"
  | "pdfExportEnabled"
  | "features"
  | "color"
  | "textColor"
  | "badge"
>;

const featureIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  "Vehicle": Car, "Driver": UserCog, "Manager": Users,
  "Work": Wrench, "Bill": IndianRupee, "Analytics": BarChart2,
  "SMS": MessageSquare, "WhatsApp": MessageSquare, "Support": Shield,
  "API": Wifi, "Report": BarChart2, "Export": BarChart2,
};

function getFeatureIcon(feature: string) {
  const lower = feature.toLowerCase();
  // Keep icon stable even when users type spelling variants like "vechicle".
  if (lower.includes("vehicle") || lower.includes("vechicle") || lower.includes("vehical")) {
    return Car;
  }
  for (const [key, Icon] of Object.entries(featureIcons)) {
    if (lower.includes(key.toLowerCase())) return Icon;
  }
  return CheckCircle2;
}

function dedupeFeatures(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value.trim().replace(/\s+/g, " ").toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(value.trim());
  }
  return result;
}

function normalizeFeature(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function toBackendBadge(value: string) {
  return value.replace(/-/g, "_");
}

function fromBackendBadge(value: string) {
  return value.replace(/_/g, "-");
}

/* ─── Toggle switch ─── */
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 99, border: "none", cursor: "pointer",
        background: value ? "var(--amber)" : "#D4CFC8",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 4, left: value ? 23 : 4,
        width: 16, height: 16, borderRadius: 99, background: "white",
        transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

/* ─── Live Preview Card ─── */
function PlanPreviewCard({ form }: { form: PlanFormValues }) {
  const PlanIcon = { Free: Zap, Bronze: Tractor, Silver: Users, Gold: Crown }[form.name] ?? Star;
  return (
    <div style={{
      borderRadius: 16, padding: "24px", border: "1px solid var(--card-border)",
      background: "var(--card-bg)", position: "relative", overflow: "hidden",
    }}>
      <p style={{ fontSize: 10.5, fontWeight: 700, color: "var(--foreground-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
        Live Preview
      </p>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: form.color, border: `1.5px solid ${form.color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <PlanIcon size={20} style={{ color: form.textColor }} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 18, color: "var(--foreground)" }}>
              {form.name || "Plan Name"}
            </h3>
            <span className={`badge ${form.badge}`}>{formatPlanPriceInrPerMo(form.price)}</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--foreground-subtle)" }}>
            {planCapSummary(form.maxVehicles)} vehicles · {planDriverSummary(form.maxDrivers)} drivers ·{" "}
            {planCapSummary(form.maxCustomers)} customers · {planCapSummary(form.maxWorkEntries)} jobs · {form.validity}
          </p>
        </div>
      </div>

      {form.features.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
          {form.features.map((f, i) => {
            const Icon = getFeatureIcon(f);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon size={13} style={{ color: "#059669", flexShrink: 0 }} strokeWidth={2} />
                <span style={{ fontSize: 12.5, color: "var(--foreground-muted)" }}>{f}</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
        <div style={{ background: "#FAFAF8", borderRadius: 9, padding: "9px 12px", border: "1px solid var(--card-border)" }}>
          <p style={{ fontSize: 10, color: "var(--foreground-subtle)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Max Vehicles</p>
          <p style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 15, color: "var(--foreground)" }}>{planCapSummary(form.maxVehicles)}</p>
        </div>
        <div style={{ background: "#FAFAF8", borderRadius: 9, padding: "9px 12px", border: "1px solid var(--card-border)" }}>
          <p style={{ fontSize: 10, color: "var(--foreground-subtle)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Max Customers</p>
          <p style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 15, color: "var(--foreground)" }}>{planCapSummary(form.maxCustomers)}</p>
        </div>
        <div style={{ background: "#FAFAF8", borderRadius: 9, padding: "9px 12px", border: "1px solid var(--card-border)" }}>
          <p style={{ fontSize: 10, color: "var(--foreground-subtle)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Max Drivers</p>
          <p style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 15, color: "var(--foreground)" }}>{planDriverSummary(form.maxDrivers)}</p>
        </div>
        <div style={{ background: "#FAFAF8", borderRadius: 9, padding: "9px 12px", border: "1px solid var(--card-border)" }}>
          <p style={{ fontSize: 10, color: "var(--foreground-subtle)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Max Work Entries</p>
          <p style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 15, color: "var(--foreground)" }}>{planCapSummary(form.maxWorkEntries)}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Edit Form (inner) ─── */
function EditPlanForm() {
  const router       = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const editParam = searchParams.get("edit");
  const idParam = searchParams.get("id");
  const parsedPlanId = idParam ? Number(idParam) : NaN;
  const planId = Number.isFinite(parsedPlanId) ? parsedPlanId : null;
  const isEdit = (editParam === "true" || editParam === "ture") && planId !== null;

  const [name,          setName]          = useState("");
  const [price,         setPrice]         = useState(0);
  const [validity,      setValidity]      = useState("30 days");
  const [maxVehicles,   setMaxVehicles]   = useState("");
  const [maxCustomers,  setMaxCustomers]  = useState("");
  const [maxDrivers, setMaxDrivers] = useState("");
  const [maxWorkEntries, setMaxWorkEntries] = useState("");
  const [managerAccess, setManagerAccess] = useState(false);
  const [pdfExportEnabled, setPdfExportEnabled] = useState(false);
  const [extraFeatures, setExtraFeatures] = useState<string[]>([]);
  const [supportLine, setSupportLine] = useState("");
  const [newFeature,    setNewFeature]    = useState("");
  const [color,         setColor]         = useState("#F5F4F0");
  const [textColor,     setTextColor]     = useState("#6B6560");
  const [badge,         setBadge]         = useState("badge-free");
  const [errors,        setErrors]        = useState<Record<string, string>>({});
  const [owners,        setOwners]        = useState(0);
  const [totalRevenue, setTotalRevenue]  = useState(0);
  const [loadingPlan,   setLoadingPlan]   = useState(false);
  const [savingPlan,    setSavingPlan]    = useState(false);
  const [apiError,      setApiError]      = useState<string | null>(null);
  const [existingPlans, setExistingPlans] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (user && user.role !== "admin") {
      router.replace("/plans");
    }
  }, [hasHydrated, user, router]);

  useEffect(() => {
    if (!isEdit || planId === null) return;

    const run = async () => {
      try {
        setLoadingPlan(true);
        setApiError(null);
        const plan = await plansApi.getOne(planId);
        setName(plan.name);
        setPrice(plan.price);
        setValidity(plan.validity);
        setMaxVehicles(plan.maxVehicles);
        setMaxCustomers(plan.maxCustomers);
        const md = plan.maxDrivers ?? "";
        setMaxDrivers(md === "0" ? "" : md);
        setMaxWorkEntries(plan.maxWorkEntries ?? "");
        setManagerAccess(plan.managerAccess);
        setPdfExportEnabled(plan.pdfExportEnabled ?? false);
        const { supportText, extras } = partitionStoredPlanFeatures(
          plan.features ?? [],
        );
        setSupportLine(supportText);
        setExtraFeatures(extras);
        setColor(plan.color);
        setTextColor(plan.textColor);
        setBadge(fromBackendBadge(plan.badge));
        setOwners(plan.owners);
        setTotalRevenue(plan.totalRevenue ?? 0);
      } catch (err) {
        setApiError(getErrorMessage(err, "Failed to load plan"));
      } finally {
        setLoadingPlan(false);
      }
    };

    void run();
  }, [isEdit, planId]);

  useEffect(() => {
    if ((editParam === "true" || editParam === "ture") && planId === null) {
      queueMicrotask(() =>
        setApiError("Invalid plan id in query."),
      );
    }
  }, [editParam, planId]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await plansApi.list({ offset: 0, limit: 1000 });
        setExistingPlans(res.data.map((plan) => ({ id: plan.id, name: plan.name })));
      } catch {
        setExistingPlans([]);
      }
    };
    void run();
  }, []);

  function applyPreset(presetName: string) {
    const p = planColorPresets.find(x => x.name === presetName);
    if (p) { setColor(p.color); setTextColor(p.textColor); setBadge(p.badge); }
  }

  function addFeature(text?: string) {
    const f = normalizeFeature(text ?? newFeature);
    if (!f || extraFeatures.some((item) => item.toLowerCase() === f.toLowerCase())) return;
    setExtraFeatures((prev) => [...prev, f]);
    if (!text) setNewFeature("");
  }

  function removeFeature(idx: number) {
    setExtraFeatures((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveFeature(idx: number, dir: -1 | 1) {
    const arr = [...extraFeatures];
    const to = idx + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    setExtraFeatures(arr);
  }

  const mergedFeatureList = useMemo(() => {
    const auto = buildAutoPlanFeatureLines({
      maxVehicles,
      maxCustomers,
      maxDrivers,
      maxWorkEntries,
      pdfExportEnabled,
      managerAccess,
    });
    const supportFeature =
      supportLine.trim().length > 0 ? formatSupportFeatureLine(supportLine) : "";
    const merged = [
      ...auto,
      ...extraFeatures.map((item) => normalizeFeature(item)),
      ...(supportFeature ? [supportFeature] : []),
    ];
    return dedupeFeatures(merged);
  }, [
    maxVehicles,
    maxCustomers,
    maxDrivers,
    maxWorkEntries,
    pdfExportEnabled,
    managerAccess,
    extraFeatures,
    supportLine,
  ]);

  const formPreview = {
    name,
    price,
    validity,
    maxVehicles,
    maxCustomers,
    maxDrivers,
    maxWorkEntries,
    managerAccess,
    pdfExportEnabled,
    features: mergedFeatureList,
    color,
    textColor,
    badge,
  };

  function validate() {
    const e: Record<string, string> = {};
    const normalizedName = name.trim();
    const duplicateName = existingPlans.some(
      (plan) =>
        plan.name.trim().toLowerCase() === normalizedName.toLowerCase() &&
        (!isEdit || plan.id !== planId),
    );
    if (!normalizedName)      e.name         = "Plan name is required";
    else if (duplicateName)   e.name         = "Plan name already exists";
    if (!Number.isFinite(price) || price < 0) e.price = "Enter a valid monthly price (₹)";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    const ok = await confirm({
      title: isEdit ? "Save plan changes?" : "Create this plan?",
      description: isEdit
        ? "Changes apply immediately for this subscription tier."
        : "The plan will appear on the Plans page for owners.",
      confirmLabel: isEdit ? "Save plan" : "Create plan",
      cancelLabel: "Cancel",
    });
    if (!ok) return;

    const payload = {
      name: name.trim(),
      price,
      validity: validity.trim(),
      maxVehicles: toBackendResourceCap(maxVehicles),
      maxCustomers: toBackendResourceCap(maxCustomers),
      maxDrivers: toBackendMaxDrivers(maxDrivers),
      maxWorkEntries: toBackendResourceCap(maxWorkEntries),
      managerAccess,
      pdfExportEnabled,
      features: mergedFeatureList,
      color,
      textColor,
      badge: toBackendBadge(badge),
    };

    try {
      setSavingPlan(true);
      setApiError(null);
      if (isEdit && planId !== null) {
        await plansApi.update(planId, payload);
      } else {
        await plansApi.create(payload);
      }
      showToast({
        title: isEdit ? "Plan updated" : "Plan created",
        variant: "success",
      });
      router.push("/plans");
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to save plan");
      setApiError(msg);
      showToast({
        title: "Could not save plan",
        message: msg,
        variant: "error",
      });
    } finally {
      setSavingPlan(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: "var(--foreground-muted)",
    display: "block", marginBottom: 5,
  };
  const errorStyle: React.CSSProperties = {
    fontSize: 11, color: "#DC2626", marginTop: 4,
    display: "flex", alignItems: "center", gap: 4,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar
        title={isEdit ? `Edit Plan` : "Create New Plan"}
        subtitle={isEdit ? `Updating plan settings and features` : "Configure a new subscription tier"}
      />

      <div style={{ padding: "28px 28px 56px" }}>

        {/* Back + title row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <button className="btn btn-ghost" style={{ gap: 7, fontSize: 13 }} onClick={() => router.push("/plans")}>
            <ArrowLeft size={14} /> Back to Plans
          </button>
        </div>
        {loadingPlan && (
          <div className="card" style={{ marginBottom: 14, padding: "18px 22px" }}>
            <LoadingUI label="Loading plan details..." />
          </div>
        )}
        {apiError && (
          <div
            className="card"
            role="alert"
            style={{
              marginBottom: 14,
              background: "var(--red-light)",
              color: "var(--red)",
              border: "1px solid rgba(220,38,38,0.18)",
              padding: "10px 12px",
              fontSize: 12.5,
            }}
          >
            {apiError}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>

          {/* ── LEFT: Form ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Basic Info */}
            <div className="card animate-fade-up stagger-1" style={{ padding: "24px 26px" }}>
              <h2 style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 16, color: "var(--foreground)", marginBottom: 4 }}>
                Basic Information
              </h2>
              <p style={{ fontSize: 12, color: "var(--foreground-subtle)", marginBottom: 20 }}>Plan name, pricing and validity settings</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

                {/* Plan Name */}
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={labelStyle}>Plan Name <span style={{ color: "#DC2626" }}>*</span></label>
                  <input className="input" placeholder="e.g. Gold, Premium, Starter…"
                    value={name} onChange={e => setName(e.target.value)}
                    style={{ borderColor: errors.name ? "#FCA5A5" : undefined }}
                  />
                  {errors.name && <p style={errorStyle}><AlertCircle size={11} />{errors.name}</p>}
                </div>

                {/* Price */}
                <div>
                  <label style={labelStyle}>Monthly price (₹) <span style={{ color: "#DC2626" }}>*</span></label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="e.g. 499"
                    value={Number.isFinite(price) ? price : 0}
                    onChange={(e) =>
                      setPrice(Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    style={{ borderColor: errors.price ? "#FCA5A5" : undefined }}
                  />
                  <p style={{ fontSize: 11, color: "var(--foreground-subtle)", marginTop: 6 }}>
                    Display: {formatPlanPriceInrPerMo(price)}
                  </p>
                  {errors.price && <p style={errorStyle}><AlertCircle size={11} />{errors.price}</p>}
                </div>

                {/* Validity */}
                <div>
                  <label style={labelStyle}>Validity</label>
                  <select className="input" style={{ cursor: "pointer" }} value={validity} onChange={e => setValidity(e.target.value)}>
                    <option>30 days</option>
                    <option>60 days</option>
                    <option>90 days</option>
                    <option>180 days</option>
                    <option>365 days</option>
                    <option>Unlimited</option>
                  </select>
                </div>

                {/* Max Vehicles */}
                <div>
                  <label style={labelStyle}>Max Vehicles</label>
                  <input
                    className="input"
                    placeholder="e.g. 5 — leave empty for Unlimited"
                    type="text"
                    inputMode="numeric"
                    value={maxVehicles}
                    onChange={(e) => setMaxVehicles(e.target.value)}
                    style={{ borderColor: errors.maxVehicles ? "#FCA5A5" : undefined }}
                  />
                  <p style={{ fontSize: 11, color: "var(--foreground-subtle)", marginTop: 6 }}>
                    Empty = unlimited vehicles.
                  </p>
                  {errors.maxVehicles && (
                    <p style={errorStyle}>
                      <AlertCircle size={11} />
                      {errors.maxVehicles}
                    </p>
                  )}
                </div>

                {/* Max Customers */}
                <div>
                  <label style={labelStyle}>Max Customers</label>
                  <input
                    className="input"
                    placeholder="e.g. 300 — leave empty for Unlimited"
                    type="text"
                    inputMode="numeric"
                    value={maxCustomers}
                    onChange={(e) => setMaxCustomers(e.target.value)}
                    style={{ borderColor: errors.maxCustomers ? "#FCA5A5" : undefined }}
                  />
                  <p style={{ fontSize: 11, color: "var(--foreground-subtle)", marginTop: 6 }}>
                    Empty = unlimited customers.
                  </p>
                  {errors.maxCustomers && (
                    <p style={errorStyle}>
                      <AlertCircle size={11} />
                      {errors.maxCustomers}
                    </p>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>Max Drivers</label>
                  <input
                    className="input"
                    placeholder="e.g. 5 or Unlimited — empty = no drivers"
                    type="text"
                    value={maxDrivers}
                    onChange={(e) => setMaxDrivers(e.target.value)}
                    style={{ borderColor: errors.maxDrivers ? "#FCA5A5" : undefined }}
                  />
                  <p style={{ fontSize: 11, color: "var(--foreground-subtle)", marginTop: 6 }}>
                    Leave empty or 0 to disable driver accounts and driver management for this plan.
                  </p>
                  {errors.maxDrivers && (
                    <p style={errorStyle}>
                      <AlertCircle size={11} />
                      {errors.maxDrivers}
                    </p>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>Max Work Entries</label>
                  <input
                    className="input"
                    placeholder="e.g. 500 — leave empty for Unlimited"
                    type="text"
                    value={maxWorkEntries}
                    onChange={(e) => setMaxWorkEntries(e.target.value)}
                    style={{ borderColor: errors.maxWorkEntries ? "#FCA5A5" : undefined }}
                  />
                  <p style={{ fontSize: 11, color: "var(--foreground-subtle)", marginTop: 6 }}>
                    Total job rows per owner. Empty = unlimited.
                  </p>
                  {errors.maxWorkEntries && (
                    <p style={errorStyle}>
                      <AlertCircle size={11} />
                      {errors.maxWorkEntries}
                    </p>
                  )}
                </div>

                <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#FAFAF8", borderRadius: 10, border: "1px solid var(--card-border)" }}>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--foreground)" }}>PDF work entries export</p>
                    <p style={{ fontSize: 11.5, color: "var(--foreground-subtle)", marginTop: 2 }}>Allow downloading work entries as PDF from the Work Entries page</p>
                  </div>
                  <Toggle value={pdfExportEnabled} onChange={setPdfExportEnabled} />
                </div>

                {/* Manager Access Toggle */}
                <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#FAFAF8", borderRadius: 10, border: "1px solid var(--card-border)" }}>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--foreground)" }}>Manager Access</p>
                    <p style={{ fontSize: 11.5, color: "var(--foreground-subtle)", marginTop: 2 }}>Allow owners on this plan to add sub-managers</p>
                  </div>
                  <Toggle value={managerAccess} onChange={setManagerAccess} />
                </div>

              </div>
            </div>

            {/* Features */}
            <div className="card animate-fade-up stagger-2" style={{ padding: "24px 26px" }}>
              <h2 style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 16, color: "var(--foreground)", marginBottom: 4 }}>
                Plan Features
              </h2>
              <p style={{ fontSize: 12, color: "var(--foreground-subtle)", marginBottom: 16 }}>
                Lines from limits and toggles above are included automatically. Add support text and any extra bullets below.
              </p>

              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                From limits &amp; options
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {buildAutoPlanFeatureLines({
                  maxVehicles,
                  maxCustomers,
                  maxDrivers,
                  maxWorkEntries,
                  pdfExportEnabled,
                  managerAccess,
                }).map((f, i) => {
                  const Icon = getFeatureIcon(f);
                  return (
                    <div
                      key={`auto-${i}-${f}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        background: "#F4F4F1",
                        borderRadius: 10,
                        border: "1px dashed var(--card-border)",
                      }}
                    >
                      <Icon size={14} style={{ color: "#64748B", flexShrink: 0 }} strokeWidth={2} />
                      <span style={{ flex: 1, fontSize: 13, color: "var(--foreground-muted)", fontWeight: 500 }}>
                        {f}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--foreground-subtle)", textTransform: "uppercase" }}>
                        Auto
                      </span>
                    </div>
                  );
                })}
              </div>

              <label style={labelStyle}>Support (optional)</label>
              <input
                className="input"
                placeholder="e.g. Email 9am–6pm, Priority phone…"
                value={supportLine}
                onChange={(e) => setSupportLine(e.target.value)}
                style={{ marginBottom: 18 }}
              />
              <p style={{ fontSize: 11, color: "var(--foreground-subtle)", marginTop: -12, marginBottom: 18 }}>
                Shown in the plan comparison table when filled. Saved as a Support line on the plan.
              </p>

              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                Additional features
              </p>
              {extraFeatures.length === 0 ? (
                <div style={{ padding: "18px", textAlign: "center", background: "#FAFAF8", borderRadius: 10, border: "1px dashed var(--card-border)", marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: "var(--foreground-subtle)" }}>
                    No extra lines yet. Use Add below for custom bullets (e.g. fuel logs, analytics).
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {extraFeatures.map((f, i) => {
                    const Icon = getFeatureIcon(f);
                    return (
                      <div
                        key={`${f}-${i}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 14px",
                          background: "#FAFAF8",
                          borderRadius: 10,
                          border: "1px solid var(--card-border)",
                        }}
                      >
                        <Icon size={14} style={{ color: "#059669", flexShrink: 0 }} strokeWidth={2} />
                        <span style={{ flex: 1, fontSize: 13, color: "var(--foreground)", fontWeight: 500 }}>{f}</span>
                        <div style={{ display: "flex", gap: 3 }}>
                          <button
                            type="button"
                            onClick={() => moveFeature(i, -1)}
                            disabled={i === 0}
                            style={{
                              padding: "3px 6px",
                              borderRadius: 6,
                              border: "1px solid var(--card-border)",
                              background: "white",
                              cursor: i === 0 ? "not-allowed" : "pointer",
                              fontSize: 11,
                              color: "var(--foreground-subtle)",
                              opacity: i === 0 ? 0.4 : 1,
                            }}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveFeature(i, 1)}
                            disabled={i === extraFeatures.length - 1}
                            style={{
                              padding: "3px 6px",
                              borderRadius: 6,
                              border: "1px solid var(--card-border)",
                              background: "white",
                              cursor: i === extraFeatures.length - 1 ? "not-allowed" : "pointer",
                              fontSize: 11,
                              color: "var(--foreground-subtle)",
                              opacity: i === extraFeatures.length - 1 ? 0.4 : 1,
                            }}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFeature(i)}
                            style={{
                              padding: "3px 7px",
                              borderRadius: 6,
                              border: "1px solid #FCA5A5",
                              background: "#FEF2F2",
                              cursor: "pointer",
                              color: "#DC2626",
                              fontSize: 11,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginBottom: 0 }}>
                <input
                  className="input"
                  placeholder="Type a custom feature…"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addFeature()}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ gap: 5, fontSize: 13, padding: "0 16px" }}
                  onClick={() => addFeature()}
                >
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>

            {/* Appearance */}
            <div className="card animate-fade-up stagger-3" style={{ padding: "24px 26px" }}>
              <h2 style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 16, color: "var(--foreground)", marginBottom: 4 }}>
                Appearance
              </h2>
              <p style={{ fontSize: 12, color: "var(--foreground-subtle)", marginBottom: 20 }}>Choose a color theme for the plan badge and card</p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                {planColorPresets.map(p => (
                  <button key={p.name} onClick={() => applyPreset(p.name)} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
                    borderRadius: 10, border: `2px solid ${p.color === color ? "var(--amber)" : "var(--card-border)"}`,
                    background: p.color, cursor: "pointer", transition: "all 0.15s",
                    boxShadow: p.color === color ? "0 0 0 3px rgba(245,158,11,0.15)" : "none",
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: p.textColor }}>{p.name}</span>
                    {p.color === color && <CheckCircle2 size={12} style={{ color: "var(--amber)" }} />}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Card Background Color</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="color" value={color} onChange={e => setColor(e.target.value)}
                      style={{ width: 38, height: 38, borderRadius: 8, border: "1px solid var(--card-border)", cursor: "pointer", padding: 2, background: "white" }} />
                    <input className="input" value={color} onChange={e => setColor(e.target.value)} style={{ flex: 1, fontFamily: "monospace", fontSize: 12 }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Icon / Text Color</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)}
                      style={{ width: 38, height: 38, borderRadius: 8, border: "1px solid var(--card-border)", cursor: "pointer", padding: 2, background: "white" }} />
                    <input className="input" value={textColor} onChange={e => setTextColor(e.target.value)} style={{ flex: 1, fontFamily: "monospace", fontSize: 12 }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Save button row */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => router.push("/plans")}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ gap: 7, fontSize: 14, padding: "10px 24px", opacity: savingPlan ? 0.7 : 1 }}
                onClick={() => void handleSave()}
                disabled={savingPlan || loadingPlan}
              >
                <Save size={15} />
                {isEdit ? "Save Changes" : "Create Plan"}
              </button>
            </div>

          </div>

          {/* ── RIGHT: Preview ── */}
          <div style={{ position: "sticky", top: 80, display: "flex", flexDirection: "column", gap: 16 }}>
            <PlanPreviewCard form={formPreview} />

            {isEdit && (
              <div style={{ background: "rgba(245,158,11,0.06)", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(245,158,11,0.15)" }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--amber-dark)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Current Stats
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Active Owners", value: String(owners), icon: Users },
                    { label: "Total collected", value: formatCollectedRevenueInr(totalRevenue), icon: IndianRupee },
                    { label: "Validity", value: validity, icon: Clock },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Icon size={12} style={{ color: "var(--amber)" }} />
                        <span style={{ fontSize: 12, color: "var(--foreground-muted)" }}>{label}</span>
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--foreground)" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: "#FAFAF8", borderRadius: 12, padding: "14px 16px", border: "1px solid var(--card-border)" }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--foreground-subtle)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Tips
              </p>
              <ul style={{ margin: 0, padding: "0 0 0 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  "Limits & toggles sync into the feature list automatically",
                  "Use ↑↓ to reorder additional features only",
                  "Press Enter to add a typed feature",
                  "Live preview matches what owners will see",
                ].map((tip) => (
                  <li key={tip} style={{ fontSize: 11.5, color: "var(--foreground-subtle)", lineHeight: 1.5 }}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>

      {savingPlan && (
        <LoadingUI
          overlay
          label={isEdit ? "Saving plan..." : "Creating plan..."}
        />
      )}
    </div>
  );
}

/* ─── Page (Suspense boundary for useSearchParams) ─── */
export default function EditPlanPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--background)" }} />}>
      <EditPlanForm />
    </Suspense>
  );
}
