import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { StorePlatformEventData } from '@citybox/messaging';
import { ProvisionPlatformStoreUseCase } from '../../../../application/use-cases/provision-platform-store/provision-platform-store.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { SkipTenant } from '../../../../../../shared/infra/http/decorators/skip-tenant.decorator';

@ApiTags('platform')
@Controller('v1/platform/stores')
export class ProvisionPlatformStoreRoute {
  constructor(
    private readonly provisionPlatformStore: ProvisionPlatformStoreUseCase,
  ) {}

  @Post(':platformStoreId/provision')
  @SkipTenant()
  @RequirePermission('platform.admin')
  @ApiOperation({
    summary: 'Provisionar organização + responsável com senha provisória',
    description:
      'M2M para o admin-api (provision on demand). Cria org/OWNER/template e devolve username + senha uma vez.',
  })
  @ApiResponse({ status: 400, description: 'Payload incompleto' })
  @ApiResponse({ status: 503, description: 'Keycloak indisponível' })
  async handle(
    @Param('platformStoreId', ParseUUIDPipe) platformStoreId: string,
    @Body() body: StorePlatformEventData,
  ) {
    const event: StorePlatformEventData = {
      ...body,
      storeId: platformStoreId,
    };
    const result = await this.provisionPlatformStore.execute({ event });
    return {
      username: result.username,
      provisionalPassword: result.provisionalPassword,
    };
  }
}
