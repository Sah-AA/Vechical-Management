"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { LoadingUI } from "../../../components/ui/LoadingUI";
import {
  ArrowLeft, CheckCircle2, AlertCircle, Phone,
  CalendarDays, IndianRupee, Wallet,
  TrendingUp, TrendingDown, Clock, X, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { getErrorMessage } from "../../../lib/api/client";
import { Driver, driversApi, SalaryHistory } from "../../../lib/api/drivers";

/* ─── Custom Tooltip ─── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:"#141210",border:"1px solid rgba(255,255,255,0.08)",
      borderRadius:10,padding:"10px 14px",fontSize:12,color:"#F5F4F0",
      fontFamily:"DM Sans,sans-serif",
    }}>
      <p style={{ fontWeight:700,marginBottom:4,fontFamily:"Syne,sans-serif",fontSize:13 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color:p.fill }}>
          {p.name}: <strong>₹{Number(p.value ?? 0).toLocaleString()}</strong>
        </p>
      ))}
    </div>
  );
}


function SalaryPayModal({
  driver,
  month,
  amount,
  setAmount,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  driver: Driver;
  month?: string;
  amount: string;
  setAmount: (v: string) => void;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(20,18,16,0.55)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="card animate-fade-up"
        style={{ width: 430, padding: "24px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h3 style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 17 }}>Pay Salary</h3>
            <p style={{ fontSize: 12, color: "var(--foreground-subtle)", marginTop: 3 }}>
              {driver.name} · {month ?? "Current month"}
            </p>
          </div>
          <button className="btn-icon" style={{ border: "none", padding: 6 }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground-muted)", display: "block", marginBottom: 6 }}>
          Amount (optional)
        </label>
        <input
          className="input"
          type="number"
          inputMode="decimal"
          placeholder="Leave empty to pay full remaining amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={busy}
        />

        {error ? (
          <div role="alert" style={{ background: "var(--red-light)", color: "var(--red)", border: "1px solid rgba(220,38,38,0.18)", padding: "8px 12px", borderRadius: 9, fontSize: 12.5, marginTop: 12 }}>
            {error}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" onClick={onSubmit} disabled={busy}>
            {busy ? <Loader2 size={13} style={{ animation: "spin 0.9s linear infinite" }} /> : null}
            Pay now
          </button>
        </div>
      </div>
    </div>
  );
}

const SALARY_PAGE_SIZE = 10;
const driverAvatarColors = [
  "#F59E0B",
  "#0EA5E9",
  "#059669",
  "#8B5CF6",
  "#EC4899",
  "#EA580C",
];

export default function DriverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id     = Number(params.id);
  const [salaryPage, setSalaryPage] = useState(1);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingMonth, setPayingMonth] = useState<string | null>(null);
  const [payModalMonth, setPayModalMonth] = useState<string | null>(null);
  const [payAmountInput, setPayAmountInput] = useState("");
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setError("Invalid driver id");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    driversApi
      .getOne(id)
      .then((res) => {
        if (cancelled) return;
        setDriver(res);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getErrorMessage(err, "Failed to load driver details"));
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

  const salaryHistory = useMemo<SalaryHistory[]>(
    () => (driver?.salaryHistory ?? []).slice().sort((a, b) => b.month.localeCompare(a.month)),
    [driver],
  );

  async function refreshDriver() {
    const updated = await driversApi.getOne(id);
    setDriver(updated);
  }

  function handlePaySalary(month?: string) {
    setPayModalMonth(month ?? "__current__");
    setPayAmountInput("");
    setPayError(null);
  }

  async function submitPaySalary() {
    const amount = payAmountInput.trim() ? Number(payAmountInput) : undefined;
    if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
      setPayError("Please enter a valid payment amount.");
      return;
    }

    setPayingMonth(payModalMonth ?? "__current__");
    setPayError(null);
    try {
      await driversApi.paySalary(id, {
        ...(payModalMonth && payModalMonth !== "__current__" ? { month: payModalMonth } : {}),
        ...(amount ? { amount } : {}),
      });
      await refreshDriver();
      setPayModalMonth(null);
    } catch (err) {
      setPayError(getErrorMessage(err, "Failed to record salary payment"));
    } finally {
      setPayingMonth(null);
    }
  }

  if (loading) {
    return <LoadingUI fullPage label="Loading driver details..." />;
  }

  if (!driver || error) {
    return (
      <div style={{ minHeight:"100vh",background:"var(--background)",display:"flex",alignItems:"center",justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          <p style={{ fontSize:16,color:"var(--foreground-muted)" }}>{error ?? "Driver not found."}</p>
          <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => router.push("/drivers")}>
            <ArrowLeft size={14}/> Back to Drivers
          </button>
        </div>
      </div>
    );
  }

  const avatarColor = driverAvatarColors[driver.id % driverAvatarColors.length];

  const totalPayable = salaryHistory.reduce((a, s) => a + Math.max(0, s.salary - s.advance), 0);
  const totalPaid = salaryHistory.reduce((a, s) => a + (s.paidAmount ?? 0), 0);
  const totalPending = Math.max(0, totalPayable - totalPaid);
  const totalAdvanceGiven = salaryHistory.reduce((a, s) => a + s.advance, 0);
  const paidMonths  = salaryHistory.filter(s => s.paid).length;
  const pendingMonths = salaryHistory.filter(s => !s.paid).length;

  const paymentHistory = salaryHistory
    .flatMap((s) =>
      (s.payments ?? []).map((p) => ({
        ...p,
        month: s.month,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
    );

  const salaryTotalPages  = Math.max(1, Math.ceil(salaryHistory.length / SALARY_PAGE_SIZE));
  const salaryCurrentPage = Math.min(salaryPage, salaryTotalPages);
  const paginatedSalary   = salaryHistory.slice(
    (salaryCurrentPage - 1) * SALARY_PAGE_SIZE,
    salaryCurrentPage * SALARY_PAGE_SIZE
  );

  /** Align chart with table: gross & advance as bars; paid + remaining stack to net payable. */
  const chartData = salaryHistory
    .slice()
    .reverse()
    .map((s) => {
      const gross = s.salary;
      const advance = s.advance;
      const netPay = Math.max(0, gross - advance);
      const paidRaw = Math.max(0, s.paidAmount ?? 0);
      const paidTowardsNet = Math.min(paidRaw, netPay);
      const remainingNet = Math.max(0, netPay - paidTowardsNet);
      return {
        month: s.month,
        "Gross Salary": gross,
        "Advance deducted": advance,
        Paid: paidTowardsNet,
        "Still owed": remainingNet,
      };
    });

  const tenureMonths = Math.floor((Date.now() - new Date(driver.joiningDate).getTime()) / (1000 * 60 * 60 * 24 * 30));

  return (
    <div style={{ minHeight:"100vh",background:"var(--background)" }}>
      <Navbar title="Driver Details" subtitle={`Full profile and salary report for ${driver.name}`} />

      {payModalMonth !== null && (
        <SalaryPayModal
          driver={driver}
          month={payModalMonth === "__current__" ? undefined : payModalMonth}
          amount={payAmountInput}
          setAmount={setPayAmountInput}
          busy={payingMonth !== null}
          error={payError}
          onClose={() => {
            if (!payingMonth) {
              setPayModalMonth(null);
              setPayError(null);
            }
          }}
          onSubmit={submitPaySalary}
        />
      )}

      <div style={{ padding:"28px 28px 48px",display:"flex",flexDirection:"column",gap:20 }}>

        {/* Back button */}
        <div>
          <button
            className="btn btn-ghost"
            style={{ gap:7,fontSize:13 }}
            onClick={() => router.push("/drivers")}
          >
            <ArrowLeft size={14}/> Back to Drivers
          </button>
        </div>

        {/* ── Profile Header Card ── */}
        <div className="card animate-fade-up stagger-1" style={{ padding:"28px 30px" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16 }}>
            <div style={{ display:"flex",alignItems:"center",gap:18 }}>
              <div style={{
                width:64,height:64,borderRadius:18,
                background:avatarColor,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:26,color:"#141210",
                flexShrink:0,
                boxShadow:`0 4px 18px ${avatarColor}55`,
              }}>
                {driver.name[0]}
              </div>
              <div>
                <h1 style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:22,color:"var(--foreground)",letterSpacing:"-0.02em",marginBottom:6 }}>
                  {driver.name}
                </h1>
                <div style={{ display:"flex",flexWrap:"wrap",gap:12 }}>
                  <span style={{ display:"flex",alignItems:"center",gap:5,fontSize:13,color:"var(--foreground-muted)" }}>
                    <Phone size={13}/>{driver.mobile}
                  </span>
                  <span style={{ display:"flex",alignItems:"center",gap:5,fontSize:13,color:"var(--foreground-muted)" }}>
                    <CalendarDays size={13}/>Joined {new Date(driver.joiningDate).toLocaleDateString()} · {tenureMonths}m tenure
                  </span>
                </div>
                <div style={{ marginTop:8 }}>
                  <span className={`badge ${driver.status === "Active" ? "badge-active" : "badge-free"}`} style={{ fontSize:12.5 }}>
                    {driver.status === "Active" ? <CheckCircle2 size={10}/> : <AlertCircle size={10}/>}
                    {driver.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Salary highlight */}
            <div style={{ textAlign:"right" }}>
              <p style={{ fontSize:11,fontWeight:700,color:"var(--foreground-subtle)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4 }}>Monthly Salary</p>
              <p style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:28,color:"var(--amber-dark)",letterSpacing:"-0.02em" }}>
                ₹{driver.monthlySalary.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* ── Key Metrics ── */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16 }}>
          {[
            { label:"Monthly Salary",    value:`₹${driver.monthlySalary.toLocaleString()}`, icon:IndianRupee, accent:"#F59E0B", bg:"rgba(245,158,11,0.08)" },
            { label:"Advance Balance",   value:`₹${driver.advanceBalance.toLocaleString()}`,icon:Wallet,      accent:"#EA580C", bg:"rgba(234,88,12,0.08)"  },
            { label:"Total Salary Paid", value:`₹${totalPaid.toLocaleString()}`,             icon:CheckCircle2,accent:"#059669", bg:"rgba(5,150,105,0.08)"  },
            { label:"Salary Pending",    value:`₹${totalPending.toLocaleString()}`,          icon:Clock,       accent:"#0EA5E9", bg:"rgba(14,165,233,0.08)" },
          ].map(({ label, value, icon: Icon, accent, bg }, i) => (
            <div key={label} className={`card card-hover animate-fade-up stagger-${i+1}`}
              style={{ padding:"18px 20px",position:"relative",overflow:"hidden" }}>
              <div style={{ position:"absolute",top:0,left:0,right:0,height:3,background:accent,opacity:0.8,borderRadius:"16px 16px 0 0" }} />
              <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between" }}>
                <div>
                  <p style={{ color:"var(--foreground-subtle)",fontSize:11.5,fontWeight:500,marginBottom:7 }}>{label}</p>
                  <p style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:22,color:"var(--foreground)",letterSpacing:"-0.03em" }}>{value}</p>
                </div>
                <div style={{ width:38,height:38,borderRadius:10,background:bg,display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <Icon size={17} style={{ color:accent }} strokeWidth={2}/>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Chart + Info Row ── */}
        <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr",gap:16 }}>

          {/* Salary chart */}
          <div className="card animate-fade-up stagger-2" style={{ padding:"24px 26px" }}>
            <div style={{ marginBottom:18 }}>
              <h2 style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:16,color:"var(--foreground)",marginBottom:3 }}>
                Monthly Salary Report
              </h2>
              <p style={{ color:"var(--foreground-subtle)",fontSize:12 }}>
                Gross & advance per month; green + blue stack = net due (matches paid vs remaining in the table).
              </p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={14} margin={{ top:4,right:8,bottom:0,left:-12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE4" vertical={false}/>
                <XAxis dataKey="month" tick={{ fontSize:11,fill:"#A09890",fontFamily:"DM Sans,sans-serif" }} axisLine={false} tickLine={false}/>
                <YAxis
                  tick={{ fontSize:11,fill:"#A09890",fontFamily:"DM Sans,sans-serif" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
                />
                <Tooltip content={<CustomTooltip />}/>
                <Bar dataKey="Gross Salary" fill="#F59E0B" radius={[4,4,0,0]} maxBarSize={28}/>
                <Bar dataKey="Advance deducted" fill="#EA580C" radius={[4,4,0,0]} maxBarSize={28}/>
                <Bar dataKey="Paid" stackId="net" fill="#059669" radius={[0,0,0,0]} maxBarSize={36}/>
                <Bar dataKey="Still owed" stackId="net" fill="#0EA5E9" radius={[4,4,0,0]} maxBarSize={36}/>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display:"flex",flexWrap:"wrap",gap:"12px 16px",marginTop:14 }}>
              {[
                { color:"#F59E0B", label:"Gross Salary" },
                { color:"#EA580C", label:"Advance deducted" },
                { color:"#059669", label:"Paid toward net" },
                { color:"#0EA5E9", label:"Still owed" },
              ].map(l => (
                <div key={l.label} style={{ display:"flex",alignItems:"center",gap:6 }}>
                  <span style={{ width:9,height:9,borderRadius:3,background:l.color,flexShrink:0 }}/>
                  <span style={{ fontSize:12,color:"var(--foreground-muted)" }}>{l.label}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <button
                className="btn btn-primary"
                onClick={() => handlePaySalary()}
                disabled={payingMonth !== null}
              >
                {payingMonth === "__current__" ? "Paying..." : "Pay Current Month Salary"}
              </button>
            </div>
          </div>

          {/* Summary info */}
          <div className="card animate-fade-up stagger-3" style={{ padding:"24px 26px" }}>
            <h2 style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:15,color:"var(--foreground)",marginBottom:16 }}>
              Salary Summary
            </h2>
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              {[
                { label:"Months Paid",       value: String(paidMonths),                         color:"#059669", icon: CheckCircle2 },
                { label:"Months Pending",    value: String(pendingMonths),                       color:"#EA580C", icon: AlertCircle  },
                { label:"Total Advance Given",value:`₹${totalAdvanceGiven.toLocaleString()}`,   color:"#EA580C", icon: Wallet       },
                { label:"Advance Balance",   value:`₹${driver.advanceBalance.toLocaleString()}`,color:"#EA580C", icon: TrendingDown },
                { label:"Total Net Paid",    value:`₹${totalPaid.toLocaleString()}`,             color:"#059669", icon: TrendingUp   },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:"#FAFAF8",borderRadius:10,border:"1px solid var(--card-border)" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <Icon size={14} style={{ color }} strokeWidth={2}/>
                    <span style={{ fontSize:12.5,color:"var(--foreground-muted)" }}>{label}</span>
                  </div>
                  <span style={{ fontSize:13.5,fontWeight:700,color,fontFamily:"Syne,sans-serif" }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Advance balance highlight */}
            {driver.advanceBalance > 0 && (
              <div style={{ marginTop:14,padding:"12px 14px",background:"#FFF7ED",border:"1px solid #FDBA74",borderRadius:10 }}>
                <p style={{ fontSize:11,fontWeight:700,color:"#9A3412",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4 }}>
                  Outstanding Advance
                </p>
                <p style={{ fontSize:20,fontWeight:800,color:"#EA580C",fontFamily:"Syne,sans-serif" }}>
                  ₹{driver.advanceBalance.toLocaleString()}
                </p>
                <p style={{ fontSize:11,color:"#EA580C",marginTop:2 }}>To be deducted from future salary</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Salary History Table ── */}
        <div className="card animate-fade-up stagger-4" style={{ overflow:"hidden" }}>
          <div style={{ padding:"20px 26px 18px",borderBottom:"1px solid var(--card-border)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <div>
              <h2 style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:16,color:"var(--foreground)",marginBottom:2 }}>
                Salary History
              </h2>
              <p style={{ color:"var(--foreground-subtle)",fontSize:12 }}>Month-wise salary, advance & net pay breakdown</p>
            </div>
            <span style={{ fontSize:12,fontWeight:600,color:"var(--foreground-subtle)",background:"#F5F4F0",padding:"4px 12px",borderRadius:99,border:"1px solid var(--card-border)" }}>
              {salaryHistory.length} months
            </span>
          </div>

          <div style={{ overflowX:"auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width:48 }}>#</th>
                  <th>Month</th>
                  <th>Gross Salary</th>
                  <th>Advance Deducted</th>
                  <th>Net Pay</th>
                  <th>Paid Amount</th>
                  <th>Remaining</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSalary.map((s, i) => {
                  const rowNum = (salaryCurrentPage - 1) * SALARY_PAGE_SIZE + i + 1;
                  return (
                  <tr key={i}>
                    <td style={{ color:"var(--foreground-subtle)",fontSize:12,fontWeight:600 }}>#{rowNum}</td>
                    <td>
                      <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                        <CalendarDays size={12} style={{ color:"var(--foreground-subtle)" }}/>
                        <span style={{ fontSize:13,fontWeight:600,color:"var(--foreground)" }}>{s.month}</span>
                      </div>
                    </td>
                    <td style={{ fontSize:13,color:"var(--foreground)" }}>₹{s.salary.toLocaleString()}</td>
                    <td style={{ fontSize:13,color: s.advance > 0 ? "#EA580C" : "var(--foreground-subtle)", fontWeight: s.advance > 0 ? 600 : 400 }}>
                      {s.advance > 0 ? `-₹${s.advance.toLocaleString()}` : "—"}
                    </td>
                    <td>
                      <span style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:15,color:"#059669" }}>
                        ₹{Math.max(0, s.salary - s.advance).toLocaleString()}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: "#059669" }}>
                      ₹{(s.paidAmount ?? 0).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 700, color: "#EA580C" }}>
                      ₹{Math.max(0, Math.max(0, s.salary - s.advance) - (s.paidAmount ?? 0)).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className={`badge ${s.paid ? "badge-active" : "badge-pending"}`}>
                          {s.paid ? <CheckCircle2 size={9}/> : <AlertCircle size={9}/>}
                          {s.paid ? "Paid" : "Pending"}
                        </span>
                        {!s.paid && (
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "3px 8px", fontSize: 11 }}
                            onClick={() => handlePaySalary(s.month)}
                            disabled={payingMonth !== null}
                          >
                            {payingMonth === s.month ? "Paying..." : "Pay"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {salaryTotalPages > 1 && (
            <div style={{ padding:"10px 26px",borderTop:"1px solid var(--card-border)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8 }}>
              <p style={{ fontSize:12,color:"var(--foreground-subtle)" }}>
                Showing <strong>{(salaryCurrentPage-1)*SALARY_PAGE_SIZE+1}–{Math.min(salaryCurrentPage*SALARY_PAGE_SIZE, salaryHistory.length)}</strong> of <strong>{salaryHistory.length}</strong> months
              </p>
              <div style={{ display:"flex",gap:4,alignItems:"center" }}>
                <button className="btn btn-ghost" style={{ padding:"5px 11px",fontSize:12 }}
                  disabled={salaryCurrentPage===1} onClick={()=>setSalaryPage(p=>Math.max(1,p-1))}>
                  ← Prev
                </button>
                {Array.from({ length: salaryTotalPages }, (_,i) => i+1).map(pg => (
                  <button key={pg} onClick={()=>setSalaryPage(pg)} className="btn btn-ghost" style={{
                    padding:"5px 10px",fontSize:12,minWidth:32,
                    ...(pg===salaryCurrentPage ? { background:"var(--amber-glow)",border:"1px solid rgba(245,158,11,0.2)",color:"var(--amber-dark)",fontWeight:700 } : {}),
                  }}>
                    {pg}
                  </button>
                ))}
                <button className="btn btn-ghost" style={{ padding:"5px 11px",fontSize:12 }}
                  disabled={salaryCurrentPage===salaryTotalPages} onClick={()=>setSalaryPage(p=>Math.min(salaryTotalPages,p+1))}>
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ padding:"14px 26px",borderTop:"1px solid var(--card-border)",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#FAFAF8" }}>
            <p style={{ fontSize:12,color:"var(--foreground-subtle)" }}>
              {paidMonths} months paid · {pendingMonths} months pending
            </p>
            <div style={{ display:"flex",gap:20 }}>
              <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                <TrendingUp size={13} style={{ color:"#059669" }}/>
                <span style={{ fontSize:12.5,color:"var(--foreground-subtle)" }}>
                  Total Paid: <strong style={{ color:"#059669" }}>₹{totalPaid.toLocaleString()}</strong>
                </span>
              </div>
              {totalPending > 0 && (
                <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                  <TrendingDown size={13} style={{ color:"#EA580C" }}/>
                  <span style={{ fontSize:12.5,color:"var(--foreground-subtle)" }}>
                    Pending: <strong style={{ color:"#EA580C" }}>₹{totalPending.toLocaleString()}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
