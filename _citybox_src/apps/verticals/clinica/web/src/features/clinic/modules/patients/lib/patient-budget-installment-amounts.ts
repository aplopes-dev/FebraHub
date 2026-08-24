/** Rateia `balanceCents` em N parcelas; a última absorve o resto (igual clinica-api). */
export function distributeInstallmentAmounts(
  balanceCents: number,
  installmentsCount: number,
): number[] {
  if (installmentsCount <= 0) return [];

  const safeBalance = Math.max(0, balanceCents);
  const baseAmount = Math.floor(safeBalance / installmentsCount);
  const amounts = Array.from({ length: installmentsCount - 1 }, () => baseAmount);
  const lastAmount = safeBalance - baseAmount * (installmentsCount - 1);
  amounts.push(lastAmount);
  return amounts;
}
