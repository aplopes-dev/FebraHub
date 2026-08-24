import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../../../shared/infra/http/auth/authenticated-user';
import { SetSequenceActiveUseCase } from '../../../../application/use-cases/set-sequence-active/set-sequence-active.use-case';
import { FiscalSequencePresenter } from '../shared/fiscal-sequence.presenter';
import { SetSequenceActiveDto } from './set-sequence-active.dto';

@ApiTags('fiscal-sequences')
@Controller('v1/sequences/:id')
export class SetSequenceActiveRoute {
  constructor(private readonly setActive: SetSequenceActiveUseCase) {}

  @Patch('active')
  @RequirePermission('fiscal.sequences.manage')
  @ApiOperation({
    summary:
      'Ativar/desativar série (desativar bloqueia emissão) — spec erp/011, US3',
  })
  async handle(
    @Param('id') id: string,
    @Body() dto: SetSequenceActiveDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const sequence = await this.setActive.execute({
      sequenceId: id,
      active: dto.active,
      user,
    });
    return FiscalSequencePresenter.toHttp(sequence);
  }
}
