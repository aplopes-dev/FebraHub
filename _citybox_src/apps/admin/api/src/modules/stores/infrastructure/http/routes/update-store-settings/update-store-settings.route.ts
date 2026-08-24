import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateStoreSettingsUseCase } from '../../../../application/use-cases/update-store-settings/update-store-settings.use-case';
import { FindStoreByIdUseCase } from '../../../../application/use-cases/find-store-by-id/find-store-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import {
  formatAuditActor,
  type AuthenticatedUser,
} from '../../../../../../shared/infra/http/auth/authenticated-user';
import { UpdateStoreSettingsBodyDto } from '../shared/store-detail.dto';
import { FindStoreByIdPresenter } from '../find-store-by-id/find-store-by-id.presenter';

@ApiTags('stores')
@Controller('v1/stores')
@RequirePermission('platform.admin')
export class UpdateStoreSettingsRoute {
  constructor(
    private readonly updateStoreSettings: UpdateStoreSettingsUseCase,
    private readonly findStoreById: FindStoreByIdUseCase,
  ) {}

  @Patch(':id/settings')
  @ApiOperation({ summary: 'Atualizar configurações operacionais da loja' })
  async handle(
    @Param('id') id: string,
    @Body() body: UpdateStoreSettingsBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.updateStoreSettings.execute({
      id,
      ...body,
      actor: formatAuditActor(user),
    });
    const result = await this.findStoreById.execute({ id });
    return FindStoreByIdPresenter.toHttp(
      result.store,
      result.related,
      null,
      [],
      result.teamSource,
    );
  }
}
