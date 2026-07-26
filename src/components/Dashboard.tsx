import React from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { Transaction, Category, Budget, CurrencyCode } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CategoryIcon } from '../utils/icons';

interface DashboardProps {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  currency: CurrencyCode;
  onOpenQuickAdd: () => void;
  onNavigateTab: (tab: any) => void;
  onEditTransaction: (tx: Transaction) => void;
  selectedMonth: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  categories,
  budgets,
  currency,
  onOpenQuickAdd,
  onNavigateTab,
  onEditTransaction
}) => {
  const categoriesMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const expensesByCategoryMap = new Map<string, number>();
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const current = expensesByCategoryMap.get(t.categoryId) || 0;
      expensesByCategoryMap.set(t.categoryId, current + t.amount);
    });

  const categoryExpensesList = Array.from(expensesByCategoryMap.entries())
    .map(([categoryId, total]) => {
      const category = categoriesMap.get(categoryId) || {
        id: categoryId,
        name: 'Autre',
        icon: 'MoreHorizontal',
        type: 'expense'
      };
      const percentage = totalExpense > 0 ? (total / totalExpense) * 100 : 0;
      return { category, total, percentage };
    })
    .sort((a, b) => b.total - a.total);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Balance */}
      <div className="bg-white rounded-xl p-5 border border-dashed border-slate-200">
        <p className="text-xs text-slate-400 mb-1">Solde net</p>
        <p className="text-3xl font-semibold text-[#1A1C1E] tracking-tight">
          {formatCurrency(netBalance, currency)}
        </p>
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100">
          <div>
            <p className="text-[11px] text-slate-400">Revenus</p>
            <p className="text-sm font-medium text-[#2D6A4F]">{formatCurrency(totalIncome, currency)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Depenses</p>
            <p className="text-sm font-medium text-slate-700">{formatCurrency(totalExpense, currency)}</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-xl p-5 border border-dashed border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[#1A1C1E]">Repartition</h2>
          <span className="text-xs text-slate-400">{formatCurrency(totalExpense, currency)}</span>
        </div>

        {categoryExpensesList.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">Aucune depense</p>
        ) : (
          <div className="space-y-3">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
              {categoryExpensesList.map((item, idx) => {
                const colors = ['#1B3022', '#2D6A4F', '#40916C', '#52B788', '#74C69D', '#94A3B8'];
                return (
                  <div
                    key={item.category.id}
                    style={{ width: `${item.percentage}%`, backgroundColor: colors[idx % colors.length] }}
                    className="h-full"
                  />
                );
              })}
            </div>

            <div className="space-y-2">
              {categoryExpensesList.map((item) => (
                <div key={item.category.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-slate-50 flex items-center justify-center">
                      <CategoryIcon name={item.category.icon} className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <span className="text-sm text-slate-700">{item.category.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{Math.round(item.percentage)}%</span>
                    <span className="text-sm font-medium text-slate-900">{formatCurrency(item.total, currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl p-5 border border-dashed border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[#1A1C1E]">Transactions recentes</h2>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs text-[#1B3022] font-medium flex items-center gap-1 hover:opacity-70 transition-opacity"
          >
            Voir tout <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-400 mb-3">Aucune transaction</p>
            <button
              onClick={onOpenQuickAdd}
              className="text-sm text-[#1B3022] font-medium flex items-center gap-1.5 mx-auto hover:opacity-70 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {recentTransactions.map((tx) => {
              const category = categoriesMap.get(tx.categoryId);
              const isIncome = tx.type === 'income';
              return (
                <div
                  key={tx.id}
                  onClick={() => onEditTransaction(tx)}
                  className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                      <CategoryIcon
                        name={category?.icon || 'MoreHorizontal'}
                        className="w-4 h-4 text-slate-500"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-slate-900">{tx.note || category?.name || 'Transaction'}</p>
                      <p className="text-[11px] text-slate-400">{category?.name}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${isIncome ? 'text-[#2D6A4F]' : 'text-slate-900'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
