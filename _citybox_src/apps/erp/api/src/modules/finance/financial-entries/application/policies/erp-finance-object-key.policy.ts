/**
 * Convenção de keys no bucket `erp` para anexos financeiros (molde de
 * `ErpObjectKeyPolicy` do catálogo):
 * `{organizationId}/financeiro/lancamentos/{financialEntryId}/{attachmentId}.{ext}`
 */
export class ErpFinanceObjectKeyPolicy {
  static financialEntryAttachmentKey(
    organizationId: string,
    financialEntryId: string,
    attachmentId: string,
    extension: string,
  ): string {
    return `${organizationId}/financeiro/lancamentos/${financialEntryId}/${attachmentId}.${extension}`;
  }
}
