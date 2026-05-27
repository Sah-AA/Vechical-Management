import { api } from "./client";
import { OffsetPaginatedResponse } from "./client";

export type DriverStatus = "Active" | "Inactive";

export interface SalaryPayment {
  id: number;
  amount: number;
  paidAt: string;
  salaryHistoryId: number;
  driverId: number;
  createdAt: string;
}

export interface SalaryHistory {
  id: number;
  month: string;
  salary: number;
  advance: number;
  paid: boolean;
  paidAmount: number;
  driverId: number;
  payments?: SalaryPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface DriverAdvance {
  id: number;
  amount: number;
  type: string;
  driverId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: number;
  name: string;
  mobile: string;
  joiningDate: string;
  monthlySalary: number;
  advanceBalance: number;
  status: DriverStatus;
  ownerId: number;
  salaryHistory?: SalaryHistory[];
  advances?: DriverAdvance[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDriverInput {
  name: string;
  mobile: string;
  joiningDate: string;
  monthlySalary: number;
  status?: DriverStatus;
}

export type UpdateDriverInput = Partial<CreateDriverInput>;

export interface CreateAdvanceInput {
  amount: number;
  type: "advance" | "repay";
}

export interface PaySalaryInput {
  month?: string;
  amount?: number;
}

export interface DriversListQuery {
  offset?: number;
  limit?: number;
  page?: number;
}

export interface DriverNestedListQuery {
  offset?: number;
  limit?: number;
  page?: number;
}

export const driversApi = {
  async list(
    query: DriversListQuery = {},
  ): Promise<OffsetPaginatedResponse<Driver>> {
    const res = await api.get<OffsetPaginatedResponse<Driver>>("/drivers", {
      params: query,
    });
    const payload = res.data as OffsetPaginatedResponse<Driver> | Driver[];
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

  async getOne(id: number): Promise<Driver> {
    const res = await api.get<Driver>(`/drivers/${id}`);
    return res.data;
  },

  async create(input: CreateDriverInput): Promise<Driver> {
    const res = await api.post<Driver>("/drivers", input);
    return res.data;
  },

  async update(id: number, input: UpdateDriverInput): Promise<Driver> {
    const res = await api.patch<Driver>(`/drivers/${id}`, input);
    return res.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/drivers/${id}`);
  },

  async createAdvance(
    driverId: number,
    input: CreateAdvanceInput,
  ): Promise<DriverAdvance> {
    const res = await api.post<DriverAdvance>(
      `/drivers/${driverId}/advance`,
      input,
    );
    return res.data;
  },

  async listAdvances(
    driverId: number,
    query: DriverNestedListQuery = {},
  ): Promise<OffsetPaginatedResponse<DriverAdvance>> {
    const res = await api.get<OffsetPaginatedResponse<DriverAdvance>>(
      `/drivers/${driverId}/advance`,
      { params: query },
    );
    return res.data;
  },

  async paySalary(driverId: number, input: PaySalaryInput = {}): Promise<SalaryHistory> {
    const res = await api.post<SalaryHistory>(`/drivers/${driverId}/salary/pay`, input);
    return res.data;
  },
};
