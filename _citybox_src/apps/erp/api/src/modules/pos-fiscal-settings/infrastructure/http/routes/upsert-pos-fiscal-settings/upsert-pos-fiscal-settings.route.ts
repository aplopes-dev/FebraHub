import { Body, Controller, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpsertPosFiscalSettingsUseCase } from '../../../../application/use-cases/upsert-pos-fiscal-settings/upsert-pos-fiscal-settings.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../../../shared/infra/http/auth/authenticated-user';
import {
  UpsertPosFiscalSettingsHttpDto,
  toUpsertPosFiscalSettingsInput,
} from '../shared/pos-fiscal-settings.dto';
import { PosFiscalSettingsPresenter } from '../shared/pos-fiscal-settings.presenter';

@ApiTags('pos-fiscal-settings')
@Controller('v1/pos-fiscal-settings')
export class UpsertPosFiscalSettingsRoute {
  constructor(
    private readonly upsertSettings: UpsertPosFiscalSettingsUseCase,
  ) {}

  @Put()
  @RequirePermission('org.pos_policies.manage')
  @ApiOperation({
    summary: 'Definir o tipo de NF emitida pelo PDV',
    description:
      'Sem `:id`: há **uma** configuração por organização. O bloqueio de Modelo 65 sem CSC é feito na tela (o CSC vive na fiscal-api).',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertPosFiscalSettingsHttpDto,
  ) {
    const settings = await this.upsertSettings.execute({
      organizationId,
      updatedByUserId: user.sub,
      ...toUpsertPosFiscalSettingsInput(dto),
    });
    return PosFiscalSettingsPresenter.toHttpSingle(settings);
  }
}
