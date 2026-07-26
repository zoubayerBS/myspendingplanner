const API_URL = import.meta.env.VITE_API_URL || '';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface UserProfile {
  uuid: string;
  email: string;
  name: string;
  isActive: boolean;
  role: string;
}

const USER_KEY = 'sp_auth_user';

function getHeaders(userId?: string): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userId) h['x-user-id'] = userId;
  return h;
}

export function saveUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getSavedUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearAuth() {
  localStorage.removeItem(USER_KEY);
}

// ── Auth ──────────────────────────────────────────────
export async function apiSignup(email: string, password: string, name: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur inscription');
  return { id: data.uuid, email: data.email, name: data.name };
}

export async function apiSignin(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/auth/signin`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur connexion');
  return { id: data.uuid, email: data.email, name: data.name };
}

export async function apiGetMe(userId: string): Promise<UserProfile> {
  const res = await fetch(`${API_URL}/api/auth/me`, { headers: getHeaders(userId) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

// ── Users (admin) ─────────────────────────────────────
export async function apiGetAllUsers(): Promise<UserProfile[]> {
  const res = await fetch(`${API_URL}/api/users`);
  return res.json();
}

export async function apiSetActive(uuid: string, isActive: boolean): Promise<void> {
  await fetch(`${API_URL}/api/users/${uuid}/activate`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ isActive }),
  });
}

export async function apiSetRole(uuid: string, role: string): Promise<void> {
  await fetch(`${API_URL}/api/users/${uuid}/role`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ role }),
  });
}

// ── Categories ────────────────────────────────────────
export async function apiFetchCategories(userId: string) {
  const res = await fetch(`${API_URL}/api/categories`, { headers: getHeaders(userId) });
  if (!res.ok) throw new Error(`Categories fetch failed: ${res.status}`);
  return res.json();
}

export async function apiAddCategory(userId: string, cat: { id: string; name: string; icon: string; type: string; isDefault?: boolean }) {
  const res = await fetch(`${API_URL}/api/categories`, {
    method: 'POST',
    headers: getHeaders(userId),
    body: JSON.stringify(cat),
  });
  if (!res.ok) throw new Error(`Add category failed: ${res.status}`);
}

export async function apiBulkCategories(userId: string, categories: any[]) {
  const res = await fetch(`${API_URL}/api/categories/bulk`, {
    method: 'POST',
    headers: getHeaders(userId),
    body: JSON.stringify({ categories }),
  });
  if (!res.ok) throw new Error(`Bulk categories failed: ${res.status}`);
}

export async function apiDeleteCategory(userId: string, catId: string) {
  const res = await fetch(`${API_URL}/api/categories/${catId}`, {
    method: 'DELETE',
    headers: getHeaders(userId),
  });
  if (!res.ok) throw new Error(`Delete category failed: ${res.status}`);
}

// ── Transactions ──────────────────────────────────────
export async function apiFetchTransactions(userId: string) {
  const res = await fetch(`${API_URL}/api/transactions`, { headers: getHeaders(userId) });
  if (!res.ok) throw new Error(`Transactions fetch failed: ${res.status}`);
  return res.json();
}

export async function apiCreateTransaction(userId: string, tx: { type: string; amount: number; categoryId: string; date: string; note: string }) {
  const res = await fetch(`${API_URL}/api/transactions`, {
    method: 'POST',
    headers: getHeaders(userId),
    body: JSON.stringify(tx),
  });
  if (!res.ok) throw new Error(`Create transaction failed: ${res.status}`);
  return res.json();
}

export async function apiUpdateTransaction(userId: string, id: number, tx: { type: string; amount: number; categoryId: string; date: string; note: string }) {
  const res = await fetch(`${API_URL}/api/transactions/${id}`, {
    method: 'PATCH',
    headers: getHeaders(userId),
    body: JSON.stringify(tx),
  });
  if (!res.ok) throw new Error(`Update transaction failed: ${res.status}`);
}

export async function apiDeleteTransaction(userId: string, id: number) {
  const res = await fetch(`${API_URL}/api/transactions/${id}`, {
    method: 'DELETE',
    headers: getHeaders(userId),
  });
  if (!res.ok) throw new Error(`Delete transaction failed: ${res.status}`);
}

// ── Budgets ───────────────────────────────────────────
export async function apiFetchBudgets(userId: string) {
  const res = await fetch(`${API_URL}/api/budgets`, { headers: getHeaders(userId) });
  if (!res.ok) throw new Error(`Budgets fetch failed: ${res.status}`);
  return res.json();
}

export async function apiSaveBudget(userId: string, categoryId: string, monthlyLimit: number) {
  const res = await fetch(`${API_URL}/api/budgets`, {
    method: 'POST',
    headers: getHeaders(userId),
    body: JSON.stringify({ categoryId, monthlyLimit }),
  });
  if (!res.ok) throw new Error(`Save budget failed: ${res.status}`);
}

export async function apiDeleteBudget(userId: string, categoryId: string) {
  const res = await fetch(`${API_URL}/api/budgets/${categoryId}`, {
    method: 'DELETE',
    headers: getHeaders(userId),
  });
  if (!res.ok) throw new Error(`Delete budget failed: ${res.status}`);
}

// ── Settings ──────────────────────────────────────────
export async function apiFetchSettings(userId: string): Promise<Record<string, string>> {
  const res = await fetch(`${API_URL}/api/settings`, { headers: getHeaders(userId) });
  if (!res.ok) throw new Error(`Settings fetch failed: ${res.status}`);
  return res.json();
}

export async function apiSaveSetting(userId: string, key: string, value: string) {
  const res = await fetch(`${API_URL}/api/settings`, {
    method: 'POST',
    headers: getHeaders(userId),
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) throw new Error(`Save setting failed: ${res.status}`);
}

// ── Reset ─────────────────────────────────────────────
export async function apiResetDatabase(userId: string) {
  const res = await fetch(`${API_URL}/api/reset`, {
    method: 'DELETE',
    headers: getHeaders(userId),
  });
  if (!res.ok) throw new Error(`Reset database failed: ${res.status}`);
}
