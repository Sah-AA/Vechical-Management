"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { authApi, AuthUser, LoginInput, LoginResponse, RegisterInput } from "../api/auth";
import { getErrorMessage, getStoredToken, setStoredToken } from "../api/client";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  status: "idle" | "loading" | "authenticated" | "error";
  error: string | null;
  hasHydrated: boolean;
  login: (input: LoginInput) => Promise<LoginResponse>;
  verifyLoginOtp: (input: { email: string; otp: string }) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  setHasHydrated: (v: boolean) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      status: "idle",
      error: null,
      hasHydrated: false,

      async login(input) {
        set({ status: "loading", error: null });
        try {
          const response = await authApi.login(input);

          if (response.requiresTwoFactor) {
            set({ status: "idle", error: null });
            return response;
          }

          setStoredToken(response.access_token);
          set({
            user: response.user,
            token: response.access_token,
            status: "authenticated",
            error: null,
          });
          return response;
        } catch (err) {
          const message = getErrorMessage(err, "Failed to log in");
          set({ status: "error", error: message });
          throw new Error(message);
        }
      },

      async verifyLoginOtp(input) {
        set({ status: "loading", error: null });
        try {
          const response = await authApi.verifyLoginOtp(input);
          setStoredToken(response.access_token);
          set({
            user: response.user,
            token: response.access_token,
            status: "authenticated",
            error: null,
          });
          return response.user;
        } catch (err) {
          const message = getErrorMessage(err, "Failed to verify OTP");
          set({ status: "error", error: message });
          throw new Error(message);
        }
      },

      async register(input) {
        set({ status: "loading", error: null });
        try {
          await authApi.register(input);
          set({ status: "idle", error: null });
        } catch (err) {
          const message = getErrorMessage(err, "Failed to register");
          set({ status: "error", error: message });
          throw new Error(message);
        }
      },

      logout() {
        setStoredToken(null);
        set({
          user: null,
          token: null,
          status: "idle",
          error: null,
        });
      },

      setHasHydrated(v) {
        set({ hasHydrated: v });
      },

      clearError() {
        set({ error: null });
      },
    }),
    {
      name: "jcb.auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => {
        const token = getStoredToken();
        if (token && state) {
          state.token = token;
          state.status = "authenticated";
        }
        state?.setHasHydrated(true);
      },
    },
  ),
);
