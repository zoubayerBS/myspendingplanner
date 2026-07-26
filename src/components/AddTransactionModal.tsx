import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import { Category, Transaction, TransactionType, CurrencyCode } from '../types';
import { CategoryIcon } from '../utils/icons';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt'> & { id?: number }) => Promise<void>;
  categories: Category[];
  editingTransaction?: Transaction | null;
  currency: CurrencyCode;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  editingTransaction,
  currency
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        setType(editingTransaction.type);
        setAmount(String(editingTransaction.amount));
        setCategoryId(editingTransaction.categoryId);
        setDate(editingTransaction.date);
        setNote(editingTransaction.note || '');
      } else {
        setType('expense');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setNote('');
        const defaultCategory = categories.find((c) => c.type === 'expense' || c.type === 'both');
        if (defaultCategory) setCategoryId(defaultCategory.id);
      }
      setTimeout(() => amountInputRef.current?.focus(), 100);
    }
  }, [isOpen, editingTransaction, categories]);

  const filteredCategories = categories.filter((c) => c.type === type || c.type === 'both');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (!categoryId) return;

    try {
      setIsSubmitting(true);
      await onSave({
        id: editingTransaction?.id,
        type,
        amount: parsedAmount,
        categoryId,
        date: date || new Date().toISOString().split('T')[0],
        note: note.trim()
      });
      onClose();
    } catch (err) {
      console.error('Failed to save transaction', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-medium text-[#1A1C1E]">
            {editingTransaction ? 'Modifier' : 'Nouvelle transaction'}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Type Toggle */}
          <div className="flex bg-slate-50 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                type === 'expense' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Depense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                type === 'income' ? 'bg-white text-[#2D6A4F] shadow-sm' : 'text-slate-500'
              }`}
            >
              Revenu
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Montant ({currency})</label>
            <input
              ref={amountInputRef}
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full text-2xl font-semibold text-[#1A1C1E] bg-slate-50 border border-slate-200 rounded-lg py-3 px-3 focus:outline-none focus:border-[#1B3022] transition-colors placeholder:text-slate-300"
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-[11px] text-slate-500 mb-1.5">Categorie</label>
            <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex items-center gap-1.5 p-2 rounded-lg text-left text-xs transition-colors ${
                    categoryId === cat.id
                      ? 'bg-[#1B3022] text-white'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CategoryIcon name={cat.icon} className={`w-3.5 h-3.5 ${categoryId === cat.id ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:border-[#1B3022] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Note</label>
              <input
                type="text"
                placeholder="Optionnel"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:border-[#1B3022] transition-colors placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1B3022] hover:bg-[#142419] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{editingTransaction ? 'Mettre a jour' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
