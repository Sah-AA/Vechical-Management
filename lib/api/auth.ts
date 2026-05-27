import { api } from "./client";

export type Role = "owner" | "admin" | "manager";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface LoginInput {
  email: string;
  password: string;
}

export type LoginResponse =
  | {
      requiresTwoFactor: false;
      access_token: string;
      user: AuthUser;
    }
  | {
      requiresTwoFactor: true;
      email: string;
      message: string;
    };

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  password: string;
  business?: string;
  address: string;
  state: string;
  pincode: string;
}

export interface RegisterResponse {
  statusCode: number;
  message: string;
  data: AuthUser;
}

export const authApi = {
  async login(input: LoginInput): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>("/auth/login", input);
    return res.data;
  },

  async verifyLoginOtp(input: {
    email: string;
    otp: string;
  }): Promise<Extract<LoginResponse, { requiresTwoFactor: false }>> {
    const res = await api.post<Extract<LoginResponse, { requiresTwoFactor: false }>>(
      "/auth/verify-login-otp",
      input,
    );
    return res.data;
  },

  async register(input: RegisterInput): Promise<RegisterResponse> {
    const res = await api.post<RegisterResponse>("/auth/register", {
      ...input,
      role: "owner" as const,
    });
    return res.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await api.post<{ message: string }>("/auth/forgot-password", {
      email,
    });
    return res.data;
  },

  async resetPassword(input: {
    email: string;
    otp: string;
    password: string;
  }): Promise<{ message: string }> {
    const res = await api.post<{ message: string }>("/auth/reset-password", input);
    return res.data;
  },

  async profile(): Promise<{ userId: number; email: string; role: Role }> {
    const res = await api.get<{ userId: number; email: string; role: Role }>(
      "/users/profile",
    );
    return res.data;
  },
};
