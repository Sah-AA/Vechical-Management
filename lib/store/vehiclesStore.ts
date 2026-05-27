"use client";

import { create } from "zustand";
import {
  Vehicle,
  CreateVehicleInput,
  CreateFuelInput,
  CreateServiceInput,
  UpdateVehicleInput,
  vehiclesApi,
} from "../api/vehicles";
import { getErrorMessage } from "../api/client";

interface VehiclesState {
  items: Vehicle[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  fetch: () => Promise<void>;
  create: (input: CreateVehicleInput) => Promise<Vehicle>;
  update: (id: number, input: UpdateVehicleInput) => Promise<Vehicle>;
  remove: (id: number) => Promise<void>;
  createFuel: (input: CreateFuelInput) => Promise<void>;
  createService: (input: CreateServiceInput) => Promise<void>;
  reset: () => void;
}

export const useVehiclesStore = create<VehiclesState>((set) => ({
  items: [],
  loading: false,
  error: null,
  loaded: false,

  async fetch() {
    set({ loading: true, error: null });
    try {
      const res = await vehiclesApi.list({ offset: 0, limit: 50 });
      set({ items: Array.isArray(res.data) ? res.data : [], loading: false, loaded: true });
    } catch (err) {
      set({ loading: false, error: getErrorMessage(err) });
    }
  },

  async create(input) {
    try {
      const created = await vehiclesApi.create(input);
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
      const updated = await vehiclesApi.update(id, input);
      set((s) => ({
        items: s.items.map((v) => (v.id === id ? { ...v, ...updated } : v)),
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
      await vehiclesApi.remove(id);
      set((s) => ({ items: s.items.filter((v) => v.id !== id) }));
    } catch (err) {
      const message = getErrorMessage(err);
      set({ error: message });
      throw new Error(message);
    }
  },

  async createFuel(input) {
    try {
      await vehiclesApi.createFuel(input);
      const refreshed = await vehiclesApi.getOne(input.vehicleId);
      set((s) => ({
        items: s.items.map((v) =>
          v.id === input.vehicleId ? { ...v, ...refreshed } : v,
        ),
      }));
    } catch (err) {
      const message = getErrorMessage(err);
      set({ error: message });
      throw new Error(message);
    }
  },

  async createService(input) {
    try {
      await vehiclesApi.createService(input);
      const refreshed = await vehiclesApi.getOne(input.vehicleId);
      set((s) => ({
        items: s.items.map((v) =>
          v.id === input.vehicleId ? { ...v, ...refreshed } : v,
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
