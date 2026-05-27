import styles from "../page.module.css";

interface SummaryCard {
  label: string;
  value: string;
  icon: React.FC<{ size?: number; style?: React.CSSProperties; strokeWidth?: number }>;
  accent: string;
  bg: string;
}

interface AdminSummaryProps {
  summaryCards: SummaryCard[];
}

export default function AdminSummary({ summaryCards }: AdminSummaryProps) {
  return (
    <div className={styles.summaryGrid}>
      {summaryCards.map(({ label, value, icon: Icon, accent, bg }, i) => (
        <div
          key={label}
          className={`card card-hover animate-fade-up stagger-${i + 1} ${styles.summaryCard}`}
          style={
            {
              "--card-accent": accent,
              "--card-bg": bg,
            } as React.CSSProperties
          }
        >
          <div
            style={{ background: accent, opacity: 0.8 }}
            className="absolute top-0 left-0 right-0 h-1 rounded-t-4xl"
          />
          <div className={styles.summaryCardHeader}>
            <div className={styles.summaryCardContent}>
              <p className={styles.summaryCardLabel}>{label}</p>
              <p className={styles.summaryCardValue}>{value}</p>
            </div>
            <div className={styles.summaryCardIcon} style={{ background: bg }}>
              <Icon size={17} style={{ color: accent }} strokeWidth={2} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
