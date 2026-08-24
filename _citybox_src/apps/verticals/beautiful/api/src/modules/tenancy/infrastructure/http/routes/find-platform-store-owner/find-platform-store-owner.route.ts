import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindPlatformStoreOwnerUseCase } from '../../../../application/use-cases/find-platform-store-owner/find-platform-store-owner.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { SkipStoreScope } from '../../../../../../shared/infra/http/decorators/skip-store-scope.decorator';
import { PlatformStoreOwnerPresenter } from '../shared/platform-store-owner.presenter';

@ApiTags('platform')
@Controller('v1/platform/stores')
export class FindPlatformStoreOwnerRoute {
  constructor(
    private readonly findPlatformStoreOwner: FindPlatformStoreOwnerUseCase,
  ) {}

  @Get(':storeId/owner')
  @SkipStoreScope()
  @RequirePermission('platform.admin')
  @ApiOperation({
    summary: 'Responsável (OWNER) da loja Beautiful',
    description:
      'M2M para o admin-api. Devolve o Member OWNER no shape `VerticalMember`.',
  })
  @ApiResponse({ status: 404, description: 'Responsável ausente' })
  async handle(@Param('storeId', ParseUUIDPipe) storeId: string) {
    const member = await this.findPlatformStoreOwner.execute({ storeId });
    return PlatformStoreOwnerPresenter.toVerticalMember(member);
  }
}
