import { api } from "./client";

export type WorkEntryStatus = "Paid" | "Pending";

export interface WorkEntryRefVehicle {
  id: number;
  name: string;
  number: string;
  type: string;
}

export interface WorkEntryRefCustomer {
  id: number;
  name: string;
  phone: string;
  businessName: string | null;
}

export interface WorkEntryRefDriver {
  id: number;
  name: string;
  mobile: string;
}

export interface WorkEntryRefCreator {
  id: number;
  name: string;
  email: string;
  role: "owner" | "admin" | "manager";
}

export interface WorkEntry {
  id: number;
  date: string;
  hours: number;
  ratePerHour: number;
  amount: number;
  notes: string | null;
  status: WorkEntryStatus;
  ownerId: number;
  createdById: number;
  vehicleId: number;
  customerId: number;
  driverId: number;
  vehicle?: WorkEntryRefVehicle;
  customer?: WorkEntryRefCustomer;
  driver?: WorkEntryRefDriver;
  createdBy?: WorkEntryRefCreator;
  createdAt: string;
  updatedAt: string;
}

export interface WorkEntryListResponse {
  data: WorkEntry[];
  meta: {
    offset: number;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WorkEntryStats {
  totalJobs: number;
  totalHours: number;
  paidRevenue: number;
  pendingAmount: number;
  totalRevenue: number;
}

export interface CreateWorkEntryInput {
  vehicleId: number;
  customerId: number;
  driverId: number;
  date: string;
  hours: number;
  ratePerHour: number;
  notes?: string;
  status?: WorkEntryStatus;
}

export type UpdateWorkEntryInput = Partial<CreateWorkEntryInput>;

export interface WorkEntryQuery {
  search?: string;
  status?: WorkEntryStatus;
  vehicleId?: number;
  customerId?: number;
  driverId?: number;
  from?: string;
  to?: string;
  offset?: number;
  page?: number;
  limit?: number;
}

export const workEntriesApi = {
  async list(query: WorkEntryQuery = {}): Promise<WorkEntryListResponse> {
    const res = await api.get<WorkEntryListResponse>("/work-entries", {
      params: query,
    });
    return res.data;
  },

  async stats(): Promise<WorkEntryStats> {
    const res = await api.get<WorkEntryStats>("/work-entries/stats");
    return res.data;
  },

  async getOne(id: number): Promise<WorkEntry> {
    const res = await api.get<WorkEntry>(`/work-entries/${id}`);
    return res.data;
  },

  async create(input: CreateWorkEntryInput): Promise<WorkEntry> {
    const res = await api.post<WorkEntry>("/work-entries", input);
    return res.data;
  },

  async update(id: number, input: UpdateWorkEntryInput): Promise<WorkEntry> {
    const res = await api.patch<WorkEntry>(`/work-entries/${id}`, input);
    return res.data;
  },

  async toggleStatus(id: number): Promise<WorkEntry> {
    const res = await api.patch<WorkEntry>(
      `/work-entries/${id}/toggle-status`,
    );
    return res.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/work-entries/${id}`);
  },

  /** PDF export (plan must include PDF export). Same query params as list. */
  async downloadExportPdf(query: WorkEntryQuery = {}): Promise<Blob> {
    const res = await api.get<Blob>("/work-entries/export/pdf", {
      params: query,
      responseType: "blob",
    });
    const blob = res.data as Blob;
    if (
      blob.type === "application/json" ||
      blob.type === "application/problem+json"
    ) {
      const text = await blob.text();
      let msg = "Export failed";
      try {
        const j = JSON.parse(text) as { message?: string | string[] };
        if (j.message)
          msg = Array.isArray(j.message) ? j.message.join(", ") : j.message;
      } catch {
        /* ignore parse errors */
      }
      throw new Error(msg);
    }
    return blob;
  },
};
