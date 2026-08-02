import React, { useState, useEffect } from 'react';
import { Download, Upload, Trash2, Smartphone, Plus, X } from 'lucide-react';
import { CurrencyCode, Category, TransactionType } from '../types';
import { apiFetchTransactions, apiFetchCategories, apiFetchBudgets, apiFetchSettings, apiResetDatabase, apiBulkCategories, apiSaveSetting, apiSaveBudget, apiCreateTransaction } from '../db/api';
import { CategoryIcon, ICON_OPTIONS } from '../utils/icons';
import { apiGetAllUsers, apiSetActive, apiSetRole, type UserProfile } from '../db/auth';

interface SettingsViewProps {
  currency: CurrencyCode;
  userId: string;
  onUpdateCurrency: (c: CurrencyCode) => Promise<void>;
  onResetDatabase: () => Promise<void>;
  onReloadData: () => Promise<void>;
  categories: Category[];
  onAddCategory: (cat: Omit<Category, 'id'>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  isAdmin?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currency,
  userId,
  onUpdateCurrency,
  onResetDatabase,
  onReloadData,
  categories,
  onAddCategory,
  onDeleteCategory,
  isAdmin
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [type, setType] = useState<TransactionType>('expense');

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setAdminLoading(true);
    const data = await apiGetAllUsers();
    setUsers(data);
    setAdminLoading(false);
  };

  const handleToggle = async (uuid: string, currentActive: boolean) => {
    await apiSetActive(uuid, !currentActive);
    await loadUsers();
  };

