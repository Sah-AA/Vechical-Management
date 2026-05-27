"use client";

import { Loader2 } from "lucide-react";

type LoadingUIProps = {
  label?: string;
  fullPage?: boolean;
  overlay?: boolean;
};

export function LoadingUI({
  label = "Loading...",
  fullPage = false,
  overlay = false,
}: LoadingUIProps) {
  const content = (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        color: "var(--foreground-muted)",
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} />
      <span>{label}</span>
    </div>
  );

  if (overlay) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2200,
          background: "rgba(20,18,16,0.36)",
          backdropFilter: "blur(2px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="card" style={{ padding: "12px 16px" }}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: fullPage ? "100vh" : "96px",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {content}
    </div>
  );
}
