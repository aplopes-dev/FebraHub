import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetServiceByIdUseCase } from '../../../../application/use-cases/get-service-by-id/get-service-by-id.use-case';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  ServicePresenter,
  ServiceResponse,
} from '../../shared/service.presenter';

@ApiTags('Services')
@Controller('v1/services')
export class GetServiceByIdRoute {
  constructor(private readonly useCase: GetServiceByIdUseCase) {}

  @RequirePermission('read', 'Service')
  @Get(':id')
  @ApiOperation({ summary: 'Obtém os detalhes de um serviço pelo ID' })
  @ApiResponse({ status: 200, description: 'Detalhes do serviço' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
  ): Promise<ServiceResponse> {
    const result = await this.useCase.execute({ storeId, id });
    return ServicePresenter.toHTTP(result);
  }
}
