const BASE_URL = import.meta.env.VITE_NOCODB_BASE_URL || 'https://app.nocodb.com/api/v2';
const TABLES_USERS = 'm0ootw62wh5qqfg';
const API_TOKEN = import.meta.env.VITE_NOCODB_API_TOKEN || '';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface UserProfile {
  Id: number;
  email: string;
  name: string;
  userId: string;
  isActive: boolean;
  role: string;
}

const USER_KEY = 'sp_auth_user';

function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'xc-token': API_TOKEN,
  };
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function saveUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getSavedUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(USER_KEY);
}

async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const res = await fetch(
    `${BASE_URL}/tables/${TABLES_USERS}/records?where=(email,eq,${encodeURIComponent(email)})`,
    { headers: getHeaders() }
  );
  const data = await res.json();
  if (data.list && data.list.length > 0) {
    return data.list[0];
  }
  return null;
}

const ADMIN_EMAIL = 'zouba196@gmail.com';

export async function signup(email: string, password: string, name: string): Promise<{ ok: boolean }> {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error('Un compte avec cet email existe deja.');
  }

  const passwordHash = await sha256(password);

  const countRes = await fetch(
    `${BASE_URL}/tables/${TABLES_USERS}/records/count`,
    { headers: getHeaders() }
  );
  const countData = await countRes.json();
  const isFirstUser = countData.count === 0;
  const isAdminEmail = email.toLowerCase() === ADMIN_EMAIL;

  const userId = crypto.randomUUID();

  await fetch(`${BASE_URL}/tables/${TABLES_USERS}/records`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      email,
      name,
      userId,
      passwordHash,
      isActive: isFirstUser || isAdminEmail,
      role: isFirstUser || isAdminEmail ? 'admin' : 'user',
    }),
  });

  return { ok: true };
}

export async function signin(email: string, password: string): Promise<AuthUser> {
  const profile = await findUserByEmail(email);
  if (!profile) {
    throw new Error('Email ou mot de passe incorrect.');
  }

  const passwordHash = await sha256(password);
  if ((profile as any).passwordHash !== passwordHash) {
    throw new Error('Email ou mot de passe incorrect.');
  }

  if (!profile.isActive) {
    throw new Error('Votre compte est en attente d activation par l administrateur.');
  }

  const user: AuthUser = {
    id: profile.userId,
    email: profile.email,
    name: profile.name,
  };
  saveUser(user);
  return user;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const res = await fetch(
    `${BASE_URL}/tables/${TABLES_USERS}/records?where=(userId,eq,${userId})`,
    { headers: getHeaders() }
  );
  const data = await res.json();
  if (data.list && data.list.length > 0) {
    return data.list[0];
  }
  return null;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const res = await fetch(
    `${BASE_URL}/tables/${TABLES_USERS}/records?pageSize=100`,
    { headers: getHeaders() }
  );
  const data = await res.json();
  return data.list || [];
}

export async function setActive(userId: string, isActive: boolean): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/tables/${TABLES_USERS}/records?where=(userId,eq,${userId})`,
    { headers: getHeaders() }
  );
  const data = await res.json();
  if (data.list && data.list.length > 0) {
    const record = data.list[0];
    await fetch(`${BASE_URL}/tables/${TABLES_USERS}/records`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ Id: record.Id, isActive }),
    });
  }
}

export async function setRole(userId: string, role: string): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/tables/${TABLES_USERS}/records?where=(userId,eq,${userId})`,
    { headers: getHeaders() }
  );
  const data = await res.json();
  if (data.list && data.list.length > 0) {
    const record = data.list[0];
    await fetch(`${BASE_URL}/tables/${TABLES_USERS}/records`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ Id: record.Id, role }),
    });
  }
}
