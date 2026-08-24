import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateStoreUseCase } from '../../../../application/use-cases/update-store/update-store.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import {
  formatAuditActor,
  type AuthenticatedUser,
} from '../../../../../../shared/infra/http/auth/authenticated-user';
import { UpdateStoreDto } from './update-store.dto';
import { UpdateStorePresenter } from './update-store.presenter';

@ApiTags('stores')
@Controller('v1/stores')
@RequirePermission('platform.admin')
export class UpdateStoreRoute {
  constructor(private readonly updateStore: UpdateStoreUseCase) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar loja' })
  async handle(
    @Param('id') id: string,
    @Body() dto: UpdateStoreDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const store = await this.updateStore.execute({
      ...dto,
      id,
      actor: formatAuditActor(user),
    });
    return UpdateStorePresenter.toHttp(store);
  }
}
