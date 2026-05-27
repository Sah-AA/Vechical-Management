"use client";

import { AlertTriangle } from "lucide-react";
import { createContext, useContext, useMemo, useState } from "react";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

type PendingConfirm = ConfirmOptions & {
  resolve: (confirmed: boolean) => void;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const value = useMemo<ConfirmContextValue>(
    () => ({
      confirm(options) {
        return new Promise<boolean>((resolve) => {
          setPending({ ...options, resolve });
        });
      },
    }),
    [],
  );

  function closeWith(result: boolean) {
    if (!pending) return;
    pending.resolve(result);
    setPending(null);
  }

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {pending ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(20,18,16,0.58)",
            backdropFilter: "blur(3px)",
            padding: 16,
          }}
          onClick={() => closeWith(false)}
        >
          <div
            className="card animate-fade-up"
            onClick={(event) => event.stopPropagation()}
            style={{ width: "min(420px, 100%)", padding: 20 }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: pending.destructive ? "var(--red-light)" : "var(--amber-light)",
                  color: pending.destructive ? "var(--red)" : "var(--amber-dark)",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={16} />
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: "Syne,sans-serif",
                    fontWeight: 700,
                    fontSize: 18,
                    color: "var(--foreground)",
                  }}
                >
                  {pending.title}
                </h3>
                {pending.description ? (
                  <p style={{ marginTop: 6, color: "var(--foreground-muted)", fontSize: 13 }}>
                    {pending.description}
                  </p>
                ) : null}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button type="button" className="btn btn-ghost" onClick={() => closeWith(false)}>
                {pending.cancelLabel ?? "Cancel"}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => closeWith(true)}
                style={
                  pending.destructive
                    ? { background: "var(--red)", color: "white" }
                    : undefined
                }
              >
                {pending.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used inside ConfirmProvider");
  }
  return context;
}
