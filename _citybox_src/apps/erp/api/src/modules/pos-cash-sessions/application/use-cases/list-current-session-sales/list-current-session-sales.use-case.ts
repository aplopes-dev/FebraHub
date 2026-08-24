import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  PosCashSessionRepository,
  type ListSessionSalesResult,
} from '../../../domain/repositories/pos-cash-session.repository.interface';

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

export type ListCurrentSessionSalesDto = {
  organizationId: string;
  posTerminalId: string;
  page?: number;
  perPage?: number;
};

/**
 * Vendas do turno **aberto** do terminal (Device). Sem sessão open → lista
 * vazia (não 404): o PDV só precisa do histórico do turno atual.
 */
@Injectable()
export class ListCurrentSessionSalesUseCase implements IUseCase<
  ListCurrentSessionSalesDto,
  ListSessionSalesResult
> {
  constructor(
    private readonly cashSessionRepository: PosCashSessionRepository,
  ) {}

  async execute(
    input: ListCurrentSessionSalesDto,
  ): Promise<ListSessionSalesResult> {
    const page = Math.max(1, input.page ?? DEFAULT_PAGE);
    const perPage = Math.min(
      MAX_PER_PAGE,
      Math.max(1, input.perPage ?? DEFAULT_PER_PAGE),
    );

    const session = await this.cashSessionRepository.findOpenByTerminal(
      input.organizationId,
      input.posTerminalId,
    );
    if (!session) {
      return { items: [], total: 0 };
    }

    return this.cashSessionRepository.listSessionSales(
      input.organizationId,
      session.id,
      page,
      perPage,
    );
  }
}
