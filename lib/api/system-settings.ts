import { api } from "./client";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3003";

/** Turn `/uploads/x.png` into an absolute URL for `<img src>`. */
export function systemAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${baseURL}${p}`;
}

export interface SystemSettingPublic {
  appName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  maintenanceMode: boolean;
}

export interface SystemSettingAdmin {
  id: number;
  appName: string;
  supportPhone: string;
  supportEmail: string;
  freeTrialDays: number;
  logoPath: string | null;
  faviconPath: string | null;
  autoExpirePlans: boolean;
  maintenanceMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSystemSettingPayload {
  appName?: string;
  supportPhone?: string;
  supportEmail?: string;
  freeTrialDays?: number;
  clearLogo?: boolean;
  clearFavicon?: boolean;
  autoExpirePlans?: boolean;
  maintenanceMode?: boolean;
}

export const systemSettingsApi = {
  async getPublic(): Promise<SystemSettingPublic> {
    const res = await api.get<SystemSettingPublic>("/system-settings/public");
    return res.data;
  },

  async getAdmin(): Promise<SystemSettingAdmin> {
    const res = await api.get<SystemSettingAdmin>("/system-settings");
    return res.data;
  },

  async update(payload: UpdateSystemSettingPayload): Promise<SystemSettingAdmin> {
    const res = await api.patch<SystemSettingAdmin>("/system-settings", payload);
    return res.data;
  },

  async uploadLogo(file: File): Promise<SystemSettingAdmin> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post<SystemSettingAdmin>("/system-settings/logo", fd);
    return res.data;
  },

  async uploadFavicon(file: File): Promise<SystemSettingAdmin> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post<SystemSettingAdmin>("/system-settings/favicon", fd);
    return res.data;
  },
};
