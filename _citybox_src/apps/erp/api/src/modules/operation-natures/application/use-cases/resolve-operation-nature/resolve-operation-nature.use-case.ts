import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type {
  OperationNature,
  OperationNatureCfopRule,
} from '../../../domain/entities/operation-nature.entity';
import { OperationNatureRepository } from '../../../domain/repositories/operation-nature.repository.interface';
import type {
  ResolveOperationNatureDto,
  ResolvedOperationNature,
} from '../../dtos/operation-nature.dto';

/**
 * Resolve a regra de-para de uma natureza de operação (spec erp/020, US2).
 *
 * Dada a operação de **entrada** (CFOP + se o item é ICMS-livre) e os grupos atuais
 * do item, devolve o CFOP de **saída** e os grupos mapeados.
 *
 * - **Mais específica vence** (FR-007): entre as linhas que casam o `fromCfop`, uma
 *   com condição `SIM`/`NAO` que bate o `itemIcmsLivre` prevalece sobre uma `AMBOS`.
 * - **Nenhuma linha casa → `null`** (FR-008): o emissor mantém o valor original do
 *   item e **não bloqueia** a operação.
 * - Grupos: se houver `groupRule` (por tributo) com `fromGroupId` = grupo do item,
 *   usa o `toGroupId`; senão mantém o grupo original do item.
 *
 * ⚠️ Não conhece emissão: o resultado é repassado por quem monta o pedido (a
 * fiscal-api não conhece naturezas de operação). O disparo real é **B7** (deferido).
 */
@Injectable()
export class ResolveOperationNatureUseCase implements IUseCase<
  ResolveOperationNatureDto,
  ResolvedOperationNature
> {
  constructor(private readonly repository: OperationNatureRepository) {}

  async execute(
    input: ResolveOperationNatureDto,
  ): Promise<ResolvedOperationNature> {
    const nature = await this.repository.findById(
      input.organizationId,
      input.operationNatureId,
    );
    if (!nature) return null;

    const rule = this.pickCfopRule(nature, input.fromCfop, input.itemIcmsLivre);
    if (!rule) return null;

    return {
      toCfop: rule.toCfop,
      toIcmsGroupId: this.mapGroup(nature, 'ICMS', input.itemIcmsGroupId),
      toPisCofinsGroupId: this.mapGroup(
        nature,
        'PIS_COFINS',
        input.itemPisCofinsGroupId,
      ),
    };
  }

  /** A linha de CFOP mais específica que se aplica ao item, ou `undefined`. */
  private pickCfopRule(
    nature: OperationNature,
    fromCfop: string,
    itemIcmsLivre: boolean,
  ): OperationNatureCfopRule | undefined {
    const matching = nature.cfopRules.filter(
      (rule) => rule.fromCfop === fromCfop,
    );
    // Específica que bate a condição do item (a entidade impede duplicata exata,
    // então há no máximo uma SIM e uma NAO por fromCfop — só uma se aplica).
    const specific = matching.find(
      (rule) =>
        (rule.icmsLivre === 'SIM' && itemIcmsLivre) ||
        (rule.icmsLivre === 'NAO' && !itemIcmsLivre),
    );
    if (specific) return specific;
    // Regra geral. Ausência de qualquer linha aplicável → undefined (FR-008).
    return matching.find((rule) => rule.icmsLivre === 'AMBOS');
  }

  /** Mapeia o grupo do item pelo de-para do tributo; mantém o original se não casar. */
  private mapGroup(
    nature: OperationNature,
    taxType: 'ICMS' | 'PIS_COFINS',
    itemGroupId: string | null | undefined,
  ): string | null {
    const current = itemGroupId ?? null;
    if (!current) return null;
    const rule = nature.groupRules.find(
      (r) => r.taxType === taxType && r.fromGroupId === current,
    );
    return rule ? rule.toGroupId : current;
  }
}
