import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalGroupRepository } from '../../../domain/repositories/fiscal-group.repository.interface';
import { FiscalDefaultTaxesRepository } from '../../../domain/repositories/fiscal-default-taxes.repository.interface';
import { FiscalGroupNotFoundError } from '../../../domain/errors/fiscal-group-not-found.error';
import { FiscalGroupInUseError } from '../../../domain/errors/fiscal-group-in-use.error';
import type { FiscalTaxType } from '../../../domain/entities/fiscal-group.entity';
import type { FiscalDefaultTaxes } from '../../../domain/entities/fiscal-default-taxes.entity';
import type { DeleteFiscalGroupDto } from '../../dtos/fiscal-defaults.dto';

/** Lê a FK de `FiscalDefaultTaxes` que aponta pro grupo, por tributo. */
function defaultGroupIdFor(
  defaults: FiscalDefaultTaxes,
  taxType: FiscalTaxType,
): string | null {
  switch (taxType) {
    case 'ICMS':
      return defaults.icmsGroupId;
    case 'IPI':
      return defaults.ipiGroupId;
    case 'PIS_COFINS':
      return defaults.pisCofinsGroupId;
    case 'ISSQN':
      return defaults.issqnGroupId;
    default: {
      // Achado do typescript-reviewer: sem este `default`, um `FiscalTaxType`
      // novo faria o switch devolver `undefined` em silêncio — nunca bateria
      // com `group.id`, e um grupo desse tributo definido como padrão nunca
      // seria bloqueado na exclusão. `never` força erro de compilação assim
      // que `FISCAL_TAX_TYPES` ganhar um 5º valor.
      const exhaustive: never = taxType;
      throw new Error(
        `Tributo sem mapeamento em FiscalDefaultTaxes: ${String(exhaustive)}`,
      );
    }
  }
}

/**
 * Exclui um grupo fiscal (spec erp/022, D3). Bloqueia (409) quando o grupo
 * está vinculado a produtos, ou é o padrão fiscal da organização — as duas
 * únicas referências que existem hoje a um `FiscalGroup`.
 */
@Injectable()
export class DeleteFiscalGroupUseCase implements IUseCase<
  DeleteFiscalGroupDto,
  void
> {
  constructor(
    private readonly groupRepository: FiscalGroupRepository,
    private readonly defaultTaxesRepository: FiscalDefaultTaxesRepository,
  ) {}

  async execute(input: DeleteFiscalGroupDto): Promise<void> {
    // `findById` e `countProductsByGroup` não dependem um do outro — rodam em
    // paralelo (achado do typescript-reviewer, perf).
    const [group, counts] = await Promise.all([
      this.groupRepository.findById(input.organizationId, input.id),
      this.groupRepository.countProductsByGroup(
        input.organizationId,
        input.taxType,
      ),
    ]);
    if (!group || group.taxType !== input.taxType) {
      throw new FiscalGroupNotFoundError(input.id);
    }

    const productCount = counts[group.id] ?? 0;
    if (productCount > 0) {
      throw new FiscalGroupInUseError(group.name, 'products', productCount);
    }

    const defaults = await this.defaultTaxesRepository.findByOrganization(
      input.organizationId,
    );
    if (defaults && defaultGroupIdFor(defaults, input.taxType) === group.id) {
      throw new FiscalGroupInUseError(group.name, 'default');
    }

    await this.groupRepository.deleteById(input.organizationId, group.id);
  }
}
