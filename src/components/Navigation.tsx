import React from 'react';
import { LayoutDashboard, ArrowLeftRight, PieChart, Tag, SlidersHorizontal, Plus, Wallet } from 'lucide-react';

export type TabType = 'dashboard' | 'transactions' | 'budgets' | 'categories' | 'settings';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenQuickAdd: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, onOpenQuickAdd }) => {
  const navItems = [
    { id: 'dashboard' as TabType, label: 'Accueil', icon: LayoutDashboard },
    { id: 'transactions' as TabType, label: 'Transactions', icon: ArrowLeftRight },
    { id: 'budgets' as TabType, label: 'Budgets', icon: PieChart },
    { id: 'categories' as TabType, label: 'Categories', icon: Tag },
    { id: 'settings' as TabType, label: 'Reglages', icon: SlidersHorizontal }
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-slate-100">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive ? 'text-[#1B3022]' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={onOpenQuickAdd}
        className="fixed bottom-20 right-4 z-40 md:hidden w-12 h-12 bg-[#1B3022] text-white rounded-full shadow-lg flex items-center justify-center"
        aria-label="Ajouter"
      >
        <Plus className="w-5 h-5" />
      </button>

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
      </aside>
    </>
  );
};
