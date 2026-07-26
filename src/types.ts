export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name, e.g., 'Utensils', 'Home', 'Car'
  color?: string; // Optional subtle accent color identifier
  type: 'expense' | 'income' | 'both';
  isDefault?: boolean;
}

export interface Transaction {
  id?: number;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string; // ISO Format 'YYYY-MM-DD'
  note?: string;
  createdAt: number; // Timestamp
}

export interface Budget {
  id: string; // categoryId or 'category_{categoryId}'
  categoryId: string;
  monthlyLimit: number;
}

export type CurrencyCode = 'DT' | 'EUR' | 'USD' | 'TND' | 'GBP' | 'CAD' | 'MAD' | 'DZD';

export interface AppSettings {
  currency: CurrencyCode;
  currencyPosition: 'after' | 'before';
  language: 'fr' | 'en';
}

export interface TransactionFilter {
  searchQuery: string;
  type: 'all' | 'expense' | 'income';
  categoryId: string; // 'all' or category ID
  monthYear: string; // 'YYYY-MM' or 'all'
  startDate?: string;
  endDate?: string;
}

export interface CategorySpending {
  category: Category;
  total: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlyStats {
  monthYear: string; // 'YYYY-MM'
  totalIncome: number;
  totalExpense: number;
  balance: number;
  prevMonthIncome?: number;
  prevMonthExpense?: number;
  incomeChangePct?: number;
  expenseChangePct?: number;
}
