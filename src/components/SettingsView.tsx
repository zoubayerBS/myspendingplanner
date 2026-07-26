import React, { useState, useEffect } from 'react';
import { Download, Upload, Trash2, Smartphone } from 'lucide-react';
import { CurrencyCode } from '../types';
import { apiFetchTransactions, apiFetchCategories, apiFetchBudgets, apiFetchSettings, apiResetDatabase, apiBulkCategories, apiSaveSetting, apiSaveBudget, apiCreateTransaction } from '../db/api';

interface SettingsViewProps {
  currency: CurrencyCode;
  userId: string;
  onUpdateCurrency: (c: CurrencyCode) => Promise<void>;
  onResetDatabase: () => Promise<void>;
  onReloadData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currency,
  userId,
  onUpdateCurrency,
  onResetDatabase,
  onReloadData
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

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
    const [transactions, categories, budgets, settings] = await Promise.all([
      apiFetchTransactions(userId),
      apiFetchCategories(userId),
      apiFetchBudgets(userId),
      apiFetchSettings(userId),
    ]);

    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      transactions,
      categories,
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
    </div>
  );
};
