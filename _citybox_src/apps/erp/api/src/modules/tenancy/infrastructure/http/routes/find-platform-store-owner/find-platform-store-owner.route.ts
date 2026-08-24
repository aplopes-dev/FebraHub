import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindPlatformStoreOwnerUseCase } from '../../../../application/use-cases/find-platform-store-owner/find-platform-store-owner.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { SkipTenant } from '../../../../../../shared/infra/http/decorators/skip-tenant.decorator';
import { PlatformStoreOwnerPresenter } from '../shared/platform-store-owner.presenter';

@ApiTags('platform')
@Controller('v1/platform/stores')
export class FindPlatformStoreOwnerRoute {
  constructor(
    private readonly findPlatformStoreOwner: FindPlatformStoreOwnerUseCase,
  ) {}

  @Get(':platformStoreId/owner')
  @SkipTenant()
  @RequirePermission('platform.admin')
  @ApiOperation({
    summary: 'Responsável (OWNER) da loja da plataforma',
    description:
      'M2M para o admin-api. Resolve a organização pelo `platformStoreId` e devolve o OWNER no shape `VerticalMember`.',
  })
  @ApiResponse({
    status: 404,
    description: 'Organização ou responsável ausente',
  })
  async handle(
    @Param('platformStoreId', ParseUUIDPipe) platformStoreId: string,
  ) {
    const detail = await this.findPlatformStoreOwner.execute({
      platformStoreId,
    });
    return PlatformStoreOwnerPresenter.toVerticalMember(detail);
  }
}
