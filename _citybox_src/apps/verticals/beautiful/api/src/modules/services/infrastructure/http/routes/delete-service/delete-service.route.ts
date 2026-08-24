import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteServiceUseCase } from '../../../../application/use-cases/delete-service/delete-service.use-case';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('Services')
@Controller('v1/services')
export class DeleteServiceRoute {
  constructor(private readonly useCase: DeleteServiceUseCase) {}

  @RequirePermission('delete', 'Service')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um serviço do catálogo' })
  @ApiResponse({ status: 204, description: 'Serviço removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.useCase.execute({ storeId, id });
  }
}
