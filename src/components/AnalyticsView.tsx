import React from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Calendar, BarChart3 } from 'lucide-react';
import { Transaction, CurrencyCode } from '../types';
import { formatCurrency, formatMonthYear, getPreviousYearMonth } from '../utils/formatters';

interface AnalyticsViewProps {
  allTransactions: Transaction[];
  selectedMonth: string; // 'YYYY-MM'
  currency: CurrencyCode;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  allTransactions,
  selectedMonth,
  currency
}) => {
  const previousMonth = getPreviousYearMonth(selectedMonth);

  // Current month stats
  const currentTxs = allTransactions.filter((t) => t.date.startsWith(selectedMonth));
  const currentIncome = currentTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const currentExpense = currentTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const currentBalance = currentIncome - currentExpense;

  // Previous month stats
  const prevTxs = allTransactions.filter((t) => t.date.startsWith(previousMonth));
  const prevIncome = prevTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const prevExpense = prevTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // Delta calculations
  const expenseChangePct = prevExpense > 0 ? ((currentExpense - prevExpense) / prevExpense) * 100 : 0;
  const incomeChangePct = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0;

  // Yearly summary (Months in selected year)
  const [selectedYear] = selectedMonth.split('-');
  const yearMonths = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    const ym = `${selectedYear}-${m}`;
    const txs = allTransactions.filter((t) => t.date.startsWith(ym));
    const inc = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return {
      monthYear: ym,
      monthLabel: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(Number(selectedYear), i, 1)),
      income: inc,
      expense: exp,
      balance: inc - exp
    };
  });

  const maxExpenseInYear = Math.max(...yearMonths.map((m) => Math.max(m.income, m.expense)), 1);

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Month vs Previous Month Comparison */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Analyse & Comparaison</h2>
            <p className="text-xs text-slate-500">
              {formatMonthYear(selectedMonth)} vs {formatMonthYear(previousMonth)}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
            {selectedYear}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Income Comparison */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Revenus du mois</span>
              {prevIncome > 0 && (
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    incomeChangePct >= 0 ? 'text-emerald-800' : 'text-slate-600'
                  }`}
                >
                  {incomeChangePct >= 0 ? '+' : ''}{incomeChangePct.toFixed(1)}% vs mois dernier
                </span>
              )}
            </div>
            <div className="text-xl font-bold text-slate-900">
              {formatCurrency(currentIncome, currency)}
            </div>
            <p className="text-[11px] text-slate-400">
              Mois précédent : {formatCurrency(prevIncome, currency)}
            </p>
          </div>

          {/* Expense Comparison */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Dépenses du mois</span>
              {prevExpense > 0 && (
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    expenseChangePct <= 0 ? 'text-emerald-800' : 'text-amber-800'
                  }`}
                >
                  {expenseChangePct >= 0 ? '+' : ''}{expenseChangePct.toFixed(1)}% vs mois dernier
                </span>
              )}
            </div>
            <div className="text-xl font-bold text-slate-900">
              {formatCurrency(currentExpense, currency)}
            </div>
            <p className="text-[11px] text-slate-400">
              Mois précédent : {formatCurrency(prevExpense, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Yearly Timeline Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-900">Évolution annuelle ({selectedYear})</h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 bg-emerald-800 rounded-sm" /> Revenus
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 bg-slate-900 rounded-sm" /> Dépenses
            </span>
          </div>
        </div>

        {/* Bar Chart Visual */}
        <div className="pt-6 pb-2">
          <div className="grid grid-cols-12 gap-1.5 sm:gap-3 items-end h-44 border-b border-slate-200 pb-2">
            {yearMonths.map((m) => {
              const incHeight = (m.income / maxExpenseInYear) * 100;
              const expHeight = (m.expense / maxExpenseInYear) * 100;
              const isCurrent = m.monthYear === selectedMonth;

              return (
                <div key={m.monthYear} className="flex flex-col items-center gap-1 h-full justify-end">
                  <div className="flex items-end gap-1 w-full justify-center h-full">
                    {/* Income Bar */}
                    <div
                      style={{ height: `${Math.max(incHeight, 4)}%` }}
                      className={`w-2.5 sm:w-3.5 rounded-t bg-emerald-800 transition-all ${
                        m.income === 0 ? 'opacity-20' : ''
                      }`}
                      title={`${m.monthLabel} Revenu: ${formatCurrency(m.income, currency)}`}
                    />
                    {/* Expense Bar */}
                    <div
                      style={{ height: `${Math.max(expHeight, 4)}%` }}
                      className={`w-2.5 sm:w-3.5 rounded-t bg-slate-900 transition-all ${
                        m.expense === 0 ? 'opacity-20' : ''
                      }`}
                      title={`${m.monthLabel} Dépense: ${formatCurrency(m.expense, currency)}`}
                    />
                  </div>
                  <span
                    className={`text-[10px] capitalize tracking-tighter ${
                      isCurrent ? 'font-bold text-slate-900 underline' : 'text-slate-400'
                    }`}
                  >
                    {m.monthLabel.slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
