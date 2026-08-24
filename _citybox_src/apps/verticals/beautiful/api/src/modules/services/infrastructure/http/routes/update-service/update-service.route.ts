import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateServiceUseCase } from '../../../../application/use-cases/update-service/update-service.use-case';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdateServiceHTTPDTO } from './update-service.dto';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  ServicePresenter,
  ServiceResponse,
} from '../../shared/service.presenter';

@ApiTags('Services')
@Controller('v1/services')
export class UpdateServiceRoute {
  constructor(private readonly useCase: UpdateServiceUseCase) {}

  @RequirePermission('update', 'Service')
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza as informações de um serviço' })
  @ApiResponse({ status: 200, description: 'Serviço atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceHTTPDTO,
  ): Promise<ServiceResponse> {
    const result = await this.useCase.execute({
      storeId,
      id,
      name: dto.name,
      categories: dto.categories,
      durationMinutes: dto.durationMinutes,
      price: dto.price,
      description: dto.description,
      active: dto.active,
    });

    return ServicePresenter.toHTTP(result);
  }
}
