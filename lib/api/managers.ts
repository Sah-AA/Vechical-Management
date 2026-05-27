import { api } from "./client";
import type { OffsetPaginatedResponse } from "./client";

export type ManagerStatus = "Active" | "Inactive";

export interface ManagerSalaryPayment {
  id: number;
  amount: number;
  paidAt: string;
  salaryHistoryId: number;
  managerId: number;
  createdAt: string;
}

export interface ManagerSalaryHistory {
  id: number;
  month: string;
  salary: number;
  advance: number;
  paid: boolean;
  paidAmount: number;
  managerId: number;
  payments?: ManagerSalaryPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface ManagerAdvance {
  id: number;
  amount: number;
  type: string;
  managerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Manager {
  id: number;
  name: string;
  email: string;
  mobile: string;
  joiningDate: string;
  monthlySalary: number;
  advanceBalance: number;
  status: ManagerStatus;
  ownerId: number;
  salaryHistory?: ManagerSalaryHistory[];
  advances?: ManagerAdvance[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateManagerInput {
  name: string;
  email: string;
  password: string;
  mobile: string;
  joiningDate: string;
  monthlySalary: number;
  status?: ManagerStatus;
}

export type UpdateManagerInput = Partial<
  Omit<CreateManagerInput, "password">
> & { password?: string };

export interface CreateAdvanceInput {
  amount: number;
  type: "advance" | "repay";
}

export interface PaySalaryInput {
  month?: string;
  amount?: number;
}

export interface ManagersListQuery {
  offset?: number;
  limit?: number;
  page?: number;
}

export interface ManagerNestedListQuery {
  offset?: number;
  limit?: number;
  page?: number;
}

export const managersApi = {
  async list(
    query: ManagersListQuery = {},
  ): Promise<OffsetPaginatedResponse<Manager>> {
    const res = await api.get<OffsetPaginatedResponse<Manager>>("/managers", {
      params: query,
    });
    const payload = res.data as OffsetPaginatedResponse<Manager> | Manager[];
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

  async getOne(id: number): Promise<Manager> {
    const res = await api.get<Manager>(`/managers/${id}`);
    return res.data;
  },

  async create(input: CreateManagerInput): Promise<Manager> {
    const res = await api.post<Manager>("/managers", input);
    return res.data;
  },

  async update(id: number, input: UpdateManagerInput): Promise<Manager> {
    const res = await api.patch<Manager>(`/managers/${id}`, input);
    return res.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/managers/${id}`);
  },

  async createAdvance(
    managerId: number,
    input: CreateAdvanceInput,
  ): Promise<ManagerAdvance> {
    const res = await api.post<ManagerAdvance>(
      `/managers/${managerId}/advance`,
      input,
    );
    return res.data;
  },

  async listAdvances(
    managerId: number,
    query: ManagerNestedListQuery = {},
  ): Promise<OffsetPaginatedResponse<ManagerAdvance>> {
    const res = await api.get<OffsetPaginatedResponse<ManagerAdvance>>(
      `/managers/${managerId}/advance`,
      { params: query },
    );
    return res.data;
  },

  async paySalary(
    managerId: number,
    input: PaySalaryInput = {},
  ): Promise<ManagerSalaryHistory> {
    const res = await api.post<ManagerSalaryHistory>(
      `/managers/${managerId}/salary/pay`,
      input,
    );
    return res.data;
  },
};
