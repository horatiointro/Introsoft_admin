export const CURRENCY_OPTIONS = [
  { code: 'USD', name: 'US Dollar' }, { code: 'ZAR', name: 'South African Rand' },
  { code: 'EUR', name: 'Euro' }, { code: 'GBP', name: 'Pound Sterling' },
  { code: 'CAD', name: 'Canadian Dollar' }, { code: 'AUD', name: 'Australian Dollar' },
  { code: 'NZD', name: 'New Zealand Dollar' }, { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CNY', name: 'Chinese Yuan' }, { code: 'INR', name: 'Indian Rupee' },
  { code: 'SGD', name: 'Singapore Dollar' }, { code: 'CHF', name: 'Swiss Franc' },
  { code: 'AED', name: 'UAE Dirham' }, { code: 'BRL', name: 'Brazilian Real' },
  { code: 'MXN', name: 'Mexican Peso' }, { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'KES', name: 'Kenyan Shilling' }, { code: 'GHS', name: 'Ghanaian Cedi' },
  { code: 'HKD', name: 'Hong Kong Dollar' }, { code: 'SEK', name: 'Swedish Krona' },
  { code: 'NOK', name: 'Norwegian Krone' }, { code: 'DKK', name: 'Danish Krone' },
  { code: 'PLN', name: 'Polish Zloty' }, { code: 'KRW', name: 'South Korean Won' },
  { code: 'THB', name: 'Thai Baht' }, { code: 'TRY', name: 'Turkish Lira' },
  { code: 'ILS', name: 'Israeli New Shekel' }, { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'PHP', name: 'Philippine Peso' }, { code: 'IDR', name: 'Indonesian Rupiah' }
] as const;

export type CurrencyCode = typeof CURRENCY_OPTIONS[number]['code'];
export type FxRateMap = Record<string, number | null | undefined>;

export function convertCurrency(amount: number, from: string, to: string, unitsPerUsd: FxRateMap): number | null {
  if (!Number.isFinite(amount)) return null;
  const fromRate = from === 'USD' ? 1 : Number(unitsPerUsd[from]);
  const toRate = to === 'USD' ? 1 : Number(unitsPerUsd[to]);
  if (!Number.isFinite(fromRate) || fromRate <= 0 || !Number.isFinite(toRate) || toRate <= 0) return null;
  return amount / fromRate * toRate;
}

export function formatCurrency(amount: number, currency: string, locale?: string): string {
  try { return new Intl.NumberFormat(locale || undefined, { style: 'currency', currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2 }).format(amount); }
  catch { return `${currency} ${Number(amount).toFixed(2)}`; }
}

export function formatForDisplay(amount: number, sourceCurrency: string, displayCurrency: string, rates: FxRateMap, locale?: string): { value: string; converted: boolean; exact: number | null } {
  const convertedAmount = convertCurrency(amount, sourceCurrency, displayCurrency, rates);
  if (convertedAmount === null) return { value: formatCurrency(amount, sourceCurrency, locale), converted: false, exact: null };
  return { value: formatCurrency(convertedAmount, displayCurrency, locale), converted: sourceCurrency !== displayCurrency, exact: convertedAmount };
}
