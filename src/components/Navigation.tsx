import React from 'react';
import { LayoutDashboard, ArrowLeftRight, PieChart, SlidersHorizontal, Plus, Wallet, LogOut, Clock } from 'lucide-react';
import { AuthUser } from '../db/auth';

export type TabType = 'dashboard' | 'transactions' | 'timeline' | 'budgets' | 'settings';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenQuickAdd: () => void;
  onLogout: () => void;
  user: AuthUser;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, onOpenQuickAdd, onLogout, user }) => {
  const navItems = [
    { id: 'dashboard' as TabType, label: 'Accueil', icon: LayoutDashboard },
    { id: 'transactions' as TabType, label: 'Transactions', icon: ArrowLeftRight },
    { id: 'timeline' as TabType, label: 'Timeline', icon: Clock },
    { id: 'budgets' as TabType, label: 'Budgets', icon: PieChart },
    { id: 'settings' as TabType, label: 'Reglages', icon: SlidersHorizontal },
  ];

  return (
    <>
      {/* Mobile Floating Dock */}
      <div className="fixed bottom-4 left-3 right-3 z-40 md:hidden">
        <div className="bg-white/80 backdrop-blur-xl shadow-lg shadow-black/10 rounded-3xl px-2 py-2 flex items-center justify-around">
          {navItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                  isActive ? 'bg-[#1B3022] text-white' : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}

          <button
            onClick={onOpenQuickAdd}
            className="w-11 h-11 rounded-2xl bg-[#1B3022] text-white flex items-center justify-center shadow-md shadow-[#1B3022]/30 -mt-5"
            aria-label="Ajouter"
          >
            <Plus className="w-5 h-5" />
          </button>

          {navItems.slice(2).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                  isActive ? 'bg-[#1B3022] text-white' : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-slate-100 min-h-screen fixed left-0 top-0 bottom-0 z-30 p-4">
        <div className="flex items-center gap-2.5 mb-8 px-2">
          <div className="w-8 h-8 rounded-lg bg-[#1B3022] text-white flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm text-[#1A1C1E]">SpendingPlanner</span>
        </div>

        <button
          onClick={onOpenQuickAdd}
          className="w-full mb-6 bg-[#1B3022] hover:bg-[#142419] text-white rounded-lg py-2.5 px-4 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle transaction</span>
        </button>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#F1F3F5] text-[#1B3022]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 pt-4 mt-4 space-y-2">
          <div className="px-3">
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Se deconnecter</span>
          </button>
        </div>
      </aside>
    </>
  );
};
