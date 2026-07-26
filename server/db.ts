import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

export const sql = neon(DATABASE_URL);

export async function initDB() {
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
