/**
 * Convenção de keys no bucket `erp` para o arquivo OFX original (molde de
 * `ErpFinanceObjectKeyPolicy`):
 * `{organizationId}/financeiro/conciliacao-bancaria/{bankStatementId}/extrato.ofx`
 */
export class BankReconciliationObjectKeyPolicy {
  static bankStatementFileKey(
    organizationId: string,
    bankStatementId: string,
  ): string {
    return `${organizationId}/financeiro/conciliacao-bancaria/${bankStatementId}/extrato.ofx`;
  }
}
