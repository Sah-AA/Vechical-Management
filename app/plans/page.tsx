"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import {
  Crown,
  Users,
  IndianRupee,
  Zap,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Tractor,
  UserCog,
  Loader2,
  ShoppingBag,
  TrendingUp,
  ClipboardList,
} from "lucide-react";
import styles from "./page.module.css";
import { getErrorMessage } from "../../lib/api/client";
import { plansApi, Plan } from "../../lib/api/plans";
import { subscriptionsApi } from "../../lib/api/subscriptions";
import { formatPlanPriceInrPerMo, formatCollectedRevenueInr } from "../../lib/planFormat";
import AdminSummary from "./render/admin.summary";
import UserSummary from "./render/user.summary";
import { pickActiveSubscription } from "../../lib/subscriptionPick";
import { useAuthStore } from "../../lib/store/authStore";
import { ownersApi, type Owner } from "../../lib/api/owners";
import { useConfirm } from "../../components/ui/ConfirmProvider";
import { useToast } from "../../components/ui/ToastProvider";
import { LoadingUI } from "../../components/ui/LoadingUI";
import {
  isDriverManagementFeatureLine,
  isManagerAccessFeatureLine,
  isPdfExportFeatureLine,
  planCapSummary,
  planDriverSummary,
} from "../../lib/planAutoFeatures";

const planIcons: Record<
  string,
  React.FC<{ size?: number; style?: React.CSSProperties }>
> = {
  Free: Zap,
  Bronze: Tractor,
  Silver: Users,
  Gold: Crown,
};

function toBadgeClass(badge: string) {
  return badge.replace(/_/g, "-");
}

