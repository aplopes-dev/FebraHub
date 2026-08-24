import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResetPlatformStoreOwnerPasswordUseCase } from '../../../../application/use-cases/reset-platform-store-owner-password/reset-platform-store-owner-password.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { SkipTenant } from '../../../../../../shared/infra/http/decorators/skip-tenant.decorator';

@ApiTags('platform')
@Controller('v1/platform/stores')
export class ResetPlatformStoreOwnerPasswordRoute {
  constructor(
    private readonly resetPlatformStoreOwnerPassword: ResetPlatformStoreOwnerPasswordUseCase,
  ) {}

  @Post(':platformStoreId/owner/reset-password')
  @SkipTenant()
  @RequirePermission('platform.admin')
  @ApiOperation({
    summary: 'Gerar senha provisória do responsável da loja',
    description:
      'M2M para o admin-api. Devolve username + senha uma única vez (paridade com a clínica).',
  })
  @ApiResponse({
    status: 404,
    description: 'Organização ou responsável ausente',
  })
  @ApiResponse({ status: 503, description: 'Keycloak indisponível' })
  async handle(
    @Param('platformStoreId', ParseUUIDPipe) platformStoreId: string,
  ) {
    const result = await this.resetPlatformStoreOwnerPassword.execute({
      platformStoreId,
    });
    return {
      username: result.username,
      provisionalPassword: result.provisionalPassword,
    };
  }
}
