import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { GetStoreSettingsUseCase } from '../../../../application/use-cases/get-store-settings/get-store-settings.use-case';
import { GetStoreSettingsPresenter } from './get-store-settings.presenter';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings')
export class GetStoreSettingsRoute {
  constructor(private readonly getStoreSettings: GetStoreSettingsUseCase) {}

  /**
   * Leitura disponível a qualquer membro da loja (escopo X-Store-Id).
   * Sistema/integrações no web seguem gate CASL; notificações e accent
   * bootstrap dependem deste GET para corretores sem permissão Settings.
   */
  @Get('store')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter configurações de sistema e notificações' })
  async handle(@StoreId() storeId: string) {
    const settings = await this.getStoreSettings.execute({ storeId });
    return GetStoreSettingsPresenter.toHttp(settings);
  }
}
