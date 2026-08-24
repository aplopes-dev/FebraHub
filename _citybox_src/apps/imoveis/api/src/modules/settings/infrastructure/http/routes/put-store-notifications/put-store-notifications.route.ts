import { Body, Controller, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { PutStoreNotificationsUseCase } from '../../../../application/use-cases/put-store-notifications/put-store-notifications.use-case';
import { StoreNotificationSettingsDto } from '../put-store-settings/put-store-settings.dto';
import { PutStoreSettingsPresenter } from '../put-store-settings/put-store-settings.presenter';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings')
export class PutStoreNotificationsRoute {
  constructor(
    private readonly putStoreNotifications: PutStoreNotificationsUseCase,
  ) {}

  @Put('store/notifications')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Salvar preferências de notificação da loja (qualquer membro da loja)',
  })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: StoreNotificationSettingsDto,
  ) {
    const settings = await this.putStoreNotifications.execute({
      storeId,
      notifications: {
        emailEnabled: dto.emailEnabled,
        pushEnabled: dto.pushEnabled,
        leadsAlerts: dto.leadsAlerts,
        calendarAlerts: dto.calendarAlerts,
        documentsAlerts: dto.documentsAlerts,
      },
    });
    return PutStoreSettingsPresenter.toHttp(settings);
  }
}