function normalizeFeatureKey(feature: string) {
  return feature.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Lines like "3 Vehicles" / "15 Customers" duplicate Max * rows in the comparison table. */
function isRedundantLimitFeatureLine(feature: string): boolean {
  const t = feature.trim().replace(/\s+/g, " ");
  const lower = t.toLowerCase();
  if (
    !/\b(vehicle|vehicles|customer|customers|driver|drivers|work entries|work entry|jobs?)\b/.test(
      lower,
    )
  ) {
    return false;
  }
  return /^(\d+|unlimited)\b/i.test(t) || /^unlimited\b/i.test(lower);
}

function supportSummaryForPlan(plan: Plan): string | null {
  const parts = plan.features
    .map((f) => f.trim())
    .filter((f) => /^support:/i.test(f))
    .map((f) => f.replace(/^support:\s*/i, "").trim())
    .filter(Boolean);
  if (!parts.length) return null;
  return parts.join(" · ");
}

function buildPlanComparisonRows(visiblePlans: Plan[]): [string, ...string[]][] {
  const baseRows: [string, ...string[]][] = [
    ["Price", ...visiblePlans.map((p) => formatPlanPriceInrPerMo(p.price))],
    ["Max Vehicles", ...visiblePlans.map((p) => planCapSummary(p.maxVehicles))],
    ["Max Customers", ...visiblePlans.map((p) => planCapSummary(p.maxCustomers))],
    ["Max Drivers", ...visiblePlans.map((p) => planDriverSummary(p.maxDrivers ?? ""))],
    ["Max Work Entries", ...visiblePlans.map((p) => planCapSummary(p.maxWorkEntries ?? ""))],
    [
      "Manager Access",
      ...visiblePlans.map((p) => (p.managerAccess ? "✓" : "—")),
    ],
    [
      "PDF work export",
      ...visiblePlans.map((p) => (p.pdfExportEnabled ? "Included" : "—")),
    ],
  ];

  const supportCells = visiblePlans.map((p) => supportSummaryForPlan(p) ?? "—");
  if (supportCells.some((c) => c !== "—")) {
    baseRows.push(["Support", ...supportCells]);
  }

  const keyToLabel = new Map<string, string>();
  for (const plan of visiblePlans) {
    for (const feature of plan.features) {
      if (!feature.trim()) continue;
      if (isRedundantLimitFeatureLine(feature)) continue;
      if (/^support:/i.test(feature.trim())) continue;
      if (isPdfExportFeatureLine(feature)) continue;
      if (isManagerAccessFeatureLine(feature)) continue;
      if (isDriverManagementFeatureLine(feature)) continue;
      const key = normalizeFeatureKey(feature);
      if (!key) continue;
      if (!keyToLabel.has(key)) keyToLabel.set(key, feature.trim());
    }
  }

  const keys = [...keyToLabel.keys()].sort((a, b) =>
    (keyToLabel.get(a) ?? "").localeCompare(
      keyToLabel.get(b) ?? "",
      undefined,
      { sensitivity: "base" },
    ),
  );

  const featureRows: [string, ...string[]][] = keys.map((key) => [
    keyToLabel.get(key) ?? key,
    ...visiblePlans.map((p) =>
      p.features.some((f) => normalizeFeatureKey(f) === key) ? "✓" : "—",
    ),
  ]);

  return [...baseRows, ...featureRows];
}

function resolveCurrentPlanContext(
  billingProfile: Owner | null,
  plans: Plan[],
): { planId: number | null; currentPrice: number } {
  const activeSub = pickActiveSubscription(billingProfile?.subscriptions);
  if (activeSub?.planId != null) {
    return {
      planId: activeSub.planId,
      currentPrice: activeSub.plan?.price ?? 0,
    };
  }
  const freePlan = plans.find((p) => p.price === 0);
  return { planId: freePlan?.id ?? null, currentPrice: 0 };
}

/** Subscription cards and comparison table: lowest price first (Free → Bronze → Gold). */
function sortPlansByPriceAsc(plans: Plan[]): Plan[] {
  return [...plans].sort((a, b) => {
    if (a.price !== b.price) return a.price - b.price;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

export default function PlansPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [visiblePlans, setVisiblePlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingProfile, setBillingProfile] = useState<Owner | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [purchaseBusyPlanId, setPurchaseBusyPlanId] = useState<number | null>(
    null,
  );
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);

  const isAdmin = user?.role === "admin";

  async function refetchPlans() {
    const res = await plansApi.list({ offset: 0, limit: 50 });
    const plans = Array.isArray(res.data) ? res.data : [];
    setVisiblePlans(sortPlansByPriceAsc(plans));
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await plansApi.list({ offset: 0, limit: 50 });
        const plans = Array.isArray(res.data) ? res.data : [];
        if (!cancelled) setVisiblePlans(sortPlansByPriceAsc(plans));
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Failed to load plans"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user || user.role === "admin") {
      queueMicrotask(() => {
        setBillingProfile(null);
        setBillingLoading(false);
      });
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setBillingLoading(true);
    });

    (async () => {
      try {
        const self = await ownersApi.getOne(user.id);
        if (cancelled) return;
        if (user.role === "manager" && self.managerOfId) {
          const ownerRecord = await ownersApi.getOne(self.managerOfId);
          if (!cancelled) setBillingProfile(ownerRecord);
        } else if (!cancelled) {
          setBillingProfile(self);
        }
      } catch {
        if (!cancelled) setBillingProfile(null);
      } finally {
        if (!cancelled) setBillingLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const totalOwners = visiblePlans.reduce((s, p) => s + p.owners, 0);
  const paidOwners = visiblePlans
    .filter((p) => p.price > 0)
    .reduce((s, p) => s + p.owners, 0);
  const totalCollected = visiblePlans.reduce(
    (s, p) => s + (p.totalRevenue ?? 0),
    0,
  );

  const summaryCards = [
    {
      label: "Total Plans",
      value: String(visiblePlans.length),
      icon: Zap,
      accent: "#F59E0B",
      bg: "rgba(245,158,11,0.08)",
    },
    {
      label: "Total Owners",
      value: totalOwners.toLocaleString(),
      icon: Users,
      accent: "#0EA5E9",
      bg: "rgba(14,165,233,0.08)",
    },
    {
      label: "Paid Subscribers",
      value: paidOwners.toLocaleString(),
      icon: UserCog,
      accent: "#059669",
      bg: "rgba(5,150,105,0.08)",
    },
    {
      label: "Total collected",
      value: formatCollectedRevenueInr(totalCollected),
      icon: IndianRupee,
      accent: "#8B5CF6",
      bg: "rgba(139,92,246,0.08)",
    },
  ];

  const planContext = useMemo(
    () => resolveCurrentPlanContext(billingProfile, visiblePlans),
    [billingProfile, visiblePlans],
  );

  const visibleRows = useMemo(
    () => buildPlanComparisonRows(visiblePlans),
    [visiblePlans],
  );

  const navbarSubtitle =
    user?.role === "admin"
      ? "Manage subscription plans and pricing"
      : "View plans and upgrade your subscription";

  const headerHint =
    user?.role === "admin"
      ? "Create, edit and manage all subscription tiers"
      : "Compare tiers and choose the plan that fits your business";

  async function refreshBillingProfile() {
    if (!user || user.role === "admin") return;
    try {
      const self = await ownersApi.getOne(user.id);
      if (user.role === "manager" && self.managerOfId) {
        setBillingProfile(await ownersApi.getOne(self.managerOfId));
      } else {
        setBillingProfile(self);
      }
    } catch {
      setBillingProfile(null);
    }
  }

  // Keep a ref so we can cancel the Razorpay handler if the component unmounts
  const rzpRef = useRef<{
    close: () => void;
    on: (event: string, handler: () => void) => void;
  } | null>(null);

  async function handlePurchasePlan(planId: number) {
    if (!user || isAdmin) return;

    const selectedPlan = visiblePlans.find((p) => p.id === planId);

    // Free plan — use direct purchase (no payment needed)
    if (!selectedPlan || selectedPlan.price === 0) {
      try {
        setPurchaseBusyPlanId(planId);
        await subscriptionsApi.purchase(planId);
        await refreshBillingProfile();
        showToast({ title: "Free plan activated", variant: "success" });
      } catch (err) {
        showToast({
          title: "Could not activate plan",
          message: getErrorMessage(err, "Try again."),
          variant: "error",
        });
      } finally {
        setPurchaseBusyPlanId(null);
      }
      return;
    }

    // Paid plan — Razorpay checkout
    try {
      setPurchaseBusyPlanId(planId);
      const order = await subscriptionsApi.createRazorpayOrder(planId);
      setPurchaseBusyPlanId(null); // unblock UI while checkout is open

      await new Promise<void>((resolve, reject) => {
        // Dynamically load the Razorpay checkout script if not already loaded
        const loadScript = (): Promise<void> =>
          new Promise((res) => {
            if (document.getElementById("razorpay-checkout-js")) {
              res();
              return;
            }
            const s = document.createElement("script");
            s.id = "razorpay-checkout-js";
            s.src = "https://checkout.razorpay.com/v1/checkout.js";
            s.onload = () => res();
            document.body.appendChild(s);
          });

        loadScript().then(() => {
          const Razorpay = window.Razorpay;
          if (!Razorpay) {
            reject(new Error("Razorpay checkout failed to load"));
            return;
          }

          const options = {
            key: order.keyId,
            amount: order.amountInPaise,
            currency: order.currency,
            name: "JCB Tractor Management",
            description: `${order.planName} plan subscription`,
            order_id: order.orderId,
            prefill: {
              name: user.name ?? "",
              email: user.email ?? "",
            },
            theme: { color: "#f59e0b" },
            modal: {
              ondismiss: () => {
                subscriptionsApi
                  .markPaymentFailed({
                    razorpayOrderId: order.orderId,
                    errorDescription: "User dismissed checkout",
                  })
                  .catch(() => {});
                reject(new Error("Payment cancelled"));
              },
            },
            handler: async (response: {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            }) => {
              try {
                await subscriptionsApi.verifyRazorpayPayment({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
                resolve();
              } catch (e) {
                reject(e);
              }
            },
          };

          const rzp = new Razorpay(options);
          rzpRef.current = rzp;
          rzp.on("payment.failed", (resp: unknown) => {
            const r = resp as { error?: { code?: string; description?: string } };
            subscriptionsApi
              .markPaymentFailed({
                razorpayOrderId: order.orderId,
                errorCode: r.error?.code,
                errorDescription: r.error?.description,
              })
              .catch(() => {});
            reject(new Error(r.error?.description ?? "Payment failed"));
          });
          rzp.open();
        });
      });

      await refreshBillingProfile();
      showToast({ title: `${selectedPlan.name} plan activated!`, variant: "success" });
    } catch (err) {
      const msg = (err as Error).message ?? "";
      if (msg !== "Payment cancelled") {
        showToast({
          title: "Payment failed",
          message: getErrorMessage(err, "Please try again."),
          variant: "error",
        });
      }
    } finally {
      setPurchaseBusyPlanId(null);
      rzpRef.current = null;
    }
  }

  async function handleDeletePlan(plan: Plan) {
    const ok = await confirm({
      title: "Delete this plan?",
      description: `“${plan.name}” will be removed. Active subscriptions may need to be handled separately.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      destructive: true,
    });
    if (!ok) return;
    try {
      setDeletingPlanId(plan.id);
      await plansApi.remove(plan.id);
      showToast({ title: "Plan deleted", variant: "success" });
      await refetchPlans();
    } catch (err) {
      showToast({
        title: "Could not delete plan",
        message: getErrorMessage(err, "Try again."),
        variant: "error",
      });
    } finally {
      setDeletingPlanId(null);
    }
  }

  return (
    <div className={styles.mainContainer}>
      <Navbar title="Plans" subtitle={navbarSubtitle} />

      <div className={styles.contentWrapper}>
        {isAdmin && <AdminSummary summaryCards={summaryCards} />}
        {isAdmin && (
          <p
            style={{
              fontSize: 11,
              color: "var(--foreground-subtle)",
              marginTop: -6,
              marginBottom: 18,
              lineHeight: 1.45,
            }}
          >
            <strong>Total collected</strong> is the sum of paid subscription amounts per plan (all
            periods, including after expiry). <strong>Owners</strong> and{" "}
            <strong>Paid subscribers</strong> count only current active, non-expired subscriptions.
          </p>
        )}

        {!isAdmin && (
          <UserSummary
            billingProfile={billingProfile}
            loading={billingLoading}
            userRole={user?.role}
          />
        )}

        <div className={styles.headerSection}>
          <div>
            <h2 className={styles.headerContent}>Subscription Plans</h2>
            <p
              style={{
                color: "var(--foreground-subtle)",
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {headerHint}
            </p>
          </div>
          {isAdmin && (
            <button
              className="btn btn-primary"
              onClick={() => router.push("/plans/add-plan")}
            >
              <Plus size={14} /> Create Plan
            </button>
          )}
        </div>

        {loading && (
          <div className="card" style={{ padding: "18px 22px" }}>
            <LoadingUI label="Loading plans..." />
          </div>
        )}
        {error && (
          <div
            className="card"
            style={{
              padding: "12px 14px",
              border: "1px solid rgba(220,38,38,0.18)",
              background: "var(--red-light)",
              color: "var(--red)",
              fontSize: 12.5,
            }}
          >
            {error}
          </div>
        )}
        <div className={styles.plansGrid}>
          {visiblePlans.map((plan, i) => {
            const PlanIcon = planIcons[plan.name] || Zap;
            const isGold = plan.name.toLowerCase() === "gold";

            const adminStats = [
              {
                label: "Owners",
                value: plan.owners,
                icon: Users,
                color: "#0EA5E9",
              },
              {
                label: "Vehicles",
                value: planCapSummary(plan.maxVehicles),
                icon: Tractor,
                color: "#EA580C",
              },
              {
                label: "Revenue",
                value:
                  plan.price === 0
                    ? "—"
                    : formatCollectedRevenueInr(plan.totalRevenue ?? 0),
                icon: IndianRupee,
                color: "#059669",
              },
            ];

            const ownerStats = [
              {
                label: "Vehicles",
                value: planCapSummary(plan.maxVehicles),
                icon: Tractor,
                color: "#EA580C",
              },
              {
                label: "Drivers",
                value: planDriverSummary(plan.maxDrivers ?? ""),
                icon: UserCog,
                color: "#8B5CF6",
              },
              {
                label: "Customers",
                value: planCapSummary(plan.maxCustomers),
                icon: Users,
                color: "#059669",
              },
              {
                label: "Job cap",
                value: planCapSummary(plan.maxWorkEntries ?? ""),
                icon: ClipboardList,
                color: "#0EA5E9",
              },
            ];

            const statsRow = isAdmin ? adminStats : ownerStats;

            const { planId: currentPlanId, currentPrice: currentPriceNum } =
              planContext;
            const isCurrentPlan =
              currentPlanId != null && plan.id === currentPlanId;
            const isLowerTierThanCurrent =
              !isAdmin && currentPriceNum > 0 && plan.price < currentPriceNum;
            const showUpgrade =
              !isAdmin &&
              !isCurrentPlan &&
              currentPriceNum > 0 &&
              plan.price > currentPriceNum;
            const showBuy =
              !isAdmin &&
              !isCurrentPlan &&
              !isLowerTierThanCurrent &&
              !showUpgrade &&
              plan.price >= currentPriceNum;

            return (
              <div
                key={plan.id}
                className={`card card-hover animate-fade-up stagger-${i + 1} ${styles.planCard} ${isGold ? styles.planCardGold : ""}`}
              >
                {isGold && (
                  <div className={styles.planCardBadge}>
                    <Crown size={10} style={{ color: "var(--amber)" }} />
                    <span className={styles.planCardBadgeText}>
                      Most Popular
                    </span>
                  </div>
                )}

                <div className={styles.planCardHeader}>
                  <div
                    className={styles.planCardIcon}
                    style={{ background: plan.color }}
                  >
                    <PlanIcon size={20} style={{ color: plan.textColor }} />
                  </div>
                  <div className={styles.planCardTitleSection}>
                    <div className={styles.planCardTitleRow}>
                      <h3 className={styles.planCardTitle}>{plan.name}</h3>
                      <span className={`badge ${toBadgeClass(plan.badge)}`}>
                        {formatPlanPriceInrPerMo(plan.price)}
                      </span>
                    </div>
                    <p className={styles.planCardDescription}>
                      <span className={styles.planValidityHighlight}>
                        {(plan.validity ?? "").trim() || "—"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className={styles.planCardStats}>
                  {statsRow.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className={styles.planCardStatItem}>
                      <div className={styles.planCardStatLabel}>
                        <Icon size={12} style={{ color }} />
                        <span className={styles.planCardStatLabelText}>
                          {label}
                        </span>
                      </div>
                      <p className={styles.planCardStatValue}>{value}</p>
                    </div>
                  ))}
                </div>

                <div className={styles.planCardFeatures}>
                  <p className={styles.planCardFeaturesLabel}>
                    Included Features
                  </p>
                  <div className={styles.planCardFeaturesList}>
                    {plan.features.map((f) => (
                      <div key={f} className={styles.planCardFeatureItem}>
                        <CheckCircle2
                          size={13}
                          className={styles.planCardFeatureIcon}
                        />
                        <span className={styles.planCardFeatureText}>{f}</span>
                      </div>
                    ))}
                    {plan.managerAccess && (
                      <div className={styles.planCardFeatureItem}>
                        <CheckCircle2
                          size={13}
                          className={styles.planCardFeatureIconAmber}
                        />
                        <span className={styles.planCardFeatureTextBold}>
                          Manager Role Access
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.planCardFooter}>
                  {isAdmin ? (
                    <>
                      <button
                        className="btn btn-ghost"
                        style={{
                          flex: 1,
                          justifyContent: "center",
                          fontSize: 13,
                        }}
                        onClick={() =>
                          router.push(`/plans/add-plan?edit=true&id=${plan.id}`)
                        }
                      >
                        <Edit2 size={13} /> Edit Plan
                      </button>
                      {plan.name.trim().toLowerCase() !== "free" && (
                        <button
                          className={`btn btn-ghost ${styles.planCardButtonDelete}`}
                          style={{
                            flex: 1,
                            justifyContent: "center",
                            fontSize: 13,
                          }}
                          onClick={() => void handleDeletePlan(plan)}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </>
                  ) : isCurrentPlan ? (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        fontSize: 13,
                        opacity: 0.65,
                        cursor: "default",
                      }}
                    >
                      Current plan
                    </button>
                  ) : isLowerTierThanCurrent ? (
                    <span
                      style={{
                        flex: 1,
                        textAlign: "center",
                        fontSize: 12.5,
                        color: "var(--foreground-subtle)",
                        padding: "8px 0",
                      }}
                    >
                      Lower tier
                    </span>
                  ) : showUpgrade ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={purchaseBusyPlanId !== null}
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        fontSize: 13,
                      }}
                      onClick={() => void handlePurchasePlan(plan.id)}
                    >
                      {purchaseBusyPlanId === plan.id ? (
                        <Loader2
                          size={13}
                          style={{
                            animation: "spin 0.9s linear infinite",
                          }}
                        />
                      ) : (
                        <TrendingUp size={13} />
                      )}{" "}
                      Upgrade
                    </button>
                  ) : showBuy ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={purchaseBusyPlanId !== null}
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        fontSize: 13,
                      }}
                      onClick={() => void handlePurchasePlan(plan.id)}
                    >
                      {purchaseBusyPlanId === plan.id ? (
                        <Loader2
                          size={13}
                          style={{
                            animation: "spin 0.9s linear infinite",
                          }}
                        />
                      ) : (
                        <ShoppingBag size={13} />
                      )}{" "}
                      Buy
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className={`card animate-fade-up stagger-5 ${styles.comparisonCard}`}
        >
          <div className={styles.comparisonHeader}>
            <h2 className={styles.comparisonTitle}>Plan Comparison</h2>
            <p className={styles.comparisonDescription}>
              Feature-wise comparison across all plans
            </p>
          </div>
          <div className={styles.comparisonTableWrapper}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  {visiblePlans.map((p) => (
                    <th key={p.id} style={{ textAlign: "center" }}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map(([feature, ...values]) => (
                  <tr key={feature}>
                    <td className={styles.tableFeature}>{feature}</td>
                    {values.map((v, j) => (
                      <td
                        key={j}
                        style={{ textAlign: "center" }}
                        className={
                          v === "✓"
                            ? styles.tableValueCheckmarkBold
                            : v === "—"
                              ? styles.tableValueDash
                              : styles.tableValueDefault
                        }
                      >
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {deletingPlanId !== null && (
        <LoadingUI overlay label="Deleting plan..." />
      )}
    </div>
  );
}
