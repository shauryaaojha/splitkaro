import { connectDB } from "./db";
import Expense from "@/models/Expense";
import Settlement from "@/models/Settlement";

/**
 * Calculate the net balance of every member in a group.
 *
 * For each user the balance is:
 *   + amount they paid (others owe them)
 *   − their split share (they owe)
 *   + settlements they made (paid off debt)
 *   − settlements they received (someone paid them, reducing what's owed to them)
 *
 * Positive = owed money (creditor), Negative = owes money (debtor).
 */
export async function calculateGroupBalances(
  groupId: string
): Promise<Map<string, number>> {
  await connectDB();

  const balances = new Map<string, number>();

  function add(userId: string, amount: number) {
    balances.set(userId, (balances.get(userId) ?? 0) + amount);
  }

  // ── Expenses ──────────────────────────────────────────────────────────
  const expenses = await Expense.find({
    groupId,
    isDeleted: false,
  }).lean();

  for (const expense of expenses) {
    // Person who paid is owed the full amount
    const payerId = expense.paidBy.toString();
    add(payerId, expense.amount);

    // Each split participant owes their share
    for (const split of expense.splits) {
      const splitUserId = split.userId.toString();
      add(splitUserId, -split.share);
    }
  }

  // ── Settlements ───────────────────────────────────────────────────────
  const settlements = await Settlement.find({ groupId }).lean();

  for (const s of settlements) {
    const payerId = s.payer.toString();
    const payeeId = s.payee.toString();

    // Payer reduces their debt (balance goes up)
    add(payerId, s.amount);
    // Payee's credit is reduced (balance goes down)
    add(payeeId, -s.amount);
  }

  // Round all values to 2 decimal places
  for (const [userId, balance] of balances) {
    balances.set(userId, Math.round(balance * 100) / 100);
  }

  return balances;
}
