import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateServiceUseCase } from '../../../../application/use-cases/create-service/create-service.use-case';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreateServiceHTTPDTO } from './create-service.dto';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  ServicePresenter,
  ServiceResponse,
} from '../../shared/service.presenter';

@ApiTags('Services')
@Controller('v1/services')
export class CreateServiceRoute {
  constructor(private readonly useCase: CreateServiceUseCase) {}

  @RequirePermission('create', 'Service')
  @Post()
  @ApiOperation({ summary: 'Cadastra um novo serviço no catálogo' })
  @ApiResponse({ status: 201, description: 'Serviço criado com sucesso' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: CreateServiceHTTPDTO,
  ): Promise<ServiceResponse> {
    const result = await this.useCase.execute({
      storeId,
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
