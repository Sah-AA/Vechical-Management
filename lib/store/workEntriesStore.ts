"use client";

import { create } from "zustand";
import {
  WorkEntry,
  WorkEntryStats,
  CreateWorkEntryInput,
  UpdateWorkEntryInput,
  workEntriesApi,
} from "../api/workEntries";
import { getErrorMessage } from "../api/client";

interface WorkEntriesState {
  items: WorkEntry[];
  stats: WorkEntryStats | null;
  loading: boolean;
  error: string | null;
  loaded: boolean;
  fetch: () => Promise<void>;
  fetchStats: () => Promise<void>;
  create: (input: CreateWorkEntryInput) => Promise<WorkEntry>;
  update: (id: number, input: UpdateWorkEntryInput) => Promise<WorkEntry>;
  toggleStatus: (id: number) => Promise<WorkEntry>;
  remove: (id: number) => Promise<void>;
  reset: () => void;
}

export const useWorkEntriesStore = create<WorkEntriesState>((set, get) => ({
  items: [],
  stats: null,
  loading: false,
  error: null,
  loaded: false,

  async fetch() {
    set({ loading: true, error: null });
    try {
      const [list, stats] = await Promise.all([
        workEntriesApi.list({ offset: 0, limit: 50 }),
        workEntriesApi.stats(),
      ]);
      set({
        items: list.data,
        stats,
        loading: false,
        loaded: true,
      });
    } catch (err) {
      set({ loading: false, error: getErrorMessage(err) });
    }
  },

  async fetchStats() {
    try {
      const stats = await workEntriesApi.stats();
      set({ stats });
    } catch {
      // ignore — stats refresh is best-effort
    }
  },

  async create(input) {
    try {
      const created = await workEntriesApi.create(input);
      set((s) => ({ items: [created, ...s.items] }));
      get().fetchStats();
      return created;
    } catch (err) {
      const message = getErrorMessage(err);
      set({ error: message });
      throw new Error(message);
    }
  },

  async update(id, input) {
    try {
      const updated = await workEntriesApi.update(id, input);
      set((s) => ({
        items: s.items.map((e) => (e.id === id ? updated : e)),
      }));
      get().fetchStats();
      return updated;
    } catch (err) {
      const message = getErrorMessage(err);
      set({ error: message });
      throw new Error(message);
    }
  },

  async toggleStatus(id) {
    try {
      const updated = await workEntriesApi.toggleStatus(id);
      set((s) => ({
        items: s.items.map((e) => (e.id === id ? updated : e)),
      }));
      get().fetchStats();
      return updated;
    } catch (err) {
      const message = getErrorMessage(err);
      set({ error: message });
      throw new Error(message);
    }
  },

  async remove(id) {
    try {
      await workEntriesApi.remove(id);
      set((s) => ({ items: s.items.filter((e) => e.id !== id) }));
      get().fetchStats();
    } catch (err) {
      const message = getErrorMessage(err);
      set({ error: message });
      throw new Error(message);
    }
  },

  reset() {
    set({ items: [], stats: null, loading: false, error: null, loaded: false });
  },
}));
