"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  systemSettingsApi,
  systemAssetUrl,
  type SystemSettingPublic,
} from "../api/system-settings";

export type BrandingContextValue = {
  loaded: boolean;
  appName: string;
  logoSrc: string | null;
  faviconSrc: string | null;
  maintenanceMode: boolean;
  /** Refetch after admin updates branding in Settings */
  refresh: () => Promise<void>;
};

const DEFAULT_APP_NAME = "JCB Admin Panel";

const BrandingContext = createContext<BrandingContextValue | null>(null);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [appName, setAppName] = useState(DEFAULT_APP_NAME);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [faviconSrc, setFaviconSrc] = useState<string | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const applyPublic = useCallback((p: SystemSettingPublic) => {
    setAppName(p.appName?.trim() || DEFAULT_APP_NAME);
    setLogoSrc(systemAssetUrl(p.logoUrl));
    setFaviconSrc(systemAssetUrl(p.faviconUrl));
    setMaintenanceMode(Boolean(p.maintenanceMode));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const p = await systemSettingsApi.getPublic();
      applyPublic(p);
    } catch {
      /* keep previous branding */
    }
  }, [applyPublic]);

  useEffect(() => {
    let cancelled = false;
    systemSettingsApi
      .getPublic()
      .then((p) => {
        if (!cancelled) applyPublic(p);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [applyPublic]);

  useEffect(() => {
    if (!loaded) return;
    document.title = appName;
  }, [loaded, appName]);

  useEffect(() => {
    if (!loaded || !faviconSrc) return;
    let link =
      document.querySelector<HTMLLinkElement>("link[rel='icon']") ||
      document.querySelector<HTMLLinkElement>("link[rel='shortcut icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = faviconSrc;
  }, [loaded, faviconSrc]);

  const value = useMemo<BrandingContextValue>(
    () => ({
      loaded,
      appName,
      logoSrc,
      faviconSrc,
      maintenanceMode,
      refresh,
    }),
    [loaded, appName, logoSrc, faviconSrc, maintenanceMode, refresh],
  );

  return (
    <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>
  );
}

export function useBranding(): BrandingContextValue {
  const ctx = useContext(BrandingContext);
  if (!ctx) {
    throw new Error("useBranding must be used within BrandingProvider");
  }
  return ctx;
}

/** Split "JCB Admin" → first word (white) + rest (amber) like the original sidebar. */
export function splitAppNameTitle(name: string): { head: string; tail: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { head: "JCB", tail: "Admin" };
  if (parts.length === 1) return { head: parts[0], tail: "" };
  return { head: parts[0], tail: parts.slice(1).join(" ") };
}
