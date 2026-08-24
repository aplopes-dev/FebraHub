import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { GetStoreSettingsUseCase } from '../../../../application/use-cases/get-store-settings/get-store-settings.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  StoreSettingsPresenter,
  StoreSettingsResponse,
} from '../../shared/store-settings.presenter';

@ApiTags('Settings')
@Controller('v1/settings/store')
export class GetStoreSettingsRoute {
  constructor(private readonly useCase: GetStoreSettingsUseCase) {}

  @RequirePermission('manage', 'Settings')
  @Get()
  @ApiOperation({ summary: 'Obtém a configuração do estabelecimento' })
  @ApiResponse({
    status: 200,
    description: 'Configuração atual (cria default se vazio)',
  })
  async handle(@StoreId() storeId: string): Promise<StoreSettingsResponse> {
    const result = await this.useCase.execute({ storeId });
    return StoreSettingsPresenter.toHTTP(result);
  }
}
