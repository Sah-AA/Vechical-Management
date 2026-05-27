import { api } from "./client";
import { OffsetPaginatedResponse } from "./client";

export interface OwnerCounts {
  vehicles: number;
  drivers: number;
  customers: number;
  subscriptions: number;
  managers: number;
}

export interface OwnerVehicle {
  id: number;
  name: string;
  number: string;
  type: string;
  status: "Active" | "Under_Service" | "Idle";
  totalFuelCost: number;
  totalServiceCost: number;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerDriver {
  id: number;
  name: string;
  mobile: string;
  status: "Active" | "Inactive";
  ownerId: number;
  advanceBalance?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerCustomer {
  id: number;
  name: string;
  mobile: string;
  address: string;
  status: "Active" | "Inactive";
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerManager {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "owner" | "admin" | "manager";
  createdAt: string;
  updatedAt: string;
}

export interface OwnerSubscriptionPlan {
  id: number;
  name: string;
  /** INR/month integer */
  price: number;
  validity: string;
  badge: string;
  managerAccess?: boolean;
}

export interface OwnerSubscription {
  id: number;
  userId: number;
  planId: number;
  plan?: OwnerSubscriptionPlan;
  status: "active" | "expired" | "cancelled" | "pending";
  paymentStatus: "paid" | "unpaid" | "refunded" | "failed";
  amount: number;
  startDate: string;
  endDate: string;
  paymentRef?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Owner {
  id: number;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  business: string | null;
  address: string;
  state: string;
  pincode: string;
  role: "owner" | "admin" | "manager";
  managerOfId: number | null;
  createdAt: string;
  updatedAt: string;
  _count?: OwnerCounts;
  vehicles?: OwnerVehicle[];
  drivers?: OwnerDriver[];
  customers?: OwnerCustomer[];
  managers?: OwnerManager[];
  subscriptions?: OwnerSubscription[];
}

export interface OwnersListQuery {
  offset?: number;
  limit?: number;
  page?: number;
}

export const ownersApi = {
  async list(
    query: OwnersListQuery = {},
  ): Promise<OffsetPaginatedResponse<Owner>> {
    const res = await api.get<OffsetPaginatedResponse<Owner>>("/users", {
      params: { role: "owner", ...query },
    });
    return res.data;
  },

  async getOne(id: number): Promise<Owner> {
    const res = await api.get<Owner>(`/users/${id}`);
    return res.data;
  },
};
