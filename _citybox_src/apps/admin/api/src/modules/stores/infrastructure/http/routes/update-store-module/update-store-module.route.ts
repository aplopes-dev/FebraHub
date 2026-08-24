import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateStoreModuleUseCase } from '../../../../application/use-cases/update-store-module/update-store-module.use-case';
import { FindStoreByIdUseCase } from '../../../../application/use-cases/find-store-by-id/find-store-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import {
  formatAuditActor,
  type AuthenticatedUser,
} from '../../../../../../shared/infra/http/auth/authenticated-user';
import { UpdateStoreModuleBodyDto } from '../shared/store-detail.dto';
import { FindStoreByIdPresenter } from '../find-store-by-id/find-store-by-id.presenter';

@ApiTags('stores')
@Controller('v1/stores')
@RequirePermission('platform.admin')
export class UpdateStoreModuleRoute {
  constructor(
    private readonly updateStoreModule: UpdateStoreModuleUseCase,
    private readonly findStoreById: FindStoreByIdUseCase,
  ) {}

  @Patch(':id/modules/:moduleKey')
  @ApiOperation({ summary: 'Ativar ou desativar módulo da loja' })
  async handle(
    @Param('id') storeId: string,
    @Param('moduleKey') moduleKey: string,
    @Body() body: UpdateStoreModuleBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.updateStoreModule.execute({
      storeId,
      moduleKey,
      enabled: body.enabled,
      actor: formatAuditActor(user),
    });
    const result = await this.findStoreById.execute({ id: storeId });
    return FindStoreByIdPresenter.toHttp(
      result.store,
      result.related,
      null,
      [],
      result.teamSource,
    );
  }
}
