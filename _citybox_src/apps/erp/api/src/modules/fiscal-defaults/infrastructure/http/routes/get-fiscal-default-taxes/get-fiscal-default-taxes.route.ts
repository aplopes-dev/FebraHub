import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetFiscalDefaultTaxesUseCase } from '../../../../application/use-cases/get-fiscal-default-taxes/get-fiscal-default-taxes.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { FiscalDefaultTaxesPresenter } from '../shared/fiscal-defaults.presenter';

@ApiTags('fiscal-defaults')
@Controller('v1/fiscal-default-taxes')
export class GetFiscalDefaultTaxesRoute {
  constructor(private readonly getDefaults: GetFiscalDefaultTaxesUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Padrões fiscais da organização' })
  async handle(@OrganizationId() organizationId: string) {
    const defaults = await this.getDefaults.execute({ organizationId });
    return FiscalDefaultTaxesPresenter.toHttpSingle(defaults);
  }
}
