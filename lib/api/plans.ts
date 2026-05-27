import { api } from "./client";
import { OffsetPaginatedResponse } from "./client";

export interface Plan {
  id: number;
  name: string;
  /** INR per month (integer only; UI formats as ₹…/mo). */
  price: number;
  validity: string;
  owners: number;
  /** Sum of paid subscription amounts (₹), all periods — includes expired. Omitted on older API responses. */
  totalRevenue?: number;
  maxVehicles: string;
  maxCustomers: string;
  maxDrivers: string;
  maxWorkEntries: string;
  managerAccess: boolean;
  pdfExportEnabled: boolean;
  features: string[];
  color: string;
  textColor: string;
  badge: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanPayload {
  name: string;
  price: number;
  validity: string;
  maxVehicles: string;
  maxCustomers: string;
  maxDrivers: string;
  maxWorkEntries: string;
  managerAccess: boolean;
  pdfExportEnabled: boolean;
  features: string[];
  color: string;
  textColor: string;
  badge: string;
}

export interface PlansListQuery {
  offset?: number;
  limit?: number;
  page?: number;
}

export const plansApi = {
  async list(query: PlansListQuery = {}): Promise<OffsetPaginatedResponse<Plan>> {
    const res = await api.get<OffsetPaginatedResponse<Plan>>("/plans", {
      params: query,
    });
    const payload = res.data as OffsetPaginatedResponse<Plan> | Plan[];
    if (Array.isArray(payload)) {
      return {
        data: payload,
        meta: {
          offset: query.offset ?? 0,
          limit: query.limit ?? payload.length,
          total: payload.length,
          totalPages: 1,
          page: 1,
        },
      };
    }
    return payload;
  },

  async getOne(id: number): Promise<Plan> {
    const res = await api.get<Plan>(`/plans/${id}`);
    return res.data;
  },

  async create(input: PlanPayload): Promise<Plan> {
    const res = await api.post<Plan>("/plans", input);
    return res.data;
  },

  async update(id: number, input: Partial<PlanPayload>): Promise<Plan> {
    const res = await api.patch<Plan>(`/plans/${id}`, input);
    return res.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/plans/${id}`);
  },
};
