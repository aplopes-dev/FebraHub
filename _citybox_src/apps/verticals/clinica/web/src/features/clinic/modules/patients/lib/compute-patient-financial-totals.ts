import type { PatientFinancialEntry } from '../types/patient-financial-entry';

export type PatientFinancialTotals = {
  receivedCents: number;
  pendingCents: number;
};

export function computePatientFinancialTotals(
  entries: PatientFinancialEntry[],
): PatientFinancialTotals {
  return entries.reduce(
    (totals, entry) => {
      if (entry.status === 'received') {
        return {
          ...totals,
          receivedCents: totals.receivedCents + entry.valueCents,
        };
      }

      return {
        ...totals,
        pendingCents: totals.pendingCents + entry.valueCents,
      };
    },
    { receivedCents: 0, pendingCents: 0 },
  );
}
