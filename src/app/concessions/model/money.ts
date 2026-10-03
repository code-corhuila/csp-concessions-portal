/** Concessions monetary values cross the API boundary as integer cents. */
export type MoneyInCents = number & { readonly __brand: 'MoneyInCents' };

export function moneyInCents(value: number): MoneyInCents {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('Money values must be non-negative integer cents.');
  }
  return value as MoneyInCents;
}

export function formatCents(cents: MoneyInCents): string {
  return (cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
