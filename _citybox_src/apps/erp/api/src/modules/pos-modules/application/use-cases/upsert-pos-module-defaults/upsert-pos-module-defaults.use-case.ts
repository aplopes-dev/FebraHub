import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { PosModuleDefaults } from '../../../domain/entities/pos-module-defaults.entity';
import { PosModuleDefaultsRepository } from '../../../domain/repositories/pos-module-defaults.repository.interface';
import type { UpsertPosModuleDefaultsDto } from '../../dtos/pos-module.dto';
import { GetPosModuleDefaultsUseCase } from '../get-pos-module-defaults/get-pos-module-defaults.use-case';

@Injectable()
export class UpsertPosModuleDefaultsUseCase implements IUseCase<
  UpsertPosModuleDefaultsDto,
  PosModuleDefaults
> {
  constructor(
    private readonly repository: PosModuleDefaultsRepository,
    private readonly getDefaults: GetPosModuleDefaultsUseCase,
  ) {}

  async execute(input: UpsertPosModuleDefaultsDto): Promise<PosModuleDefaults> {
    const current = await this.getDefaults.execute({
      organizationId: input.organizationId,
    });

    // Perfil **antes** dos ajustes finos: o gerente escolhe "Loja" e depois
    // liga Delivery. A ordem inversa faria o perfil apagar o ajuste que ele
    // acabou de fazer na mesma tela.
    const withProfile = input.applyProfile
      ? current.applyProfile(input.applyProfile)
      : current;

    const updated =
      input.modules === undefined
        ? withProfile
        : withProfile.update({ modules: input.modules });

    return this.repository.save(updated);
  }
}
