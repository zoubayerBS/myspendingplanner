import React, { useState, useEffect, useCallback } from 'react';
import {
  initializeDatabase,
  fetchCategories,
  fetchTransactions,
  fetchBudgets,
  fetchCurrency,
  saveTransaction as apiSaveTransaction,
  deleteTransaction as apiDeleteTransaction,
  saveBudget as apiSaveBudget,
  deleteBudget as apiDeleteBudget,
  addCategory as apiAddCategory,
  deleteCategory as apiDeleteCategory,
  updateCurrency as apiUpdateCurrency,
} from './db/database';
import { Category, Transaction, Budget, CurrencyCode } from './types';
import { getCurrentYearMonth } from './utils/formatters';

import { Navigation, TabType } from './components/Navigation';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { BudgetManager } from './components/BudgetManager';
import { CategoryManager } from './components/CategoryManager';
import { SettingsView } from './components/SettingsView';
import { AddTransactionModal } from './components/AddTransactionModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentYearMonth());
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isReady, setIsReady] = useState(false);

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>('DT');

  const refreshData = useCallback(async () => {
    const [txs, cats, bgs, cur] = await Promise.all([
      fetchTransactions(),
      fetchCategories(),
      fetchBudgets(),
      fetchCurrency(),
    ]);
    setAllTransactions(txs);
    setCategories(cats);
    setBudgets(bgs);
    setCurrency(cur as CurrencyCode);
  }, []);

  useEffect(() => {
    async function setupApp() {
      try {
        await initializeDatabase();
        await refreshData();
        setIsReady(true);
      } catch (err) {
        console.error('Failed to initialize database', err);
        setIsReady(true);
      }
    }
    setupApp();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshData]);

  const monthlyTransactions = allTransactions.filter((t) =>
    t.date.startsWith(selectedMonth)
  );

  const handleOpenQuickAdd = () => {
    setEditingTransaction(null);
    setIsQuickAddOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsQuickAddOpen(true);
  };

  const handleSaveTransaction = async (
    txData: Omit<Transaction, 'id' | 'createdAt'> & { id?: number }
  ) => {
    await apiSaveTransaction(txData);
    await refreshData();
  };

  const handleDeleteTransaction = async (id: number) => {
    await apiDeleteTransaction(id);
    await refreshData();
  };

  const handleSaveBudget = async (categoryId: string, monthlyLimit: number) => {
    await apiSaveBudget(categoryId, monthlyLimit);
    await refreshData();
  };

  const handleDeleteBudget = async (id: string) => {
    await apiDeleteBudget(id);
    await refreshData();
  };

  const handleAddCategory = async (catData: Omit<Category, 'id'>) => {
    await apiAddCategory(catData);
    await refreshData();
  };

  const handleDeleteCategory = async (id: string) => {
    await apiDeleteCategory(id);
    await refreshData();
  };

  const handleUpdateCurrency = async (newCurrency: CurrencyCode) => {
    await apiUpdateCurrency(newCurrency);
    await refreshData();
  };

  const handleResetDatabase = async () => {
    const { nocodb, Tables } = await import('./db/nocodb');
    const [txs, cats, bgs, sts] = await Promise.all([
      nocodb.listAll(Tables.transactions),
      nocodb.listAll(Tables.categories),
      nocodb.listAll(Tables.budgets),
      nocodb.listAll(Tables.settings),
    ]);
    await Promise.all([
      ...txs.map((r) => nocodb.remove(Tables.transactions, r.id)),
      ...cats.map((r) => nocodb.remove(Tables.categories, r.id)),
      ...bgs.map((r) => nocodb.remove(Tables.budgets, r.id)),
      ...sts.map((r) => nocodb.remove(Tables.settings, r.id)),
    ]);
    await initializeDatabase();
    await refreshData();
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-[#1B3022] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans antialiased md:pl-56">
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAdd={handleOpenQuickAdd}
      />

      <div className="min-h-screen flex flex-col">
        <Header
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          isOffline={isOffline}
        />

        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 pb-20 md:pb-8">
          {activeTab === 'dashboard' && (
            <Dashboard
              transactions={monthlyTransactions}
              categories={categories}
              budgets={budgets}
              currency={currency}
              onOpenQuickAdd={handleOpenQuickAdd}
              onNavigateTab={setActiveTab}
              onEditTransaction={handleEditTransaction}
              selectedMonth={selectedMonth}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionList
              transactions={monthlyTransactions}
              categories={categories}
              currency={currency}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenQuickAdd={handleOpenQuickAdd}
              selectedMonth={selectedMonth}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetManager
              budgets={budgets}
              categories={categories}
              transactions={monthlyTransactions}
              currency={currency}
              onSaveBudget={handleSaveBudget}
              onDeleteBudget={handleDeleteBudget}
            />
          )}

          {activeTab === 'categories' && (
            <CategoryManager
              categories={categories}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currency={currency}
              onUpdateCurrency={handleUpdateCurrency}
              onResetDatabase={handleResetDatabase}
              onReloadData={refreshData}
            />
          )}
        </main>
      </div>

      <AddTransactionModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSave={handleSaveTransaction}
        categories={categories}
        editingTransaction={editingTransaction}
        currency={currency}
      />
    </div>
  );
}
