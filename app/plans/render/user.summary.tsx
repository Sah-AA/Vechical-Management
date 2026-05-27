import styles from "../page.module.css";
import { Role } from "../../../lib/api/auth";
import {
  CalendarDays,
  CheckCircle2,
  Crown,
  Hourglass,
  IndianRupee,
  Layers,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { Owner } from "../../../lib/api/owners";
import { formatPlanPriceInrPerMo } from "../../../lib/planFormat";
import { pickActiveSubscription } from "../../../lib/subscriptionPick";

interface UserSummaryProps {
  userRole?: Role;
  billingProfile: Owner | null;
  loading?: boolean;
}

function formatDate(iso: string | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatRemainingDays(endDate: string | undefined) {
  if (!endDate) return "—";
  const end = new Date(endDate).getTime();
  if (Number.isNaN(end)) return "—";
  const diff = Math.ceil((end - Date.now()) / 86400000);
  if (diff <= 0) return "Expired";
  return `${diff} day${diff === 1 ? "" : "s"}`;
}

export default function UserSummary({
  userRole,
  billingProfile,
  loading,
}: UserSummaryProps) {
  if (!userRole || !["owner", "manager"].includes(userRole)) {
    return null;
  }

  if (loading) {
    return (
      <div
        className={`card ${styles.userSummaryCard} ${styles.userSummaryCardLoading}`}
      >
        <div className={styles.userSummaryLoadingInner}>
          <Loader2
            size={20}
            className={styles.userSummarySpinner}
            aria-hidden
          />
          <p className={styles.userSummaryLoadingText}>Loading your plan…</p>
        </div>
      </div>
    );
  }

  const activeSub = pickActiveSubscription(billingProfile?.subscriptions);

  if (!activeSub?.plan) {
    return (
      <div
        className={`card ${styles.userSummaryCard} ${styles.userSummaryCardEmpty}`}
      >
        <div className={styles.userSummaryEmptyInner}>
          <div
            className={`${styles.userSummaryIconWrap} ${styles.userSummaryIconMuted}`}
          >
            <Layers size={22} strokeWidth={1.75} aria-hidden />
          </div>
          <p className={styles.userSummaryEmptyTitle}>No active plan</p>
          <p className={styles.userSummaryEmptyHint}>
            Choose a plan below to get started.
          </p>
        </div>
      </div>
    );
  }

  const priceLabel =
    activeSub.amount > 0
      ? `₹${activeSub.amount.toLocaleString("en-IN")}`
      : formatPlanPriceInrPerMo(activeSub.plan.price);

  const remainingLabel = formatRemainingDays(activeSub.endDate);

  const planNameLower = activeSub.plan.name.trim().toLowerCase();
  const HeaderIcon =
    planNameLower === "gold"
      ? Crown
      : planNameLower === "free"
        ? Sparkles
        : Layers;

  return (
    <div className={`card ${styles.userSummaryCard}`}>
      <div className={styles.userSummaryHeader}>
        <div className={styles.userSummaryHeaderMain}>
          <div
            className={`${styles.userSummaryHeroIcon} ${
              planNameLower === "gold"
                ? styles.userSummaryHeroGold
                : planNameLower === "free"
                  ? styles.userSummaryHeroFree
                  : styles.userSummaryHeroDefault
            }`}
          >
            <HeaderIcon size={26} strokeWidth={1.75} aria-hidden />
          </div>
          <div>
            <p className={styles.userSummaryEyebrow}>
              <Sparkles size={12} style={{ opacity: 0.85 }} aria-hidden />
              Your subscription
            </p>
            <h3 className={styles.userSummaryPlanName}>
              {activeSub.plan.name}
            </h3>
          </div>
        </div>
        <div className={styles.userSummaryBadge}>
          <CheckCircle2 size={16} strokeWidth={2.5} aria-hidden />
          <span>Active</span>
        </div>
      </div>

      <div className={styles.userSummaryContent}>
        <div className={styles.userSummaryRow}>
          <div className={styles.userSummaryRowLeft}>
            <span
              className={`${styles.userSummaryIconWrap} ${styles.userSummaryIconAmber}`}
            >
              <Layers size={17} strokeWidth={2} aria-hidden />
            </span>
            <span className={styles.userSummaryRowLabel}>Plan name</span>
          </div>
          <span className={styles.userSummaryRowValue}>
            {activeSub.plan.name}
          </span>
        </div>
        <div className={styles.userSummaryRow}>
          <div className={styles.userSummaryRowLeft}>
            <span
              className={`${styles.userSummaryIconWrap} ${styles.userSummaryIconEmerald}`}
            >
              <IndianRupee size={17} strokeWidth={2} aria-hidden />
            </span>
            <span className={styles.userSummaryRowLabel}>Price paid</span>
          </div>
          <span className={styles.userSummaryRowValue}>{priceLabel}</span>
        </div>
        <div className={styles.userSummaryRow}>
          <div className={styles.userSummaryRowLeft}>
            <span
              className={`${styles.userSummaryIconWrap} ${styles.userSummaryIconSky}`}
            >
              <CalendarDays size={17} strokeWidth={2} aria-hidden />
            </span>
            <span className={styles.userSummaryRowLabel}>Purchase date</span>
          </div>
          <span className={styles.userSummaryRowValue}>
            {formatDate(activeSub.startDate)}
          </span>
        </div>
        <div className={styles.userSummaryRow}>
          <div className={styles.userSummaryRowLeft}>
            <span
              className={`${styles.userSummaryIconWrap} ${styles.userSummaryIconOrange}`}
            >
              <Hourglass size={17} strokeWidth={2} aria-hidden />
            </span>
            <span className={styles.userSummaryRowLabel}>Remaining expiry</span>
          </div>
          <span
            className={`${styles.userSummaryRowValue} ${
              remainingLabel === "Expired" ? styles.userSummaryValueWarn : ""
            }`}
          >
            {remainingLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
