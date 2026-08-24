import { Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ToggleServiceActiveUseCase } from '../../../../application/use-cases/toggle-service-active/toggle-service-active.use-case';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  ServicePresenter,
  ServiceResponse,
} from '../../shared/service.presenter';

@ApiTags('Services')
@Controller('v1/services')
export class ToggleServiceActiveRoute {
  constructor(private readonly useCase: ToggleServiceActiveUseCase) {}

  @RequirePermission('update', 'Service')
  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Alterna o status ativo/inativo de um serviço' })
  @ApiResponse({ status: 200, description: 'Status alterado com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
  ): Promise<ServiceResponse> {
    const result = await this.useCase.execute({ storeId, id });
    return ServicePresenter.toHTTP(result);
  }
}
