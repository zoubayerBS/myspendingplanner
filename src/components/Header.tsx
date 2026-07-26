import React from 'react';
import { ChevronLeft, ChevronRight, Wallet, LogOut } from 'lucide-react';
import { formatMonthYear, getCurrentYearMonth } from '../utils/formatters';

interface HeaderProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  isOffline?: boolean;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedMonth,
  setSelectedMonth,
  isOffline = false,
  onLogout,
}) => {
  const currentMonthKey = getCurrentYearMonth();
  const isCurrentMonth = selectedMonth === currentMonthKey;

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-white">
        {/* Mobile */}
        <div className="md:hidden">
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#1B3022] text-white flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="font-semibold text-lg text-[#1A1C1E] tracking-tight">SpendingPlanner</span>
            </div>
            <div className="flex items-center gap-2">
              {isOffline && (
                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  Offline
                </span>
              )}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Se deconnecter"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-1 px-4 pb-2.5">
            <button
              onClick={handlePrevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-[#1A1C1E] min-w-[100px] text-center select-none">
              {formatMonthYear(selectedMonth)}
            </span>
            <button
              onClick={handleNextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 active:scale-95 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {!isCurrentMonth && (
              <button
                onClick={() => setSelectedMonth(currentMonthKey)}
                className="ml-1 text-[11px] font-medium text-[#1B3022] underline underline-offset-2 decoration-1"
              >
                Auj.
              </button>
            )}
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex items-center justify-between px-6 py-3">
          <div className="w-40" />

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-base font-semibold text-[#1A1C1E] min-w-[140px] text-center select-none">
              {formatMonthYear(selectedMonth)}
            </span>
            <button
              onClick={handleNextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 active:scale-95 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {!isCurrentMonth && (
              <button
                onClick={() => setSelectedMonth(currentMonthKey)}
                className="ml-1 text-[11px] font-medium text-[#1B3022] underline underline-offset-2 decoration-1"
              >
                Aujourd'hui
              </button>
            )}
          </div>

          <div className="w-40 flex items-center justify-end">
            {isOffline && (
              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                Offline
              </span>
            )}
          </div>
        </div>
      </header>
      <hr className="border-slate-200" />
    </>
  );
};
