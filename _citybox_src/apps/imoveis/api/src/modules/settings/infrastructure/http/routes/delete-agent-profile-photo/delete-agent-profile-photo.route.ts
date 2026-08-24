import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { authorizeAgentProfileAccess } from '../../../../../../shared/infra/http/auth/authorize-agent-profile-access';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import type { PermissionUser } from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { DeleteAgentProfilePhotoUseCase } from '../../../../application/use-cases/delete-agent-profile-photo/delete-agent-profile-photo.use-case';
import { DeleteAgentProfilePhotoPresenter } from './delete-agent-profile-photo.presenter';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/profile/:agentId/photo')
export class DeleteAgentProfilePhotoRoute {
  constructor(
    private readonly deleteAgentProfilePhoto: DeleteAgentProfilePhotoUseCase,
  ) {}

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover foto do perfil do corretor' })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
  ) {
    authorizeAgentProfileAccess({
      user,
      scope,
      targetAgentId: agentId,
      mode: 'write',
    });
    const profile = await this.deleteAgentProfilePhoto.execute({
      storeId,
      agentId,
    });
    return DeleteAgentProfilePhotoPresenter.toHttp(profile);
  }
}
