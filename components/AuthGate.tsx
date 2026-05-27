"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import { useAuthStore } from "../lib/store/authStore";
import { LoadingUI } from "./ui/LoadingUI";

const PUBLIC_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const isPublic = PUBLIC_PATHS.has(pathname);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token && !isPublic) {
      const from = encodeURIComponent(pathname);
      router.replace(`/login?from=${from}`);
    }
  }, [hasHydrated, token, isPublic, pathname, router]);

  // While we don't yet know auth state, don't flash protected UI.
  if (!hasHydrated) {
    return <FullPageLoader />;
  }

  if (isPublic) {
    return <>{children}</>;
  }

  if (!token) {
    return <FullPageLoader />;
  }

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Sidebar />
      <main
        className="flex-1 flex flex-col main-content"
        style={{ minHeight: "100vh" }}
      >
        {children}
      </main>
    </div>
  );
}

function FullPageLoader() {
  return <LoadingUI fullPage label="Checking session..." />;
}
