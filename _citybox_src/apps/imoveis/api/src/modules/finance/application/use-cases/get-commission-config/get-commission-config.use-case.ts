import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { CommissionConfigEntity } from '../../../domain/entities/commission-config.entity';
import { CommissionConfigRepository } from '../../../domain/repositories/commission-config.repository.interface';

/**
 * Loja sem configuração recebe os padrões (6% / 40-30-30) **sem** criar linha —
 * a persistência acontece só no `PUT`.
 */
@Injectable()
export class GetCommissionConfigUseCase implements IUseCase<
  { storeId: string },
  CommissionConfigEntity
> {
  constructor(private readonly configs: CommissionConfigRepository) {}

  async execute({
    storeId,
  }: {
    storeId: string;
  }): Promise<CommissionConfigEntity> {
    const config = await this.configs.getByStoreId(storeId);
    return config ?? CommissionConfigEntity.default(storeId);
  }
}
