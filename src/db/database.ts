import {
  apiFetchCategories,
  apiFetchTransactions,
  apiFetchBudgets,
  apiFetchSettings,
  apiCreateTransaction,
  apiUpdateTransaction,
  apiDeleteTransaction,
  apiSaveBudget,
  apiDeleteBudget,
  apiAddCategory,
  apiDeleteCategory,
  apiSaveSetting,
  apiBulkCategories,
} from './api';
import { Category, Transaction, Budget } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_food', name: 'Alimentation & Courses', icon: 'Utensils', type: 'expense', isDefault: true },
  { id: 'cat_housing', name: 'Logement & Loyer', icon: 'Home', type: 'expense', isDefault: true },
  { id: 'cat_transport', name: 'Transports & Carburant', icon: 'Car', type: 'expense', isDefault: true },
  { id: 'cat_bills', name: 'Factures & Abonnements', icon: 'Receipt', type: 'expense', isDefault: true },
  { id: 'cat_health', name: 'Santé & Soins', icon: 'HeartPulse', type: 'expense', isDefault: true },
  { id: 'cat_shopping', name: 'Shopping & Vêtements', icon: 'ShoppingBag', type: 'expense', isDefault: true },
  { id: 'cat_leisure', name: 'Loisirs & Sorties', icon: 'Smile', type: 'expense', isDefault: true },
  { id: 'cat_tech', name: 'Éducation & High-Tech', icon: 'Laptop', type: 'expense', isDefault: true },
  { id: 'cat_other_exp', name: 'Autres Dépenses', icon: 'MoreHorizontal', type: 'expense', isDefault: true },
  { id: 'cat_salary', name: 'Salaire', icon: 'Briefcase', type: 'income', isDefault: true },
  { id: 'cat_freelance', name: 'Freelance & Ventes', icon: 'Coins', type: 'income', isDefault: true },
  { id: 'cat_invest', name: 'Investissements', icon: 'TrendingUp', type: 'income', isDefault: true },
  { id: 'cat_gift', name: 'Cadeaux & Allocations', icon: 'Gift', type: 'income', isDefault: true },
];

export async function fetchCategories(userId: string): Promise<Category[]> {
  return apiFetchCategories(userId);
}

export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  return apiFetchTransactions(userId);
}

export async function fetchBudgets(userId: string): Promise<Budget[]> {
  return apiFetchBudgets(userId);
}

export async function fetchCurrency(userId: string): Promise<string> {
  const settings = await apiFetchSettings(userId);
  return settings.currency || 'DT';
}

export async function saveTransaction(
  txData: Omit<Transaction, 'id' | 'createdAt'> & { id?: number },
  userId: string
): Promise<void> {
  const payload = { type: txData.type, amount: txData.amount, categoryId: txData.categoryId, date: txData.date, note: txData.note || '' };
  if (txData.id) {
    await apiUpdateTransaction(userId, txData.id, payload);
  } else {
    await apiCreateTransaction(userId, payload);
  }
}

export async function deleteTransaction(id: number, userId: string): Promise<void> {
  await apiDeleteTransaction(userId, id);
}

export async function saveBudget(categoryId: string, monthlyLimit: number, userId: string): Promise<void> {
  await apiSaveBudget(userId, categoryId, monthlyLimit);
}

export async function deleteBudget(categoryId: string, userId: string): Promise<void> {
  await apiDeleteBudget(userId, categoryId);
}

export async function addCategory(cat: Omit<Category, 'id'>, userId: string): Promise<void> {
  await apiAddCategory(userId, { id: `cat_custom_${Date.now()}`, name: cat.name, icon: cat.icon, type: cat.type, isDefault: false });
}

export async function deleteCategory(id: string, userId: string): Promise<void> {
  await apiDeleteCategory(userId, id);
}

export async function updateCurrency(newCurrency: string, userId: string): Promise<void> {
  await apiSaveSetting(userId, 'currency', newCurrency);
}

export async function initializeDatabase(userId: string): Promise<void> {
  const cats = await fetchCategories(userId);
  if (cats.length === 0) {
    await apiBulkCategories(userId, DEFAULT_CATEGORIES.map((c) => ({
      id: c.id, name: c.name, icon: c.icon, type: c.type, isDefault: c.isDefault,
    })));
  }
  const settings = await apiFetchSettings(userId);
  if (!settings.currency) {
    await apiSaveSetting(userId, 'currency', 'DT');
  }
}
