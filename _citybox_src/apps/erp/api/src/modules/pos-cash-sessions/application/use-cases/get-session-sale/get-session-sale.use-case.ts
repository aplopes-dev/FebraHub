import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PosCashSessionNotFoundError } from '../../../domain/errors/pos-cash-session-not-found.error';
import {
  PosCashSessionRepository,
  type SessionSale,
} from '../../../domain/repositories/pos-cash-session.repository.interface';
import type { GetSessionSaleDto } from '../../dtos/pos-cash-session.dto';

@Injectable()
export class GetSessionSaleUseCase implements IUseCase<
  GetSessionSaleDto,
  SessionSale
> {
  constructor(
    private readonly cashSessionRepository: PosCashSessionRepository,
  ) {}

  async execute(input: GetSessionSaleDto): Promise<SessionSale> {
    const session = await this.cashSessionRepository.findById(
      input.organizationId,
      input.sessionId,
    );
    if (!session) throw new PosCashSessionNotFoundError(input.sessionId);

    const sale = await this.cashSessionRepository.findSessionSale(
      input.organizationId,
      input.sessionId,
      input.saleOrderId,
    );
    if (!sale) throw new PosCashSessionNotFoundError(input.saleOrderId);
    return sale;
  }
}
