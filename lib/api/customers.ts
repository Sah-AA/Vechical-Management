import { api } from "./client";

export type CustomerStatus = "Active" | "Inactive";

export interface CustomerCreator {
  id: number;
  name: string;
  email: string;
  role: "owner" | "admin" | "manager";
}

export interface CustomerPayment {
  id: number;
  amount: number;
  paidAt: string;
  notes: string | null;
  customerId: number;
  ownerId: number;
  createdById: number;
  createdBy?: CustomerCreator;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  businessName: string | null;
  gstNumber: string | null;
  status: CustomerStatus;
  notes: string | null;
  ownerId: number;
  createdById: number;
  createdBy?: CustomerCreator;
  payments?: CustomerPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListResponse {
  data: Customer[];
  meta: {
    offset: number;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  businessName?: string;
  gstNumber?: string;
  status?: CustomerStatus;
  notes?: string;
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export interface CreateCustomerPaymentInput {
  amount: number;
  paidAt?: string;
  notes?: string;
}

export interface CustomerQuery {
  search?: string;
  status?: CustomerStatus;
  offset?: number;
  page?: number;
  limit?: number;
}

export const customersApi = {
  async list(query: CustomerQuery = {}): Promise<CustomerListResponse> {
    const res = await api.get<CustomerListResponse>("/customers", {
      params: query,
    });
    return res.data;
  },

  async getOne(id: number): Promise<Customer> {
    const res = await api.get<Customer>(`/customers/${id}`);
    return res.data;
  },

  async create(input: CreateCustomerInput): Promise<Customer> {
    const res = await api.post<Customer>("/customers", input);
    return res.data;
  },

  async update(id: number, input: UpdateCustomerInput): Promise<Customer> {
    const res = await api.patch<Customer>(`/customers/${id}`, input);
    return res.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/customers/${id}`);
  },

  async createPayment(
    customerId: number,
    input: CreateCustomerPaymentInput,
  ): Promise<CustomerPayment> {
    const res = await api.post<CustomerPayment>(
      `/customers/${customerId}/payments`,
      input,
    );
    return res.data;
  },
};
