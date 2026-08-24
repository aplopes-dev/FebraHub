import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { StorePlatformEventData } from '@citybox/messaging';
import { ProvisionPlatformStoreUseCase } from '../../../../application/use-cases/provision-platform-store/provision-platform-store.use-case';
import { RequirePlatformAdmin } from '../../../../../../shared/infra/http/decorators/permissions';
import { SkipImoveisScope } from '../../../../../../shared/infra/http/decorators/skip-imoveis-scope.decorator';

@ApiTags('platform')
@Controller('v1/platform/stores')
export class ProvisionPlatformStoreRoute {
  constructor(
    private readonly provisionPlatformStore: ProvisionPlatformStoreUseCase,
  ) {}

  @Post(':storeId/provision')
  @SkipImoveisScope()
  @RequirePlatformAdmin()
  @ApiOperation({
    summary: 'Provisionar responsável da loja com senha provisória',
    description:
      'M2M para o admin-api (provision on demand). Devolve username + senha uma vez.',
  })
  @ApiResponse({
    status: 404,
    description: 'Payload incompleto / responsável ausente',
  })
  @ApiResponse({ status: 503, description: 'Keycloak indisponível' })
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
