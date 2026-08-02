import React, { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight, Calendar, X, TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction, Category, CurrencyCode } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CategoryIcon } from '../utils/icons';

type ZoomLevel = 'month' | 'week' | 'day';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  currency: CurrencyCode;
  onEditTransaction: (tx: Transaction) => void;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmt(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const CATEGORY_COLORS: Record<string, string> = {
  cat_food: '#1B3022',
  cat_housing: '#2D6A4F',
  cat_transport: '#40916C',
  cat_bills: '#52B788',
  cat_health: '#74C69D',
  cat_shopping: '#94A3B8',
  cat_leisure: '#C0392B',
  cat_tech: '#8B5CF6',
  cat_other_exp: '#6B7280',
  cat_salary: '#16A34A',
  cat_freelance: '#059669',
  cat_invest: '#0891B2',
  cat_gift: '#D97706',
};

const FALLBACK_COLORS = ['#1B3022', '#2D6A4F', '#40916C', '#52B788', '#74C69D', '#94A3B8', '#C0392B', '#8B5CF6', '#6B7280', '#16A34A', '#059669', '#0891B2', '#D97706'];

export const TimelineView: React.FC<Props> = ({
  transactions,
  categories,
  currency,
  onEditTransaction,
}) => {
  const [zoom, setZoom] = useState<ZoomLevel>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const categoriesMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const txByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    transactions.forEach((tx) => {
      const list = map.get(tx.date) || [];
      list.push(tx);
      map.set(tx.date, list);
    });
    return map;
  }, [transactions]);

  const periodDates = useMemo(() => {
    if (zoom === 'day') return [fmt(currentDate)];
    if (zoom === 'week') {
      const start = startOfWeek(currentDate);
      return Array.from({ length: 7 }, (_, i) => fmt(addDays(start, i)));
    }
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => fmt(new Date(year, month, i + 1)));
  }, [zoom, currentDate]);

  const periodTxs = useMemo(() => {
    return transactions.filter((tx) => periodDates.includes(tx.date));
  }, [transactions, periodDates]);

  const periodStats = useMemo(() => {
    const income = periodTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = periodTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense, count: periodTxs.length };
  }, [periodTxs]);

  const navigate = (dir: -1 | 1) => {
    const d = new Date(currentDate);
    if (zoom === 'day') d.setDate(d.getDate() + dir);
    else if (zoom === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  const periodLabel = useMemo(() => {
    if (zoom === 'day') return formatDate(fmt(currentDate));
    if (zoom === 'week') {
      const start = startOfWeek(currentDate);
      const end = addDays(start, 6);
      return `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} — ${end.getDate()} ${MONTH_NAMES[end.getMonth()]}`;
    }
    return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [zoom, currentDate]);

  // ── Month stacked bar data ──────────────────────────────
  const { monthChartData, expenseCategoryIds } = useMemo(() => {
    if (zoom !== 'month') return { monthChartData: [], expenseCategoryIds: [] };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const catIdSet = new Set<string>();

    const data = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateKey = fmt(new Date(year, month, day));
      const dayTxs = txByDate.get(dateKey) || [];
      const row: any = { day, dateKey, _txs: dayTxs };

      dayTxs.forEach((tx) => {
        if (tx.type === 'expense') {
          catIdSet.add(tx.categoryId);
          row[tx.categoryId] = (row[tx.categoryId] || 0) + tx.amount;
        }
      });

      return row;
    });

    const catIds = Array.from(catIdSet);
    return { monthChartData: data, expenseCategoryIds: catIds };
  }, [zoom, currentDate, txByDate]);

  const catColorMap = useMemo(() => {
    const map = new Map<string, string>();
    expenseCategoryIds.forEach((id, idx) => {
      map.set(id, CATEGORY_COLORS[id] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length]);
    });
    return map;
  }, [expenseCategoryIds]);

  const handleMonthBarClick = useCallback((data: any) => {
    if (!data?.activePayload?.[0]) return;
    const payload = data.activePayload[0].payload;
    const dayTxs: Transaction[] = payload._txs || [];
    if (dayTxs.length === 1) setSelectedTx(dayTxs[0]);
    else if (dayTxs.length > 1) {
      const [y, m] = payload.dateKey.split('-').map(Number);
      setCurrentDate(new Date(y, m - 1, payload.day));
      setZoom('day');
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-5 border border-dashed border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[#1A1C1E]">Timeline</h2>
          <div className="flex items-center bg-slate-50 rounded-lg p-0.5">
            {(['day', 'week', 'month'] as ZoomLevel[]).map((z) => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  zoom === z ? 'bg-white text-[#1B3022] shadow-sm' : 'text-slate-500'
                }`}
              >
                {z === 'day' ? 'Jour' : z === 'week' ? 'Semaine' : 'Mois'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">{periodLabel}</span>
            <button onClick={goToday} className="text-[10px] text-[#1B3022] font-medium px-2 py-0.5 rounded bg-[#F1F3F5] hover:bg-[#E2E6E9] transition-colors">
              Auj.
            </button>
          </div>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-[#2D6A4F]" />
            <span className="text-slate-500">Revenus</span>
            <span className="font-medium text-[#2D6A4F]">{formatCurrency(periodStats.income, currency)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-3 h-3 text-[#C0392B]" />
            <span className="text-slate-500">Depenses</span>
            <span className="font-medium text-[#C0392B]">{formatCurrency(periodStats.expense, currency)}</span>
          </div>
          <div className="ml-auto text-slate-400">{periodStats.count} tx</div>
        </div>

        {periodStats.count === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Aucune transaction</p>
          </div>
        ) : zoom === 'month' ? (
          <div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthChartData}
                  margin={{ top: 4, right: 4, bottom: 0, left: -16 }}
                  onClick={handleMonthBarClick}
                >
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 9, fill: '#94A3B8' }}
                    tickLine={false}
                    axisLine={false}
                    interval={currentDate.getMonth() === new Date().getMonth() ? (new Date().getDate() - 1) : -1}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0]?.payload as any;
                      const dayTxs: Transaction[] = row._txs || [];
                      const total = dayTxs.filter((t) => t.type === 'expense').reduce((s: number, t: Transaction) => s + t.amount, 0);
                      return (
                        <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg max-w-[200px]">
                          <p className="font-medium mb-1">{label} {MONTH_NAMES[currentDate.getMonth()]}</p>
                          {payload.filter((p: any) => p.value > 0).map((p: any) => {
                            const cat = categoriesMap.get(p.dataKey);
                            return (
                              <div key={p.dataKey} className="flex items-center justify-between gap-2">
                                <span className="text-slate-300 truncate">{cat?.name || p.dataKey}</span>
                                <span className="font-medium">{formatCurrency(p.value, currency)}</span>
                              </div>
                            );
                          })}
                          {total > 0 && (
                            <div className="border-t border-slate-700 mt-1 pt-1 flex justify-between">
                              <span className="text-slate-400">Total</span>
                              <span className="font-medium">{formatCurrency(total, currency)}</span>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  {expenseCategoryIds.map((catId) => (
                    <Bar
                      key={catId}
                      dataKey={catId}
                      stackId="a"
                      fill={catColorMap.get(catId) || '#94A3B8'}
                      radius={[2, 2, 0, 0]}
                      maxBarSize={20}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {expenseCategoryIds.length > 0 && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 pt-3 border-t border-slate-100">
                {expenseCategoryIds.map((catId) => {
                  const cat = categoriesMap.get(catId);
                  const color = catColorMap.get(catId) || '#94A3B8';
                  const total = monthChartData.reduce((s: number, row: any) => s + (row[catId] || 0), 0);
                  return (
                    <div key={catId} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-[10px] text-slate-500">{cat?.name}</span>
                      <span className="text-[10px] font-medium text-slate-700">{formatCurrency(total, currency)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : zoom === 'week' ? (
          <div className="space-y-1">
            {periodDates.map((dateKey) => {
              const dayTxs = txByDate.get(dateKey) || [];
              const d = new Date(dateKey + 'T00:00:00');
              const isToday = dateKey === fmt(new Date());
              const dayExpense = dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
              const dayIncome = dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);

              return (
                <div key={dateKey} className={`rounded-lg border border-slate-100 overflow-hidden ${isToday ? 'ring-1 ring-[#1B3022]/20' : ''}`}>
                  <div className={`flex items-center justify-between px-3 py-2 ${isToday ? 'bg-[#F1F3F5]' : 'bg-slate-50/50'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${isToday ? 'text-[#1B3022]' : 'text-slate-600'}`}>
                        {DAY_NAMES[(d.getDay() + 6) % 7]} {d.getDate()}
                      </span>
                      {dayTxs.length === 0 && <span className="text-[10px] text-slate-300">—</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      {dayIncome > 0 && <span className="text-[#2D6A4F] font-medium">+{formatCurrency(dayIncome, currency)}</span>}
                      {dayExpense > 0 && <span className="text-[#C0392B] font-medium">-{formatCurrency(dayExpense, currency)}</span>}
                    </div>
                  </div>
                  {dayTxs.length > 0 && (
                    <div className="divide-y divide-slate-50">
                      {dayTxs.map((tx) => {
                        const cat = categoriesMap.get(tx.categoryId);
                        const isIncome = tx.type === 'income';
                        return (
                          <div
                            key={tx.id}
                            onClick={() => setSelectedTx(tx)}
                            className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center">
                                <CategoryIcon name={cat?.icon || 'MoreHorizontal'} className="w-3 h-3 text-slate-500" />
                              </div>
                              <span className="text-xs text-slate-700">{tx.note || cat?.name || 'Transaction'}</span>
                            </div>
                            <span className={`text-xs font-medium ${isIncome ? 'text-[#2D6A4F]' : 'text-slate-900'}`}>
                              {isIncome ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <DayView date={currentDate} txs={txByDate.get(fmt(currentDate)) || []} categoriesMap={categoriesMap} currency={currency} onSelectTx={setSelectedTx} />
        )}
      </div>

      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedTx(null)} />
          <div className="relative bg-white w-full sm:max-w-md max-h-[70vh] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{formatDate(selectedTx.date)}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{categoriesMap.get(selectedTx.categoryId)?.name}</p>
              </div>
              <button onClick={() => setSelectedTx(null)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                  <CategoryIcon name={categoriesMap.get(selectedTx.categoryId)?.icon || 'MoreHorizontal'} className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{selectedTx.note || categoriesMap.get(selectedTx.categoryId)?.name || 'Transaction'}</p>
                  <p className="text-xs text-slate-400">{selectedTx.type === 'income' ? 'Revenu' : 'Depense'}</p>
                </div>
                <span className={`text-lg font-semibold ${selectedTx.type === 'income' ? 'text-[#2D6A4F]' : 'text-slate-900'}`}>
                  {selectedTx.type === 'income' ? '+' : '-'}{formatCurrency(selectedTx.amount, currency)}
                </span>
              </div>
              <button
                onClick={() => { setSelectedTx(null); onEditTransaction(selectedTx); }}
                className="w-full py-2.5 text-sm font-medium text-[#1B3022] bg-[#F1F3F5] rounded-lg hover:bg-[#E2E6E9] transition-colors"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function DayView({
  date,
  txs,
  categoriesMap,
  currency,
  onSelectTx,
}: {
  date: Date;
  txs: Transaction[];
  categoriesMap: Map<string, Category>;
  currency: CurrencyCode;
  onSelectTx: (tx: Transaction) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const txByHour = useMemo(() => {
    const map = new Map<number, Transaction[]>();
    txs.forEach((tx) => {
      const created = tx.createdAt ? new Date(tx.createdAt) : new Date(date);
      const hour = created.getHours();
      const list = map.get(hour) || [];
      list.push(tx);
      map.set(hour, list);
    });
    return map;
  }, [txs, date]);

  const activeHours = hours.filter((h) => txByHour.has(h));

  if (txs.length === 0) {
    return (
      <div className="py-12 text-center">
        <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-2" />
        <p className="text-sm text-slate-400">Aucune transaction ce jour</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[18px] top-0 bottom-0 w-px bg-slate-100" />
      <div className="space-y-0">
        {hours.map((hour) => {
          const hourTxs = txByHour.get(hour) || [];
          if (hourTxs.length === 0 && activeHours.length > 0) return null;
          return (
            <div key={hour} className="flex items-start gap-3 relative">
              <span className="text-[10px] text-slate-400 w-9 text-right pt-1 shrink-0">
                {String(hour).padStart(2, '0')}:00
              </span>
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 z-10 ${hourTxs.length > 0 ? 'bg-[#1B3022]' : 'bg-slate-200'}`} />
              <div className="flex-1 pb-2 min-w-0">
                {hourTxs.length === 0 ? (
                  <div className="h-6" />
                ) : (
                  <div className="space-y-1">
                    {hourTxs.map((tx) => {
                      const cat = categoriesMap.get(tx.categoryId);
                      const isIncome = tx.type === 'income';
                      return (
                        <div
                          key={tx.id}
                          onClick={() => onSelectTx(tx)}
                          className="flex items-center justify-between py-1.5 px-2 -mx-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CategoryIcon name={cat?.icon || 'MoreHorizontal'} className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="text-xs text-slate-700 truncate">{tx.note || cat?.name || 'Transaction'}</span>
                          </div>
                          <span className={`text-xs font-medium shrink-0 ml-2 ${isIncome ? 'text-[#2D6A4F]' : 'text-slate-900'}`}>
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
        })}
      </div>
    </div>
  );
}
