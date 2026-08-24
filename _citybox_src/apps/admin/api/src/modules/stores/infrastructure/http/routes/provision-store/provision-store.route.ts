import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ProvisionStoreUseCase } from '../../../../application/use-cases/provision-store/provision-store.use-case';

@ApiTags('stores')
@Controller('v1/stores')
@RequirePermission('platform.admin')
export class ProvisionStoreRoute {
  constructor(private readonly provisionStore: ProvisionStoreUseCase) {}

  @Post(':id/provision')
  @ApiOperation({
    summary: 'Provisionar vertical e devolver senha provisória do responsável',
  })
  @ApiResponse({ status: 409, description: 'Loja já provisionada (ACTIVE)' })
  @ApiResponse({ status: 404, description: 'Loja não encontrada' })
  async handle(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.provisionStore.execute({ storeId: id });
    return {
      username: result.username,
      provisionalPassword: result.provisionalPassword,
    };
  }
}
