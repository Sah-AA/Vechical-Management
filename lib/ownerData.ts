export interface SubscriptionHistory {
  date: string;
  plan: string;
  amount: number;
  status: "Paid" | "Pending" | "Expired";
  duration: string;
}

export interface OwnerVehicle {
  id: number;
  registration: string;
  type: string;
  model: string;
  status: "Active" | "Idle" | "Service";
}

export interface OwnerDriver {
  id: number;
  name: string;
  mobile: string;
  status: "Active" | "Inactive";
  since: string;
}

export interface OwnerManager {
  id: number;
  name: string;
  mobile: string;
  status: "Active" | "Inactive";
  since: string;
}

export interface Owner {
  id: number;
  name: string;
  mobile: string;
  city: string;
  plan: "Free" | "Bronze" | "Silver" | "Gold";
  status: "Active" | "Pending";
  joinedDate: string;
  vehicles: OwnerVehicle[];
  drivers: OwnerDriver[];
  managers: OwnerManager[];
  subscriptionHistory: SubscriptionHistory[];
}

export const ownersData: Owner[] = [
  {
    id: 1, name: "Ramesh Patel", mobile: "9876543210", city: "Ahmedabad",
    plan: "Gold", status: "Active", joinedDate: "2022-03-10",
    vehicles: [
      { id:1, registration: "GJ-01-AB-1234", type: "JCB",     model: "JCB 3DX",        status: "Active"  },
      { id:2, registration: "GJ-01-AB-2345", type: "Tractor", model: "Mahindra 575",    status: "Active"  },
      { id:3, registration: "GJ-01-AB-3456", type: "Tractor", model: "Eicher 380",      status: "Idle"    },
      { id:4, registration: "GJ-01-AB-4567", type: "JCB",     model: "JCB JX90",        status: "Service" },
      { id:5, registration: "GJ-01-AB-5678", type: "Tractor", model: "Sonalika DI 750", status: "Active"  },
      { id:6, registration: "GJ-01-AB-6789", type: "Tractor", model: "New Holland 3630",status: "Active"  },
      { id:7, registration: "GJ-01-AB-7890", type: "Tractor", model: "Farmtrac 60",     status: "Active"  },
      { id:8, registration: "GJ-01-AB-8901", type: "JCB",     model: "JCB 2DX",         status: "Idle"    },
    ],
    drivers: [
      { id:1, name: "Sunil Kumar",   mobile: "9111000001", status: "Active",   since: "Mar 2022" },
      { id:2, name: "Ramesh Singh",  mobile: "9111000002", status: "Active",   since: "May 2022" },
      { id:3, name: "Vikram Patel",  mobile: "9111000003", status: "Inactive", since: "Aug 2023" },
    ],
    managers: [
      { id:1, name: "Bhavesh Patel", mobile: "9111111111", status: "Active", since: "Jan 2025" },
      { id:2, name: "Chirag Patel",  mobile: "9222222222", status: "Active", since: "Mar 2025" },
    ],
    subscriptionHistory: [
      { date: "2026-01-01", plan: "Gold",   amount: 4999, status: "Paid",    duration: "Jan 2026 – Dec 2026" },
      { date: "2025-01-01", plan: "Gold",   amount: 4999, status: "Paid",    duration: "Jan 2025 – Dec 2025" },
      { date: "2024-01-01", plan: "Silver", amount: 2999, status: "Paid",    duration: "Jan 2024 – Dec 2024" },
      { date: "2023-01-01", plan: "Bronze", amount: 1499, status: "Paid",    duration: "Jan 2023 – Dec 2023" },
      { date: "2022-03-10", plan: "Free",   amount: 0,    status: "Expired", duration: "Mar 2022 – Dec 2022" },
    ],
  },
  {
    id: 2, name: "Suresh Kumar", mobile: "9123456780", city: "Surat",
    plan: "Silver", status: "Active", joinedDate: "2023-06-15",
    vehicles: [
      { id:1, registration: "GJ-05-CD-1111", type: "Tractor", model: "MF 241",         status: "Active" },
      { id:2, registration: "GJ-05-CD-2222", type: "Tractor", model: "Mahindra 265",    status: "Active" },
      { id:3, registration: "GJ-05-CD-3333", type: "JCB",     model: "JCB 3DX",         status: "Idle"   },
      { id:4, registration: "GJ-05-CD-4444", type: "Tractor", model: "Sonalika DI 60",  status: "Active" },
    ],
    drivers: [
      { id:4, name: "Mahesh Yadav",  mobile: "9222000001", status: "Active", since: "Jun 2023" },
      { id:5, name: "Dinesh Solanki",mobile: "9222000002", status: "Active", since: "Sep 2023" },
    ],
    managers: [
      { id:3, name: "Farhan Siddiqui", mobile: "9333333333", status: "Active", since: "Jul 2023" },
    ],
    subscriptionHistory: [
      { date: "2026-01-01", plan: "Silver", amount: 2999, status: "Paid",    duration: "Jan 2026 – Dec 2026" },
      { date: "2025-01-01", plan: "Silver", amount: 2999, status: "Paid",    duration: "Jan 2025 – Dec 2025" },
      { date: "2023-06-15", plan: "Free",   amount: 0,    status: "Expired", duration: "Jun 2023 – Dec 2023" },
    ],
  },
  {
    id: 3, name: "Mahesh Joshi", mobile: "9988776655", city: "Rajkot",
    plan: "Free", status: "Pending", joinedDate: "2025-08-01",
    vehicles: [
      { id:1, registration: "GJ-03-EF-5555", type: "Tractor", model: "Eicher 241", status: "Active" },
    ],
    drivers: [],
    managers: [],
    subscriptionHistory: [
      { date: "2025-08-01", plan: "Free", amount: 0, status: "Expired", duration: "Aug 2025 – Present" },
    ],
  },
  {
    id: 4, name: "Dinesh Solanki", mobile: "9765432109", city: "Vadodara",
    plan: "Bronze", status: "Active", joinedDate: "2024-02-20",
    vehicles: [
      { id:1, registration: "GJ-07-GH-6666", type: "Tractor", model: "Farmtrac 45", status: "Active" },
    ],
    drivers: [
      { id:6, name: "Kiran Patel", mobile: "9444000001", status: "Active", since: "Mar 2024" },
    ],
    managers: [],
    subscriptionHistory: [
      { date: "2026-01-01", plan: "Bronze", amount: 1499, status: "Paid",    duration: "Jan 2026 – Dec 2026" },
      { date: "2024-02-20", plan: "Free",   amount: 0,    status: "Expired", duration: "Feb 2024 – Dec 2024" },
    ],
  },
  {
    id: 5, name: "Nilesh Parmar", mobile: "9654321098", city: "Anand",
    plan: "Gold", status: "Active", joinedDate: "2022-11-05",
    vehicles: [
      { id:1, registration: "GJ-16-IJ-7777", type: "JCB",     model: "JCB 3DX",         status: "Active"  },
      { id:2, registration: "GJ-16-IJ-8888", type: "Tractor", model: "Mahindra 575",     status: "Active"  },
      { id:3, registration: "GJ-16-IJ-9999", type: "Tractor", model: "Sonalika DI 750",  status: "Service" },
      { id:4, registration: "GJ-16-IJ-0000", type: "JCB",     model: "JCB JX90",         status: "Active"  },
      { id:5, registration: "GJ-16-IJ-0001", type: "Tractor", model: "New Holland 3630", status: "Idle"    },
      { id:6, registration: "GJ-16-IJ-0002", type: "Tractor", model: "Eicher 380",       status: "Active"  },
      { id:7, registration: "GJ-16-IJ-0003", type: "Tractor", model: "MF 241",           status: "Active"  },
      { id:8, registration: "GJ-16-IJ-0004", type: "Tractor", model: "Farmtrac 60",      status: "Active"  },
      { id:9, registration: "GJ-16-IJ-0005", type: "JCB",     model: "JCB 2DX",          status: "Active"  },
    ],
    drivers: [
      { id:7,  name: "Yogesh Trivedi", mobile: "9555000001", status: "Active",   since: "Nov 2022" },
      { id:8,  name: "Nilesh Chaudhari",mobile: "9555000002",status: "Active",   since: "Jan 2023" },
      { id:9,  name: "Rajesh Rathod",  mobile: "9555000003", status: "Inactive", since: "Apr 2024" },
    ],
    managers: [
      { id:4, name: "Darshan Parmar", mobile: "9333333333", status: "Active",   since: "Feb 2025" },
      { id:5, name: "Ekta Parmar",    mobile: "9444444444", status: "Inactive", since: "Apr 2025" },
      { id:6, name: "Faisal Khan",    mobile: "9555555555", status: "Active",   since: "May 2025" },
    ],
    subscriptionHistory: [
      { date: "2026-01-01", plan: "Gold",   amount: 4999, status: "Paid",    duration: "Jan 2026 – Dec 2026" },
      { date: "2025-01-01", plan: "Gold",   amount: 4999, status: "Paid",    duration: "Jan 2025 – Dec 2025" },
      { date: "2024-01-01", plan: "Gold",   amount: 4999, status: "Paid",    duration: "Jan 2024 – Dec 2024" },
      { date: "2022-11-05", plan: "Silver", amount: 2999, status: "Paid",    duration: "Nov 2022 – Dec 2023" },
    ],
  },
  {
    id: 6, name: "Ajay Mehta", mobile: "9345678901", city: "Bhavnagar",
    plan: "Silver", status: "Pending", joinedDate: "2024-09-12",
    vehicles: [
      { id:1, registration: "GJ-11-KL-1212", type: "Tractor", model: "Mahindra 265", status: "Active" },
      { id:2, registration: "GJ-11-KL-2323", type: "Tractor", model: "MF 241",       status: "Idle"   },
      { id:3, registration: "GJ-11-KL-3434", type: "JCB",     model: "JCB JX90",     status: "Active" },
    ],
    drivers: [
      { id:10, name: "Hitesh Desai", mobile: "9666000001", status: "Active", since: "Sep 2024" },
    ],
    managers: [
      { id:7, name: "Jaydip Mehta", mobile: "9777777777", status: "Active", since: "Oct 2024" },
    ],
    subscriptionHistory: [
      { date: "2026-01-01", plan: "Silver", amount: 2999, status: "Pending", duration: "Jan 2026 – Dec 2026" },
      { date: "2024-09-12", plan: "Free",   amount: 0,    status: "Expired", duration: "Sep 2024 – Dec 2024" },
    ],
  },
  {
    id: 7, name: "Vijay Chauhan", mobile: "9812345670", city: "Jamnagar",
    plan: "Bronze", status: "Active", joinedDate: "2025-01-20",
    vehicles: [
      { id:1, registration: "GJ-10-MN-4545", type: "Tractor", model: "Eicher 380", status: "Active" },
    ],
    drivers: [],
    managers: [],
    subscriptionHistory: [
      { date: "2026-01-01", plan: "Bronze", amount: 1499, status: "Paid",    duration: "Jan 2026 – Dec 2026" },
      { date: "2025-01-20", plan: "Free",   amount: 0,    status: "Expired", duration: "Jan 2025 – Dec 2025" },
    ],
  },
  {
    id: 8, name: "Haresh Trivedi", mobile: "9700000001", city: "Gandhinagar",
    plan: "Gold", status: "Active", joinedDate: "2021-07-14",
    vehicles: [
      { id:1,  registration: "GJ-02-OP-5656", type: "JCB",     model: "JCB 3DX",        status: "Active"  },
      { id:2,  registration: "GJ-02-OP-6767", type: "Tractor", model: "Mahindra 575",    status: "Active"  },
      { id:3,  registration: "GJ-02-OP-7878", type: "JCB",     model: "JCB JX90",        status: "Idle"    },
      { id:4,  registration: "GJ-02-OP-8989", type: "Tractor", model: "Farmtrac 60",     status: "Active"  },
      { id:5,  registration: "GJ-02-OP-9090", type: "Tractor", model: "Sonalika DI 750", status: "Service" },
      { id:6,  registration: "GJ-02-OP-0101", type: "Tractor", model: "Eicher 380",      status: "Active"  },
      { id:7,  registration: "GJ-02-OP-1212", type: "JCB",     model: "JCB 2DX",         status: "Active"  },
      { id:8,  registration: "GJ-02-OP-2323", type: "Tractor", model: "MF 241",          status: "Active"  },
      { id:9,  registration: "GJ-02-OP-3434", type: "Tractor", model: "New Holland 3630",status: "Active"  },
      { id:10, registration: "GJ-02-OP-4545", type: "Tractor", model: "Mahindra 265",    status: "Idle"    },
    ],
    drivers: [
      { id:11, name: "Sandeep Trivedi", mobile: "9888000001", status: "Active",   since: "Jul 2021" },
      { id:12, name: "Arvind Shah",     mobile: "9888000002", status: "Active",   since: "Oct 2021" },
      { id:13, name: "Prakash Nair",    mobile: "9888000003", status: "Inactive", since: "Mar 2023" },
    ],
    managers: [
      { id:8,  name: "Gaurav Trivedi", mobile: "9666666666", status: "Active", since: "Dec 2024" },
      { id:9,  name: "Hinal Shah",     mobile: "9777777777", status: "Active", since: "Feb 2025" },
    ],
    subscriptionHistory: [
      { date: "2026-01-01", plan: "Gold",   amount: 4999, status: "Paid",    duration: "Jan 2026 – Dec 2026" },
      { date: "2025-01-01", plan: "Gold",   amount: 4999, status: "Paid",    duration: "Jan 2025 – Dec 2025" },
      { date: "2024-01-01", plan: "Gold",   amount: 4999, status: "Paid",    duration: "Jan 2024 – Dec 2024" },
      { date: "2023-01-01", plan: "Silver", amount: 2999, status: "Paid",    duration: "Jan 2023 – Dec 2023" },
      { date: "2022-01-01", plan: "Bronze", amount: 1499, status: "Paid",    duration: "Jan 2022 – Dec 2022" },
      { date: "2021-07-14", plan: "Free",   amount: 0,    status: "Expired", duration: "Jul 2021 – Dec 2021" },
    ],
  },
  {
    id: 9, name: "Pravin Yadav", mobile: "9800000002", city: "Morbi",
    plan: "Free", status: "Pending", joinedDate: "2026-02-01",
    vehicles: [
      { id:1, registration: "GJ-27-QR-5050", type: "Tractor", model: "Sonalika DI 35", status: "Active" },
    ],
    drivers: [],
    managers: [],
    subscriptionHistory: [
      { date: "2026-02-01", plan: "Free", amount: 0, status: "Expired", duration: "Feb 2026 – Present" },
    ],
  },
  {
    id: 10, name: "Kalpesh Shah", mobile: "9900000003", city: "Navsari",
    plan: "Silver", status: "Active", joinedDate: "2023-10-05",
    vehicles: [
      { id:1, registration: "GJ-17-ST-6161", type: "Tractor", model: "Mahindra 575",    status: "Active" },
      { id:2, registration: "GJ-17-ST-7272", type: "JCB",     model: "JCB 3DX",         status: "Idle"   },
      { id:3, registration: "GJ-17-ST-8383", type: "Tractor", model: "New Holland 3630",status: "Active" },
      { id:4, registration: "GJ-17-ST-9494", type: "Tractor", model: "Eicher 241",      status: "Active" },
      { id:5, registration: "GJ-17-ST-0505", type: "Tractor", model: "MF 241",          status: "Active" },
    ],
    drivers: [
      { id:14, name: "Ankit Joshi",    mobile: "9900000004", status: "Active", since: "Oct 2023" },
      { id:15, name: "Biplab Mondal",  mobile: "9900000005", status: "Active", since: "Dec 2023" },
    ],
    managers: [
      { id:10, name: "Chetan Shah", mobile: "9900000006", status: "Active", since: "Nov 2023" },
    ],
    subscriptionHistory: [
      { date: "2026-01-01", plan: "Silver", amount: 2999, status: "Paid",    duration: "Jan 2026 – Dec 2026" },
      { date: "2025-01-01", plan: "Silver", amount: 2999, status: "Paid",    duration: "Jan 2025 – Dec 2025" },
      { date: "2023-10-05", plan: "Free",   amount: 0,    status: "Expired", duration: "Oct 2023 – Dec 2023" },
    ],
  },
];

export const ownerAvatarColors = [
  "#F59E0B","#EA580C","#0EA5E9","#8B5CF6",
  "#059669","#EC4899","#14B8A6","#F97316","#6366F1","#10B981",
];

export const planBadge: Record<string, string> = {
  Free: "badge-free", Bronze: "badge-bronze", Silver: "badge-silver", Gold: "badge-gold",
};
