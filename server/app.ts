import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { sql, initDB } from './db';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

function generateToken(user: { uuid: string; email: string; role: string }) {
  return jwt.sign({ uuid: user.uuid, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Non autorise' });
  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as { uuid: string; email: string; role: string };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

function requireAdmin(req: any, res: any, next: any) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Acces interdit' });
  next();
}

const BCRYPT_ROUNDS = 12;

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

// ── Auth (public) ────────────────────────────────────
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

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const uuid = crypto.randomUUID();

    const result = await sql`
      INSERT INTO users (uuid, email, name, "passwordHash", "isActive", role, "createdAt")
      VALUES (${uuid}, ${email}, ${name}, ${passwordHash}, ${isFirstUser || isAdminEmail}, ${isFirstUser || isAdminEmail ? 'admin' : 'user'}, ${Date.now()})
      RETURNING uuid, email, name, "isActive", role
    `;

    await seedUserData(uuid);
    const user = result[0];
    const token = generateToken({ uuid: user.uuid, email: user.email, role: user.role });
    res.json({ ...user, token });
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
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    if (!user.isActive) return res.status(403).json({ error: 'Votre compte est en attente d activation par l administrateur.' });

    const token = generateToken({ uuid: user.uuid, email: user.email, role: user.role });
    res.json({ uuid: user.uuid, email: user.email, name: user.name, role: user.role, token });
  } catch (err: any) {
    console.error('Signin error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Auth (protected) ─────────────────────────────────
app.get('/api/auth/me', verifyToken, async (req: any, res) => {
  try {
    const result = await sql`SELECT uuid, email, name, role, "isActive" FROM users WHERE uuid = ${req.user.uuid}`;
    if (result.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Users (admin) ─────────────────────────────────────
app.get('/api/users', verifyToken, requireAdmin, async (_req, res) => {
  try {
    const result = await sql`SELECT id, uuid, email, name, "isActive", role FROM users ORDER BY id`;
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/users/:uuid/activate', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { uuid } = req.params;
    const { isActive } = req.body;
    await sql`UPDATE users SET "isActive" = ${isActive} WHERE uuid = ${uuid}`;
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/users/:uuid/role', verifyToken, requireAdmin, async (req, res) => {
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
app.get('/api/categories', verifyToken, async (req: any, res) => {
  try {
    const result = await sql`SELECT * FROM categories WHERE "userId" = ${req.user.uuid}`;
    res.json(result.map((r) => ({ id: r.cat_id, name: r.name, icon: r.icon, type: r.type, isDefault: r.isDefault })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', verifyToken, async (req: any, res) => {
  try {
    const { id, name, icon, type, isDefault } = req.body;
    await sql`INSERT INTO categories (cat_id, name, icon, type, "isDefault", "userId") VALUES (${id}, ${name}, ${icon}, ${type}, ${isDefault || false}, ${req.user.uuid})`;
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories/bulk', verifyToken, async (req: any, res) => {
  try {
    const { categories } = req.body;
    for (const c of categories) {
      await sql`INSERT INTO categories (cat_id, name, icon, type, "isDefault", "userId") VALUES (${c.id}, ${c.name}, ${c.icon}, ${c.type}, ${c.isDefault || false}, ${req.user.uuid})`;
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:catId', verifyToken, async (req: any, res) => {
  try {
    const { catId } = req.params;
    await sql`DELETE FROM categories WHERE cat_id = ${catId} AND "userId" = ${req.user.uuid}`;
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Transactions ──────────────────────────────────────
app.get('/api/transactions', verifyToken, async (req: any, res) => {
  try {
    const result = await sql`SELECT * FROM transactions WHERE "userId" = ${req.user.uuid} ORDER BY "createdAt" DESC`;
    res.json(result.map((r) => ({ id: r.id, type: r.type, amount: Number(r.amount), categoryId: r.categoryId, date: r.date, note: r.note, createdAt: Number(r.createdAt) })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', verifyToken, async (req: any, res) => {
  try {
    const { type, amount, categoryId, date, note } = req.body;
    const result = await sql`INSERT INTO transactions (type, amount, "categoryId", date, note, "createdAt", "userId") VALUES (${type}, ${amount}, ${categoryId}, ${date}, ${note || ''}, ${Date.now()}, ${req.user.uuid}) RETURNING id`;
    res.json({ id: result[0].id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/transactions/:id', verifyToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { type, amount, categoryId, date, note } = req.body;
    await sql`UPDATE transactions SET type = ${type}, amount = ${amount}, "categoryId" = ${categoryId}, date = ${date}, note = ${note || ''} WHERE id = ${Number(id)} AND "userId" = ${req.user.uuid}`;
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/transactions/:id', verifyToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    await sql`DELETE FROM transactions WHERE id = ${Number(id)} AND "userId" = ${req.user.uuid}`;
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Budgets ───────────────────────────────────────────
app.get('/api/budgets', verifyToken, async (req: any, res) => {
  try {
    const result = await sql`SELECT * FROM budgets WHERE "userId" = ${req.user.uuid}`;
    res.json(result.map((r) => ({ id: r.categoryId, categoryId: r.categoryId, monthlyLimit: Number(r.monthlyLimit) })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/budgets', verifyToken, async (req: any, res) => {
  try {
    const { categoryId, monthlyLimit } = req.body;
    const existing = await sql`SELECT id FROM budgets WHERE "categoryId" = ${categoryId} AND "userId" = ${req.user.uuid}`;
    if (existing.length > 0) {
      await sql`UPDATE budgets SET "monthlyLimit" = ${monthlyLimit} WHERE "categoryId" = ${categoryId} AND "userId" = ${req.user.uuid}`;
    } else {
      await sql`INSERT INTO budgets ("categoryId", "monthlyLimit", "userId") VALUES (${categoryId}, ${monthlyLimit}, ${req.user.uuid})`;
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/budgets/:categoryId', verifyToken, async (req: any, res) => {
  try {
    const { categoryId } = req.params;
    await sql`DELETE FROM budgets WHERE "categoryId" = ${categoryId} AND "userId" = ${req.user.uuid}`;
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Settings ──────────────────────────────────────────
app.get('/api/settings', verifyToken, async (req: any, res) => {
  try {
    const result = await sql`SELECT * FROM settings WHERE "userId" = ${req.user.uuid}`;
    const obj: Record<string, string> = {};
    result.forEach((r) => { obj[r.key] = r.value; });
    res.json(obj);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', verifyToken, async (req: any, res) => {
  try {
    const { key, value } = req.body;
    const existing = await sql`SELECT id FROM settings WHERE key = ${key} AND "userId" = ${req.user.uuid}`;
    if (existing.length > 0) {
      await sql`UPDATE settings SET value = ${value} WHERE key = ${key} AND "userId" = ${req.user.uuid}`;
    } else {
      await sql`INSERT INTO settings (key, value, "userId") VALUES (${key}, ${value}, ${req.user.uuid})`;
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Reset ─────────────────────────────────────────────
app.delete('/api/reset', verifyToken, async (req: any, res) => {
  try {
    await sql`DELETE FROM transactions WHERE "userId" = ${req.user.uuid}`;
    await sql`DELETE FROM categories WHERE "userId" = ${req.user.uuid}`;
    await sql`DELETE FROM budgets WHERE "userId" = ${req.user.uuid}`;
    await sql`DELETE FROM settings WHERE "userId" = ${req.user.uuid}`;
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── SSE Real-time Events ──────────────────────────────
app.get('/api/events', async (req: any, res) => {
  let userId: string | null = null;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as { uuid: string };
      userId = decoded.uuid;
    } catch {}
  }

  if (!userId && req.query.token) {
    try {
      const decoded = jwt.verify(req.query.token as string, JWT_SECRET) as { uuid: string };
      userId = decoded.uuid;
    } catch {}
  }

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

export { app, initDB };
