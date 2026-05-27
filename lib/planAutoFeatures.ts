/**
 * Plan "Plan Features" list: limit summaries + toggles are derived from form fields
 * and merged with admin extras + support text on save. Used by add/edit plan and
 * comparison-table dedupe.
 */

export function isSupportFeatureLine(feature: string): boolean {
  return feature.trim().toLowerCase().includes("support");
}

/** Drivers disabled: empty field or explicit 0. */
export function isDriverManagementEnabled(maxDriversRaw: string): boolean {
  const t = maxDriversRaw.trim().toLowerCase();
  if (!t) return false;
  if (t === "0") return false;
  return true;
}

/** Empty → unlimited (stored as "Unlimited"). */
export function toBackendResourceCap(raw: string): string {
  const t = raw.trim();
  if (!t) return "Unlimited";
  const low = t.toLowerCase();
  if (low.includes("unlimited") || low === "∞") return "Unlimited";
  return t;
}

/** Empty or 0 → "0" (no driver slots / no driver management). */
export function toBackendMaxDrivers(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (!t || t === "0") return "0";
  if (t.includes("unlimited") || t === "∞") return "Unlimited";
  return raw.trim();
}

/** Short label for subtitle / preview (empty → Unlimited). */
export function planCapSummary(raw: string): string {
  const t = raw.trim();
  if (!t) return "Unlimited";
  const low = t.toLowerCase();
  if (low.includes("unlimited") || low === "∞") return "Unlimited";
  const m = raw.trim().match(/\d+/);
  return m ? m[0] : raw.trim();
}

function capWord(raw: string): string {
  return planCapSummary(raw);
}

export function planDriverSummary(raw: string): string {
  if (!isDriverManagementEnabled(raw)) return "None";
  return planCapSummary(raw);
}


export function buildAutoPlanFeatureLines(args: {
  maxVehicles: string;
  maxCustomers: string;
  maxDrivers: string;
  maxWorkEntries: string;
  pdfExportEnabled: boolean;
  managerAccess: boolean;
}): string[] {
  const lines: string[] = [];
  lines.push(`${capWord(args.maxVehicles)} vehicles`);
  lines.push(`${capWord(args.maxCustomers)} customers`);
  if (isDriverManagementEnabled(args.maxDrivers)) {
    lines.push(`${capWord(args.maxDrivers)} drivers`);
  }
  lines.push(`${capWord(args.maxWorkEntries)} work entries`);
  if (args.pdfExportEnabled) lines.push("PDF work entries export");
  if (args.managerAccess) lines.push("Manager access");
  if (isDriverManagementEnabled(args.maxDrivers)) {
    lines.push("Driver management");
  }
  return lines;
}

const AUTO_LINE_RES: RegExp[] = [
  /^(\d+|Unlimited) vehicles$/i,
  /^(\d+|Unlimited) customers$/i,
  /^(\d+|Unlimited) drivers$/i,
  /^(\d+|Unlimited) work entries$/i,
  /^PDF work entries export$/i,
  /^Manager access(\s*\(.*\))?$/i,
  /^Driver management$/i,
];

export function isAutoStoredPlanFeatureLine(line: string): boolean {
  const t = line.trim().replace(/\s+/g, " ");
  return AUTO_LINE_RES.some((re) => re.test(t));
}

export function isPdfExportFeatureLine(feature: string): boolean {
  const l = feature.trim().toLowerCase();
  return l.includes("pdf") && (l.includes("export") || l.includes("work"));
}

export function isManagerAccessFeatureLine(feature: string): boolean {
  const l = feature.trim().toLowerCase();
  return (
    l.includes("manager") &&
    (l.includes("access") || l.includes("role") || l.includes("sub-manager"))
  );
}

export function isDriverManagementFeatureLine(feature: string): boolean {
  return feature.trim().toLowerCase().includes("driver management");
}

export function partitionStoredPlanFeatures(features: string[]): {
  supportText: string;
  extras: string[];
} {
  const extras: string[] = [];
  const supportBits: string[] = [];
  for (const raw of features) {
    const t = raw.trim();
    if (!t) continue;
    if (isAutoStoredPlanFeatureLine(t)) continue;
    if (/^support:/i.test(t)) {
      supportBits.push(t.replace(/^support:\s*/i, "").trim() || t);
      continue;
    }
    extras.push(raw);
  }
  return { supportText: supportBits.join(" · "), extras };
}

export function formatSupportFeatureLine(supportText: string): string {
  const t = supportText.trim();
  if (!t) return "";
  if (/^support:/i.test(t)) return t.trim();
  return `Support: ${t.trim()}`;
}
