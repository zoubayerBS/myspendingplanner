import React, { useState } from 'react';
import { Edit2, X, Check } from 'lucide-react';
import { Category, Budget, CurrencyCode, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon } from '../utils/icons';

interface BudgetManagerProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  currency: CurrencyCode;
  onSaveBudget: (categoryId: string, monthlyLimit: number) => Promise<void>;
  onDeleteBudget: (budgetId: string) => Promise<void>;
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  budgets,
  categories,
  transactions,
  currency,
  onSaveBudget,
  onDeleteBudget
}) => {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [limitInput, setLimitInput] = useState<string>('');

  const categoriesMap = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');

  const categorySpendingMap = new Map<string, number>();
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const current = categorySpendingMap.get(t.categoryId) || 0;
      categorySpendingMap.set(t.categoryId, current + t.amount);
    });

  const budgetsMap = new Map<string, Budget>(budgets.map((b) => [b.categoryId, b]));

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalSpentInBudgetedCategories = budgets.reduce((sum, b) => {
    return sum + (categorySpendingMap.get(b.categoryId) || 0);
  }, 0);

  const handleSave = async (categoryId: string) => {
    const val = parseFloat(limitInput.replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      await onSaveBudget(categoryId, val);
    }
    setEditingCategoryId(null);
    setLimitInput('');
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-white rounded-xl p-5 border border-dashed border-slate-200">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] text-slate-400 mb-0.5">Budget</p>
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(totalBudgeted, currency)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 mb-0.5">Depense</p>
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(totalSpentInBudgetedCategories, currency)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 mb-0.5">Reste</p>
            <p className={`text-lg font-semibold ${totalBudgeted - totalSpentInBudgetedCategories >= 0 ? 'text-[#2D6A4F]' : 'text-red-500'}`}>
              {formatCurrency(totalBudgeted - totalSpentInBudgetedCategories, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-xl p-5 border border-dashed border-slate-200 space-y-4">
        <h3 className="text-sm font-medium text-[#1A1C1E]">Categories</h3>

        <div className="space-y-3">
          {expenseCategories.map((category) => {
            const budget = budgetsMap.get(category.id);
            const limit = budget?.monthlyLimit || 0;
            const spent = categorySpendingMap.get(category.id) || 0;
            const pct = limit > 0 ? (spent / limit) * 100 : 0;
            const isEditing = editingCategoryId === category.id;

            return (
              <div key={category.id} className="py-3 border-b border-slate-50 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-slate-50 flex items-center justify-center">
                      <CategoryIcon name={category.icon} className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-900">{category.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {limit > 0 ? `${formatCurrency(spent, currency)} / ${formatCurrency(limit, currency)}` : `${formatCurrency(spent, currency)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="10"
                          placeholder="0"
                          value={limitInput}
                          onChange={(e) => setLimitInput(e.target.value)}
                          className="w-20 text-sm bg-slate-50 border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:border-[#1B3022]"
                          autoFocus
                        />
                        <button onClick={() => handleSave(category.id)} className="p-1 text-[#2D6A4F] hover:bg-slate-50 rounded">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingCategoryId(null)} className="p-1 text-slate-400 hover:bg-slate-50 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingCategoryId(category.id); setLimitInput(limit ? String(limit) : ''); }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {limit > 0 && (
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(pct, 100)}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-[#1B3022]'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
