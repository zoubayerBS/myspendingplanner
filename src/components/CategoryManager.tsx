import React, { useState } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { Category, TransactionType } from '../types';
import { CategoryIcon, ICON_OPTIONS } from '../utils/icons';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (cat: Omit<Category, 'id'>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onAddCategory,
  onDeleteCategory
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [type, setType] = useState<TransactionType>('expense');

  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');
  const incomeCategories = categories.filter((c) => c.type === 'income' || c.type === 'both');

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onAddCategory({ name: name.trim(), icon, type });
    setName('');
    setIcon('Tag');
    setIsAdding(false);
  };

  const renderCategoryList = (cats: Category[], emptyLabel: string) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {cats.length === 0 && (
        <p className="text-sm text-slate-400 col-span-2 py-4 text-center">{emptyLabel}</p>
      )}
      {cats.map((cat) => (
        <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center">
              <CategoryIcon name={cat.icon} className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <span className="text-sm text-slate-700">{cat.name}</span>
          </div>
          {!cat.isDefault && (
            <button
              onClick={() => onDeleteCategory(cat.id)}
              className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-[#1A1C1E]">Categories</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 bg-[#1B3022] hover:bg-[#142419] text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter</span>
        </button>
      </div>

      {/* Add Category Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-medium text-slate-900">Ajouter une categorie</h3>
              <button onClick={() => setIsAdding(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-50">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Nom</label>
                <input
                  type="text"
                  placeholder="Ex: Abonnements"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B3022] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TransactionType)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B3022]"
                >
                  <option value="expense">Depense</option>
                  <option value="income">Revenu</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1.5">Icone</label>
                <div className="grid grid-cols-5 gap-1.5 max-h-36 overflow-y-auto">
                  {ICON_OPTIONS.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setIcon(item.name)}
                      className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                        icon === item.name ? 'bg-[#1B3022] text-white' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                      title={item.label}
                    >
                      <CategoryIcon name={item.name} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  Annuler
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-[#1B3022] hover:bg-[#142419] text-white text-sm font-medium rounded-lg transition-colors">
                  Creer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Categories */}
      <div className="bg-white rounded-xl p-5 border border-dashed border-slate-200">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Depenses ({expenseCategories.length})</h3>
        {renderCategoryList(expenseCategories, 'Aucune categorie de depense')}
      </div>

      {/* Income Categories */}
      <div className="bg-white rounded-xl p-5 border border-dashed border-slate-200">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Revenus ({incomeCategories.length})</h3>
        {renderCategoryList(incomeCategories, 'Aucune categorie de revenu')}
      </div>
    </div>
  );
};
