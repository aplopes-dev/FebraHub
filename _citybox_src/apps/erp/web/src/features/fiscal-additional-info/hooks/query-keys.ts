import type { FiscalDocumentType } from "@/features/fiscal-additional-info/lib/document-type-options";

export const fiscalAdditionalInfoKeys = {
  all: (scope: string) =>
    ["comercio", "fiscal-additional-infos", scope] as const,
  list: (scope: string, documentType: FiscalDocumentType) =>
    [...fiscalAdditionalInfoKeys.all(scope), "list", documentType] as const,
  count: (scope: string) =>
    [...fiscalAdditionalInfoKeys.all(scope), "count"] as const,
};
