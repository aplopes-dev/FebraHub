import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { GetClientByIdUseCase } from '../../../../application/use-cases/get-client-by-id/get-client-by-id.use-case';
import { ClientPresenter, ClientResponse } from '../../shared/client.presenter';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('Clients')
@Controller('v1/clients')
export class GetClientByIdRoute {
  constructor(private readonly useCase: GetClientByIdUseCase) {}

  @RequirePermission('read', 'Client')
  @Get(':id')
  @ApiOperation({ summary: 'Obtém os detalhes de um cliente pelo ID' })
  @ApiResponse({ status: 200, description: 'Detalhes do cliente' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
  ): Promise<ClientResponse> {
    const result = await this.useCase.execute({ storeId, id });
    return ClientPresenter.toHTTP(result);
  }
}
