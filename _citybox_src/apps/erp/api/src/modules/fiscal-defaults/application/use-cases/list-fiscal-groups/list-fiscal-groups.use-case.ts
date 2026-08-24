import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type {
  FiscalGroup,
  FiscalTaxType,
} from '../../../domain/entities/fiscal-group.entity';
import { FiscalGroupRepository } from '../../../domain/repositories/fiscal-group.repository.interface';
import type { ListFiscalGroupsDto } from '../../dtos/fiscal-defaults.dto';

/** `FiscalGroup` + quantos produtos usam o grupo (spec erp/022, D2). */
export type FiscalGroupWithProductCount = {
  group: FiscalGroup;
  productCount: number;
};

/**
 * Lista os grupos fiscais da organização (opcionalmente por tributo), com a
 * contagem de produtos vinculados por grupo. A contagem é resolvida num único
 * `groupBy` por tributo presente no resultado — não por grupo (D2, evita N+1).
 */
@Injectable()
export class ListFiscalGroupsUseCase implements IUseCase<
  ListFiscalGroupsDto,
  FiscalGroupWithProductCount[]
> {
  constructor(private readonly repository: FiscalGroupRepository) {}

  async execute(
    input: ListFiscalGroupsDto,
  ): Promise<FiscalGroupWithProductCount[]> {
    const groups = await this.repository.listByOrganization(
      input.organizationId,
      input.taxType,
    );
    if (groups.length === 0) return [];

    const taxTypes = [...new Set(groups.map((group) => group.taxType))];
    const countsByTaxType = new Map<FiscalTaxType, Record<string, number>>(
      await Promise.all(
        taxTypes.map(
          async (taxType) =>
            [
              taxType,
              await this.repository.countProductsByGroup(
                input.organizationId,
                taxType,
              ),
            ] as const,
        ),
      ),
    );

    return groups.map((group) => ({
      group,
      productCount: countsByTaxType.get(group.taxType)?.[group.id] ?? 0,
    }));
  }
}
