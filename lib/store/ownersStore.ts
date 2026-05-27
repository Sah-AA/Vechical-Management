"use client";

import { create } from "zustand";
import { Owner, ownersApi } from "../api/owners";
import { getErrorMessage } from "../api/client";

interface OwnersState {
  items: Owner[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  fetch: (opts?: { limit?: number }) => Promise<void>;
  reset: () => void;
}

export const useOwnersStore = create<OwnersState>((set) => ({
  items: [],
  loading: false,
  error: null,
  loaded: false,

  async fetch(opts) {
    set({ loading: true, error: null });
    try {
      const limit = opts?.limit && opts.limit > 0 ? opts.limit : 50;
      const res = await ownersApi.list({ offset: 0, limit });
      set({ items: res.data, loading: false, loaded: true });
    } catch (err) {
      set({ loading: false, error: getErrorMessage(err) });
    }
  },

  reset() {
    set({ items: [], loading: false, error: null, loaded: false });
  },
}));
