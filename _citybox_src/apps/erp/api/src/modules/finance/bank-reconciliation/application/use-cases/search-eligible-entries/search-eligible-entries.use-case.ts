import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../../tenancy/application/pagination';
import { FinancialEntryRepository } from '../../../../financial-entries/domain/repositories/financial-entry.repository.interface';
import type { FinancialEntry } from '../../../../financial-entries/domain/entities/financial-entry.entity';
import { BankStatementRepository } from '../../../domain/repositories/bank-statement.repository.interface';
import { BankStatementTransactionRepository } from '../../../domain/repositories/bank-statement-transaction.repository.interface';
import { BankStatementMatchRepository } from '../../../domain/repositories/bank-statement-match.repository.interface';
import { BankStatementNotFoundError } from '../../../domain/errors/bank-statement-not-found.error';
import { BankStatementTransactionNotFoundError } from '../../../domain/errors/bank-statement-transaction-not-found.error';
import { calculateEligibleAmountCents } from '../../../domain/services/eligible-amount';
import type {
  EligibleEntryResult,
  SearchEligibleEntriesDto,
  SearchEligibleEntriesResult,
} from '../../dtos/search-eligible-entries.dto';

/**
 * FR-016/036/037/038, research.md D17 — substitui a chamada direta do
 * cliente a `GET /v1/financial-entries` (que filtrava `status=pending`, o
 * bug relatado pelo usuário). Elegibilidade é conhecimento deste módulo, não
 * de `financial-entries`: exclui explicitamente lançamentos com
 * `BankStatementMatch` ativo (FR-033) — deixou de ser implícito por status
 * desde que `paid` também passou a ser elegível (D16).
 */
@Injectable()
export class SearchEligibleEntriesUseCase implements IUseCase<
  SearchEligibleEntriesDto,
  SearchEligibleEntriesResult
> {
  constructor(
    private readonly bankStatementRepository: BankStatementRepository,
    private readonly bankStatementTransactionRepository: BankStatementTransactionRepository,
    private readonly bankStatementMatchRepository: BankStatementMatchRepository,
    private readonly financialEntryRepository: FinancialEntryRepository,
  ) {}

  async execute(
    input: SearchEligibleEntriesDto,
  ): Promise<SearchEligibleEntriesResult> {
    const bankStatement = await this.bankStatementRepository.findById(
      input.organizationId,
      input.bankStatementId,
    );
    if (!bankStatement) {
      throw new BankStatementNotFoundError(input.bankStatementId);
    }

    const transaction = await this.bankStatementTransactionRepository.findById(
      input.organizationId,
      input.transactionId,
    );
    if (!transaction || transaction.bankStatementId !== input.bankStatementId) {
      throw new BankStatementTransactionNotFoundError(input.transactionId);
    }

    const periodTypes = input.periodType?.length
      ? input.periodType
      : (['competence', 'due', 'paid'] as const);
    const filterByCompetence = periodTypes.includes('competence');
    const filterByDue = periodTypes.includes('due');
    const filterByPaid = periodTypes.includes('paid');

    // FR-037 — travado na conta do extrato; `undefined` quando o extrato não
    // tem conta resolvida (007-financeiro-ajustes-ui) busca na organização
    // inteira, mesmo padrão de `ReconciliationCandidateCriteria`.
    const criteria = {
      bankAccountId: bankStatement.bankAccountId ?? undefined,
      chartOfAccountId: input.chartOfAccountId
        ? [input.chartOfAccountId]
        : undefined,
      customerId: input.customerId,
      supplierId: input.supplierId,
      search: input.search,
      paymentMethod: input.paymentMethod,
      cardBrand: input.cardBrand,
      dueFrom: filterByDue ? input.periodFrom : undefined,
      dueTo: filterByDue ? input.periodTo : undefined,
      competenceFrom: filterByCompetence ? input.periodFrom : undefined,
      competenceTo: filterByCompetence ? input.periodTo : undefined,
      paidFrom: filterByPaid ? input.periodFrom : undefined,
      paidTo: filterByPaid ? input.periodTo : undefined,
    };

    // Sem status — elegibilidade não é mais implícita por `pending` (D16).
    const allMatching = await this.financialEntryRepository.findAll(
      input.organizationId,
      criteria,
    );

    const activeIds =
      await this.bankStatementMatchRepository.findActiveFinancialEntryIds(
        input.organizationId,
        allMatching.map((entry) => entry.id),
      );
    const eligible = allMatching.filter((entry) => !activeIds.has(entry.id));

    const total = eligible.length;
    const pagination = resolvePagination(total, input.page, input.perPage);
    const page = eligible.slice(
      pagination.skip,
      pagination.skip + pagination.perPage,
    );

    return {
      data: page.map(toEligibleEntryResult),
      total,
    };
  }
}

function toEligibleEntryResult(entry: FinancialEntry): EligibleEntryResult {
  const lastPayment = entry.payments[entry.payments.length - 1];
  return {
    financialEntryId: entry.id,
    status: entry.status,
    eligibleAmountCents: calculateEligibleAmountCents(entry),
    dueDate: entry.dueDate,
    competenceDate: entry.competenceDate,
    paidAt: lastPayment ? lastPayment.paidAt : null,
    description: entry.description,
    categoryName: entry.categoryName,
  };
}
