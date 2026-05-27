import { api } from "./client";
import { OffsetPaginatedResponse } from "./client";

export type VehicleStatus = "Active" | "Under_Service" | "Idle";

export interface FuelEntry {
  id: number;
  date: string;
  litres: number;
  pricePerLitre: number;
  amount: number;
  notes: string | null;
  vehicleId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceEntry {
  id: number;
  date: string;
  description: string;
  cost: number;
  status: "Completed" | "Pending";
  vehicleId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: number;
  name: string;
  number: string;
  type: string;
  status: VehicleStatus;
  totalFuelCost: number;
  totalServiceCost: number;
  ownerId: number;
  fuelEntries?: FuelEntry[];
  serviceEntries?: ServiceEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleInput {
  name: string;
  number: string;
  type: string;
  status?: VehicleStatus;
}

export type UpdateVehicleInput = Partial<CreateVehicleInput>;

export interface CreateFuelInput {
  date: string;
  litres: number;
  pricePerLitre: number;
  amount: number;
  notes?: string;
  vehicleId: number;
}

export interface CreateServiceInput {
  date: string;
  description: string;
  cost: number;
  status?: "Completed" | "Pending";
  vehicleId: number;
}

export interface VehiclesListQuery {
  offset?: number;
  limit?: number;
  page?: number;
}

export const vehiclesApi = {
  async list(
    query: VehiclesListQuery = {},
  ): Promise<OffsetPaginatedResponse<Vehicle>> {
    const res = await api.get<OffsetPaginatedResponse<Vehicle>>("/vehicles", {
      params: query,
    });
    const payload = res.data as OffsetPaginatedResponse<Vehicle> | Vehicle[];
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

  async getOne(id: number): Promise<Vehicle> {
    const res = await api.get<Vehicle>(`/vehicles/${id}`);
    return res.data;
  },

  async create(input: CreateVehicleInput): Promise<Vehicle> {
    const res = await api.post<Vehicle>("/vehicles", input);
    return res.data;
  },

  async update(id: number, input: UpdateVehicleInput): Promise<Vehicle> {
    const res = await api.patch<Vehicle>(`/vehicles/${id}`, input);
    return res.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/vehicles/${id}`);
  },

  async createFuel(input: CreateFuelInput): Promise<FuelEntry> {
    const res = await api.post<FuelEntry>(
      `/vehicles/${input.vehicleId}/fuel`,
      input,
    );
    return res.data;
  },

  async createService(input: CreateServiceInput): Promise<ServiceEntry> {
    const res = await api.post<ServiceEntry>(
      `/vehicles/${input.vehicleId}/service`,
      input,
    );
    return res.data;
  },
};
