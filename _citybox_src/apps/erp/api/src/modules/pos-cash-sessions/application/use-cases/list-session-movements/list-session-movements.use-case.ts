import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { PosCashMovement } from '../../../domain/entities/pos-cash-movement.entity';
import { PosCashSessionNotFoundError } from '../../../domain/errors/pos-cash-session-not-found.error';
import { PosCashSessionRepository } from '../../../domain/repositories/pos-cash-session.repository.interface';
import type { ListSessionMovementsDto } from '../../dtos/pos-cash-session.dto';

@Injectable()
export class ListSessionMovementsUseCase implements IUseCase<
  ListSessionMovementsDto,
  PosCashMovement[]
> {
  constructor(
    private readonly cashSessionRepository: PosCashSessionRepository,
  ) {}

  async execute(input: ListSessionMovementsDto): Promise<PosCashMovement[]> {
    const session = await this.cashSessionRepository.findById(
      input.organizationId,
      input.sessionId,
    );
    if (!session) throw new PosCashSessionNotFoundError(input.sessionId);

    return this.cashSessionRepository.listMovements(
      input.organizationId,
      input.sessionId,
    );
  }
}
