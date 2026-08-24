import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreateClientUseCase } from '../../../../application/use-cases/create-client/create-client.use-case';
import { CreateClientHTTPDTO } from './create-client.dto';
import { ClientPresenter, ClientResponse } from '../../shared/client.presenter';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('Clients')
@Controller('v1/clients')
export class CreateClientRoute {
  constructor(private readonly useCase: CreateClientUseCase) {}

  @RequirePermission('create', 'Client')
  @Post()
  @ApiOperation({
    summary: 'Cadastra um novo cliente (nome + telefone + categoria opcional)',
  })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: CreateClientHTTPDTO,
  ): Promise<ClientResponse> {
    const result = await this.useCase.execute({
      storeId,
      name: dto.name,
      phone: dto.phone,
      categoryId: dto.categoryId,
    });

    return ClientPresenter.toHTTP(result);
  }
}
