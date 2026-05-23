export interface SimplifiedDebt {
  from: string;
  to: string;
  amount: number;
}

/**
 * Greedy debt-simplification algorithm.
 *
 * Given a balance map (positive = creditor, negative = debtor),
 * produce the minimal set of transactions to settle all debts.
 *
 * Strategy: sort creditors and debtors by absolute value descending,
 * then iteratively match the largest creditor with the largest debtor.
 */
export function simplifyDebts(
  balances: Map<string, number>
): SimplifiedDebt[] {
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  for (const [id, balance] of balances) {
    // Round to 2 decimals to avoid floating-point dust
    const rounded = Math.round(balance * 100) / 100;
    if (rounded > 0) {
      creditors.push({ id, amount: rounded });
    } else if (rounded < 0) {
      debtors.push({ id, amount: Math.abs(rounded) });
    }
  }

  // Sort descending by amount so we settle the largest debts first
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions: SimplifiedDebt[] = [];

  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];

    const transfer = Math.min(creditor.amount, debtor.amount);
    const rounded = Math.round(transfer * 100) / 100;

    if (rounded > 0) {
      transactions.push({
        from: debtor.id,
        to: creditor.id,
        amount: rounded,
      });
    }

    creditor.amount = Math.round((creditor.amount - transfer) * 100) / 100;
    debtor.amount = Math.round((debtor.amount - transfer) * 100) / 100;

    if (creditor.amount === 0) ci++;
    if (debtor.amount === 0) di++;
  }

  return transactions;
}
