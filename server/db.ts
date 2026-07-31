import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

let _neonSql: any = null;

function getSql() {
  if (!_neonSql) {
    const url = (process.env.DATABASE_URL || '').trim();
    if (!url) throw new Error('DATABASE_URL is required');
    _neonSql = neon(url);
  }
  return _neonSql;
}

export function sql(strings: TemplateStringsArray, ...values: any[]) {
  return getSql()(strings, ...values);
}

export async function initDB() {
  const db = getSql();
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      uuid TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "isActive" BOOLEAN DEFAULT false,
      role TEXT DEFAULT 'user',
      "tokenVersion" INTEGER DEFAULT 0,
      "createdAt" BIGINT DEFAULT 0
    )
  `;

  await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER DEFAULT 0`;

  await db`
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

  await db`
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

  await db`
    CREATE TABLE IF NOT EXISTS budgets (
      id SERIAL PRIMARY KEY,
      "categoryId" TEXT NOT NULL,
      "monthlyLimit" NUMERIC NOT NULL,
      "userId" TEXT NOT NULL
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      "userId" TEXT NOT NULL
    )
  `;
}
