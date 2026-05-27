import { api } from "./client";

export interface NotificationRow {
  id: number;
  title: string;
  message: string;
  /** Backend discriminator for routing/push; drives UI category when set */
  event?: string | null;
  targetUserId: number | null;
  targetManagerId: number | null;
  createdAt: string;
  updatedAt: string;
  targetUser?: {
    id: number;
    name: string;
    email: string;
    role: string;
  } | null;
  targetManager?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export type NotifySegment =
  | "all"
  | "free_tier"
  | "never_paid"
  | "inactive"
  | "paid_active"
  | "expired";

export interface BulkNotifyPayload {
  title: string;
  message: string;
  segment: NotifySegment;
  inactiveDays?: number;
}

export interface BulkNotifyResult {
  segment: string;
  usersTargeted: number;
  pushTokens: number;
  message: string;
}

export const notificationsApi = {
  /** Notifications for the logged-in user (broadcast + targeted). */
  async feed(): Promise<NotificationRow[]> {
    const res = await api.get<NotificationRow[]>("/api/v1/notification/feed");
    return res.data;
  },

  /** Admin: send notification to a user segment. */
  async bulkNotify(payload: BulkNotifyPayload): Promise<BulkNotifyResult> {
    const res = await api.post<BulkNotifyResult>(
      "/api/v1/notification/bulk-notify",
      payload,
    );
    return res.data;
  },

  /** Admin: broadcast to every user. */
  async sendToAll(payload: { title: string; message: string }): Promise<void> {
    await api.post("/api/v1/notification/send-notification-to-all-users", payload);
  },
};
