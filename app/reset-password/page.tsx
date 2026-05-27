"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Tractor,
} from "lucide-react";
import { authApi } from "../../lib/api/auth";
import { getErrorMessage } from "../../lib/api/client";
import { useToast } from "../../components/ui/ToastProvider";
import styles from "../auth-pages.module.css";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetFallback />}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetFallback() {
  return (
    <div className={styles.shell}>
      <div className={`card animate-fade-up ${styles.card}`}>
        <div className={styles.centerHead}>
          <div className={styles.iconWrap}>
            <Tractor size={24} />
          </div>
          <p className={styles.subtitle}>Loading…</p>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { showToast } = useToast();

  const queryEmail = params.get("email")?.trim() ?? "";

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (queryEmail) setEmail(queryEmail);
  }, [queryEmail]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const em = email.trim();
    if (!em) {
      setError("Email is required.");
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.resetPassword({
        email: em,
        otp: otp.trim(),
        password,
      });
      showToast({ title: res.message, variant: "success" });
      router.replace("/login?reset=1");
    } catch (err) {
      setError(getErrorMessage(err, "Could not reset password."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.shell}>
      <div className={`card animate-fade-up ${styles.card}`} style={{ maxWidth: 440 }}>
        <div className={styles.centerHead}>
          <div
            className={styles.iconWrap}
            style={{
              background: "linear-gradient(135deg,#059669,#34d399)",
              boxShadow: "0 8px 22px rgba(5,150,105,0.28)",
            }}
          >
            <ShieldCheck size={26} strokeWidth={2} />
          </div>
          <h1 className={styles.title}>Create new password</h1>
          <p className={styles.subtitle}>
            Enter the code we sent and choose a strong new password. Codes expire in{" "}
            <strong>10 minutes</strong>.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div>
            <label className={styles.label}>
              <Mail size={11} /> Email
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div>
            <label className={styles.label}>
              <KeyRound size={11} /> Verification code
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="• • • • • •"
              className={`input ${styles.otpInput}`}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={submitting}
            />
          </div>

          <div>
            <label className={styles.label}>
              <Lock size={11} /> New password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={6}
                className="input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                style={{ paddingRight: 38 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
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
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className={styles.label}>
              <Lock size={11} /> Confirm password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw2 ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={6}
                className="input"
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={submitting}
                style={{ paddingRight: 38 }}
              />
              <button
                type="button"
                onClick={() => setShowPw2((v) => !v)}
                aria-label={showPw2 ? "Hide password" : "Show password"}
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
                {showPw2 ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error ? (
            <div className={styles.alertErr} role="alert">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{
              justifyContent: "center",
              gap: 8,
              padding: "10px 18px",
              marginTop: 4,
              opacity: submitting ? 0.75 : 1,
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={14} style={{ animation: "spin 0.9s linear infinite" }} />
                Updating…
              </>
            ) : (
              <>
                <ShieldCheck size={14} /> Update password
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() =>
            router.push(
              `/forgot-password?email=${encodeURIComponent(email.trim())}`,
            )
          }
        >
          Resend code
        </button>

        <p className={styles.footerLink}>
          <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft size={13} /> Back to sign in
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
