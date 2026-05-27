"use client";

import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: number;
  title: string;
  message?: string;
  variant: ToastVariant;
};

type ShowToastInput = {
  title: string;
  message?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  showToast: (input: ShowToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_TIMEOUT_MS = 3200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const removeToast = useCallback((id: number) => {
    const timeout = timeoutRef.current[id];
    if (timeout) {
      clearTimeout(timeout);
      delete timeoutRef.current[id];
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, variant = "info" }: ShowToastInput) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev, { id, title, message, variant }]);
      timeoutRef.current[id] = setTimeout(() => removeToast(id), TOAST_TIMEOUT_MS);
    },
    [removeToast],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 2400,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxWidth: 360,
          width: "min(360px, calc(100vw - 24px))",
        }}
      >
        {toasts.map((toast) => {
          const variantStyle = getVariantStyle(toast.variant);
          const Icon = getVariantIcon(toast.variant);

          return (
            <div
              key={toast.id}
              className="animate-fade-up"
              style={{
                background: "var(--card-bg)",
                border: `1px solid ${variantStyle.border}`,
                borderLeft: `4px solid ${variantStyle.accent}`,
                borderRadius: 12,
                boxShadow: "var(--card-shadow-hover)",
                padding: "10px 12px",
                display: "grid",
                gridTemplateColumns: "18px 1fr auto",
                gap: 10,
                alignItems: "start",
              }}
            >
              <Icon size={16} style={{ color: variantStyle.accent, marginTop: 2 }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: 13, color: "var(--foreground)" }}>
                  {toast.title}
                </p>
                {toast.message ? (
                  <p style={{ fontSize: 12, marginTop: 2, color: "var(--foreground-muted)" }}>
                    {toast.message}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => removeToast(toast.id)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--foreground-subtle)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 2,
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}

function getVariantIcon(variant: ToastVariant) {
  if (variant === "success") return CheckCircle2;
  if (variant === "error") return AlertCircle;
  return Info;
}

function getVariantStyle(variant: ToastVariant) {
  if (variant === "success") {
    return { accent: "var(--emerald)", border: "rgba(5,150,105,0.25)" };
  }
  if (variant === "error") {
    return { accent: "var(--red)", border: "rgba(220,38,38,0.25)" };
  }
  return { accent: "#2563EB", border: "rgba(37,99,235,0.22)" };
}
