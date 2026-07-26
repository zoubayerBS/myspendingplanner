import { nocodb, Tables, type NocoRecord } from './nocodb';
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

function mapCategory(r: NocoRecord): Category {
  return { id: r.id || String(r.Id), name: r.name, icon: r.icon, type: r.type, isDefault: r.isDefault };
}

function mapTransaction(r: NocoRecord): Transaction {
  return { id: Number(r.Id), type: r.type, amount: Number(r.amount), categoryId: r.categoryId, date: r.date, note: r.note || '', createdAt: Number(r.createdAt) };
}

function mapBudget(r: NocoRecord): Budget {
  return { id: r.categoryId || String(r.Id), categoryId: r.categoryId, monthlyLimit: Number(r.monthlyLimit) };
}

export async function fetchCategories(): Promise<Category[]> {
  const records = await nocodb.listAll(Tables.categories);
  return records.map(mapCategory);
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const records = await nocodb.listAll(Tables.transactions);
  return records.map(mapTransaction).sort((a, b) => b.createdAt - a.createdAt);
}

export async function fetchBudgets(): Promise<Budget[]> {
  const records = await nocodb.listAll(Tables.budgets);
  return records.map(mapBudget);
}

export async function fetchCurrency(): Promise<string> {
  const records = await nocodb.list(Tables.settings);
  const found = records.find((r) => r.key === 'currency');
  return found ? String(found.value) : 'DT';
}

export async function saveTransaction(
  txData: Omit<Transaction, 'id' | 'createdAt'> & { id?: number }
): Promise<void> {
  if (txData.id) {
    const records = await nocodb.listAll(Tables.transactions);
    const existing = records.find((r) => Number(r.Id) === txData.id);
    if (existing) {
      await nocodb.update(Tables.transactions, existing.Id, {
        type: txData.type,
        amount: txData.amount,
        categoryId: txData.categoryId,
        date: txData.date,
        note: txData.note,
        createdAt: existing.createdAt,
      });
    }
  } else {
    await nocodb.create(Tables.transactions, {
      type: txData.type,
      amount: txData.amount,
      categoryId: txData.categoryId,
      date: txData.date,
      note: txData.note,
      createdAt: Date.now(),
    });
  }
}

export async function deleteTransaction(id: number): Promise<void> {
  const records = await nocodb.listAll(Tables.transactions);
  const existing = records.find((r) => Number(r.Id) === id);
  if (existing) {
    await nocodb.remove(Tables.transactions, existing.Id);
  }
}

export async function saveBudget(categoryId: string, monthlyLimit: number): Promise<void> {
  const records = await nocodb.listAll(Tables.budgets);
  const existing = records.find((r) => r.categoryId === categoryId);
  if (existing) {
    await nocodb.update(Tables.budgets, existing.Id, { categoryId, monthlyLimit });
  } else {
    await nocodb.create(Tables.budgets, { categoryId, monthlyLimit });
  }
}

export async function deleteBudget(categoryId: string): Promise<void> {
  const records = await nocodb.listAll(Tables.budgets);
  const existing = records.find((r) => r.categoryId === categoryId);
  if (existing) {
    await nocodb.remove(Tables.budgets, existing.Id);
  }
}

export async function addCategory(cat: Omit<Category, 'id'>): Promise<void> {
  await nocodb.create(Tables.categories, {
    id: `cat_custom_${Date.now()}`,
    name: cat.name,
    icon: cat.icon,
    type: cat.type,
    isDefault: false,
  });
}

export async function deleteCategory(id: string): Promise<void> {
  const records = await nocodb.listAll(Tables.categories);
  const existing = records.find((r) => r.id === id);
  if (existing) {
    await nocodb.remove(Tables.categories, existing.Id);
  }
}

export async function updateCurrency(newCurrency: string): Promise<void> {
  const records = await nocodb.list(Tables.settings);
  const existing = records.find((r) => r.key === 'currency');
  if (existing) {
    await nocodb.update(Tables.settings, existing.Id, { key: 'currency', value: newCurrency });
  } else {
    await nocodb.create(Tables.settings, { key: 'currency', value: newCurrency });
  }
}

export async function initializeDatabase(): Promise<void> {
  const catCount = await nocodb.count(Tables.categories);
  if (catCount === 0) {
    await nocodb.createBulk(Tables.categories, DEFAULT_CATEGORIES.map((c) => ({
      id: c.id, name: c.name, icon: c.icon, type: c.type, isDefault: c.isDefault,
    })));
  }

  const settingsCount = await nocodb.count(Tables.settings);
  if (settingsCount === 0) {
    await nocodb.create(Tables.settings, { key: 'currency', value: 'DT' });
  }

  const budgetCount = await nocodb.count(Tables.budgets);
  if (budgetCount === 0) {
    // No seed budgets — user creates them manually
  }
}
