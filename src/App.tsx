import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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

import AuthView from './components/AuthView';
import AdminView from './components/AdminView';
import { Navigation, TabType } from './components/Navigation';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { BudgetManager } from './components/BudgetManager';
import { CategoryManager } from './components/CategoryManager';
import { SettingsView } from './components/SettingsView';
import { AddTransactionModal } from './components/AddTransactionModal';

function AppContent() {
  const { user, profile, loading: authLoading, logout } = useAuth();

  const [showAdmin, setShowAdmin] = useState(false);

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

  const userId = user?.id || '';

  const refreshTransactions = async () => {
    if (!userId) return;
    try {
      const txs = await fetchTransactions(userId);
      setAllTransactions(txs);
    } catch (err) {
      console.error('Failed to refresh transactions', err);
    }
  };

  const refreshCategories = async () => {
    if (!userId) return;
    try {
      const cats = await fetchCategories(userId);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to refresh categories', err);
    }
  };

  const refreshBudgets = async () => {
    if (!userId) return;
    try {
      const bgs = await fetchBudgets(userId);
      setBudgets(bgs);
    } catch (err) {
      console.error('Failed to refresh budgets', err);
    }
  };

  const refreshData = async () => {
    if (!userId) return;
    await Promise.all([
      refreshTransactions(),
      refreshCategories(),
      refreshBudgets(),
      fetchCurrency(userId).then((cur) => setCurrency(cur as CurrencyCode)).catch(() => {}),
    ]);
  };

  useEffect(() => {
    if (!userId) return;
    async function setupApp() {
      try {
        await initializeDatabase(userId);
        await refreshData();
        setIsReady(true);
      } catch (err) {
        console.error('Failed to initialize database', err);
        setIsReady(true);
      }
    }
    setupApp();
  }, [userId]);

  useEffect(() => {
    if (!userId || !isReady) return;

    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL || ''}/api/events?userId=${userId}`,
    );

    eventSource.onmessage = () => {
      refreshData();
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [userId, isReady]);

  useEffect(() => {
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
  }, []);

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
    if (txData.id) {
      await apiSaveTransaction(txData, userId);
      setAllTransactions((prev) =>
        prev.map((t) =>
          t.id === txData.id
            ? { ...t, type: txData.type, amount: txData.amount, categoryId: txData.categoryId, date: txData.date, note: txData.note || '' }
            : t
        )
      );
    } else {
      const result = await apiSaveTransaction(txData, userId);
      const newTx: Transaction = {
        id: result.id,
        type: txData.type,
        amount: txData.amount,
        categoryId: txData.categoryId,
        date: txData.date,
        note: txData.note || '',
        createdAt: Date.now(),
      };
      setAllTransactions((prev) => [newTx, ...prev]);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    setAllTransactions((prev) => prev.filter((t) => t.id !== id));
    await apiDeleteTransaction(id, userId);
  };

  const handleSaveBudget = async (categoryId: string, monthlyLimit: number) => {
    setBudgets((prev) => {
      const existing = prev.find((b) => b.categoryId === categoryId);
      if (existing) {
        return prev.map((b) => b.categoryId === categoryId ? { ...b, monthlyLimit } : b);
      }
      return [...prev, { id: categoryId, categoryId, monthlyLimit }];
    });
    await apiSaveBudget(categoryId, monthlyLimit, userId);
  };

  const handleDeleteBudget = async (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.categoryId !== id));
    await apiDeleteBudget(id, userId);
  };

  const handleAddCategory = async (catData: Omit<Category, 'id'>) => {
    const newCat: Category = { id: `cat_custom_${Date.now()}`, ...catData, isDefault: false };
    setCategories((prev) => [...prev, newCat]);
    await apiAddCategory(catData, userId);
  };

  const handleDeleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    await apiDeleteCategory(id, userId);
  };

  const handleUpdateCurrency = async (newCurrency: CurrencyCode) => {
    await apiUpdateCurrency(newCurrency, userId);
    await refreshData();
  };

  const handleResetDatabase = async () => {
    const { apiResetDatabase } = await import('./db/api');
    await apiResetDatabase(userId);
    await initializeDatabase(userId);
    await refreshData();
  };

  const handleLogout = () => {
    logout();
    setAllTransactions([]);
    setCategories([]);
    setBudgets([]);
    setIsReady(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-[#1B3022] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView onNavigateToAdmin={() => setShowAdmin(true)} />;
  }

  if (showAdmin) {
    return <AdminView onBack={() => setShowAdmin(false)} />;
  }

  if (!profile?.isActive) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="border-2 border-dashed border-orange-200 rounded-xl p-6">
            <h1 className="text-lg font-semibold text-orange-700 mb-2">Compte en attente</h1>
            <p className="text-sm text-gray-500 mb-4">
              Votre compte est en attente d activation par l administrateur.
            </p>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Se deconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        onLogout={handleLogout}
        onAdmin={() => setShowAdmin(true)}
        user={user}
        isAdmin={profile?.role === 'admin'}
      />

      <div className="min-h-screen flex flex-col">
        <Header
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          isOffline={isOffline}
          onLogout={handleLogout}
        />

        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 pb-20 md:pb-8 overflow-x-hidden">
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
              userId={userId}
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

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
