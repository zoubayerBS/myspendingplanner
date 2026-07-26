import { CurrencyCode, Transaction, Category } from '../types';

export function formatCurrency(amount: number, currency: CurrencyCode = 'DT'): string {
  const formattedNumber = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  switch (currency) {
    case 'DT':
    case 'TND':
      return `${formattedNumber} DT`;
    case 'EUR':
      return `${formattedNumber} €`;
    case 'USD':
      return `$${formattedNumber}`;
    case 'GBP':
      return `£${formattedNumber}`;
    case 'MAD':
      return `${formattedNumber} DH`;
    case 'DZD':
      return `${formattedNumber} DA`;
    default:
      return `${formattedNumber} ${currency}`;
  }
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return dateString;

  const date = new Date(year, month - 1, day);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  ) {
    return "Aujourd'hui";
  }

  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) {
    return 'Hier';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  }).format(date);
}

export function formatMonthYear(yearMonth: string): string {
  if (!yearMonth || yearMonth === 'all') return 'Toutes les dates';
  const [year, month] = yearMonth.split('-').map(Number);
  if (!year || !month) return yearMonth;

  const date = new Date(year, month - 1, 1);
  const formatted = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric'
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function getCurrentYearMonth(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getPreviousYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 2, 1);
  const prevYear = date.getFullYear();
  const prevMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${prevYear}-${prevMonth}`;
}

export function exportToCSV(
  transactions: Transaction[],
  categoriesMap: Map<string, Category>,
  currency: CurrencyCode
) {
  // UTF-8 BOM for Excel
  const BOM = '\uFEFF';
  const headers = ['ID', 'Date', 'Type', 'Catégorie', 'Montant', 'Devise', 'Note'];

  const rows = transactions.map((tx) => {
    const category = categoriesMap.get(tx.categoryId)?.name || 'Inconnue';
    const typeLabel = tx.type === 'income' ? 'Revenu' : 'Dépense';
    const note = (tx.note || '').replace(/"/g, '""');

    return [
      tx.id || '',
      tx.date,
      typeLabel,
      `"${category}"`,
      tx.amount.toFixed(2),
      currency,
      `"${note}"`
    ].join(';');
  });

  const csvContent = BOM + [headers.join(';'), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `spending_planner_export_${getCurrentYearMonth()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
