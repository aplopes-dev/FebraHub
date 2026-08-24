import type {
  TransactionStatus,
  TransactionType,
} from '../../../../domain/entities/transaction.entity';
import type { TransactionsReportOutput } from '../../../../application/use-cases/get-transactions-report/get-transactions-report.use-case';

const STATUS_LABEL: Record<TransactionStatus, string> = {
  DRAFT: 'Rascunho',
  PROPOSAL: 'Proposta',
  CONTRACT_SIGNED: 'Contrato assinado',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

const TYPE_LABEL: Record<TransactionType, string> = {
  SALE: 'Venda',
  RENTAL: 'Locação',
};

export class GetTransactionsReportPresenter {
  static toHttp(report: TransactionsReportOutput) {
    return {
      data: {
        totalCount: report.totalCount,
        totalGrossValueCents: report.totalGrossValueCents,
        totalCommissionCents: report.totalCommissionCents,
        completedCount: report.completedCount,
        byStatus: report.byStatus.map((row) => ({
          ...row,
          label: STATUS_LABEL[row.status],
        })),
        byType: report.byType.map((row) => ({
          ...row,
          label: TYPE_LABEL[row.type],
        })),
        // `agentName` fica igual ao id: a API não tem cadastro de corretor — o web
        // resolve o nome de exibição pelo catálogo local.
        byAgent: report.byAgent.map((row) => ({
          ...row,
          agentName: row.agentId,
        })),
      },
    };
  }
}
