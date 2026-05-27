"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  Mail,
  Send,
  Tractor,
} from "lucide-react";
import { authApi } from "../../lib/api/auth";
import { getErrorMessage } from "../../lib/api/client";
import styles from "../auth-pages.module.css";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotFallback />}>
      <ForgotPasswordInner />
    </Suspense>
  );
}

function ForgotFallback() {
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

function ForgotPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const presetEmail = params.get("email") || "";

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (presetEmail) setEmail(presetEmail);
  }, [presetEmail]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email address.");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.forgotPassword(trimmed);
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err, "Could not send reset code."));
    } finally {
      setSubmitting(false);
    }
  }

  function continueToReset() {
    router.push(
      `/reset-password?email=${encodeURIComponent(email.trim())}`,
    );
  }

  return (
    <div className={styles.shell}>
      <div className={`card animate-fade-up ${styles.card}`}>
        <div className={styles.centerHead}>
          <div className={styles.iconWrap}>
            <KeyRound size={24} strokeWidth={2.2} />
          </div>
          <h1 className={styles.title}>Forgot password?</h1>
          <p className={styles.subtitle}>
            Enter the email on your account. We&apos;ll send a 6-digit code valid for{" "}
            <strong>10 minutes</strong>.
          </p>
        </div>

        {sent ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className={styles.alertOk} role="status">
              If an account exists for this email, check your inbox for the verification code.
              <span className={styles.hint} style={{ display: "block", marginTop: 8 }}>
                No SMTP configured? Check the server console in development for the OTP.
              </span>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ justifyContent: "center", gap: 8 }}
              onClick={continueToReset}
            >
              Continue to new password
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => {
                setSent(false);
              }}
            >
              Use a different email
            </button>
          </div>
        ) : (
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
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
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
                  Sending…
                </>
              ) : (
                <>
                  <Send size={14} /> Send reset code
                </>
              )}
            </button>
          </form>
        )}

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
