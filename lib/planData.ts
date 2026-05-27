export interface Plan {
  id: number;
  name: string;
  price: number;
  validity: string;
  owners: number;
  maxVehicles: string;
  maxCustomers: string;
  managerAccess: boolean;
  features: string[];
  color: string;
  textColor: string;
  badge: string;
}

export const defaultPlans: Plan[] = [
  {
    id: 1,
    name: "Free",
    price: 0,
    validity: "Unlimited",
    owners: 620,
    maxVehicles: "1",
    maxCustomers: "5",
    managerAccess: false,
    features: [
      "1 Vehicle",
      "5 Customers",
      "Basic Work Entry",
      "View Reports",
    ],
    color: "#F5F4F0",
    textColor: "#6B6560",
    badge: "badge-free",
  },
  {
    id: 2,
    name: "Bronze",
    price: 299,
    validity: "30 days",
    owners: 380,
    maxVehicles: "1",
    maxCustomers: "100",
    managerAccess: false,
    features: [
      "1 Vehicle",
      "100 Customers",
      "Work Entry & Bills",
      "SMS / WhatsApp Bills",
      "Driver Management",
    ],
    color: "#FFF3E6",
    textColor: "#C05621",
    badge: "badge-bronze",
  },
  {
    id: 3,
    name: "Silver",
    price: 599,
    validity: "30 days",
    owners: 210,
    maxVehicles: "5",
    maxCustomers: "300",
    managerAccess: false,
    features: [
      "5 Vehicles",
      "300 Customers",
      "Full Work Tracking",
      "Fuel & Service Logs",
      "Priority Support",
    ],
    color: "#F3F4F6",
    textColor: "#4B5563",
    badge: "badge-silver",
  },
  {
    id: 4,
    name: "Gold",
    price: 999,
    validity: "30 days",
    owners: 74,
    maxVehicles: "10",
    maxCustomers: "500",
    managerAccess: true,
    features: [
      "10 Vehicles",
      "500 Customers",
      "Manager Access",
      "Full Analytics",
      "Fuel & Service Reports",
      "Priority 24/7 Support",
    ],
    color: "#FFFBEB",
    textColor: "#B45309",
    badge: "badge-gold",
  },
];

const STORAGE_KEY = "jcb_plans";

export function loadPlans(): Plan[] {
  if (typeof window === "undefined") return defaultPlans;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Plan[];
  } catch {}
  return defaultPlans;
}

export function savePlans(plans: Plan[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch {}
}

export function getPlanById(id: number): Plan | undefined {
  return loadPlans().find((p) => p.id === id);
}

export function upsertPlan(plan: Plan): void {
  const plans = loadPlans();
  const idx = plans.findIndex((p) => p.id === plan.id);
  if (idx >= 0) plans[idx] = plan;
  else plans.push(plan);
  savePlans(plans);
}

export function deletePlanById(id: number): void {
  savePlans(loadPlans().filter((p) => p.id !== id));
}

export function nextPlanId(): number {
  const plans = loadPlans();
  return plans.length > 0 ? Math.max(...plans.map((p) => p.id)) + 1 : 1;
}

export const planColorPresets: {
  name: string;
  color: string;
  textColor: string;
  badge: string;
}[] = [
  { name: "Free", color: "#F5F4F0", textColor: "#6B6560", badge: "badge-free" },
  {
    name: "Bronze",
    color: "#FFF3E6",
    textColor: "#C05621",
    badge: "badge-bronze",
  },
  {
    name: "Silver",
    color: "#F3F4F6",
    textColor: "#4B5563",
    badge: "badge-silver",
  },
  { name: "Gold", color: "#FFFBEB", textColor: "#B45309", badge: "badge-gold" },
  {
    name: "Custom",
    color: "#EFF6FF",
    textColor: "#1D4ED8",
    badge: "badge-free",
  },
];
