import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { FiscalDefaultTaxes } from '../../../domain/entities/fiscal-default-taxes.entity';
import type { FiscalTaxType } from '../../../domain/entities/fiscal-group.entity';
import { FiscalDefaultTaxesRepository } from '../../../domain/repositories/fiscal-default-taxes.repository.interface';
import { FiscalGroupRepository } from '../../../domain/repositories/fiscal-group.repository.interface';
import type { UpsertFiscalDefaultTaxesDto } from '../../dtos/fiscal-defaults.dto';

/**
 * Grava os padrões fiscais da organização. "Upsert": cria com o default se ainda
 * não existir — do ponto de vista da tela, o padrão sempre existiu.
 *
 * Valida que cada `groupId` referenciado pertence à organização **e** é do
 * tributo correto (não deixa apontar um grupo de ICMS no slot de IPI, nem um
 * grupo de outra org). O CFOP é apenas uma string (código do catálogo estático).
 */
@Injectable()
export class UpsertFiscalDefaultTaxesUseCase implements IUseCase<
  UpsertFiscalDefaultTaxesDto,
  FiscalDefaultTaxes
> {
  constructor(
    private readonly repository: FiscalDefaultTaxesRepository,
    private readonly groupRepository: FiscalGroupRepository,
  ) {}

  async execute(
    input: UpsertFiscalDefaultTaxesDto,
  ): Promise<FiscalDefaultTaxes> {
    // Validações independentes — em paralelo (4 leituras, não 4 round-trips seriais).
    await Promise.all([
      this.assertGroupBelongsToTax(
        input.organizationId,
        input.icmsGroupId,
        'ICMS',
      ),
      this.assertGroupBelongsToTax(
        input.organizationId,
        input.ipiGroupId,
        'IPI',
      ),
      this.assertGroupBelongsToTax(
        input.organizationId,
        input.pisCofinsGroupId,
        'PIS_COFINS',
      ),
      this.assertGroupBelongsToTax(
        input.organizationId,
        input.issqnGroupId,
        'ISSQN',
      ),
    ]);

    const current =
      (await this.repository.findByOrganization(input.organizationId)) ??
      FiscalDefaultTaxes.createDefault(input.organizationId);

    return this.repository.save(
      current.update({
        icmsGroupId: input.icmsGroupId,
        ipiGroupId: input.ipiGroupId,
        pisCofinsGroupId: input.pisCofinsGroupId,
        issqnGroupId: input.issqnGroupId,
        cfop: input.cfop.trim(),
      }),
    );
  }

  /** `null` = slot vazio (válido). Se preenchido, o grupo deve ser da org e do tributo. */
  private async assertGroupBelongsToTax(
    organizationId: string,
    groupId: string | null,
    taxType: FiscalTaxType,
  ): Promise<void> {
    if (groupId === null) return;

    const groups = await this.groupRepository.listByOrganization(
      organizationId,
      taxType,
    );
    const found = groups.some((group) => group.id === groupId);
    if (!found) {
      throw new ValidatorDomainError({
        internalMessage: `Group ${groupId} is not a ${taxType} group of organization ${organizationId}`,
        externalMessage: `O grupo selecionado para ${taxType} não existe nesta organização ou não é desse tributo.`,
        context: 'FiscalDefaultTaxes',
      });
    }
  }
}
