/** Format stored integer INR/month for UI (matches former `price` string labels). */
export function formatPlanPriceInrPerMo(amount: number): string {
  if (amount <= 0) return "₹0/mo";
  return `₹${amount.toLocaleString("en-IN")}/mo`;
}

/** Sum of paid subscription `amount` for a plan (includes expired periods). */
export function formatCollectedRevenueInr(total: number): string {
  if (!Number.isFinite(total) || total <= 0) return "₹0";
  if (total < 1000) return `₹${Math.round(total).toLocaleString("en-IN")}`;
  if (total < 100000)
    return `₹${(total / 1000).toFixed(total % 1000 === 0 ? 0 : 1)}K`;
  return `₹${(total / 100000).toFixed(1)}L`;
}
