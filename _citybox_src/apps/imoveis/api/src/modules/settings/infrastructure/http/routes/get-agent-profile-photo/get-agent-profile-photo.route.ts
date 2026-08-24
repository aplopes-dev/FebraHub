import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { authorizeAgentProfileAccess } from '../../../../../../shared/infra/http/auth/authorize-agent-profile-access';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import type { PermissionUser } from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { GetAgentProfilePhotoUseCase } from '../../../../application/use-cases/get-agent-profile-photo/get-agent-profile-photo.use-case';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/profile/:agentId/photo')
export class GetAgentProfilePhotoRoute {
  constructor(
    private readonly getAgentProfilePhoto: GetAgentProfilePhotoUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obter bytes da foto do perfil do corretor' })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Res() res: Response,
  ) {
    authorizeAgentProfileAccess({
      user,
      scope,
      targetAgentId: agentId,
      mode: 'read',
    });
    const { buffer, mimeType } = await this.getAgentProfilePhoto.execute({
      storeId,
      agentId,
    });
    res.setHeader('Content-Type', mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  }
}
