import type { FiscalEnvironment } from "../api/fiscal-sequence.dto";

export const fiscalSequenceKeys = {
  all: ["fiscal", "sequences"] as const,
  list: (companyId: string, environment: FiscalEnvironment) =>
    [...fiscalSequenceKeys.all, "list", companyId, environment] as const,
};
