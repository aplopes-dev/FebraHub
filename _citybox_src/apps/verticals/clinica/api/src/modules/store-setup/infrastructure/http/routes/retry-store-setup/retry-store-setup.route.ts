import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RetryStoreSetupUseCase } from '../../../../application/use-cases/retry-store-setup/retry-store-setup.use-case';
import { RequirePlatformAdmin } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('store-setup')
@Controller('v1/store-setup')
@RequirePlatformAdmin()
export class RetryStoreSetupRoute {
  constructor(private readonly retryStoreSetup: RetryStoreSetupUseCase) {}

  @Post(':storeId/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reprocessar setup inicial da loja Clínica' })
  async handle(@Param('storeId') storeId: string) {
    const result = await this.retryStoreSetup.execute({ storeId });
    return { data: result };
  }
}