  const handleRole = async (uuid: string, newRole: string) => {
    await apiSetRole(uuid, newRole);
    await loadUsers();
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onAddCategory({ name: name.trim(), icon, type });
    setName('');
    setIcon('Tag');
    setIsAdding(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const handleExportJSON = async () => {
    const [transactions, categoriesData, budgets, settings] = await Promise.all([
      apiFetchTransactions(userId),
      apiFetchCategories(userId),
      apiFetchBudgets(userId),
      apiFetchSettings(userId),
    ]);

    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      transactions,
      categories: categoriesData,
      budgets,
      settings,
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `spending_planner_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus('Restauration en cours...');
      const text = await file.text();
      const data = JSON.parse(text);

      await apiResetDatabase(userId);

      if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
        await apiBulkCategories(userId, data.categories);
      }
      if (data.settings && typeof data.settings === 'object') {
        for (const [key, value] of Object.entries(data.settings)) {
          await apiSaveSetting(userId, key, value as string);
        }
      }
      if (data.budgets && Array.isArray(data.budgets)) {
        for (const b of data.budgets) {
          await apiSaveBudget(userId, b.categoryId, b.monthlyLimit);
        }
      }
      if (data.transactions && Array.isArray(data.transactions)) {
        for (const t of data.transactions) {
          await apiCreateTransaction(userId, { type: t.type, amount: t.amount, categoryId: t.categoryId, date: t.date, note: t.note || '' });
        }
      }

      await onReloadData();
      setImportStatus('Restauration reussie!');
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err) {
      console.error('Failed to import backup', err);
      setImportStatus("Erreur lors de l'importation.");
    }
  };

  const currencies = [
    { code: 'DT', label: 'DT' },
    { code: 'EUR', label: 'EUR' },
    { code: 'USD', label: 'USD' },
    { code: 'TND', label: 'TND' },
    { code: 'MAD', label: 'MAD' },
    { code: 'DZD', label: 'DZD' },
    { code: 'GBP', label: 'GBP' },
    { code: 'CAD', label: 'CAD' }
  ];

  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');
  const incomeCategories = categories.filter((c) => c.type === 'income' || c.type === 'both');
  const pendingUsers = users.filter((u) => !u.isActive);
  const activeUsers = users.filter((u) => u.isActive);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-[#1A1C1E]">Reglages</h2>

      {/* Currency */}
      <div className="bg-white rounded-xl p-5 border border-dashed border-slate-200">
        <p className="text-[11px] text-slate-400 mb-3">Devise</p>
        <div className="grid grid-cols-4 gap-1.5">
          {currencies.map((item) => (
            <button
              key={item.code}
              onClick={() => onUpdateCurrency(item.code as CurrencyCode)}
              className={`py-2 text-sm font-medium rounded-lg transition-colors ${
                currency === item.code
                  ? 'bg-[#1B3022] text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* PWA */}
      <div className="bg-white rounded-xl p-5 border border-dashed border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          <Smartphone className="w-4 h-4 text-slate-400" />
          <p className="text-[11px] text-slate-400">
            {isInstalled ? 'Application installee' : 'Installer sur l\'ecran d\'accueil'}
          </p>
        </div>
        {!isInstalled && deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="bg-[#1B3022] hover:bg-[#142419] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Installer
          </button>
        )}
      </div>

      {/* Backup */}
      <div className="bg-white rounded-xl p-5 border border-dashed border-slate-200 space-y-3">
        <p className="text-[11px] text-slate-400">Sauvegarde & Restauration</p>

        {importStatus && (
          <p className="text-xs text-[#1B3022] bg-slate-50 p-2 rounded-lg">{importStatus}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter</span>
          </button>

          <label className="flex items-center gap-1.5 text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Importer</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>
      </div>

      {/* Reset */}
      <div className="bg-white rounded-xl p-5 border border-dashed border-slate-200">
        <p className="text-[11px] text-slate-400 mb-3">Reinitialiser les donnees</p>

        {showResetConfirm ? (
          <div className="space-y-2">
            <p className="text-xs text-red-600">Toutes les donnees seront supprimees.</p>
            <div className="flex gap-2">
              <button
                onClick={async () => { await onResetDatabase(); setShowResetConfirm(false); }}
                className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors"
              >
                Confirmer
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reinitialiser</span>
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="bg-white rounded-xl p-5 border border-dashed border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] text-slate-400">Categories</p>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 bg-[#1B3022] hover:bg-[#142419] text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Ajouter</span>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-[11px] text-slate-500 mb-2">Depenses ({expenseCategories.length})</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {expenseCategories.length === 0 && (
                <p className="text-xs text-slate-400 col-span-2 py-2 text-center">Aucune categorie</p>
              )}
              {expenseCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                      <CategoryIcon name={cat.icon} className="w-3 h-3 text-slate-500" />
                    </div>
                    <span className="text-xs text-slate-700">{cat.name}</span>
                  </div>
                  {!cat.isDefault && (
                    <button
                      onClick={() => onDeleteCategory(cat.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] text-slate-500 mb-2">Revenus ({incomeCategories.length})</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {incomeCategories.length === 0 && (
                <p className="text-xs text-slate-400 col-span-2 py-2 text-center">Aucune categorie</p>
              )}
              {incomeCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                      <CategoryIcon name={cat.icon} className="w-3 h-3 text-slate-500" />
                    </div>
                    <span className="text-xs text-slate-700">{cat.name}</span>
                  </div>
                  {!cat.isDefault && (
                    <button
                      onClick={() => onDeleteCategory(cat.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Admin */}
      {isAdmin && (
        <div className="bg-white rounded-xl p-5 border border-dashed border-slate-200">
          <p className="text-[11px] text-slate-400 mb-3">Administration</p>

          {adminLoading ? (
            <p className="text-xs text-slate-400">Chargement...</p>
          ) : (
            <div className="space-y-3">
              {pendingUsers.length > 0 && (
                <div>
                  <p className="text-[11px] text-orange-500 mb-2">En attente ({pendingUsers.length})</p>
                  <div className="space-y-1.5">
                    {pendingUsers.map((u) => (
                      <div key={u.uuid} className="border border-dashed border-orange-200 rounded-lg p-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium">{u.name || u.email}</p>
                          <p className="text-[10px] text-gray-400">{u.email}</p>
                        </div>
                        <button
                          onClick={() => handleToggle(u.uuid, false)}
                          className="text-[11px] bg-green-500 text-white px-2.5 py-1 rounded-lg hover:bg-green-600 transition-colors"
                        >
                          Activer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeUsers.length > 0 && (
                <div>
                  <p className="text-[11px] text-green-500 mb-2">Actifs ({activeUsers.length})</p>
                  <div className="space-y-1.5">
                    {activeUsers.map((u) => (
                      <div key={u.uuid} className="border border-dashed border-gray-200 rounded-lg p-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium">{u.name || u.email}</p>
                          <p className="text-[10px] text-gray-400">{u.email}</p>
                          {u.role === 'admin' && (
                            <span className="text-[10px] text-blue-600 font-medium">Admin</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {u.role === 'admin' ? (
                            <button
                              onClick={() => handleRole(u.uuid, 'user')}
                              className="text-[11px] bg-blue-100 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              Retirer
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRole(u.uuid, 'admin')}
                              className="text-[11px] bg-blue-100 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              Admin
                            </button>
                          )}
                          <button
                            onClick={() => handleToggle(u.uuid, true)}
                            className="text-[11px] bg-red-100 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Desactiver
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {users.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Aucun utilisateur inscrit.</p>
              )}
            </div>
          )}
        </div>
      )}

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
    </div>
  );
};
