import { Body, Controller, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdateStoreSettingsUseCase } from '../../../../application/use-cases/update-store-settings/update-store-settings.use-case';
import {
  StoreSettingsPresenter,
  StoreSettingsResponse,
} from '../../shared/store-settings.presenter';
import { UpdateStoreSettingsHTTPDTO } from './update-store-settings.dto';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('Settings')
@Controller('v1/settings/store')
export class UpdateStoreSettingsRoute {
  constructor(private readonly useCase: UpdateStoreSettingsUseCase) {}

  @RequirePermission('manage', 'Settings')
  @Patch()
  @ApiOperation({ summary: 'Atualiza a configuração do estabelecimento' })
  @ApiResponse({ status: 200, description: 'Configuração atualizada' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: UpdateStoreSettingsHTTPDTO,
  ): Promise<StoreSettingsResponse> {
    const result = await this.useCase.execute({
      storeId,
      name: dto.name,
      themeId: dto.themeId,
      cnpj: dto.cnpj,
      communicationsName: dto.communicationsName,
      responsible: dto.responsible,
      email: dto.email,
      phone: dto.phone,
      mobile: dto.mobile,
      cep: dto.cep,
      street: dto.street,
      number: dto.number,
      complement: dto.complement,
      neighborhood: dto.neighborhood,
      city: dto.city,
      state: dto.state,
    });
    return StoreSettingsPresenter.toHTTP(result);
  }
}
