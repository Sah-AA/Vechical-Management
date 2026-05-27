"use client";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Navbar from "../../components/Navbar";
import { api, getErrorMessage } from "../../lib/api/client";
import { authApi } from "../../lib/api/auth";
import { useToast } from "../../components/ui/ToastProvider";
import { parseSettingsProfileForm } from "../../lib/validation/settingsProfile";
import {
  notificationsApi,
  NotifySegment,
  BulkNotifyResult,
} from "../../lib/api/notifications";
import {
  systemSettingsApi,
  systemAssetUrl,
} from "../../lib/api/system-settings";
import { useBranding } from "../../lib/branding/BrandingContext";
import {
  User,
  Bell,
  Shield,
  Globe,
  Save,
  Upload,
  Eye,
  EyeOff,
  Check,
  Smartphone,
  Tractor,
  X,
  Send,
  Users,
  Crown,
  Clock,
  UserX,
  Zap,
  Megaphone,
  CheckCircle,
} from "lucide-react";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Megaphone },
  { id: "platform", label: "Platform", icon: Globe },
];

/* ─── Shared helpers ─── */
function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 99,
        border: "none",
        cursor: "pointer",
        background: value ? "var(--amber)" : "#D4CFC8",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: value ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: 99,
          background: "white",
          transition: "left 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
        }}
      />
    </button>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: "24px" }}>
      <div
        style={{
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: "1px solid var(--card-border)",
        }}
      >
        <h3
          style={{
            fontFamily: "Syne,sans-serif",
            fontWeight: 700,
            fontSize: 15,
            color: "var(--foreground)",
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            style={{
              fontSize: 12,
              color: "var(--foreground-subtle)",
              marginTop: 3,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.5fr",
        gap: 20,
        alignItems: "center",
        padding: "12px 0",
        borderBottom: "1px solid #F0EEE9",
      }}
    >
      <div>
        <p
          style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}
        >
          {label}
        </p>
        {hint && (
          <p
            style={{
              fontSize: 11.5,
              color: "var(--foreground-subtle)",
              marginTop: 2,
            }}
          >
            {hint}
          </p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: "1px solid #F0EEE9",
      }}
    >
      <div>
        <p
          style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}
        >
          {label}
        </p>
        {hint && (
          <p
            style={{
              fontSize: 11.5,
              color: "var(--foreground-subtle)",
              marginTop: 2,
            }}
          >
            {hint}
          </p>
        )}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

/* ─── Profile Tab ─── */
type SettingsProfile = {
  id: number;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  business?: string | null;
  address: string;
  state: string;
  pincode: string;
  role: "owner" | "admin" | "manager";
  twoFactorEnabled?: boolean;
};

function ProfileTab({
  profile,
  saving,
  onSave,
}: {
  profile: SettingsProfile | null;
  saving: boolean;
  onSave: (payload: {
    name: string;
    phone: string;
    businessName: string;
    address: string;
    state: string;
    pincode: string;
  }) => Promise<void>;
}) {
  const isManager = profile?.role === "manager";
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    businessName: "",
    address: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name ?? "",
      phone: profile.phone ?? "",
      businessName: profile.businessName ?? "",
      address: profile.address ?? "",
      state: profile.state ?? "",
      pincode: profile.pincode ?? "",
    });
  }, [profile]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Section
        title={isManager ? "Manager Profile" : "Admin Profile"}
        subtitle={
          isManager
            ? "Update your manager account details"
            : "Update your admin account details"
        }
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 18,
              background: "var(--amber)",
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
            {(form.name || profile?.name || "A").charAt(0).toUpperCase()}
          </div>
          <div>
            <p
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--foreground)",
                marginBottom: 6,
              }}
            >
              {isManager ? "Manager Avatar" : "Admin Avatar"}
            </p>
            <p style={{ fontSize: 11.5, color: "var(--foreground-subtle)" }}>
              Profile photo upload will be enabled later.
            </p>
          </div>
        </div>

        <FieldRow label="Full Name" hint="Your display name on the panel">
          <input
            className="input"
            value={form.name}
            disabled={saving || !profile}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </FieldRow>

        <FieldRow label="Email" hint="Used for login and notifications">
          <input className="input" value={profile?.email ?? ""} disabled />
        </FieldRow>

        <FieldRow
          label="Mobile"
          hint={isManager ? "Manager contact number" : "Admin contact number"}
        >
          <input
            className="input"
            value={form.phone}
            disabled={saving || !profile}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </FieldRow>

        {!isManager && (
          <>
            <FieldRow label="Organisation" hint="Your organisation name">
              <input
                className="input"
                value={form.businessName}
                disabled={saving || !profile}
                onChange={(e) =>
                  setForm((f) => ({ ...f, businessName: e.target.value }))
                }
              />
            </FieldRow>

            <FieldRow label="Address" hint="Business address">
              <input
                className="input"
                value={form.address}
                disabled={saving || !profile}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
              />
            </FieldRow>

            <FieldRow label="State" hint="State or region">
              <input
                className="input"
                value={form.state}
                disabled={saving || !profile}
                onChange={(e) =>
                  setForm((f) => ({ ...f, state: e.target.value }))
                }
              />
            </FieldRow>

            <FieldRow label="Pincode" hint="Postal code">
              <input
                className="input"
                value={form.pincode}
                disabled={saving || !profile}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pincode: e.target.value }))
                }
              />
            </FieldRow>
          </>
        )}

        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}
        >
          <button
            className="btn btn-primary"
            disabled={saving || !profile}
            onClick={() => {
              const parsed = parseSettingsProfileForm(form, {
                isManager: !!isManager,
              });
              if (!parsed.success) {
                const msg =
                  parsed.formError ??
                  Object.values(parsed.fieldErrors).filter(Boolean).join(" ");
                void showToast({
                  title: "Please fix profile fields",
                  message: msg || "Invalid input",
                  variant: "error",
                });
                return;
              }
              void onSave(parsed.data);
            }}
          >
            <Save size={14} /> Save Profile
          </button>
        </div>
      </Section>
    </div>
  );
}

