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

export async function fetchCategories(userId: string): Promise<Category[]> {
  const records = await nocodb.listAll(Tables.categories, `where=(userId,eq,${userId})`);
  return records.map(mapCategory);
}

export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  const records = await nocodb.listAll(Tables.transactions, `where=(userId,eq,${userId})`);
  return records.map(mapTransaction).sort((a, b) => b.createdAt - a.createdAt);
}

export async function fetchBudgets(userId: string): Promise<Budget[]> {
  const records = await nocodb.listAll(Tables.budgets, `where=(userId,eq,${userId})`);
  return records.map(mapBudget);
}

export async function fetchCurrency(userId: string): Promise<string> {
  const records = await nocodb.list(Tables.settings, `where=(userId,eq,${userId})`);
  const found = records.find((r) => r.key === 'currency');
  return found ? String(found.value) : 'DT';
}

export async function saveTransaction(
  txData: Omit<Transaction, 'id' | 'createdAt'> & { id?: number },
  userId: string
): Promise<void> {
  if (txData.id) {
    const records = await nocodb.listAll(Tables.transactions, `where=(userId,eq,${userId})`);
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
      userId,
    });
  }
}

export async function deleteTransaction(id: number, userId: string): Promise<void> {
  const records = await nocodb.listAll(Tables.transactions, `where=(userId,eq,${userId})`);
  const existing = records.find((r) => Number(r.Id) === id);
  if (existing) {
    await nocodb.remove(Tables.transactions, existing.Id);
  }
}

export async function saveBudget(categoryId: string, monthlyLimit: number, userId: string): Promise<void> {
  const records = await nocodb.listAll(Tables.budgets, `where=(userId,eq,${userId})`);
  const existing = records.find((r) => r.categoryId === categoryId);
  if (existing) {
    await nocodb.update(Tables.budgets, existing.Id, { categoryId, monthlyLimit });
  } else {
    await nocodb.create(Tables.budgets, { categoryId, monthlyLimit, userId });
  }
}

export async function deleteBudget(categoryId: string, userId: string): Promise<void> {
  const records = await nocodb.listAll(Tables.budgets, `where=(userId,eq,${userId})`);
  const existing = records.find((r) => r.categoryId === categoryId);
  if (existing) {
    await nocodb.remove(Tables.budgets, existing.Id);
  }
}

export async function addCategory(cat: Omit<Category, 'id'>, userId: string): Promise<void> {
  await nocodb.create(Tables.categories, {
    id: `cat_custom_${Date.now()}`,
    name: cat.name,
    icon: cat.icon,
    type: cat.type,
    isDefault: false,
    userId,
  });
}

export async function deleteCategory(id: string, userId: string): Promise<void> {
  const records = await nocodb.listAll(Tables.categories, `where=(userId,eq,${userId})`);
  const existing = records.find((r) => r.id === id);
  if (existing) {
    await nocodb.remove(Tables.categories, existing.Id);
  }
}

export async function updateCurrency(newCurrency: string, userId: string): Promise<void> {
  const records = await nocodb.list(Tables.settings, `where=(userId,eq,${userId})`);
  const existing = records.find((r) => r.key === 'currency');
  if (existing) {
    await nocodb.update(Tables.settings, existing.Id, { key: 'currency', value: newCurrency });
  } else {
    await nocodb.create(Tables.settings, { key: 'currency', value: newCurrency, userId });
  }
}

export async function initializeDatabase(userId: string): Promise<void> {
  const catRecords = await nocodb.listAll(Tables.categories, `where=(userId,eq,${userId})`);
  if (catRecords.length === 0) {
    await nocodb.createBulk(Tables.categories, DEFAULT_CATEGORIES.map((c) => ({
      id: c.id, name: c.name, icon: c.icon, type: c.type, isDefault: c.isDefault, userId,
    })));
  }

  const settingsRecords = await nocodb.list(Tables.settings, `where=(userId,eq,${userId})`);
  const hasCurrency = settingsRecords.find((r) => r.key === 'currency');
  if (!hasCurrency) {
    await nocodb.create(Tables.settings, { key: 'currency', value: 'DT', userId });
  }
}
