import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { neon } from '@neondatabase/serverless';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

let _sql: any = null;

function getSql() {
  if (!_sql) {
    const url = (process.env.DATABASE_URL || '').trim();
    if (!url) throw new Error('DATABASE_URL is required');
    _sql = neon(url);
  }
  return _sql;
}

function sql(strings: TemplateStringsArray, ...values: any[]) {
  return getSql()(strings, ...values);
}

async function sha256(message: string): Promise<string> {
  const { createHash } = await import('crypto');
  return createHash('sha256').update(message).digest('hex');
}

const DEFAULT_CATEGORIES = [
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

async function seedUserData(userId: string) {
  for (const c of DEFAULT_CATEGORIES) {
    await sql`INSERT INTO categories (cat_id, name, icon, type, "isDefault", "userId") VALUES (${c.id}, ${c.name}, ${c.icon}, ${c.type}, ${c.isDefault}, ${userId})`;
  }
  await sql`INSERT INTO settings (key, value, "userId") VALUES ('currency', 'DT', ${userId})`;
}

async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      uuid TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "isActive" BOOLEAN DEFAULT false,
      role TEXT DEFAULT 'user',
      "createdAt" BIGINT DEFAULT 0
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      cat_id TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      type TEXT NOT NULL,
      "isDefault" BOOLEAN DEFAULT false,
      "userId" TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      "categoryId" TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT DEFAULT '',
      "createdAt" BIGINT DEFAULT 0,
      "userId" TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS budgets (
      id SERIAL PRIMARY KEY,
      "categoryId" TEXT NOT NULL,
      "monthlyLimit" NUMERIC NOT NULL,
      "userId" TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      "userId" TEXT NOT NULL
    )
  `;
}

// ── Auth ──────────────────────────────────────────────
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Champs requis manquants' });

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) return res.status(409).json({ error: 'Un compte avec cet email existe deja.' });

    const countResult = await sql`SELECT COUNT(*)::int as count FROM users`;
    const isFirstUser = countResult[0].count === 0;
    const ADMIN_EMAIL = 'zouba196@gmail.com';
    const isAdminEmail = email.toLowerCase() === ADMIN_EMAIL;

    const passwordHash = await sha256(password);
    const uuid = crypto.randomUUID();

    const result = await sql`
      INSERT INTO users (uuid, email, name, "passwordHash", "isActive", role, "createdAt")
      VALUES (${uuid}, ${email}, ${name}, ${passwordHash}, ${isFirstUser || isAdminEmail}, ${isFirstUser || isAdminEmail ? 'admin' : 'user'}, ${Date.now()})
      RETURNING uuid, email, name, "isActive", role
    `;

    await seedUserData(uuid);
    res.json(result[0]);
  } catch (err: any) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Champs requis manquants' });

    const result = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (result.length === 0) return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });

    const user = result[0];
    const passwordHash = await sha256(password);
    if (user.passwordHash !== passwordHash) return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    if (!user.isActive) return res.status(403).json({ error: 'Votre compte est en attente d activation par l administrateur.' });

    res.json({ uuid: user.uuid, email: user.email, name: user.name, role: user.role });
  } catch (err: any) {
    console.error('Signin error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(401).json({ error: 'Non autorise' });

    const result = await sql`SELECT uuid, email, name, role, "isActive" FROM users WHERE uuid = ${userId}`;
    if (result.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Users (admin) ─────────────────────────────────────
app.get('/api/users', async (_req, res) => {
  try {
    const result = await sql`SELECT id, uuid, email, name, "isActive", role FROM users ORDER BY id`;
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/users/:uuid/activate', async (req, res) => {
  try {
    const { uuid } = req.params;
    const { isActive } = req.body;
    await sql`UPDATE users SET "isActive" = ${isActive} WHERE uuid = ${uuid}`;
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/users/:uuid/role', async (req, res) => {
  try {
    const { uuid } = req.params;
    const { role } = req.body;
    await sql`UPDATE users SET role = ${role} WHERE uuid = ${uuid}`;
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Categories ────────────────────────────────────────
app.get('/api/categories', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const result = await sql`SELECT * FROM categories WHERE "userId" = ${userId}`;
    res.json(result.map((r: any) => ({ id: r.cat_id, name: r.name, icon: r.icon, type: r.type, isDefault: r.isDefault })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id, name, icon, type, isDefault } = req.body;
    await sql`INSERT INTO categories (cat_id, name, icon, type, "isDefault", "userId") VALUES (${id}, ${name}, ${icon}, ${type}, ${isDefault || false}, ${userId})`;
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories/bulk', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { categories } = req.body;
    for (const c of categories) {
      await sql`INSERT INTO categories (cat_id, name, icon, type, "isDefault", "userId") VALUES (${c.id}, ${c.name}, ${c.icon}, ${c.type}, ${c.isDefault || false}, ${userId})`;
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:catId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { catId } = req.params;
    await sql`DELETE FROM categories WHERE cat_id = ${catId} AND "userId" = ${userId}`;
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Transactions ──────────────────────────────────────
app.get('/api/transactions', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const result = await sql`SELECT * FROM transactions WHERE "userId" = ${userId} ORDER BY "createdAt" DESC`;
    res.json(result.map((r: any) => ({ id: r.id, type: r.type, amount: Number(r.amount), categoryId: r.categoryId, date: r.date, note: r.note, createdAt: Number(r.createdAt) })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { type, amount, categoryId, date, note } = req.body;
    const result = await sql`INSERT INTO transactions (type, amount, "categoryId", date, note, "createdAt", "userId") VALUES (${type}, ${amount}, ${categoryId}, ${date}, ${note || ''}, ${Date.now()}, ${userId}) RETURNING id`;
    res.json({ id: result[0].id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/transactions/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const { type, amount, categoryId, date, note } = req.body;
    await sql`UPDATE transactions SET type = ${type}, amount = ${amount}, "categoryId" = ${categoryId}, date = ${date}, note = ${note || ''} WHERE id = ${Number(id)} AND "userId" = ${userId}`;
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    await sql`DELETE FROM transactions WHERE id = ${Number(id)} AND "userId" = ${userId}`;
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Budgets ───────────────────────────────────────────
app.get('/api/budgets', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const result = await sql`SELECT * FROM budgets WHERE "userId" = ${userId}`;
    res.json(result.map((r: any) => ({ id: r.categoryId, categoryId: r.categoryId, monthlyLimit: Number(r.monthlyLimit) })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/budgets', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { categoryId, monthlyLimit } = req.body;
    const existing = await sql`SELECT id FROM budgets WHERE "categoryId" = ${categoryId} AND "userId" = ${userId}`;
    if (existing.length > 0) {
      await sql`UPDATE budgets SET "monthlyLimit" = ${monthlyLimit} WHERE "categoryId" = ${categoryId} AND "userId" = ${userId}`;
    } else {
      await sql`INSERT INTO budgets ("categoryId", "monthlyLimit", "userId") VALUES (${categoryId}, ${monthlyLimit}, ${userId})`;
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/budgets/:categoryId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { categoryId } = req.params;
    await sql`DELETE FROM budgets WHERE "categoryId" = ${categoryId} AND "userId" = ${userId}`;
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Settings ──────────────────────────────────────────
app.get('/api/settings', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const result = await sql`SELECT * FROM settings WHERE "userId" = ${userId}`;
    const obj: Record<string, string> = {};
    result.forEach((r: any) => { obj[r.key] = r.value; });
    res.json(obj);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { key, value } = req.body;
    const existing = await sql`SELECT id FROM settings WHERE key = ${key} AND "userId" = ${userId}`;
    if (existing.length > 0) {
      await sql`UPDATE settings SET value = ${value} WHERE key = ${key} AND "userId" = ${userId}`;
    } else {
      await sql`INSERT INTO settings (key, value, "userId") VALUES (${key}, ${value}, ${userId})`;
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Reset ─────────────────────────────────────────────
app.delete('/api/reset', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    await sql`DELETE FROM transactions WHERE "userId" = ${userId}`;
    await sql`DELETE FROM categories WHERE "userId" = ${userId}`;
    await sql`DELETE FROM budgets WHERE "userId" = ${userId}`;
    await sql`DELETE FROM settings WHERE "userId" = ${userId}`;
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── SSE Real-time Events ──────────────────────────────
app.get('/api/events', async (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  if (!userId) return res.status(401).json({ error: 'Non autorise' });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write(':ok\n\n');

  let lastHash = '';
  let closed = false;

  const check = async () => {
    if (closed) return;
    try {
      const txs = await sql`SELECT id, type, amount, "categoryId", date, note, "createdAt" FROM transactions WHERE "userId" = ${userId} ORDER BY "createdAt" DESC`;
      const hash = JSON.stringify(txs);
      if (hash !== lastHash) {
        lastHash = hash;
        res.write(`data: ${hash}\n\n`);
      }
    } catch (e) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: 'poll failed' })}\n\n`);
    }
  };

  await check();

  const interval = setInterval(check, 5000);

  req.on('close', () => {
    closed = true;
    clearInterval(interval);
  });
});

let dbReady = false;

export default async function handler(req: any, res: any) {
  try {
    if (!dbReady) {
      await initDB();
      dbReady = true;
    }
    return app(req, res);
  } catch (err: any) {
    console.error('Handler error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message || 'Internal server error' });
    }
  }
}
