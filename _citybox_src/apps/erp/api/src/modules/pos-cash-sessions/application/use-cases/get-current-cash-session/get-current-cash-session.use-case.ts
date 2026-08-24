import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { GetCurrentCashSessionDto } from '../../dtos/pos-cash-session.dto';
import type { PosCashSession } from '../../../domain/entities/pos-cash-session.entity';
import { PosCashSessionRepository } from '../../../domain/repositories/pos-cash-session.repository.interface';

@Injectable()
export class GetCurrentCashSessionUseCase implements IUseCase<
  GetCurrentCashSessionDto,
  PosCashSession | null
> {
  constructor(
    private readonly cashSessionRepository: PosCashSessionRepository,
  ) {}

  execute(input: GetCurrentCashSessionDto): Promise<PosCashSession | null> {
    return this.cashSessionRepository.findOpenByTerminal(
      input.organizationId,
      input.posTerminalId,
    );
  }
}
