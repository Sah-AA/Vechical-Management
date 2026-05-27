"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Tractor,
  UserPlus,
  UserRound,
} from "lucide-react";
import { useAuthStore } from "../../lib/store/authStore";

interface FormState {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  business: string;
  address: string;
  state: string;
  pincode: string;
  password: string;
  confirmPassword: string;
}

const empty: FormState = {
  name: "",
  email: "",
  phone: "",
  businessName: "",
  business: "",
  address: "",
  state: "",
  pincode: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const [form, setForm] = useState<FormState>(empty);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (hasHydrated && token) router.replace("/");
  }, [hasHydrated, token, router]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (form.password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        businessName: form.businessName.trim(),
        business: form.business.trim() || undefined,
        address: form.address.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        password: form.password,
      });
      // auto-login on successful registration
      const loginResult = await login({
        email: form.email.trim(),
        password: form.password,
      });
      if (loginResult.requiresTwoFactor) {
        router.replace(`/login?from=${encodeURIComponent("/")}`);
        return;
      }
      router.replace("/");
    } catch {
      // error is captured in store
    }
  }

  const submitting = status === "loading";
  const displayedError = localError ?? error;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        background:
          "radial-gradient(1200px 600px at 80% -10%, rgba(245,158,11,0.10), transparent 60%), radial-gradient(900px 500px at -10% 110%, rgba(234,88,12,0.08), transparent 60%), var(--background)",
      }}
    >
      <div
        className="card animate-fade-up"
        style={{
          width: "100%",
          maxWidth: 560,
          padding: "30px 30px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 50,
              height: 50,
              margin: "0 auto 12px",
              borderRadius: 14,
              background: "linear-gradient(135deg,#F59E0B,#D97706)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 22px rgba(245,158,11,0.32)",
            }}
          >
            <Tractor size={22} style={{ color: "#141210" }} />
          </div>
          <h1
            style={{
              fontFamily: "Syne,sans-serif",
              fontWeight: 800,
              fontSize: 21,
              color: "var(--foreground)",
              letterSpacing: "-0.02em",
            }}
          >
            Create owner account
          </h1>
          <p
            style={{
              fontSize: 12.5,
              color: "var(--foreground-muted)",
              marginTop: 4,
            }}
          >
            Get your business onto the JCB Admin Panel in minutes
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <Row>
            <Field
              label="Full name"
              icon={<UserRound size={11} />}
              required
              value={form.name}
              onChange={(v) => update("name", v)}
              placeholder="Ramesh Patel"
              disabled={submitting}
            />
            <Field
              label="Phone"
              icon={<Phone size={11} />}
              required
              value={form.phone}
              onChange={(v) => update("phone", v)}
              placeholder="9876543210"
              disabled={submitting}
            />
          </Row>

          <Field
            label="Email"
            icon={<Mail size={11} />}
            required
            type="email"
            value={form.email}
            onChange={(v) => update("email", v)}
            placeholder="you@example.com"
            disabled={submitting}
          />

          <Row>
            <Field
              label="Business name"
              icon={<Building2 size={11} />}
              required
              value={form.businessName}
              onChange={(v) => update("businessName", v)}
              placeholder="Patel Tractors"
              disabled={submitting}
            />
            <Field
              label="Business type"
              icon={<Building2 size={11} />}
              value={form.business}
              onChange={(v) => update("business", v)}
              placeholder="Optional"
              disabled={submitting}
            />
          </Row>

          <Field
            label="Address"
            icon={<MapPin size={11} />}
            required
            value={form.address}
            onChange={(v) => update("address", v)}
            placeholder="Street, area"
            disabled={submitting}
          />

          <Row>
            <Field
              label="State"
              icon={<MapPin size={11} />}
              required
              value={form.state}
              onChange={(v) => update("state", v)}
              placeholder="Gujarat"
              disabled={submitting}
            />
            <Field
              label="Pincode"
              icon={<MapPin size={11} />}
              required
              value={form.pincode}
              onChange={(v) => update("pincode", v)}
              placeholder="380001"
              disabled={submitting}
            />
          </Row>

          <Row>
            <div>
              <Label icon={<Lock size={11} />}>Password</Label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="input"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  disabled={submitting}
                  style={{ paddingRight: 38 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 6,
                  }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <Field
              label="Confirm password"
              icon={<Lock size={11} />}
              required
              type={showPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(v) => update("confirmPassword", v)}
              placeholder="Re-enter password"
              disabled={submitting}
            />
          </Row>

          {displayedError && (
            <div
              role="alert"
              style={{
                background: "var(--red-light)",
                color: "var(--red)",
                border: "1px solid rgba(220,38,38,0.18)",
                padding: "8px 12px",
                borderRadius: 9,
                fontSize: 12.5,
              }}
            >
              {displayedError}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{
              justifyContent: "center",
              padding: "10px 18px",
              marginTop: 4,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? (
              <>
                <Loader2
                  size={14}
                  style={{ animation: "spin 0.9s linear infinite" }}
                />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus size={14} /> Create account
              </>
            )}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            fontSize: 12.5,
            color: "var(--foreground-muted)",
            marginTop: 16,
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "var(--amber-dark)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </p>
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

/* ── helpers ─────────────────────────── */

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

function Label({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: "var(--foreground-subtle)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 6,
      }}
    >
      {icon}
      {children}
    </label>
  );
}

function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  disabled,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <Label icon={icon}>{label}</Label>
      <input
        type={type}
        required={required}
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
