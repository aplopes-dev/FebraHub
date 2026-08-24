import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetPosFiscalSettingsUseCase } from '../../../../application/use-cases/get-pos-fiscal-settings/get-pos-fiscal-settings.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { PosFiscalSettingsPresenter } from '../shared/pos-fiscal-settings.presenter';

@ApiTags('pos-fiscal-settings')
@Controller('v1/pos-fiscal-settings')
export class GetPosFiscalSettingsRoute {
  constructor(private readonly getSettings: GetPosFiscalSettingsUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Tipo de NF emitida pelo PDV (config da organização)',
  })
  async handle(@OrganizationId() organizationId: string) {
    const settings = await this.getSettings.execute({ organizationId });
    return PosFiscalSettingsPresenter.toHttpSingle(settings);
  }
}
