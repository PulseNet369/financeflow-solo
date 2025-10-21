export const ASSET_CATEGORIES = [
  'Stocks',
  'Crypto',
  'Cash',
  'Cash at Bank',
  'Savings',
  'Precious Metals',
  'Real Estate',
  'Vehicles',
  'Pension',
  'Other Investments',
] as const;

export const LIABILITY_CATEGORIES = [
  'Mortgage',
  'Student Loan',
  'Car Loan',
  'Personal Loan',
  'Medical Debt',
  'Tax Debt',
  'Other Debt',
] as const;

export type AssetCategory = typeof ASSET_CATEGORIES[number];
export type LiabilityCategory = typeof LIABILITY_CATEGORIES[number];

export interface Asset {
  id: string;
  name: string;
  value: number;
  category: AssetCategory;
  description?: string;
  createdAt: string;
}

export interface Liability {
  id: string;
  name: string;
  value: number;
  category: LiabilityCategory;
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
  accountId?: string; // Links to Asset or Liability
  accountType?: 'asset' | 'liability' | 'creditCard';
  dayOfMonth?: number; // Day of month when due (1-31)
  status: 'estimated' | 'confirmed';
  lastConfirmedDate?: string;
  lastConfirmedAmount?: number;
  createdAt: string;
}

export interface NetWorthSnapshot {
  date: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  totalCreditDebt: number;
  availableCredit: number;
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
  netWorthHistory: NetWorthSnapshot[];
}
