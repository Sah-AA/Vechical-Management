"use client";

import { create } from "zustand";
import {
  Driver,
  CreateDriverInput,
  CreateAdvanceInput,
  UpdateDriverInput,
  driversApi,
} from "../api/drivers";
import { getErrorMessage } from "../api/client";

interface DriversState {
  items: Driver[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  fetch: () => Promise<void>;
  create: (input: CreateDriverInput) => Promise<Driver>;
  update: (id: number, input: UpdateDriverInput) => Promise<Driver>;
  remove: (id: number) => Promise<void>;
  createAdvance: (driverId: number, input: CreateAdvanceInput) => Promise<void>;
  paySalary: (driverId: number, month?: string, amount?: number) => Promise<void>;
  reset: () => void;
}

export const useDriversStore = create<DriversState>((set) => ({
  items: [],
  loading: false,
  error: null,
  loaded: false,

  async fetch() {
    set({ loading: true, error: null });
    try {
      const res = await driversApi.list({ offset: 0, limit: 50 });
      set({ items: Array.isArray(res.data) ? res.data : [], loading: false, loaded: true });
    } catch (err) {
      set({ loading: false, error: getErrorMessage(err) });
    }
  },

  async create(input) {
    try {
      const created = await driversApi.create(input);
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
      const updated = await driversApi.update(id, input);
      set((s) => ({
        items: s.items.map((d) => (d.id === id ? { ...d, ...updated } : d)),
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
      await driversApi.remove(id);
      set((s) => ({ items: s.items.filter((d) => d.id !== id) }));
    } catch (err) {
      const message = getErrorMessage(err);
      set({ error: message });
      throw new Error(message);
    }
  },

  async createAdvance(driverId, input) {
    try {
      await driversApi.createAdvance(driverId, input);
      // backend updates advanceBalance on driver; refetch the driver
      const updated = await driversApi.getOne(driverId);
      set((s) => ({
        items: s.items.map((d) =>
          d.id === driverId ? { ...d, ...updated } : d,
        ),
      }));
    } catch (err) {
      const message = getErrorMessage(err);
      set({ error: message });
      throw new Error(message);
    }
  },

  async paySalary(driverId, month, amount) {
    try {
      await driversApi.paySalary(driverId, {
        ...(month ? { month } : {}),
        ...(amount && amount > 0 ? { amount } : {}),
      });
      const updated = await driversApi.getOne(driverId);
      set((s) => ({
        items: s.items.map((d) =>
          d.id === driverId ? { ...d, ...updated } : d,
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
