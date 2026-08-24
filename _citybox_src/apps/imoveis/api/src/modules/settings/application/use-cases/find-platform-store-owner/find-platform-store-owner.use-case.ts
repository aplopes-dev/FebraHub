import { Injectable, NotFoundException } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { TeamMemberEntity } from '../../../domain/entities/team-member.entity';
import { TeamMemberRepository } from '../../../domain/repositories/team-member.repository.interface';

export type FindPlatformStoreOwnerInput = {
  storeId: string;
};

/**
 * Responsável da loja Imóveis (`TeamMember` admin ativo) — contrato M2M do admin.
 */
@Injectable()
export class FindPlatformStoreOwnerUseCase implements IUseCase<
  FindPlatformStoreOwnerInput,
  TeamMemberEntity
> {
  constructor(private readonly members: TeamMemberRepository) {}

  async execute(input: FindPlatformStoreOwnerInput): Promise<TeamMemberEntity> {
    const owner = await this.members.findActiveAdmin(input.storeId);
    if (!owner) {
      throw new NotFoundException(
        `Responsável não encontrado para a loja ${input.storeId}`,
      );
    }
    return owner;
  }
}