/* ─── Security Tab ─── */
function SecurityTab({
  profile,
  saving,
  onUpdatePassword,
  onToggleTwoFactor,
}: {
  profile: SettingsProfile | null;
  saving: boolean;
  onUpdatePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  onToggleTwoFactor: (enabled: boolean) => Promise<void>;
}) {
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [twoFA, setTwoFA] = useState(Boolean(profile?.twoFactorEnabled));
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setTwoFA(Boolean(profile?.twoFactorEnabled));
  }, [profile?.twoFactorEnabled]);

  const sessions = [
    {
      device: "Chrome · Windows 10",
      location: "Ahmedabad, India",
      time: "Active now",
      current: true,
    },
    {
      device: "Safari · iPhone 15",
      location: "Surat, India",
      time: "2 hours ago",
      current: false,
    },
    {
      device: "Firefox · Ubuntu",
      location: "Rajkot, India",
      time: "Yesterday",
      current: false,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Section
        title="Change Password"
        subtitle="Keep your admin account secure"
      >
        <FieldRow label="Current Password">
          <div style={{ position: "relative" }}>
            <input
              className="input"
              type={showOld ? "text" : "password"}
              placeholder="••••••••"
              style={{ paddingRight: 36 }}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={saving || !profile}
            />
            <button
              onClick={() => setShowOld((v) => !v)}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--foreground-subtle)",
                display: "flex",
              }}
            >
              {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </FieldRow>

        <FieldRow label="New Password" hint="Min 6 characters">
          <div style={{ position: "relative" }}>
            <input
              className="input"
              type={showNew ? "text" : "password"}
              placeholder="••••••••"
              style={{ paddingRight: 36 }}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={saving || !profile}
            />
            <button
              onClick={() => setShowNew((v) => !v)}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--foreground-subtle)",
                display: "flex",
              }}
            >
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </FieldRow>

        <FieldRow label="Confirm Password">
          <div style={{ position: "relative" }}>
            <input
              className="input"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              style={{ paddingRight: 36 }}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={saving || !profile}
            />
            <button
              onClick={() => setShowConfirm((v) => !v)}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--foreground-subtle)",
                display: "flex",
              }}
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </FieldRow>

        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}
        >
          <button
            className="btn btn-primary"
            disabled={saving || !profile}
            onClick={async () => {
              if (newPassword.length < 6) return;
              if (newPassword !== confirmPassword) return;
              await onUpdatePassword(currentPassword, newPassword);
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            }}
          >
            <Save size={14} /> Update Password
          </button>
        </div>
      </Section>

      {profile?.role !== "manager" && (
        <Section
          title="Two-Factor Authentication"
          subtitle="Add an extra layer of security to your account"
        >
          <ToggleRow
            label="Enable 2FA (OTP via Email)"
            hint="You'll be asked for an OTP after password login"
            value={twoFA}
            onChange={async (next) => {
              setTwoFA(next);
              await onToggleTwoFactor(next);
            }}
          />
          {twoFA && (
            <div
              style={{
                marginTop: 16,
                padding: "14px 16px",
                background: "rgba(5,150,105,0.06)",
                border: "1px solid rgba(5,150,105,0.15)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Check size={15} style={{ color: "#059669", flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "#065F46" }}>
                2FA is active. OTP will be sent to your registered email on
                login.
              </p>
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

/* ─── Platform Tab (includes Logo & Favicon) ─── */
function PlatformTab() {
  const { showToast } = useToast();
  const { refresh: refreshBranding } = useBranding();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFav, setUploadingFav] = useState(false);

  const [appName, setAppName] = useState("JCB Admin Panel");
  const [supportPhone, setSupportPhone] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [trialDays, setTrialDays] = useState("7");
  const [autoExpiry, setAutoExpiry] = useState(true);
  const [maintenance, setMaintenance] = useState(false);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    systemSettingsApi
      .getAdmin()
      .then((row) => {
        if (cancelled) return;
        setAppName(row.appName);
        setSupportPhone(row.supportPhone);
        setSupportEmail(row.supportEmail);
        setTrialDays(String(row.freeTrialDays));
        setAutoExpiry(row.autoExpirePlans);
        setMaintenance(row.maintenanceMode);
        setLogoPreview(systemAssetUrl(row.logoPath));
        setFaviconPreview(systemAssetUrl(row.faviconPath));
      })
      .catch((err) => {
        if (!cancelled) {
          showToast({
            title: "Could not load platform settings",
            message: getErrorMessage(err, ""),
            variant: "error",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  function validateImageFile(file: File): string | null {
    if (file.size > 5 * 1024 * 1024) return "File must be 5 MB or smaller.";
    if (file.type === "image/gif") return "GIF files are not allowed.";
    if (file.type.startsWith("video/")) return "Video files are not allowed.";
    const okMime = [
      "image/png",
      "image/jpeg",
      "image/svg+xml",
      "image/webp",
      "image/x-icon",
      "image/vnd.microsoft.icon",
    ].includes(file.type);
    const okExt = /\.(png|jpe?g|svg|webp|ico)$/i.test(file.name);
    if (!okMime && !okExt)
      return "Allowed: PNG, JPEG, SVG, WEBP, ICO (no GIF).";
    return null;
  }

  async function saveConfig() {
    const days = parseInt(trialDays, 10);
    if (Number.isNaN(days) || days < 0) {
      showToast({ title: "Enter a valid number of days", variant: "error" });
      return;
    }
    setSaving(true);
    try {
      await systemSettingsApi.update({
        appName: appName.trim(),
        supportPhone: supportPhone.trim(),
        supportEmail: supportEmail.trim(),
        freeTrialDays: days,
        autoExpirePlans: autoExpiry,
        maintenanceMode: maintenance,
      });
      await refreshBranding();
      showToast({ title: "Configuration saved", variant: "success" });
    } catch (err) {
      showToast({
        title: "Save failed",
        message: getErrorMessage(err, ""),
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function onLogoFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const err = validateImageFile(file);
    if (err) {
      showToast({ title: err, variant: "error" });
      return;
    }
    setUploadingLogo(true);
    try {
      const row = await systemSettingsApi.uploadLogo(file);
      setLogoPreview(systemAssetUrl(row.logoPath));
      await refreshBranding();
      showToast({ title: "Logo updated", variant: "success" });
    } catch (err) {
      showToast({
        title: "Upload failed",
        message: getErrorMessage(err, ""),
        variant: "error",
      });
    } finally {
      setUploadingLogo(false);
    }
  }

  async function onFaviconFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const err = validateImageFile(file);
    if (err) {
      showToast({ title: err, variant: "error" });
      return;
    }
    setUploadingFav(true);
    try {
      const row = await systemSettingsApi.uploadFavicon(file);
      setFaviconPreview(systemAssetUrl(row.faviconPath));
      await refreshBranding();
      showToast({ title: "Favicon updated", variant: "success" });
    } catch (err) {
      showToast({
        title: "Upload failed",
        message: getErrorMessage(err, ""),
        variant: "error",
      });
    } finally {
      setUploadingFav(false);
    }
  }

  async function removeLogo() {
    try {
      await systemSettingsApi.update({ clearLogo: true });
      setLogoPreview(null);
      await refreshBranding();
      showToast({ title: "Logo removed", variant: "success" });
    } catch (err) {
      showToast({
        title: "Could not remove logo",
        message: getErrorMessage(err, ""),
        variant: "error",
      });
    }
  }

  async function removeFavicon() {
    try {
      await systemSettingsApi.update({ clearFavicon: true });
      setFaviconPreview(null);
      await refreshBranding();
      showToast({ title: "Favicon removed", variant: "success" });
    } catch (err) {
      showToast({
        title: "Could not remove favicon",
        message: getErrorMessage(err, ""),
        variant: "error",
      });
    }
  }

  if (loading) {
    return (
      <div
        className="card"
        style={{
          padding: 40,
          textAlign: "center",
          color: "var(--foreground-muted)",
        }}
      >
        Loading platform settings…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── App Configuration ── */}
      <Section
        title="App Configuration"
        subtitle="Global settings for the platform"
      >
        <FieldRow
          label="App Name"
          hint="Displayed in the sidebar and browser tab"
        >
          <input
            className="input"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
          />
        </FieldRow>
        <FieldRow
          label="Support Phone"
          hint="Shown to users on billing/plan pages"
        >
          <input
            className="input"
            value={supportPhone}
            onChange={(e) => setSupportPhone(e.target.value)}
          />
        </FieldRow>
        <FieldRow label="Support Email" hint="Forwarded to admin inbox">
          <input
            type="email"
            className="input"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
          />
        </FieldRow>
      
        <p
          style={{
            fontSize: 11.5,
            color: "var(--foreground-subtle)",
            marginTop: -4,
            marginBottom: 0,
          }}
        >
          Logo & favicon uploads: max 5 MB; PNG, JPEG, SVG, WEBP, ICO only — no
          GIF or video.
        </p>
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}
        >
          <button
            type="button"
            className="btn btn-primary"
            disabled={saving}
            onClick={() => void saveConfig()}
          >
            <Save size={14} /> {saving ? "Saving…" : "Save Config"}
          </button>
        </div>
      </Section>

      {/* ── Logo & Favicon ── */}
      <Section
        title="Logo & Favicon"
        subtitle="Customise the app icon shown in the sidebar and browser tabs"
      >
        {/* Hidden file inputs */}
        <input
          ref={logoRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg,.webp,.ico,image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon,image/vnd.microsoft.icon"
          style={{ display: "none" }}
          onChange={onLogoFile}
        />
        <input
          ref={faviconRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg,.webp,.ico,image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon,image/vnd.microsoft.icon"
          style={{ display: "none" }}
          onChange={onFaviconFile}
        />

        {/* Live sidebar preview */}
        <div
          style={{
            marginBottom: 20,
            padding: "16px",
            background: "#FAFAF8",
            borderRadius: 12,
            border: "1px solid var(--card-border)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--foreground-subtle)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 12,
            }}
          >
            Live Preview
          </p>
          <div
            style={{
              display: "flex",
              gap: 20,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            {/* Sidebar logo preview */}
            <div
              style={{
                borderRadius: 12,
                background: "linear-gradient(180deg,#212121 0%,#1A1A1A 100%)",
                border: "1px solid rgba(245,158,11,0.15)",
                padding: "14px 18px",
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  flexShrink: 0,
                  background: logoPreview
                    ? "transparent"
                    : "linear-gradient(135deg,#F59E0B,#D97706)",
                  boxShadow: "0 3px 12px rgba(245,158,11,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="logo"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Tractor size={18} color="#111" strokeWidth={2.5} />
                )}
              </div>
              <div>
                <p
                  style={{
                    color: "#fff",
                    fontFamily: "Syne,sans-serif",
                    fontWeight: 800,
                    fontSize: 14,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                  }}
                >
                  {appName.split(" ")[0]}{" "}
                  <span style={{ color: "#F59E0B" }}>
                    {appName.split(" ").slice(1).join(" ")}
                  </span>
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 3,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#22C55E",
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      color: "#9CA3AF",
                      fontSize: 9.5,
                      letterSpacing: "0.06em",
                    }}
                  >
                    MANAGEMENT PANEL
                  </span>
                </div>
              </div>
            </div>

            {/* Browser tab preview */}
            <div
              style={{
                borderRadius: 10,
                background: "#E8E6E1",
                border: "1px solid #D4CFC8",
                padding: "8px 14px",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                minWidth: 220,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  background: faviconPreview
                    ? "transparent"
                    : "linear-gradient(135deg,#F59E0B,#D97706)",
                  flexShrink: 0,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {faviconPreview ? (
                  <img
                    src={faviconPreview}
                    alt="fav"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Tractor size={10} color="#111" strokeWidth={3} />
                )}
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: "#4B4540",
                  fontFamily: "DM Sans,sans-serif",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 180,
                }}
              >
                {appName} — JCB Management
              </span>
            </div>
          </div>
        </div>

        {/* Logo upload row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "14px 0",
            borderBottom: "1px solid #F0EEE9",
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 16,
              flexShrink: 0,
              background: logoPreview
                ? "transparent"
                : "linear-gradient(135deg,#F59E0B,#D97706)",
              boxShadow: "0 3px 14px rgba(245,158,11,0.30)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              border: "2px solid rgba(245,158,11,0.2)",
            }}
          >
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Tractor size={26} color="#111" strokeWidth={2.5} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--foreground)",
                marginBottom: 3,
              }}
            >
              App Logo
              {logoPreview && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    color: "#059669",
                    fontWeight: 500,
                  }}
                >
                  · Custom logo active
                </span>
              )}
            </p>
            <p
              style={{
                fontSize: 11.5,
                color: "var(--foreground-subtle)",
                marginBottom: 10,
              }}
            >
              Sidebar header icon. Square PNG/SVG with transparent background
              recommended (80×80px).
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ fontSize: 12.5, gap: 6 }}
                disabled={uploadingLogo}
                onClick={() => logoRef.current?.click()}
              >
                <Upload size={13} />
                {uploadingLogo
                  ? "Uploading…"
                  : logoPreview
                    ? "Replace Logo"
                    : "Upload Logo"}
              </button>
              {logoPreview && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{
                    fontSize: 12.5,
                    gap: 6,
                    color: "#DC2626",
                    borderColor: "#FCA5A5",
                  }}
                  onClick={() => void removeLogo()}
                >
                  <X size={13} /> Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Favicon upload row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "14px 0",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              flexShrink: 0,
              background: faviconPreview
                ? "transparent"
                : "linear-gradient(135deg,#F59E0B,#D97706)",
              boxShadow: "0 3px 12px rgba(245,158,11,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              border: "2px solid rgba(245,158,11,0.2)",
            }}
          >
            {faviconPreview ? (
              <img
                src={faviconPreview}
                alt="Favicon"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Tractor size={20} color="#111" strokeWidth={2.5} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--foreground)",
                marginBottom: 3,
              }}
            >
              Favicon
              {faviconPreview && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    color: "#059669",
                    fontWeight: 500,
                  }}
                >
                  · Custom favicon active
                </span>
              )}
            </p>
            <p
              style={{
                fontSize: 11.5,
                color: "var(--foreground-subtle)",
                marginBottom: 10,
              }}
            >
              Shown in browser tabs and bookmarks. ICO or 32×32 PNG recommended.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ fontSize: 12.5, gap: 6 }}
                disabled={uploadingFav}
                onClick={() => faviconRef.current?.click()}
              >
                <Upload size={13} />
                {uploadingFav
                  ? "Uploading…"
                  : faviconPreview
                    ? "Replace Favicon"
                    : "Upload Favicon"}
              </button>
              {faviconPreview && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{
                    fontSize: 12.5,
                    gap: 6,
                    color: "#DC2626",
                    borderColor: "#FCA5A5",
                  }}
                  onClick={() => void removeFavicon()}
                >
                  <X size={13} /> Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Supported Languages ── */}
      <Section
        title="Supported Languages"
        subtitle="Languages available to app users"
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,1fr)",
            gap: 10,
            marginTop: 4,
          }}
        >
          {[
            { lang: "English", code: "EN" },
            { lang: "Gujarati", code: "GU" },
            { lang: "Hindi", code: "HI" },
            { lang: "Marathi", code: "MR" },
          ].map(({ lang, code }) => (
            <div
              key={lang}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                background: "#FAFAF8",
                borderRadius: 10,
                border: "1px solid var(--card-border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "var(--amber-glow)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--amber-dark)",
                    fontFamily: "Syne,sans-serif",
                  }}
                >
                  {code}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--foreground)",
                  }}
                >
                  {lang}
                </span>
              </div>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#059669",
                  background: "var(--emerald-light)",
                  padding: "2px 8px",
                  borderRadius: 99,
                }}
              >
                Active
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ─── Bulk Notifications Tab ─── */
type SegmentOption = {
  id: NotifySegment;
  label: string;
  hint: string;
  icon: React.ElementType;
  color: string;
  showDays?: boolean;
};

const SEGMENTS: SegmentOption[] = [
  {
    id: "all",
    label: "All Owners",
    hint: "Send to every registered owner — system-wide announcement.",
    icon: Users,
    color: "#2563EB",
  },
  {
    id: "free_tier",
    label: "Free Tier Users",
    hint: "Owners currently on a free plan — great for upgrade nudges.",
    icon: Crown,
    color: "#D97706",
  },
  {
    id: "never_paid",
    label: "Never Paid",
    hint: "Owners who have never purchased any paid plan.",
    icon: UserX,
    color: "#DC2626",
  },
  {
    id: "inactive",
    label: "Inactive Users",
    hint: "Owners who haven't been active for a set number of days.",
    icon: Clock,
    color: "#7C3AED",
    showDays: true,
  },
  {
    id: "paid_active",
    label: "Paid Active",
    hint: "Owners with an active paid subscription.",
    icon: Zap,
    color: "#059669",
  },
  {
    id: "expired",
    label: "Expired Subscriptions",
    hint: "Owners whose subscription has expired — re-engagement.",
    icon: Clock,
    color: "#DC2626",
  },
];

function BulkNotifyTab() {
  const { showToast } = useToast();
  const [segment, setSegment] = useState<NotifySegment>("all");
  const [inactiveDays, setInactiveDays] = useState(30);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<BulkNotifyResult | null>(null);

  const selectedSeg = SEGMENTS.find((s) => s.id === segment)!;

  async function handleSend() {
    if (!title.trim()) {
      showToast({ title: "Title is required", variant: "error" });
      return;
    }
    if (!message.trim()) {
      showToast({ title: "Message is required", variant: "error" });
      return;
    }

    setSending(true);
    setLastResult(null);
    try {
      const res = await notificationsApi.bulkNotify({
        title: title.trim(),
        message: message.trim(),
        segment,
        ...(segment === "inactive" ? { inactiveDays } : {}),
      });
      setLastResult(res);
      showToast({
        title: "Notification sent!",
        message: res.message,
        variant: "success",
      });
      setTitle("");
      setMessage("");
    } catch (err) {
      showToast({
        title: "Failed to send",
        message: getErrorMessage(err, "Could not send notification"),
        variant: "error",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Segment picker */}
      <Section
        title="Target Audience"
        subtitle="Choose which group of users will receive this notification"
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 10,
            paddingTop: 4,
          }}
        >
          {SEGMENTS.map((seg) => {
            const active = segment === seg.id;
            return (
              <button
                key={seg.id}
                onClick={() => setSegment(seg.id)}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1.5px solid ${active ? seg.color : "var(--card-border)"}`,
                  background: active ? seg.color + "14" : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      background: seg.color + "20",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <seg.icon size={13} color={seg.color} strokeWidth={2.2} />
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: active ? seg.color : "var(--foreground)",
                    }}
                  >
                    {seg.label}
                  </span>
                  {active && (
                    <CheckCircle
                      size={13}
                      color={seg.color}
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </div>
                <p
                  style={{
                    fontSize: 11.5,
                    color: "var(--foreground-subtle)",
                    lineHeight: 1.45,
                    margin: 0,
                  }}
                >
                  {seg.hint}
                </p>
              </button>
            );
          })}
        </div>

        {/* Inactive days slider */}
        {selectedSeg.showDays && (
          <div
            style={{
              marginTop: 16,
              padding: "14px 16px",
              background: "#F8F7F4",
              borderRadius: 10,
              border: "1px solid var(--card-border)",
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
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--foreground)",
                }}
              >
                Inactive for at least
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#7C3AED" }}>
                {inactiveDays} days
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={180}
              value={inactiveDays}
              onChange={(e) => setInactiveDays(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#7C3AED" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "var(--foreground-subtle)",
                marginTop: 2,
              }}
            >
              <span>1 day</span>
              <span>180 days</span>
            </div>
          </div>
        )}
      </Section>

      {/* Compose */}
      <Section
        title="Compose Notification"
        subtitle="Write the notification that will appear in the app and as a push notification"
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            paddingTop: 4,
          }}
        >
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--foreground-subtle)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="e.g. Upgrade now and get 20% off!"
              style={{
                width: "100%",
                marginTop: 6,
                padding: "9px 12px",
                fontSize: 13.5,
                borderRadius: 8,
                border: "1.5px solid var(--card-border)",
                background: "var(--input-bg)",
                color: "var(--foreground)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <p
              style={{
                fontSize: 11,
                color: "var(--foreground-subtle)",
                marginTop: 3,
                textAlign: "right",
              }}
            >
              {title.length}/80
            </p>
          </div>

          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--foreground-subtle)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={300}
              rows={4}
              placeholder="e.g. We noticed you're on the free plan. Upgrade to Gold to unlock unlimited entries, PDF exports, and priority support."
              style={{
                width: "100%",
                marginTop: 6,
                padding: "9px 12px",
                fontSize: 13.5,
                borderRadius: 8,
                border: "1.5px solid var(--card-border)",
                background: "var(--input-bg)",
                color: "var(--foreground)",
                outline: "none",
                boxSizing: "border-box",
                resize: "vertical",
                fontFamily: "inherit",
                lineHeight: 1.5,
              }}
            />
            <p
              style={{
                fontSize: 11,
                color: "var(--foreground-subtle)",
                marginTop: 3,
                textAlign: "right",
              }}
            >
              {message.length}/300
            </p>
          </div>

          {/* Preview badge */}
          {(title || message) && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                border: "1.5px solid var(--card-border)",
                background: "#FAFAF8",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: "var(--foreground-subtle)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 8,
                }}
              >
                Preview
              </p>
              <div
                style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "var(--amber-glow)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Bell size={16} color="var(--amber-dark)" />
                </span>
                <div>
                  <p
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: "var(--foreground)",
                      margin: 0,
                    }}
                  >
                    {title || "Notification title"}
                  </p>
                  <p
                    style={{
                      fontSize: 12.5,
                      color: "var(--foreground-muted)",
                      margin: "3px 0 0",
                      lineHeight: 1.5,
                    }}
                  >
                    {message || "Notification body…"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Send button */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              paddingTop: 4,
            }}
          >
            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !message.trim()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 22px",
                borderRadius: 9,
                border: "none",
                cursor: sending ? "not-allowed" : "pointer",
                background:
                  !title.trim() || !message.trim() ? "#E5E3DE" : "var(--amber)",
                color:
                  !title.trim() || !message.trim()
                    ? "#9CA3AF"
                    : "var(--amber-contrast)",
                fontSize: 14,
                fontWeight: 700,
                transition: "all 0.15s",
              }}
            >
              <Send size={14} />
              {sending ? "Sending…" : `Send to ${selectedSeg.label}`}
            </button>

            {lastResult && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12.5,
                  color: "#059669",
                }}
              >
                <CheckCircle size={14} />
                {lastResult.usersTargeted} user(s) notified ·{" "}
                {lastResult.pushTokens} push token(s) reached
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Quick templates */}
      <Section
        title="Quick Templates"
        subtitle="Click to pre-fill — then customise before sending"
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 10,
            paddingTop: 4,
          }}
        >
          {[
            {
              title: "Server Maintenance",
              message:
                "We will be performing scheduled server maintenance on [date] from [time] to [time]. The app may be briefly unavailable.",
              seg: "all" as NotifySegment,
            },
            {
              title: "Upgrade & Save",
              message:
                "You're on the free plan. Upgrade to our Gold plan today to unlock PDF exports, unlimited entries, and dedicated support.",
              seg: "free_tier" as NotifySegment,
            },
            {
              title: "We Miss You!",
              message:
                "It's been a while since you logged in. Check out the new features we've added and get back on track with your business.",
              seg: "inactive" as NotifySegment,
            },
            {
              title: "Subscription Expired",
              message:
                "Your subscription has expired. Renew now to restore full access to all premium features.",
              seg: "expired" as NotifySegment,
            },
            {
              title: "New Feature Released",
              message:
                "We just launched a new PDF export feature! Generate professional reports with one click from the Work Entries section.",
              seg: "all" as NotifySegment,
            },
            {
              title: "Exclusive Offer",
              message:
                "As a valued free-tier user, you're eligible for 30% off on your first paid plan. Offer valid for 7 days only!",
              seg: "never_paid" as NotifySegment,
            },
          ].map((tpl, i) => (
            <button
              key={i}
              onClick={() => {
                setTitle(tpl.title);
                setMessage(tpl.message);
                setSegment(tpl.seg);
              }}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: "1.5px solid var(--card-border)",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.borderColor =
                  "var(--amber)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.borderColor =
                  "var(--card-border)")
              }
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--foreground)",
                  margin: "0 0 4px",
                }}
              >
                {tpl.title}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--foreground-subtle)",
                  margin: 0,
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {tpl.message}
              </p>
              <span
                style={{
                  display: "inline-block",
                  marginTop: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--foreground-muted)",
                  background: "var(--card-border)",
                  padding: "2px 8px",
                  borderRadius: 99,
                }}
              >
                → {SEGMENTS.find((s) => s.id === tpl.seg)?.label}
              </span>
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ─── Main Page ─── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { showToast } = useToast();

  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [securitySaving, setSecuritySaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<SettingsProfile>("/users/profile")
      .then((res) => {
        if (!cancelled) setProfile(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          showToast({
            title: "Failed to load settings",
            message: getErrorMessage(err, "Could not fetch profile"),
            variant: "error",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  async function saveProfile(payload: {
    name: string;
    phone: string;
    businessName: string;
    address: string;
    state: string;
    pincode: string;
  }) {
    if (!profile) return;

    setProfileSaving(true);
    try {
      const res = await api.patch<SettingsProfile>("/users/profile", payload);
      setProfile((p) => (p ? { ...p, ...res.data } : p));
      showToast({ title: "Profile updated", variant: "success" });
    } catch (err) {
      showToast({
        title: "Failed to save profile",
        message: getErrorMessage(err, "Could not update profile"),
        variant: "error",
      });
    } finally {
      setProfileSaving(false);
    }
  }

  async function updatePassword(currentPassword: string, newPassword: string) {
    if (!profile) return;

    if (!currentPassword.trim()) {
      showToast({ title: "Current password required", variant: "error" });
      return;
    }

    if (newPassword.length < 6) {
      showToast({
        title: "Password must be at least 6 characters",
        variant: "error",
      });
      return;
    }

    setSecuritySaving(true);
    try {
      const loginCheck = await authApi.login({
        email: profile.email,
        password: currentPassword,
      });
      if (loginCheck.requiresTwoFactor) {
        throw new Error(
          "Current password verified, but 2FA is enabled. Please disable 2FA first to change password from this screen.",
        );
      }
      await api.patch("/users/profile", { password: newPassword });
      showToast({ title: "Password updated", variant: "success" });
    } catch (err) {
      showToast({
        title: "Failed to update password",
        message: getErrorMessage(err, "Could not update password"),
        variant: "error",
      });
    } finally {
      setSecuritySaving(false);
    }
  }

  async function toggleTwoFactor(enabled: boolean) {
    if (!profile) return;

    setSecuritySaving(true);
    try {
      const res = await api.patch<SettingsProfile>("/users/profile", {
        twoFactorEnabled: enabled,
      });
      setProfile((p) => (p ? { ...p, ...res.data } : p));
      showToast({
        title: enabled ? "Two-factor enabled" : "Two-factor disabled",
        variant: "success",
      });
    } catch (err) {
      showToast({
        title: "Failed to update two-factor setting",
        message: getErrorMessage(err, "Could not update two-factor setting"),
        variant: "error",
      });
      setProfile((p) => (p ? { ...p, twoFactorEnabled: !enabled } : p));
    } finally {
      setSecuritySaving(false);
    }
  }

  const isAdmin = profile?.role === "admin";

  const tabContent: Record<string, React.ReactNode> = {
    profile: (
      <ProfileTab
        profile={profile}
        saving={profileSaving}
        onSave={saveProfile}
      />
    ),
    security: (
      <SecurityTab
        profile={profile}
        saving={securitySaving}
        onUpdatePassword={updatePassword}
        onToggleTwoFactor={toggleTwoFactor}
      />
    ),
    notifications: <BulkNotifyTab />,
    platform: <PlatformTab />,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar
        title="Settings"
        subtitle="Manage your admin preferences and platform configuration"
      />

      <div
        style={{
          padding: "28px 28px 40px",
          display: "flex",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        <div
          className="card"
          style={{
            width: 220,
            padding: "8px",
            flexShrink: 0,
            position: "sticky",
            top: 92,
          }}
        >
          {tabs
            .filter(
              (t) =>
                (t.id !== "notifications" && t.id !== "platform") || isAdmin,
            )
            .map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 9,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    textAlign: "left",
                    background: isActive ? "var(--amber-glow)" : "transparent",
                    color: isActive
                      ? "var(--amber-dark)"
                      : "var(--foreground-muted)",
                    fontFamily: "DM Sans,sans-serif",
                    fontSize: 13.5,
                    fontWeight: isActive ? 600 : 400,
                    marginBottom: 2,
                  }}
                >
                  <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                  {label}
                </button>
              );
            })}
        </div>

        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}
        >
          {tabContent[activeTab]}
        </div>
      </div>
    </div>
  );
}
