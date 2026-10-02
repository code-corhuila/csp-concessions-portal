/** Concessions monetary values cross the API boundary as integer cents. */
export type MoneyInCents = number;

export function formatCents(cents: MoneyInCents): string {
  return (cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
