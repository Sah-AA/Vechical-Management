"use client";

import { BrandingProvider } from "../../lib/branding/BrandingContext";
import { ConfirmProvider } from "./ConfirmProvider";
import { ToastProvider } from "./ToastProvider";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <BrandingProvider>{children}</BrandingProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
