"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, LogIn, Mail, ShieldCheck, Tractor } from "lucide-react";
import { useAuthStore } from "../../lib/store/authStore";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("from") || "/";
  const passwordResetOk = params.get("reset") === "1";

  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const verifyLoginOtp = useAuthStore((s) => s.verifyLoginOtp);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpStepEmail, setOtpStepEmail] = useState<string | null>(null);

  useEffect(() => {
    if (hasHydrated && token) router.replace(redirectTo);
  }, [hasHydrated, token, router, redirectTo]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();
    try {
      const response = await login({ email: email.trim(), password });
      if (response.requiresTwoFactor) {
        setOtpStepEmail(response.email);
        return;
      }
      router.replace(redirectTo);
    } catch {
      // error is captured in store
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    if (!otpStepEmail) return;
    clearError();
    try {
      await verifyLoginOtp({ email: otpStepEmail, otp: otp.trim() });
      router.replace(redirectTo);
    } catch {
      // error is captured in store
    }
  }

  const submitting = status === "loading";

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
          maxWidth: 420,
          padding: "32px 30px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div
            style={{
              width: 52,
              height: 52,
              margin: "0 auto 14px",
              borderRadius: 14,
              background: "linear-gradient(135deg,#F59E0B,#D97706)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 22px rgba(245,158,11,0.32)",
            }}
          >
            <Tractor size={24} style={{ color: "#141210" }} />
          </div>
          <h1
            style={{
              fontFamily: "Syne,sans-serif",
              fontWeight: 800,
              fontSize: 22,
              color: "var(--foreground)",
              letterSpacing: "-0.02em",
            }}
          >
            Welcome back
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--foreground-muted)",
              marginTop: 4,
            }}
          >
            Sign in to your JCB Admin Panel
          </p>
        </div>

        {!otpStepEmail ? (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {passwordResetOk ? (
              <div
                role="status"
                style={{
                  background: "rgba(5,150,105,0.1)",
                  color: "#047857",
                  border: "1px solid rgba(5,150,105,0.22)",
                  padding: "10px 12px",
                  borderRadius: 9,
                  fontSize: 12.5,
                }}
              >
                Password updated. Sign in with your new password.
              </div>
            ) : null}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Mail size={11} /> Email
              </label>
              <input type="email" autoComplete="email" required className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={submitting} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Lock size={11} /> Password
              </label>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} autoComplete="current-password" required className="input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={submitting} style={{ paddingRight: 38 }} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} style={{ position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: "var(--foreground-subtle)", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: "right", marginTop: -4 }}>
              <Link href="/forgot-password" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--amber-dark)", textDecoration: "none" }}>
                Forgot password?
              </Link>
            </div>

            {error && (
              <div role="alert" style={{ background: "var(--red-light)", color: "var(--red)", border: "1px solid rgba(220,38,38,0.18)", padding: "8px 12px", borderRadius: 9, fontSize: 12.5 }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ justifyContent: "center", padding: "10px 18px", marginTop: 4, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-fade-in" style={{ animation: "spin 0.9s linear infinite" }} />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={14} /> Sign in
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div role="status" style={{ background: "rgba(245,158,11,0.12)", color: "#92400E", border: "1px solid rgba(245,158,11,0.28)", padding: "10px 12px", borderRadius: 9, fontSize: 12.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <ShieldCheck size={14} /> 2FA verification required
              </div>
              OTP sent to <strong>{otpStepEmail}</strong>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <ShieldCheck size={11} /> One-Time Password
              </label>
              <input type="text" inputMode="numeric" pattern="\d{6}" maxLength={6} required className="input" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} disabled={submitting} />
            </div>

            {error && (
              <div role="alert" style={{ background: "var(--red-light)", color: "var(--red)", border: "1px solid rgba(220,38,38,0.18)", padding: "8px 12px", borderRadius: 9, fontSize: 12.5 }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={submitting || otp.length !== 6} style={{ justifyContent: "center", padding: "10px 18px", marginTop: 4, opacity: submitting || otp.length !== 6 ? 0.7 : 1 }}>
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-fade-in" style={{ animation: "spin 0.9s linear infinite" }} />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck size={14} /> Verify OTP
                </>
              )}
            </button>

            <button type="button" className="btn btn-ghost" onClick={() => { setOtpStepEmail(null); setOtp(""); }}>
              Back to password login
            </button>
          </form>
        )}

        <p
          style={{
            textAlign: "center",
            fontSize: 12.5,
            color: "var(--foreground-muted)",
            marginTop: 18,
          }}
        >
          New owner?{" "}
          <Link
            href="/register"
            style={{
              color: "var(--amber-dark)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Create an account
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
