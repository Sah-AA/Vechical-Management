"use client";

import { create } from "zustand";
import {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  customersApi,
} from "../api/customers";
import { getErrorMessage } from "../api/client";

interface CustomersState {
  items: Customer[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  fetch: () => Promise<void>;
  create: (input: CreateCustomerInput) => Promise<Customer>;
  update: (id: number, input: UpdateCustomerInput) => Promise<Customer>;
  remove: (id: number) => Promise<void>;
  reset: () => void;
}

export const useCustomersStore = create<CustomersState>((set) => ({
  items: [],
  loading: false,
  error: null,
  loaded: false,

  async fetch() {
    set({ loading: true, error: null });
    try {
      const res = await customersApi.list({ offset: 0, limit: 50 });
      set({ items: res.data, loading: false, loaded: true });
    } catch (err) {
      set({ loading: false, error: getErrorMessage(err) });
    }
  },

  async create(input) {
    try {
      const created = await customersApi.create(input);
      set((s) => ({ items: [created, ...s.items] }));
      return created;
    } catch (err) {
      const message = getErrorMessage(err);
      set({ error: message });
      throw new Error(message);
    }
  },

  async update(id, input) {
    try {
      const updated = await customersApi.update(id, input);
      set((s) => ({
        items: s.items.map((c) => (c.id === id ? updated : c)),
      }));
      return updated;
    } catch (err) {
      const message = getErrorMessage(err);
      set({ error: message });
      throw new Error(message);
    }
  },

  async remove(id) {
    try {
      await customersApi.remove(id);
      set((s) => ({ items: s.items.filter((c) => c.id !== id) }));
    } catch (err) {
      const message = getErrorMessage(err);
      set({ error: message });
      throw new Error(message);
    }
  },

  reset() {
    set({ items: [], loading: false, error: null, loaded: false });
  },
}));
