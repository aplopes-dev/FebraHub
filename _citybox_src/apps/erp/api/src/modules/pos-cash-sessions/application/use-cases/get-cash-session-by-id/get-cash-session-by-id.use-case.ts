import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { PosCashSession } from '../../../domain/entities/pos-cash-session.entity';
import { PosCashSessionNotFoundError } from '../../../domain/errors/pos-cash-session-not-found.error';
import { PosCashSessionRepository } from '../../../domain/repositories/pos-cash-session.repository.interface';
import type { GetCashSessionByIdDto } from '../../dtos/pos-cash-session.dto';

@Injectable()
export class GetCashSessionByIdUseCase implements IUseCase<
  GetCashSessionByIdDto,
  PosCashSession
> {
  constructor(
    private readonly cashSessionRepository: PosCashSessionRepository,
  ) {}

  async execute(input: GetCashSessionByIdDto): Promise<PosCashSession> {
    const session = await this.cashSessionRepository.findById(
      input.organizationId,
      input.sessionId,
    );
    if (!session) throw new PosCashSessionNotFoundError(input.sessionId);
    return session;
  }
}
