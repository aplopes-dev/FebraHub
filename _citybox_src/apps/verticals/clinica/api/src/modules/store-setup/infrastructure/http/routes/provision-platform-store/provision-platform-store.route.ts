import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { StorePlatformEventData } from '@citybox/messaging';
import { ProvisionPlatformStoreUseCase } from '../../../../application/use-cases/provision-platform-store/provision-platform-store.use-case';
import { RequirePlatformAdmin } from '../../../../../../shared/infra/http/decorators/permissions';
import { SkipClinicScope } from '../../../../../../shared/infra/http/decorators/skip-clinic-scope.decorator';

@ApiTags('platform')
@Controller('v1/platform/stores')
@RequirePlatformAdmin()
export class ProvisionPlatformStoreRoute {
  constructor(
    private readonly provisionPlatformStore: ProvisionPlatformStoreUseCase,
  ) {}

  @Post(':platformStoreId/provision')
  @SkipClinicScope()
  @ApiOperation({
    summary: 'Provisionar clínica + responsável com senha provisória',
    description:
      'M2M para o admin-api (provision on demand). Devolve username + senha uma vez.',
  })
  @ApiResponse({ status: 404, description: 'Responsável ausente após seed' })
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
