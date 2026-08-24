import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { StorePlatformEventData } from '@citybox/messaging';
import { ProvisionPlatformStoreUseCase } from '../../../../application/use-cases/provision-platform-store/provision-platform-store.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { SkipStoreScope } from '../../../../../../shared/infra/http/decorators/skip-store-scope.decorator';

@ApiTags('platform')
@Controller('v1/platform/stores')
export class ProvisionPlatformStoreRoute {
  constructor(
    private readonly provisionPlatformStore: ProvisionPlatformStoreUseCase,
  ) {}

  @Post(':storeId/provision')
  @SkipStoreScope()
  @RequirePermission('platform.admin')
  @ApiOperation({
    summary: 'Provisionar responsável da loja com senha provisória',
  })
  @ApiResponse({ status: 404, description: 'Payload incompleto' })
  async handle(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() body: StorePlatformEventData,
  ) {
    const event: StorePlatformEventData = { ...body, storeId };
    const result = await this.provisionPlatformStore.execute({ event });
    return {
      username: result.username,
      provisionalPassword: result.provisionalPassword,
    };
  }
}
