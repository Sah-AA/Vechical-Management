"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { LoadingUI } from "../../../components/ui/LoadingUI";
import { useToast } from "../../../components/ui/ToastProvider";
import { getErrorMessage } from "../../../lib/api/client";
import { Customer, customersApi } from "../../../lib/api/customers";
import { WorkEntry, workEntriesApi } from "../../../lib/api/workEntries";
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  IndianRupee,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  TrendingDown,
  TrendingUp,
  UserCog,
} from "lucide-react";
import styles from "./page.module.css";

const avatarColors = [
  "#F59E0B",
  "#EA580C",
  "#0EA5E9",
  "#8B5CF6",
  "#059669",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const { showToast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setError("Invalid customer id");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      customersApi.getOne(id),
      workEntriesApi.list({ customerId: id, limit: 200 }),
    ])
      .then(([customerData, workData]) => {
        if (cancelled) return;
        setCustomer(customerData);
        setEntries(workData.data);
        setPaymentDate(new Date().toISOString().slice(0, 10));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getErrorMessage(err, "Failed to load customer details"));
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const summary = useMemo(() => {
    const paymentsList = customer?.payments ?? [];
    const paymentsTotal = paymentsList.reduce((sum, p) => sum + p.amount, 0);
    const totalJobs = entries.length;
    const totalAmount = entries.reduce((sum, item) => sum + item.amount, 0);

    const jobPaidTotal = entries
      .filter((item) => item.status === "Paid")
      .reduce((sum, item) => sum + item.amount, 0);

    const jobPendingTotal = entries
      .filter((item) => item.status === "Pending")
      .reduce((sum, item) => sum + item.amount, 0);

    // Payments are treated as settlement against currently pending jobs only.
    // This avoids double-counting when jobs are also manually marked as Paid.
    const appliedToPending = Math.min(paymentsTotal, jobPendingTotal);
    const advanceCredit = Math.max(0, paymentsTotal - jobPendingTotal);

    const balanceDue = Math.max(0, jobPendingTotal - paymentsTotal);
    const totalCollected = Math.min(totalAmount, jobPaidTotal + appliedToPending);

    const paidJobs = entries.filter((item) => item.status === "Paid").length;
    const pendingJobs = entries.filter((item) => item.status === "Pending").length;

    const paidPercent =
      totalAmount > 0
        ? Math.min(100, Math.round((totalCollected / totalAmount) * 100))
        : 0;

    return {
      totalJobs,
      totalAmount,
      jobPaidTotal,
      jobPendingTotal,
      paymentsTotal,
      appliedToPending,
      advanceCredit,
      balanceDue,
      totalCollected,
      paidJobs,
      pendingJobs,
      paidPercent,
      paymentCount: paymentsList.length,
    };
  }, [entries, customer?.payments]);

  const avatarColor = customer ? avatarColors[customer.id % avatarColors.length] : avatarColors[0];

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number.parseFloat(paymentAmount.replace(/,/g, ""));
    if (!Number.isFinite(amt) || amt <= 0) {
      showToast({
        title: "Enter a valid amount",
        variant: "error",
      });
      return;
    }
    setPaymentSubmitting(true);
    try {
      await customersApi.createPayment(id, {
        amount: amt,
        notes: paymentNotes.trim() || undefined,
        paidAt: paymentDate || undefined,
      });
      showToast({ title: "Payment recorded", variant: "success" });
      setPaymentAmount("");
      setPaymentNotes("");
      const [customerData, workData] = await Promise.all([
        customersApi.getOne(id),
        workEntriesApi.list({ customerId: id, limit: 200 }),
      ]);
      setCustomer(customerData);
      setEntries(workData.data);
    } catch (err) {
      showToast({
        title: getErrorMessage(err, "Could not save payment"),
        variant: "error",
      });
    } finally {
      setPaymentSubmitting(false);
    }
  }

  function sendWhatsApp() {
    if (!customer) return;
    const due = summary.balanceDue;
    const msg =
      due > 0
        ? `Hello ${customer.name},\n\nYour account with us has a pending balance of ₹${due.toLocaleString()}.\nKindly clear the dues at your earliest convenience.\n\nThank you!\n- JCB Management`
        : `Hello ${customer.name},\n\nThank you for clearing all dues! Your account is fully paid.\n\n- JCB Management`;
    window.open(
      `https://wa.me/91${customer.phone}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  }

  if (loading) {
    return <LoadingUI fullPage label="Loading customer details..." />;
  }

  if (error || !customer) {
    return (
      <div className={styles.statePage}>
        <div className={styles.stateCard}>
          <p className={styles.stateText}>{error ?? "Customer not found."}</p>
          <button className="btn btn-primary" onClick={() => router.push("/customers")}>
            <ArrowLeft size={14} /> Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar
        title="Customer Details"
        subtitle={`Full profile and work history for ${customer.name}`}
      />

      <div className={styles.container}>
        <button className={`btn btn-ghost ${styles.backBtn}`} onClick={() => router.push("/customers")}>
          <ArrowLeft size={14} /> Back to Customers
        </button>

        <div className={`card animate-fade-up ${styles.headerCard}`}>
          <div className={styles.headerRow}>
            <div className={styles.identity}>
              <div className={styles.avatar} style={{ background: avatarColor, boxShadow: `0 4px 18px ${avatarColor}55` }}>
                {customer.name?.[0] ?? "C"}
              </div>
              <div>
                <h1 className={styles.name}>{customer.name}</h1>
                <div className={styles.metaRow}>
                  <span className={styles.metaItem}>
                    <Phone size={13} />
                    {customer.phone}
                  </span>
                  <span className={styles.metaItem}>
                    <MapPin size={13} />
                    {customer.address ?? "Address not provided"}
                  </span>
                </div>
                <div className={styles.badgeRow}>
                  <span className={`badge ${summary.balanceDue > 0 ? "badge-pending" : "badge-active"}`}>
                    {summary.balanceDue > 0 ? <Clock size={10} /> : <CheckCircle2 size={10} />}
                    {summary.balanceDue > 0 ? "Pending" : "Paid"}
                  </span>
                </div>
              </div>
            </div>

            {summary.balanceDue > 0 ? (
              <button className={styles.whatsAppBtn} onClick={sendWhatsApp}>
                <MessageCircle size={14} /> Send Payment Reminder
              </button>
            ) : null}
          </div>
        </div>

        <div className={styles.metricGrid}>
          {[
            { label: "Total Jobs", value: String(summary.totalJobs), icon: Briefcase, accent: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
            { label: "Total Billed", value: `₹${summary.totalAmount.toLocaleString()}`, icon: IndianRupee, accent: "#0EA5E9", bg: "rgba(14,165,233,0.08)" },
            {
              label: "Total collected",
              value: `₹${summary.totalCollected.toLocaleString()}`,
              icon: CheckCircle2,
              accent: "#059669",
              bg: "rgba(5,150,105,0.08)",
            },
            {
              label: "Balance due",
              value: `₹${summary.balanceDue.toLocaleString()}`,
              icon: Clock,
              accent: "#EA580C",
              bg: "rgba(234,88,12,0.08)",
            },
          ].map(({ label, value, icon: Icon, accent, bg }, i) => (
            <div key={label} className={`card card-hover animate-fade-up stagger-${i + 1} ${styles.metricCard}`}>
              <div className={styles.metricTopBar} style={{ background: accent }} />
              <div className={styles.metricContent}>
                <div>
                  <p className={styles.metricLabel}>{label}</p>
                  <p className={styles.metricValue}>{value}</p>
                </div>
                <div className={styles.metricIcon} style={{ background: bg }}>
                  <Icon size={17} style={{ color: accent }} strokeWidth={2} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.twoCol}>
          <div className={`card animate-fade-up ${styles.blockCard}`}>
            <h2 className={styles.blockTitle}>Payment Summary</h2>
            <div className={styles.summaryGrid}>
              <div className={styles.paidCard}>
                <p className={styles.summaryLabel}>Paid Amount</p>
                <p className={styles.summaryValuePaid}>₹{summary.totalCollected.toLocaleString()}</p>
                <p className={styles.summaryHint}>
                  {summary.paidJobs} jobs marked paid
                  {summary.paymentsTotal > 0
                    ? ` · ₹${summary.appliedToPending.toLocaleString()} applied from customer payments`
                    : ""}
                  {summary.advanceCredit > 0
                    ? ` · ₹${summary.advanceCredit.toLocaleString()} advance credit`
                    : ""}
                </p>
              </div>
              <div className={styles.pendingCard}>
                <p className={styles.summaryLabel}>Pending Amount</p>
                <p className={styles.summaryValuePending}>₹{summary.balanceDue.toLocaleString()}</p>
                <p className={styles.summaryHintPending}>
                  {summary.pendingJobs} unpaid jobs · after payments adjustment
                </p>
              </div>
            </div>
            <div>
              <div className={styles.progressHead}>
                <span className={styles.progressLabel}>Payment completion</span>
                <span className={styles.progressPercent}>{summary.paidPercent}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${summary.paidPercent}%`,
                    background:
                      summary.paidPercent === 100
                        ? "linear-gradient(90deg,#059669,#34D399)"
                        : "linear-gradient(90deg,#F59E0B,#D97706)",
                  }}
                />
              </div>
            </div>
          </div>

          <div className={`card animate-fade-up ${styles.blockCard}`}>
            <h2 className={styles.blockTitle}>Customer Info</h2>
            <div className={styles.infoList}>
              {[
                { label: "Mobile Number", value: customer.phone, icon: Phone },
                { label: "Address", value: customer.address ?? "Not provided", icon: MapPin },
                { label: "Total Work Orders", value: String(summary.totalJobs), icon: Briefcase },
                {
                  label: "Account Status",
                  value: summary.balanceDue > 0 ? "Pending" : "Paid",
                  icon: summary.balanceDue > 0 ? Clock : CheckCircle2,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className={styles.infoRow}>
                  <div className={styles.infoIconWrap}>
                    <Icon size={14} style={{ color: "var(--amber-dark)" }} />
                  </div>
                  <div>
                    <p className={styles.infoLabel}>{label}</p>
                    <p className={styles.infoValue}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`card animate-fade-up ${styles.paymentCard}`}>
          <div className={styles.paymentCardHead}>
            <div>
              <h2 className={styles.blockTitle}>Payments received</h2>
              <p className={styles.paymentIntro}>
                Record cash or transfers from this customer. Recorded amounts reduce the balance due on jobs still
                marked unpaid.
              </p>
            </div>
            <span className={styles.entryBadge}>{summary.paymentCount} recorded</span>
          </div>

          <form className={styles.paymentForm} onSubmit={handleRecordPayment}>
            <div className={styles.paymentFormGrid}>
              <label className={styles.paymentField}>
                <span className={styles.paymentLabel}>Amount (₹)</span>
                <input
                  className="input"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 20000"
                  value={paymentAmount}
                  onChange={(ev) => setPaymentAmount(ev.target.value)}
                  disabled={paymentSubmitting}
                  autoComplete="off"
                />
              </label>
              <label className={styles.paymentField}>
                <span className={styles.paymentLabel}>Payment date</span>
                <input
                  className="input"
                  type="date"
                  value={paymentDate}
                  onChange={(ev) => setPaymentDate(ev.target.value)}
                  disabled={paymentSubmitting}
                />
              </label>
              <label className={`${styles.paymentField} ${styles.paymentFieldGrow}`}>
                <span className={styles.paymentLabel}>Notes (optional)</span>
                <input
                  className="input"
                  type="text"
                  placeholder="Reference, mode of payment…"
                  value={paymentNotes}
                  onChange={(ev) => setPaymentNotes(ev.target.value)}
                  disabled={paymentSubmitting}
                  maxLength={500}
                />
              </label>
              <div className={styles.paymentSubmitWrap}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={paymentSubmitting}
                  style={{ width: "100%", gap: 8 }}
                >
                  {paymentSubmitting ? <Loader2 size={16} className={styles.spin} /> : <Banknote size={16} />}
                  Record payment
                </button>
              </div>
            </div>
          </form>

          {!customer.payments?.length ? (
            <div className={styles.paymentEmpty}>No payments recorded yet.</div>
          ) : (
            <div className={styles.paymentTableWrap}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Notes</th>
                    <th>Recorded by</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.payments.map((p, i) => (
                    <tr key={p.id}>
                      <td className={styles.serial}>{i + 1}</td>
                      <td>
                        <div className={styles.cellWithIcon}>
                          <CalendarDays size={12} className={styles.cellIconMuted} />
                          {new Date(p.paidAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className={styles.amount}>₹{p.amount.toLocaleString()}</td>
                      <td className={styles.paymentNotesCell}>{p.notes?.trim() ? p.notes : "—"}</td>
                      <td>
                        <div className={styles.cellWithIcon}>
                          <UserCog size={12} className={styles.cellIconMuted} />
                          {p.createdBy?.name ?? "—"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={`card animate-fade-up ${styles.tableCard}`}>
          <div className={styles.tableHead}>
            <div>
              <h2 className={styles.tableTitle}>Work History</h2>
              <p className={styles.tableSubtitle}>All jobs completed for {customer.name}</p>
            </div>
            <span className={styles.entryBadge}>{entries.length} entries</span>
          </div>

          {entries.length === 0 ? (
            <div className={styles.emptyState}>No work history yet.</div>
          ) : (
            <>
              <div className={styles.tableWrap}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Date</th>
                      <th>Vehicle</th>
                      <th>Driver</th>
                      <th>Hours</th>
                      <th>Amount</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, i) => (
                      <tr key={entry.id}>
                        <td className={styles.serial}>{i + 1}</td>
                        <td>
                          <div className={styles.cellWithIcon}>
                            <CalendarDays size={12} className={styles.cellIconMuted} />
                            {new Date(entry.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <div className={styles.cellWithIcon}>
                            <Car size={12} className={styles.cellIconBlue} />
                            {entry.vehicle?.name ?? "—"}
                          </div>
                        </td>
                        <td>
                          <div className={styles.cellWithIcon}>
                            <UserCog size={12} className={styles.cellIconMuted} />
                            {entry.driver?.name ?? "—"}
                          </div>
                        </td>
                        <td className={styles.hours}>{entry.hours}h</td>
                        <td className={styles.amount}>₹{entry.amount.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${entry.status === "Paid" ? "badge-active" : "badge-pending"}`}>
                            {entry.status === "Paid" ? <CheckCircle2 size={9} /> : <Clock size={9} />}
                            {entry.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.tableFooter}>
                <p className={styles.footerText}>
                  {summary.paidJobs} paid · {summary.pendingJobs} pending
                </p>
                <div className={styles.footerTotals}>
                  <div className={styles.footerItem}>
                    <TrendingUp size={13} className={styles.green} />
                    <span className={styles.footerText}>
                      Collected: <strong className={styles.green}>₹{summary.totalCollected.toLocaleString()}</strong>
                    </span>
                  </div>
                  <div className={styles.footerItem}>
                    <TrendingDown size={13} className={styles.orange} />
                    <span className={styles.footerText}>
                      Balance due: <strong className={styles.orange}>₹{summary.balanceDue.toLocaleString()}</strong>
                    </span>
                  </div>
                  {summary.advanceCredit > 0 ? (
                    <div className={styles.footerItem}>
                      <TrendingUp size={13} className={styles.green} />
                      <span className={styles.footerText}>
                        Advance credit: <strong className={styles.green}>₹{summary.advanceCredit.toLocaleString()}</strong>
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
