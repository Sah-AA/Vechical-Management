import { api } from "./client";

export interface PlanEntitlementsSnapshot {
  role: "admin" | "owner" | "manager";
  ownerId: number;
  plan: {
    id: number;
    name: string;
    maxCustomers: string;
    maxDrivers: string;
    maxVehicles: string;
    maxWorkEntries: string;
    managerAccess: boolean;
    pdfExportEnabled: boolean;
  } | null;
  limits: {
    customers: number | null;
    drivers: number | null;
    vehicles: number | null;
    workEntries: number | null;
  } | null;
  counts: {
    customers: number;
    drivers: number;
    vehicles: number;
    workEntries: number;
  } | null;
}

export const planEntitlementsApi = {
  async getCurrent(): Promise<PlanEntitlementsSnapshot> {
    const res = await api.get<PlanEntitlementsSnapshot>(
      "/plan-entitlements/current",
    );
    return res.data;
  },
};
