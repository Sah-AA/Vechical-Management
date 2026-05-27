import type { Owner, OwnerSubscription } from "./api/owners";

export function pickActiveSubscription(
  subs: OwnerSubscription[] | undefined,
): OwnerSubscription | null {
  if (!subs?.length) return null;
  const now = Date.now();
  const notExpired = (s: OwnerSubscription) =>
    s.plan != null && new Date(s.endDate).getTime() > now;

  const pool = subs.filter(notExpired);
  if (!pool.length) return null;

  const active = pool.find((s) => s.status === "active");
  if (active) return active;

  const pending = pool.find((s) => s.status === "pending");
  if (pending) return pending;

  return pool[0];
}

/** Whether the owner's current (non-expired) plan allows employed manager staff. */
export function planAllowsEmployedManagers(
  owner: Owner | null | undefined,
): boolean {
  const sub = pickActiveSubscription(owner?.subscriptions);
  return Boolean(sub?.plan?.managerAccess);
}
