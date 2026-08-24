import { Body, Controller, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpsertFiscalDefaultTaxesUseCase } from '../../../../application/use-cases/upsert-fiscal-default-taxes/upsert-fiscal-default-taxes.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import {
  UpsertFiscalDefaultTaxesHttpDto,
  toUpsertFiscalDefaultTaxesInput,
} from '../shared/fiscal-defaults.dto';
import { FiscalDefaultTaxesPresenter } from '../shared/fiscal-defaults.presenter';

@ApiTags('fiscal-defaults')
@Controller('v1/fiscal-default-taxes')
export class UpsertFiscalDefaultTaxesRoute {
  constructor(
    private readonly upsertDefaults: UpsertFiscalDefaultTaxesUseCase,
  ) {}

  @Put()
  @RequirePermission('store.catalog.manage')
  @ApiOperation({
    summary: 'Definir os padrões fiscais da organização',
    description:
      'Sem `:id`: há **um** padrão por organização. Cada grupo referenciado é validado (pertence à org e ao tributo). O CFOP é um código do catálogo estático.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: UpsertFiscalDefaultTaxesHttpDto,
  ) {
    const defaults = await this.upsertDefaults.execute({
      organizationId,
      ...toUpsertFiscalDefaultTaxesInput(dto),
    });
    return FiscalDefaultTaxesPresenter.toHttpSingle(defaults);
  }
}
