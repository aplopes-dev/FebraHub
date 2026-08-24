import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PosModuleDefaults } from '../../../domain/entities/pos-module-defaults.entity';
import { PosModuleDefaultsRepository } from '../../../domain/repositories/pos-module-defaults.repository.interface';
import type { GetPosModuleDefaultsDto } from '../../dtos/pos-module.dto';

/**
 * Padrão de módulos da organização, criando na primeira leitura.
 *
 * **Nunca devolve 404**, pela mesma razão de `GetPosPolicy`: toda organização
 * tem um padrão — se não configurou, tem o neutro. Um 404 obrigaria a tela do
 * ERP e o PDV a inventarem cada um o seu fallback.
 */
@Injectable()
export class GetPosModuleDefaultsUseCase implements IUseCase<
  GetPosModuleDefaultsDto,
  PosModuleDefaults
> {
  constructor(private readonly repository: PosModuleDefaultsRepository) {}

  async execute(input: GetPosModuleDefaultsDto): Promise<PosModuleDefaults> {
    const existing = await this.repository.findByOrganization(
      input.organizationId,
    );
    if (existing) return existing;

    return this.repository.save(
      PosModuleDefaults.createDefault(input.organizationId),
    );
  }
}
