import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../../../shared/infra/http/auth/authenticated-user';
import { DeleteFiscalSequenceUseCase } from '../../../../application/use-cases/delete-fiscal-sequence/delete-fiscal-sequence.use-case';

@ApiTags('fiscal-sequences')
@Controller('v1/sequences/:id')
export class DeleteFiscalSequenceRoute {
  constructor(private readonly deleteSequence: DeleteFiscalSequenceUseCase) {}

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('fiscal.sequences.manage')
  @ApiOperation({
    summary: 'Excluir série (só com número atual 0) — spec erp/011, US3',
  })
  async handle(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.deleteSequence.execute({ sequenceId: id, user });
  }
}
