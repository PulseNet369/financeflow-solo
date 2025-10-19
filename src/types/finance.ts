export interface Asset {
  id: string;
  name: string;
  value: number;
  category: string;
  description?: string;
  createdAt: string;
}

export interface Liability {
  id: string;
  name: string;
  value: number;
  category: string;
  interestRate?: number;
  description?: string;
  createdAt: string;
}

export interface CreditCard {
  id: string;
  name: string;
  creditLimit: number;
  outstandingDebt: number;
  apr: number;
  paymentDay: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  recurring: boolean;
  createdAt: string;
}

export interface Settings {
  currency: string;
  theme: 'light' | 'dark';
  includeCreditInNetWorth: boolean;
}

export interface FinanceData {
  assets: Asset[];
  liabilities: Liability[];
  creditCards: CreditCard[];
  transactions: Transaction[];
  settings: Settings;
}
