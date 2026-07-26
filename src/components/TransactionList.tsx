import React, { useState, useMemo } from 'react';
import { Search, Download, Trash2, Edit3, Plus, X } from 'lucide-react';
import { Transaction, Category, CurrencyCode } from '../types';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters';
import { CategoryIcon } from '../utils/icons';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  currency: CurrencyCode;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: number) => Promise<void>;
  onOpenQuickAdd: () => void;
  selectedMonth: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  currency,
  onEditTransaction,
  onDeleteTransaction,
  onOpenQuickAdd,
  selectedMonth
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const categoriesMap = useMemo(() => {
    return new Map<string, Category>(categories.map((c) => [c.id, c]));
  }, [categories]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedType !== 'all' && tx.type !== selectedType) return false;
      if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const catName = categoriesMap.get(tx.categoryId)?.name.toLowerCase() || '';
        const note = (tx.note || '').toLowerCase();
        const matchesQuery = catName.includes(query) || note.includes(query) || tx.amount.toString().includes(query);
        if (!matchesQuery) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedType, selectedCategory, searchQuery, categoriesMap]);

  const handleExportCSV = () => {
    exportToCSV(filteredTransactions, categoriesMap, currency);
  };

  const handleDelete = async (id: number) => {
    await onDeleteTransaction(id);
    setConfirmDeleteId(null);
  };

  const groupedByDate = useMemo<Record<string, Transaction[]>>(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((tx) => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    });
    return groups;
  }, [filteredTransactions]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-[#1A1C1E]">Transactions</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 bg-[#1B3022] hover:bg-[#142419] text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B3022] transition-colors placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
            {(['all', 'expense', 'income'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  selectedType === type ? 'bg-white text-[#1B3022] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {type === 'all' ? 'Toutes' : type === 'expense' ? 'Depenses' : 'Revenus'}
              </button>
            ))}
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B3022] min-w-0"
          >
            <option value="all">Toutes</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {Object.keys(groupedByDate).length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-400">Aucune transaction</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedType('all'); setSelectedCategory('all'); }}
            className="text-sm text-[#1B3022] font-medium mt-2 hover:opacity-70 transition-opacity"
          >
            Reinitialiser
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {(Object.entries(groupedByDate) as [string, Transaction[]][]).map(([dateStr, txs]) => (
            <div key={dateStr} className="bg-white rounded-xl border border-dashed border-slate-200 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-50 bg-slate-50/50">
                <span className="text-xs font-medium text-slate-500">{formatDate(dateStr)}</span>
              </div>

              <div className="divide-y divide-slate-50">
                {txs.map((tx) => {
                  const category = categoriesMap.get(tx.categoryId);
                  const isIncome = tx.type === 'income';
                  const isConfirmingDelete = confirmDeleteId === tx.id;

                  return (
                    <div key={tx.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                          <CategoryIcon name={category?.icon || 'MoreHorizontal'} className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-slate-900 truncate">{tx.note || category?.name || 'Transaction'}</p>
                          <p className="text-[11px] text-slate-400">{category?.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-sm font-medium ${isIncome ? 'text-[#2D6A4F]' : 'text-slate-900'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                        </span>

                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => tx.id && handleDelete(tx.id)} className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded">Oui</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded">Non</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100">
                            <button onClick={() => onEditTransaction(tx)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => tx.id && setConfirmDeleteId(tx.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
