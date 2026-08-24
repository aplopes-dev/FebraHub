import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  PosCashSessionRepository,
  type ListCashSessionsResult,
} from '../../../domain/repositories/pos-cash-session.repository.interface';
import type { ListCashSessionsDto } from '../../dtos/pos-cash-session.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

@Injectable()
export class ListCashSessionsUseCase implements IUseCase<
  ListCashSessionsDto,
  ListCashSessionsResult
> {
  constructor(
    private readonly cashSessionRepository: PosCashSessionRepository,
  ) {}

  execute(input: ListCashSessionsDto): Promise<ListCashSessionsResult> {
    const page = Math.max(1, input.page ?? DEFAULT_PAGE);
    const perPage = Math.min(
      MAX_PER_PAGE,
      Math.max(1, input.perPage ?? DEFAULT_PER_PAGE),
    );

    return this.cashSessionRepository.listSessions({
      organizationId: input.organizationId,
      posTerminalId: input.posTerminalId?.trim() || undefined,
      operatorName: input.operatorName?.trim() || undefined,
      openedFrom: input.openedFrom ? new Date(input.openedFrom) : undefined,
      openedTo: input.openedTo ? new Date(input.openedTo) : undefined,
      page,
      perPage,
    });
  }
}
