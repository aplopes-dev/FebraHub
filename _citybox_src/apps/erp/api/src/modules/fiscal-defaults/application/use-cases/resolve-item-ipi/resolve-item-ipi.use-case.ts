import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { IpiCst } from '../../../domain/entities/fiscal-group.entity';
import { FiscalGroupRepository } from '../../../domain/repositories/fiscal-group.repository.interface';
import type {
  ResolveItemIpiDto,
  ResolvedItemIpi,
} from '../../dtos/fiscal-defaults.dto';

/**
 * Resolve o perfil fiscal de IPI de um item (spec erp/019): item → `ipiGroupId` →
 * grupo → CST + `cEnq` + percentual, prontos para o bloco `IPI` do XML.
 *
 * ⚠️ **`null` quando o produto NÃO tem grupo de IPI** — e o emissor então NÃO
 * emite bloco `IPI` (não-regressão FR-008). Diferente dos demais tributos, a
 * ausência aqui não vira "fallback zerado": IPI é opcional na NF-e, exigido só de
 * contribuinte de IPI.
 */
@Injectable()
export class ResolveItemIpiUseCase implements IUseCase<
  ResolveItemIpiDto,
  ResolvedItemIpi
> {
  constructor(private readonly repository: FiscalGroupRepository) {}

  async execute(input: ResolveItemIpiDto): Promise<ResolvedItemIpi> {
    if (!input.productIpiGroupId) return null;

    const group = await this.repository.findById(
      input.organizationId,
      input.productIpiGroupId,
    );
    if (!group || group.taxType !== 'IPI') return null;
    if (group.ipiCst === null || group.ipiEnquadramento === null) return null;

    return {
      // Estreitado por `FiscalGroup.validateIpi` (∈ IPI_CST_SUPPORTED) + CHECK no banco.
      cst: group.ipiCst as IpiCst,
      cEnq: group.ipiEnquadramento,
      aliquota: group.ipiRate,
    };
  }
}
