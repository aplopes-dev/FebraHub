import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StoreSetupRepository } from '../../../domain/repositories/store-setup.repository.interface';
import { ERP_SEED_TEMPLATE } from '../../seed-data/erp-seed-template';

export type ProvisionOrganizationDataInput = {
  organizationId: string;
  /** Reaplica o template mesmo que a organização já esteja na versão corrente. */
  force?: boolean;
};

export type ProvisionOrganizationDataOutput = {
  organizationId: string;
  provisioned: boolean;
  version: number;
};

/**
 * Aplica o template de dados de sistema numa organização.
 *
 * Roda em toda criação de organização e pode ser reexecutado à vontade: cada bloco é um
 * upsert por `systemKey` que preserva o que o lojista renomeou. O `StoreSetupLog` evita o
 * trabalho repetido no caminho comum, e `force` existe para o reprovisionamento em lote.
 */
@Injectable()
export class ProvisionOrganizationDataUseCase implements IUseCase<
  ProvisionOrganizationDataInput,
  ProvisionOrganizationDataOutput
> {
  private readonly logger = new Logger(ProvisionOrganizationDataUseCase.name);

  constructor(private readonly repository: StoreSetupRepository) {}

  async execute(
    input: ProvisionOrganizationDataInput,
  ): Promise<ProvisionOrganizationDataOutput> {
    const { organizationId, force = false } = input;
    const template = ERP_SEED_TEMPLATE;

    const appliedVersion =
      await this.repository.findAppliedVersion(organizationId);
    if (
      !force &&
      appliedVersion !== null &&
      appliedVersion >= template.version
    ) {
      return { organizationId, provisioned: false, version: appliedVersion };
    }

    const branchIds = await this.repository.listBranchIds(organizationId);

    // Perfis primeiro: o backfill de memberships sem perfil depende deles.
    await this.repository.upsertPermissionProfiles(
      organizationId,
      template.permissionProfiles,
    );
    await this.repository.upsertUnitsOfMeasure(
      organizationId,
      template.unitsOfMeasure,
    );
    await this.repository.upsertProductCategories(
      organizationId,
      template.productCategories,
    );
    await this.repository.upsertStocks(
      organizationId,
      template.stocks,
      branchIds,
    );
    await this.repository.upsertMovementCategories(
      organizationId,
      template.movementCategories,
      branchIds,
    );
    // Grupos antes das contas: `ChartOfAccount.financialGroupId` é FK obrigatória.
    await this.repository.upsertFinancialGroups(
      organizationId,
      template.financialGroups,
    );
    await this.repository.upsertChartOfAccounts(
      organizationId,
      template.chartOfAccounts,
    );
    await this.repository.upsertCostCenters(
      organizationId,
      template.costCenters,
    );
    await this.repository.upsertPaymentMethods(
      organizationId,
      template.paymentMethods,
    );
    await this.repository.upsertServiceOrderStatuses(
      organizationId,
      template.serviceOrderStatuses,
    );
    await this.repository.upsertContractStatuses(
      organizationId,
      template.contractStatuses,
    );

    await this.repository.saveAppliedVersion(
      organizationId,
      template.version,
      new Date(),
    );

    this.logger.log(
      `Organização ${organizationId} provisionada com o template v${template.version}`,
    );

    return { organizationId, provisioned: true, version: template.version };
  }
}
