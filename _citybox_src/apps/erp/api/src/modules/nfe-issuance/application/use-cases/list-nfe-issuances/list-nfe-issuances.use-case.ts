import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { NfeIssuance } from '../../../domain/entities/nfe-issuance.entity';
import { NfeIssuanceRepository } from '../../../domain/repositories/nfe-issuance.repository.interface';

type Input = { organizationId: string };

/** Lista as NF-e emitidas pela organização (mais recentes primeiro) — a tela
 * usa isso pra filtrar pedidos de venda que já têm NF-e emitida. */
@Injectable()
export class ListNfeIssuancesUseCase implements IUseCase<Input, NfeIssuance[]> {
  constructor(private readonly repository: NfeIssuanceRepository) {}

  execute(input: Input): Promise<NfeIssuance[]> {
    return this.repository.listByOrganization(input.organizationId);
  }
}
