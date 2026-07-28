const API_URL = import.meta.env.VITE_API_URL || '';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  token: string;
  sseToken: string;
}

export interface UserProfile {
  uuid: string;
  email: string;
  name: string;
  isActive: boolean;
  role: string;
}

const USER_KEY = 'sp_auth_user';

function getHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export function getToken(): string | null {
  const user = getSavedUser();
  return user?.token || null;
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

export async function apiLogout(): Promise<void> {
  const token = getToken();
  if (!token) return;
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: getHeaders(token),
    });
  } catch {}
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
  return { id: data.uuid, email: data.email, name: data.name, token: data.token, sseToken: data.sseToken };
}

export async function apiSignin(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/auth/signin`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur connexion');
  return { id: data.uuid, email: data.email, name: data.name, token: data.token, sseToken: data.sseToken };
}

export async function apiGetMe(_userId: string): Promise<UserProfile> {
  const token = getToken();
  if (!token) throw new Error('Non autorise');
  const res = await fetch(`${API_URL}/api/auth/me`, { headers: getHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

// ── Users (admin) ─────────────────────────────────────
export async function apiGetAllUsers(): Promise<UserProfile[]> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/users`, { headers: getHeaders(token || undefined) });
  return res.json();
}

export async function apiSetActive(uuid: string, isActive: boolean): Promise<void> {
  const token = getToken();
  await fetch(`${API_URL}/api/users/${uuid}/activate`, {
    method: 'PATCH',
    headers: getHeaders(token || undefined),
    body: JSON.stringify({ isActive }),
  });
}

export async function apiSetRole(uuid: string, role: string): Promise<void> {
  const token = getToken();
  await fetch(`${API_URL}/api/users/${uuid}/role`, {
    method: 'PATCH',
    headers: getHeaders(token || undefined),
    body: JSON.stringify({ role }),
  });
}

// ── Categories ────────────────────────────────────────
export async function apiFetchCategories(_userId: string) {
  const token = getToken();
  if (!token) throw new Error('Non autorise');
  const res = await fetch(`${API_URL}/api/categories`, { headers: getHeaders(token) });
  if (!res.ok) throw new Error(`Categories fetch failed: ${res.status}`);
  return res.json();
}

export async function apiAddCategory(_userId: string, cat: { id: string; name: string; icon: string; type: string; isDefault?: boolean }) {
  const token = getToken();
  if (!token) throw new Error('Non autorise');
  const res = await fetch(`${API_URL}/api/categories`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(cat),
  });
  if (!res.ok) throw new Error(`Add category failed: ${res.status}`);
}

export async function apiBulkCategories(_userId: string, categories: any[]) {
  const token = getToken();
  if (!token) throw new Error('Non autorise');
  const res = await fetch(`${API_URL}/api/categories/bulk`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ categories }),
  });
  if (!res.ok) throw new Error(`Bulk categories failed: ${res.status}`);
}

export async function apiDeleteCategory(_userId: string, catId: string) {
  const token = getToken();
  if (!token) throw new Error('Non autorise');
  const res = await fetch(`${API_URL}/api/categories/${catId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Delete category failed: ${res.status}`);
}

// ── Transactions ──────────────────────────────────────
export async function apiFetchTransactions(_userId: string) {
  const token = getToken();
  if (!token) throw new Error('Non autorise');
  const res = await fetch(`${API_URL}/api/transactions`, { headers: getHeaders(token) });
  if (!res.ok) throw new Error(`Transactions fetch failed: ${res.status}`);
  return res.json();
}

export async function apiCreateTransaction(_userId: string, tx: { type: string; amount: number; categoryId: string; date: string; note: string }) {
  const token = getToken();
  if (!token) throw new Error('Non autorise');
  const res = await fetch(`${API_URL}/api/transactions`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(tx),
  });
  if (!res.ok) throw new Error(`Create transaction failed: ${res.status}`);
  return res.json();
}

export async function apiUpdateTransaction(_userId: string, id: number, tx: { type: string; amount: number; categoryId: string; date: string; note: string }) {
  const token = getToken();
  if (!token) throw new Error('Non autorise');
  const res = await fetch(`${API_URL}/api/transactions/${id}`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify(tx),
  });
  if (!res.ok) throw new Error(`Update transaction failed: ${res.status}`);
}

export async function apiDeleteTransaction(_userId: string, id: number) {
  const token = getToken();
  if (!token) throw new Error('Non autorise');
  const res = await fetch(`${API_URL}/api/transactions/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Delete transaction failed: ${res.status}`);
}

// ── Budgets ───────────────────────────────────────────
export async function apiFetchBudgets(_userId: string) {
  const token = getToken();
  if (!token) throw new Error('Non autorise');
  const res = await fetch(`${API_URL}/api/budgets`, { headers: getHeaders(token) });
  if (!res.ok) throw new Error(`Budgets fetch failed: ${res.status}`);
  return res.json();
}

export async function apiSaveBudget(_userId: string, categoryId: string, monthlyLimit: number) {
  const token = getToken();
  if (!token) throw new Error('Non autorise');
  const res = await fetch(`${API_URL}/api/budgets`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ categoryId, monthlyLimit }),
  });
  if (!res.ok) throw new Error(`Save budget failed: ${res.status}`);
}

export async function apiDeleteBudget(_userId: string, categoryId: string) {
  const token = getToken();
  if (!token) throw new Error('Non autorise');
  const res = await fetch(`${API_URL}/api/budgets/${categoryId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Delete budget failed: ${res.status}`);
}

// ── Settings ──────────────────────────────────────────
export async function apiFetchSettings(_userId: string): Promise<Record<string, string>> {
  const token = getToken();
  if (!token) throw new Error('Non autorise');
  const res = await fetch(`${API_URL}/api/settings`, { headers: getHeaders(token) });
  if (!res.ok) throw new Error(`Settings fetch failed: ${res.status}`);
  return res.json();
}

export async function apiSaveSetting(_userId: string, key: string, value: string) {
  const token = getToken();
  if (!token) throw new Error('Non autorise');
  const res = await fetch(`${API_URL}/api/settings`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) throw new Error(`Save setting failed: ${res.status}`);
}

// ── Reset ─────────────────────────────────────────────
export async function apiResetDatabase(_userId: string) {
  const token = getToken();
  if (!token) throw new Error('Non autorise');
  const res = await fetch(`${API_URL}/api/reset`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Reset database failed: ${res.status}`);
}
