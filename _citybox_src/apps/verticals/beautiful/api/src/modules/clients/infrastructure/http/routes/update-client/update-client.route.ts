import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdateClientUseCase } from '../../../../application/use-cases/update-client/update-client.use-case';
import { UpdateClientHTTPDTO } from './update-client.dto';
import { ClientPresenter, ClientResponse } from '../../shared/client.presenter';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('Clients')
@Controller('v1/clients')
export class UpdateClientRoute {
  constructor(private readonly useCase: UpdateClientUseCase) {}

  @RequirePermission('update', 'Client')
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza nome, telefone e/ou categoria do cliente',
  })
  @ApiResponse({ status: 200, description: 'Cliente atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClientHTTPDTO,
  ): Promise<ClientResponse> {
    const result = await this.useCase.execute({
      storeId,
      id,
      name: dto.name,
      phone: dto.phone,
      categoryId: dto.categoryId,
    });

    return ClientPresenter.toHTTP(result);
  }
}
