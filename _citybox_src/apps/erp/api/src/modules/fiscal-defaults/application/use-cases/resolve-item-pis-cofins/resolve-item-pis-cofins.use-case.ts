import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalDefaultTaxesRepository } from '../../../domain/repositories/fiscal-default-taxes.repository.interface';
import { FiscalGroupRepository } from '../../../domain/repositories/fiscal-group.repository.interface';
import type {
  ResolveItemPisCofinsDto,
  ResolvedItemPisCofins,
} from '../../dtos/fiscal-defaults.dto';

/**
 * Resolve o PIS/COFINS de um item para a emissão (spec erp/015, plan D5):
 * produto → grupo do produto → grupo padrão da organização → fallback (null).
 *
 * `null` = produto sem grupo **e** sem padrão → o emissor envia o item sem
 * PIS/COFINS e a fiscal-api aplica CST 01 zerado (não-regressão). Quem monta o
 * pedido de emissão lê `ProductFiscal.pisCofinsGroupId` e passa aqui; a fiscal-api
 * não conhece grupos.
 */
@Injectable()
export class ResolveItemPisCofinsUseCase implements IUseCase<
  ResolveItemPisCofinsDto,
  ResolvedItemPisCofins
> {
  constructor(
    private readonly groupRepository: FiscalGroupRepository,
    private readonly defaultTaxesRepository: FiscalDefaultTaxesRepository,
  ) {}

  async execute(
    input: ResolveItemPisCofinsDto,
  ): Promise<ResolvedItemPisCofins> {
    let groupId = input.productPisCofinsGroupId;
    if (!groupId) {
      const defaults = await this.defaultTaxesRepository.findByOrganization(
        input.organizationId,
      );
      groupId = defaults?.pisCofinsGroupId ?? null;
    }
    if (!groupId) return null;

    const group = await this.groupRepository.findById(
      input.organizationId,
      groupId,
    );
    if (
      !group ||
      group.taxType !== 'PIS_COFINS' ||
      group.pisCst === null ||
      group.cofinsCst === null
    ) {
      return null;
    }

    return {
      pis: { cst: group.pisCst, aliquota: group.pisAliquota },
      cofins: { cst: group.cofinsCst, aliquota: group.cofinsAliquota },
    };
  }
}
