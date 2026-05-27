export interface SalaryRecord {
  month: string;
  salary: number;
  advance: number;
  paid: boolean;
}

export interface Driver {
  id: number;
  name: string;
  mobile: string;
  joiningDate: string;
  monthlySalary: number;
  advanceBalance: number;
  status: "Active" | "Inactive";
  salaryHistory: SalaryRecord[];
}

export const driversData: Driver[] = [
  {
    id: 1, name: "Sunil Kumar", mobile: "9876001122",
    joiningDate: "2023-01-15", monthlySalary: 14000, advanceBalance: 3000, status: "Active",
    salaryHistory: [
      { month: "Jan 2024", salary: 14000, advance: 2000, paid: true  },
      { month: "Feb 2024", salary: 14000, advance: 1000, paid: true  },
      { month: "Mar 2024", salary: 14000, advance: 0,    paid: true  },
      { month: "Apr 2024", salary: 14000, advance: 3000, paid: false },
      { month: "May 2024", salary: 14000, advance: 0,    paid: false },
    ],
  },
  {
    id: 2, name: "Ramesh Singh", mobile: "9811223344",
    joiningDate: "2022-06-10", monthlySalary: 12000, advanceBalance: 0, status: "Active",
    salaryHistory: [
      { month: "Jan 2024", salary: 12000, advance: 0, paid: true  },
      { month: "Feb 2024", salary: 12000, advance: 0, paid: true  },
      { month: "Mar 2024", salary: 12000, advance: 0, paid: true  },
      { month: "Apr 2024", salary: 12000, advance: 0, paid: true  },
      { month: "May 2024", salary: 12000, advance: 0, paid: false },
    ],
  },
  {
    id: 3, name: "Mahesh Yadav", mobile: "9900112233",
    joiningDate: "2023-08-01", monthlySalary: 11000, advanceBalance: 5500, status: "Active",
    salaryHistory: [
      { month: "Feb 2024", salary: 11000, advance: 2000, paid: true  },
      { month: "Mar 2024", salary: 11000, advance: 3500, paid: true  },
      { month: "Apr 2024", salary: 11000, advance: 0,    paid: false },
      { month: "May 2024", salary: 11000, advance: 0,    paid: false },
    ],
  },
  {
    id: 4, name: "Dinesh Verma", mobile: "9755443322",
    joiningDate: "2021-03-20", monthlySalary: 15000, advanceBalance: 0, status: "Inactive",
    salaryHistory: [
      { month: "Jan 2024", salary: 15000, advance: 0, paid: true },
      { month: "Feb 2024", salary: 15000, advance: 0, paid: true },
    ],
  },
];

export const driverAvatarColors = ["#F59E0B","#0EA5E9","#059669","#8B5CF6","#EC4899","#EA580C"];
