import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../../../shared/infra/http/auth/authenticated-user';
import { UpdateSequenceNumberUseCase } from '../../../../application/use-cases/update-sequence-number/update-sequence-number.use-case';
import { FiscalSequencePresenter } from '../shared/fiscal-sequence.presenter';
import { UpdateSequenceNumberDto } from './update-sequence-number.dto';

@ApiTags('fiscal-sequences')
@Controller('v1/sequences/:id')
export class UpdateSequenceNumberRoute {
  constructor(private readonly updateNumber: UpdateSequenceNumberUseCase) {}

  @Patch('number')
  @RequirePermission('fiscal.sequences.manage')
  @ApiOperation({
    summary:
      'Ajustar o número atual (só aumentar; auditado) — spec erp/011, US2',
  })
  async handle(
    @Param('id') id: string,
    @Body() dto: UpdateSequenceNumberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const sequence = await this.updateNumber.execute({
      sequenceId: id,
      newNumber: dto.newNumber,
      user,
    });
    return FiscalSequencePresenter.toHttp(sequence);
  }
}
