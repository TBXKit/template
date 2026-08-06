/**
 * Formats a monetary amount for display using the store's currency
 * (`Webstore.currency`). The one place every price display in this app —
 * package price, basket line items, basket total — formats money, so
 * currency handling (locale, decimal places, currency symbol) stays
 * consistent without each component re-deriving it.
 */
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount);
}
