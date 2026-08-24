import { Injectable, NotFoundException } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  MemberRepository,
  type MemberRecord,
} from '../../../domain/repositories/member.repository';

export type FindPlatformStoreOwnerInput = {
  storeId: string;
};

/**
 * Responsável da loja Beautiful (`Member` OWNER ativo) — contrato M2M do admin.
 */
@Injectable()
export class FindPlatformStoreOwnerUseCase implements IUseCase<
  FindPlatformStoreOwnerInput,
  MemberRecord
> {
  constructor(private readonly members: MemberRepository) {}

  async execute(input: FindPlatformStoreOwnerInput): Promise<MemberRecord> {
    const owner = await this.members.findActiveOwnerByStoreId(input.storeId);
    if (!owner) {
      throw new NotFoundException(
        `Responsável não encontrado para a loja ${input.storeId}`,
      );
    }
    return owner;
  }
}
