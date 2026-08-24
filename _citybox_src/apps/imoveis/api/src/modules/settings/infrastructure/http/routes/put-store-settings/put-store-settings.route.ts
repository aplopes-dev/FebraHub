import { Body, Controller, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { PutStoreSettingsUseCase } from '../../../../application/use-cases/put-store-settings/put-store-settings.use-case';
import { PutStoreSettingsDto } from './put-store-settings.dto';
import { PutStoreSettingsPresenter } from './put-store-settings.presenter';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings')
export class PutStoreSettingsRoute {
  constructor(private readonly putStoreSettings: PutStoreSettingsUseCase) {}

  @Put('store')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('manage', 'Settings')
  @ApiOperation({
    summary: 'Salvar sistema, notificações e integrações da loja',
  })
  async handle(@StoreId() storeId: string, @Body() dto: PutStoreSettingsDto) {
    const settings = await this.putStoreSettings.execute({
      storeId,
      system: dto.system,
      notifications: dto.notifications,
      integrations: dto.integrations,
    });
    return PutStoreSettingsPresenter.toHttp(settings);
  }
}
