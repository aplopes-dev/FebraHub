import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import type { TransactionEntity } from '../../../domain/entities/transaction.entity';
import {
  TransactionRepository,
  type ListTransactionsFilters,
} from '../../../domain/repositories/transaction.repository.interface';
import {
  civilDayEndExclusiveInBahia,
  civilDayStartInBahia,
} from '../../policies/transaction-date.policy';
import {
  parseTransactionStatuses,
  parseTransactionTypes,
} from '../shared/parse-transaction-enums';

export type ListTransactionsInput = {
  storeId: string;
  page?: number;
  perPage?: number;
  search?: string;
  type?: string[];
  status?: string[];
  agentId?: string;
  periodFrom?: string;
  periodTo?: string;
};

export type ListTransactionsOutput = {
  items: TransactionEntity[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

const DEFAULT_PER_PAGE = 9;
const MAX_PER_PAGE = 200;

@Injectable()
export class ListTransactionsUseCase implements IUseCase<
  ListTransactionsInput,
  ListTransactionsOutput
> {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(input: ListTransactionsInput): Promise<ListTransactionsOutput> {
    const page = Math.max(1, Number(input.page ?? 1) || 1);
    const perPage = Math.min(
      MAX_PER_PAGE,
      Math.max(
        1,
        Number(input.perPage ?? DEFAULT_PER_PAGE) || DEFAULT_PER_PAGE,
      ),
    );

    let filters: ListTransactionsFilters;
    try {
      filters = {
        page,
        perPage,
        search: input.search?.trim() || undefined,
        type: parseTransactionTypes(input.type),
        status: parseTransactionStatuses(input.status),
        agentId: input.agentId?.trim() || undefined,
        periodFrom: input.periodFrom?.trim()
          ? civilDayStartInBahia(input.periodFrom.trim(), 'periodFrom')
          : undefined,
        periodToExclusive: input.periodTo?.trim()
          ? civilDayEndExclusiveInBahia(input.periodTo.trim(), 'periodTo')
          : undefined,
      };
    } catch (err) {
      throw new ValidatorDomainError({
        internalMessage: err instanceof Error ? err.message : 'Invalid filters',
        externalMessage: 'Filtros de listagem inválidos.',
        context: ListTransactionsUseCase.name,
      });
    }

    const { items, total } = await this.transactions.findMany(
      input.storeId,
      filters,
    );
    const totalPages = Math.max(1, Math.ceil(total / perPage) || 1);

    return { items, total, page, perPage, totalPages };
  }
}
