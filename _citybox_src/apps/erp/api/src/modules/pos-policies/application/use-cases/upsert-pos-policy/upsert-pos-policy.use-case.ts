import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PosPolicy } from '../../../domain/entities/pos-policy.entity';
import { PosPolicyRepository } from '../../../domain/repositories/pos-policy.repository.interface';
import type { UpsertPosPolicyDto } from '../../dtos/pos-policy.dto';

/**
 * Grava as alçadas. Cria com os defaults se ainda não existir — daí "upsert" e
 * não "update": do ponto de vista de quem usa a tela, a alçada sempre existiu.
 */
@Injectable()
export class UpsertPosPolicyUseCase implements IUseCase<
  UpsertPosPolicyDto,
  PosPolicy
> {
  constructor(private readonly posPolicyRepository: PosPolicyRepository) {}

  async execute(input: UpsertPosPolicyDto): Promise<PosPolicy> {
    const current =
      (await this.posPolicyRepository.findByOrganization(
        input.organizationId,
      )) ?? PosPolicy.createDefault(input.organizationId);

    return this.posPolicyRepository.save(
      current.update({
        discountSupervisorAbovePercent: input.discountSupervisorAbovePercent,
        withdrawalSupervisorAboveCents: input.withdrawalSupervisorAboveCents,
        cancellationRequiresSupervisor: input.cancellationRequiresSupervisor,
        refundRequiresSupervisor: input.refundRequiresSupervisor,
      }),
    );
  }
}
