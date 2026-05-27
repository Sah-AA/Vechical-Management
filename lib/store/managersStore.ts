"use client";

import { create } from "zustand";
import type {
  CreateManagerInput,
  CreateAdvanceInput,
  UpdateManagerInput,
  Manager,
} from "../api/managers";
import { managersApi } from "../api/managers";
import { getErrorMessage } from "../api/client";

interface ManagersState {
  items: Manager[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  fetch: () => Promise<void>;
  create: (input: CreateManagerInput) => Promise<Manager>;
  update: (id: number, input: UpdateManagerInput) => Promise<Manager>;
  remove: (id: number) => Promise<void>;
  createAdvance: (managerId: number, input: CreateAdvanceInput) => Promise<void>;
  paySalary: (managerId: number, month?: string, amount?: number) => Promise<void>;
  reset: () => void;
}

export const useManagersStore = create<ManagersState>((set) => ({
  items: [],
  loading: false,
  error: null,
  loaded: false,

  async fetch() {
    set({ loading: true, error: null });
    try {
      const res = await managersApi.list({ offset: 0, limit: 50 });
      set({
        items: Array.isArray(res.data) ? res.data : [],
        loading: false,
        loaded: true,
      });
    } catch (err) {
      set({ loading: false, error: getErrorMessage(err) });
    }
  },

  async create(input) {
    try {
      const created = await managersApi.create(input);
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
      const updated = await managersApi.update(id, input);
      set((s) => ({
        items: s.items.map((m) => (m.id === id ? { ...m, ...updated } : m)),
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
      await managersApi.remove(id);
      set((s) => ({ items: s.items.filter((m) => m.id !== id) }));
    } catch (err) {
      const message = getErrorMessage(err);
      set({ error: message });
      throw new Error(message);
    }
  },

  async createAdvance(managerId, input) {
    try {
      await managersApi.createAdvance(managerId, input);
      const updated = await managersApi.getOne(managerId);
      set((s) => ({
        items: s.items.map((m) =>
          m.id === managerId ? { ...m, ...updated } : m,
        ),
      }));
    } catch (err) {
      const message = getErrorMessage(err);
      set({ error: message });
      throw new Error(message);
    }
  },

  async paySalary(managerId, month, amount) {
    try {
      await managersApi.paySalary(managerId, {
        ...(month ? { month } : {}),
        ...(amount && amount > 0 ? { amount } : {}),
      });
      const updated = await managersApi.getOne(managerId);
      set((s) => ({
        items: s.items.map((m) =>
          m.id === managerId ? { ...m, ...updated } : m,
        ),
      }));
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
