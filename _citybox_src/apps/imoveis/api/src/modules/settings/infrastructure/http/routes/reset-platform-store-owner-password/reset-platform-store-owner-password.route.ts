import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResetPlatformStoreOwnerPasswordUseCase } from '../../../../application/use-cases/reset-platform-store-owner-password/reset-platform-store-owner-password.use-case';
import { RequirePlatformAdmin } from '../../../../../../shared/infra/http/decorators/permissions';
import { SkipImoveisScope } from '../../../../../../shared/infra/http/decorators/skip-imoveis-scope.decorator';

@ApiTags('platform')
@Controller('v1/platform/stores')
export class ResetPlatformStoreOwnerPasswordRoute {
  constructor(
    private readonly resetPlatformStoreOwnerPassword: ResetPlatformStoreOwnerPasswordUseCase,
  ) {}

  @Post(':storeId/owner/reset-password')
  @SkipImoveisScope()
  @RequirePlatformAdmin()
  @ApiOperation({
    summary: 'Gerar senha provisória do responsável da loja',
    description:
      'M2M para o admin-api. Devolve username + senha uma única vez (paridade com ERP/clínica).',
  })
  @ApiResponse({ status: 404, description: 'Responsável ausente' })
  @ApiResponse({ status: 503, description: 'Keycloak indisponível' })
  async handle(@Param('storeId', ParseUUIDPipe) storeId: string) {
    const result = await this.resetPlatformStoreOwnerPassword.execute({
      storeId,
    });
    return {
      username: result.username,
      provisionalPassword: result.provisionalPassword,
    };
  }
}
