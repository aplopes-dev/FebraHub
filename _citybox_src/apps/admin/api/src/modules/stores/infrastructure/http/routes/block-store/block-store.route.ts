import { Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BlockStoreUseCase } from '../../../../application/use-cases/block-store/block-store.use-case';
import { UnblockStoreUseCase } from '../../../../application/use-cases/unblock-store/unblock-store.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import {
  formatAuditActor,
  type AuthenticatedUser,
} from '../../../../../../shared/infra/http/auth/authenticated-user';
import { BlockStorePresenter } from './block-store.presenter';

@ApiTags('stores')
@Controller('v1/stores')
@RequirePermission('platform.admin')
export class BlockStoreRoute {
  constructor(
    private readonly blockStore: BlockStoreUseCase,
    private readonly unblockStore: UnblockStoreUseCase,
  ) {}

  @Patch(':id/block')
  @ApiOperation({ summary: 'Bloquear loja' })
  async block(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const actor = formatAuditActor(user);
    const store = await this.blockStore.execute({ id, actor });
    return BlockStorePresenter.toHttp(store);
  }

  @Patch(':id/unblock')
  @ApiOperation({ summary: 'Desbloquear loja' })
  async unblock(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const actor = formatAuditActor(user);
    const store = await this.unblockStore.execute({ id, actor });
    return BlockStorePresenter.toHttp(store);
  }
}
