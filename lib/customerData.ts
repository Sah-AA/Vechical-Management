export interface WorkHistoryItem {
  date: string;
  vehicle: string;
  driver: string;
  hours: number;
  amount: number;
  status: "Paid" | "Pending";
}

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  address: string;
  totalJobs: number;
  paid: number;
  pending: number;
  accountStatus: "Paid" | "Pending";
  workHistory: WorkHistoryItem[];
}

export const customersData: Customer[] = [
  {
    id: 1, name: "Ramesh Patel", mobile: "9876543210",
    address: "Village Mota, Anand, Gujarat",
    totalJobs: 12, paid: 18400, pending: 3200, accountStatus: "Pending",
    workHistory: [
      { date: "2024-05-10", vehicle: "JCB JX90",   driver: "Sunil Kumar",  hours: 4, amount: 4000, status: "Paid"    },
      { date: "2024-05-22", vehicle: "MF 241",      driver: "Ramesh Singh", hours: 6, amount: 3600, status: "Paid"    },
      { date: "2024-06-03", vehicle: "JCB JX90",   driver: "Sunil Kumar",  hours: 5, amount: 3200, status: "Pending" },
      { date: "2024-06-18", vehicle: "Eicher 380",  driver: "Mahesh Yadav", hours: 3, amount: 2100, status: "Paid"    },
      { date: "2024-07-01", vehicle: "JCB JX90",   driver: "Sunil Kumar",  hours: 6, amount: 6000, status: "Paid"    },
    ],
  },
  {
    id: 2, name: "Suresh Kumar", mobile: "9123456780",
    address: "Surat Road, Bharuch, Gujarat",
    totalJobs: 8, paid: 12000, pending: 0, accountStatus: "Paid",
    workHistory: [
      { date: "2024-04-18", vehicle: "MF 241",    driver: "Mahesh Yadav", hours: 3, amount: 6000, status: "Paid" },
      { date: "2024-05-05", vehicle: "JCB JX90", driver: "Sunil Kumar",  hours: 6, amount: 6000, status: "Paid" },
    ],
  },
  {
    id: 3, name: "Mahesh Joshi", mobile: "9988776655",
    address: "Rajkot Highway, Rajkot, Gujarat",
    totalJobs: 5, paid: 5500, pending: 2800, accountStatus: "Pending",
    workHistory: [
      { date: "2024-03-12", vehicle: "MF 241",    driver: "Ramesh Singh", hours: 4, amount: 5500, status: "Paid"    },
      { date: "2024-06-15", vehicle: "JCB JX90", driver: "Mahesh Yadav", hours: 4, amount: 2800, status: "Pending" },
    ],
  },
  {
    id: 4, name: "Dinesh Solanki", mobile: "9765432109",
    address: "Vadodara, Baroda, Gujarat",
    totalJobs: 20, paid: 38000, pending: 0, accountStatus: "Paid",
    workHistory: [
      { date: "2024-05-01", vehicle: "JCB JX90", driver: "Sunil Kumar",  hours: 8, amount: 8000, status: "Paid" },
      { date: "2024-05-20", vehicle: "MF 241",    driver: "Ramesh Singh", hours: 5, amount: 5000, status: "Paid" },
      { date: "2024-06-10", vehicle: "JCB JX90", driver: "Mahesh Yadav", hours: 7, amount: 7000, status: "Paid" },
    ],
  },
  {
    id: 5, name: "Nilesh Parmar", mobile: "9654321098",
    address: "Anand Vidyanagar, Anand, Gujarat",
    totalJobs: 3, paid: 0, pending: 9600, accountStatus: "Pending",
    workHistory: [
      { date: "2024-06-08", vehicle: "JCB JX90", driver: "Mahesh Yadav", hours: 8, amount: 9600, status: "Pending" },
    ],
  },
  {
    id: 6, name: "Ajay Mehta", mobile: "9345678901",
    address: "Bhavnagar, Gujarat",
    totalJobs: 15, paid: 22500, pending: 4500, accountStatus: "Pending",
    workHistory: [
      { date: "2024-04-25", vehicle: "MF 241",    driver: "Ramesh Singh", hours: 5, amount: 7500, status: "Paid"    },
      { date: "2024-05-30", vehicle: "JCB JX90", driver: "Sunil Kumar",  hours: 4, amount: 4500, status: "Pending" },
      { date: "2024-06-20", vehicle: "MF 241",    driver: "Mahesh Yadav", hours: 5, amount: 7500, status: "Paid"    },
    ],
  },
];

export const avatarColors = ["#F59E0B","#EA580C","#0EA5E9","#8B5CF6","#059669","#EC4899","#14B8A6","#F97316"];
