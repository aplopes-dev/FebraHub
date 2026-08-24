import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindPlatformStoreOwnerUseCase } from '../../../../application/use-cases/find-platform-store-owner/find-platform-store-owner.use-case';
import { RequirePlatformAdmin } from '../../../../../../shared/infra/http/decorators/permissions';
import { SkipImoveisScope } from '../../../../../../shared/infra/http/decorators/skip-imoveis-scope.decorator';
import { PlatformStoreOwnerPresenter } from '../shared/platform-store-owner.presenter';

@ApiTags('platform')
@Controller('v1/platform/stores')
export class FindPlatformStoreOwnerRoute {
  constructor(
    private readonly findPlatformStoreOwner: FindPlatformStoreOwnerUseCase,
  ) {}

  @Get(':storeId/owner')
  @SkipImoveisScope()
  @RequirePlatformAdmin()
  @ApiOperation({
    summary: 'Responsável (OWNER) da loja Imóveis',
    description:
      'M2M para o admin-api. Devolve o TeamMember admin no shape `VerticalMember`.',
  })
  @ApiResponse({ status: 404, description: 'Responsável ausente' })
  async handle(@Param('storeId', ParseUUIDPipe) storeId: string) {
    const member = await this.findPlatformStoreOwner.execute({ storeId });
    return PlatformStoreOwnerPresenter.toVerticalMember(member);
  }
}
