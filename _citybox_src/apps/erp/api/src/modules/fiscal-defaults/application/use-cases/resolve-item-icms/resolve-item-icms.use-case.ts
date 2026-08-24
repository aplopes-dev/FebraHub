import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalDefaultTaxesRepository } from '../../../domain/repositories/fiscal-default-taxes.repository.interface';
import { FiscalGroupRepository } from '../../../domain/repositories/fiscal-group.repository.interface';
import type {
  ResolveItemIcmsDto,
  ResolvedItemIcms,
} from '../../dtos/fiscal-defaults.dto';

/**
 * Resolve o ICMS de um item para a emissão (spec erp/016, plan D5): produto →
 * grupo do produto → grupo padrão da organização → fallback (null). A alíquota é
 * a da **UF de destino** — INTERNA se destino = UF do emitente, senão INTERESTADUAL.
 *
 * `null` = produto sem grupo **e** sem padrão → o emissor manda o item sem ICMS e
 * a fiscal-api aplica `ICMS00` zerado (não-regressão). A fiscal-api não conhece
 * grupos; a origem (`orig`) vem de `ProductFiscal.origin`, resolvida pelo caller.
 */
@Injectable()
export class ResolveItemIcmsUseCase implements IUseCase<
  ResolveItemIcmsDto,
  ResolvedItemIcms
> {
  constructor(
    private readonly groupRepository: FiscalGroupRepository,
    private readonly defaultTaxesRepository: FiscalDefaultTaxesRepository,
  ) {}

  async execute(input: ResolveItemIcmsDto): Promise<ResolvedItemIcms> {
    let groupId = input.productIcmsGroupId;
    if (!groupId) {
      const defaults = await this.defaultTaxesRepository.findByOrganization(
        input.organizationId,
      );
      groupId = defaults?.icmsGroupId ?? null;
    }
    if (!groupId) return null;

    const group = await this.groupRepository.findById(
      input.organizationId,
      groupId,
    );
    if (!group || group.taxType !== 'ICMS') return null;

    const rateType =
      input.destinationUf.trim().toUpperCase() ===
      input.emitterUf.trim().toUpperCase()
        ? 'INTERNA'
        : 'INTERESTADUAL';
    const aliquota = group.ufRate(input.destinationUf, rateType) ?? 0;

    return {
      cst: group.icmsCst,
      csosn: group.icmsCsosn,
      aliquota,
    };
  }
}
