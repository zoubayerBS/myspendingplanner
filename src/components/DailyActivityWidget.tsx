import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction, Category, CurrencyCode } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CategoryIcon } from '../utils/icons';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  currency: CurrencyCode;
  selectedMonth: string;
  onEditTransaction: (tx: Transaction) => void;
}

interface DayData {
  day: number;
  dayLabel: string;
  dateKey: string;
  expense: number;
  income: number;
  count: number;
}

export const DailyActivityWidget: React.FC<Props> = ({
  transactions,
  categories,
  currency,
  selectedMonth,
  onEditTransaction,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const categoriesMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const { dailyData, totalDays } = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const map = new Map<number, DayData>();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      map.set(d, { day: d, dayLabel: String(d), dateKey, expense: 0, income: 0, count: 0 });
    }

    transactions.forEach((tx) => {
      const dayNum = parseInt(tx.date.split('-')[2], 10);
      const entry = map.get(dayNum);
      if (!entry) return;
      entry.count++;
      if (tx.type === 'expense') entry.expense += tx.amount;
      else entry.income += tx.amount;
    });

    return { dailyData: Array.from(map.values()), totalDays: daysInMonth };
  }, [transactions, selectedMonth]);

  const dayTransactions = useMemo(() => {
    if (!selectedDay) return [];
    return transactions
      .filter((t) => t.date === selectedDay.dateKey)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [transactions, selectedDay]);

  const stats = useMemo(() => {
    const totalExpense = dailyData.reduce((s, d) => s + d.expense, 0);
    const totalIncome = dailyData.reduce((s, d) => s + d.income, 0);
    const expenseDays = dailyData.filter((d) => d.expense > 0).length || 1;
    const incomeDays = dailyData.filter((d) => d.income > 0).length || 1;
    return {
      avgExpense: totalExpense / expenseDays,
      avgIncome: totalIncome / incomeDays,
      activeDays: dailyData.filter((d) => d.count > 0).length,
    };
  }, [dailyData]);

  const hasData = dailyData.some((d) => d.expense > 0 || d.income > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload as DayData;
    return (
      <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
        <p className="font-medium mb-1">{formatDate(d.dateKey)}</p>
        {d.expense > 0 && <p className="text-red-300">- {formatCurrency(d.expense, currency)}</p>}
        {d.income > 0 && <p className="text-green-300">+ {formatCurrency(d.income, currency)}</p>}
        {d.count > 0 && <p className="text-slate-400 mt-1">{d.count} tx</p>}
      </div>
    );
  };

  const handleBarClick = (data: DayData) => {
    if (data.expense > 0 || data.income > 0) setSelectedDay(data);
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-dashed border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-[#1A1C1E]">Activite quotidienne</h2>
        <span className="text-xs text-slate-400">{stats.activeDays}/{totalDays} jours</span>
      </div>

      {!hasData ? (
        <p className="text-sm text-slate-400 py-6 text-center">Aucune activite ce mois</p>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#C0392B]" />
              <span className="text-[11px] text-slate-500">
                Moy. <span className="font-medium text-slate-700">{formatCurrency(stats.avgExpense, currency)}</span>/j
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
              <span className="text-[11px] text-slate-500">
                Moy. <span className="font-medium text-slate-700">{formatCurrency(stats.avgIncome, currency)}</span>/j
              </span>
            </div>
          </div>

          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyData}
                margin={{ top: 4, right: 0, bottom: 0, left: -20 }}
                onClick={(e: any) => e?.activePayload?.[0]?.payload && handleBarClick(e.activePayload[0].payload)}
              >
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fontSize: 9, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  interval={totalDays > 15 ? Math.floor(totalDays / 8) : 0}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="expense" stackId="a" fill="#E8A0A0" radius={[0, 0, 0, 0]} maxBarSize={16} />
                <Bar dataKey="income" stackId="b" fill="#A0D8B4" radius={[3, 3, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedDay(null)} />
          <div className="relative bg-white w-full sm:max-w-md max-h-[80vh] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{formatDate(selectedDay.dateKey)}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedDay.count} transaction{selectedDay.count > 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setSelectedDay(null)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-slate-50 flex items-center gap-4">
              {selectedDay.expense > 0 && (
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-[#C0392B]" />
                  <span className="text-xs font-medium text-[#C0392B]">{formatCurrency(selectedDay.expense, currency)}</span>
                </div>
              )}
              {selectedDay.income > 0 && (
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  <span className="text-xs font-medium text-[#2D6A4F]">+{formatCurrency(selectedDay.income, currency)}</span>
                </div>
              )}
              <div className="ml-auto text-xs text-slate-400">
                Solde: <span className={`font-medium ${selectedDay.income - selectedDay.expense >= 0 ? 'text-[#2D6A4F]' : 'text-[#C0392B]'}`}>
                  {formatCurrency(selectedDay.income - selectedDay.expense, currency)}
                </span>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[50vh] px-5 py-2">
              {dayTransactions.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">Aucune transaction</p>
              ) : (
                <div className="space-y-1">
                  {dayTransactions.map((tx) => {
                    const cat = categoriesMap.get(tx.categoryId);
                    const isIncome = tx.type === 'income';
                    return (
                      <div
                        key={tx.id}
                        onClick={() => { setSelectedDay(null); onEditTransaction(tx); }}
                        className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                            <CategoryIcon name={cat?.icon || 'MoreHorizontal'} className="w-4 h-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-900">{tx.note || cat?.name || 'Transaction'}</p>
                            <p className="text-[11px] text-slate-400">{cat?.name}</p>
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
        </div>
      )}
    </div>
  );
};
