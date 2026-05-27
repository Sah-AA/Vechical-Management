import { api } from "./client";
import type { OffsetPaginatedResponse } from "./client";
import type { OwnerSubscription } from "./owners";

export interface OwnerPlanRow {
  userId: number;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  joinedAt: string;
  lastSeen: string;
  subscription: {
    id: number;
    planId: number;
    planName: string | null;
    planPrice: number;
    planBadge: string | null;
    planValidity: string | null;
    status: string;
    paymentStatus: string;
    startDate: string;
    endDate: string;
    amount: number;
  } | null;
}

export interface AdminOverviewResult {
  rows: OwnerPlanRow[];
  stats: {
    totalOwners: number;
    onFreePlan: number;
    onPaidPlan: number;
    noSubscription: number;
    expired: number;
  };
  plans: { id: number; name: string; price: number; badge: string | null }[];
}

/** Row from `GET /subscriptions` (admin). */
export interface AdminSubscriptionRow {
  id: number;
  userId: number;
  planId: number;
  status: string;
  paymentStatus: string;
  amount: number;
  startDate: string;
  endDate: string;
  plan?: {
    id: number;
    name: string;
    price: number;
    validity?: string;
    badge?: string;
  };
  user?: { id: number; name: string; email: string; role: string };
}

export interface RazorpayOrderResult {
  orderId: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  keyId: string;
  planId: number;
  planName: string;
  paymentHistoryId: number;
}

export interface PaymentHistoryRow {
  id: number;
  userId: number;
  planId: number;
  subscriptionId: number | null;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amount: number;
  currency: string;
  status: "created" | "paid" | "failed" | "refunded";
  errorCode: string | null;
  errorDescription: string | null;
  createdAt: string;
  plan?: { id: number; name: string; price: number; validity: string };
  subscription?: { id: number; status: string; endDate: string } | null;
}

export const subscriptionsApi = {
  /** Admin-only direct purchase (no payment gateway). */
  async purchase(planId: number, userId?: number): Promise<OwnerSubscription> {
    const res = await api.post<OwnerSubscription>("/subscriptions/purchase", {
      planId,
      ...(userId != null ? { userId } : {}),
    });
    return res.data;
  },

  /** Step 1: Create a Razorpay order for the given paid plan. */
  async createRazorpayOrder(planId: number): Promise<RazorpayOrderResult> {
    const res = await api.post<RazorpayOrderResult>(
      "/subscriptions/razorpay/create-order",
      { planId },
    );
    return res.data;
  },

  /** Step 2: Verify payment signature and activate subscription. */
  async verifyRazorpayPayment(payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<{ subscription: OwnerSubscription; message: string }> {
    const res = await api.post<{ subscription: OwnerSubscription; message: string }>(
      "/subscriptions/razorpay/verify",
      payload,
    );
    return res.data;
  },

  /** Report a failed / dismissed checkout. */
  async markPaymentFailed(payload: {
    razorpayOrderId: string;
    errorCode?: string;
    errorDescription?: string;
  }): Promise<void> {
    await api.post("/subscriptions/razorpay/failed", payload);
  },

  /** Owner's own payment history. */
  async getPaymentHistory(): Promise<PaymentHistoryRow[]> {
    const res = await api.get<PaymentHistoryRow[]>(
      "/subscriptions/razorpay/history",
    );
    return res.data;
  },

  /** Admin: all payment history across all owners. */
  async getAdminPaymentHistory(): Promise<PaymentHistoryRow[]> {
    const res = await api.get<PaymentHistoryRow[]>(
      "/subscriptions/razorpay/history/all",
    );
    return res.data;
  },

  async listAll(
    query: { offset?: number; limit?: number } = {},
  ): Promise<OffsetPaginatedResponse<AdminSubscriptionRow>> {
    const res = await api.get<OffsetPaginatedResponse<AdminSubscriptionRow>>(
      "/subscriptions",
      { params: query },
    );
    return res.data;
  },

  /** Admin: overview of every owner's current plan. */
  async adminOverview(): Promise<AdminOverviewResult> {
    const res = await api.get<AdminOverviewResult>(
      "/subscriptions/admin/overview",
    );
    return res.data;
  },
};
