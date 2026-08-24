import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PosCashSessionNotFoundError } from '../../../domain/errors/pos-cash-session-not-found.error';
import {
  PosCashSessionRepository,
  type ListSessionSalesResult,
} from '../../../domain/repositories/pos-cash-session.repository.interface';
import type { ListSessionSalesDto } from '../../dtos/pos-cash-session.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

@Injectable()
export class ListSessionSalesUseCase implements IUseCase<
  ListSessionSalesDto,
  ListSessionSalesResult
> {
  constructor(
    private readonly cashSessionRepository: PosCashSessionRepository,
  ) {}

  async execute(input: ListSessionSalesDto): Promise<ListSessionSalesResult> {
    const session = await this.cashSessionRepository.findById(
      input.organizationId,
      input.sessionId,
    );
    if (!session) throw new PosCashSessionNotFoundError(input.sessionId);

    const page = Math.max(1, input.page ?? DEFAULT_PAGE);
    const perPage = Math.min(
      MAX_PER_PAGE,
      Math.max(1, input.perPage ?? DEFAULT_PER_PAGE),
    );

    return this.cashSessionRepository.listSessionSales(
      input.organizationId,
      input.sessionId,
      page,
      perPage,
    );
  }
}
