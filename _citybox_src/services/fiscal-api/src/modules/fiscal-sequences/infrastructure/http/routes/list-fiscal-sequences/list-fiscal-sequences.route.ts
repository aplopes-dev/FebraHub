import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../../../shared/infra/http/auth/authenticated-user';
import { ListFiscalSequencesUseCase } from '../../../../application/use-cases/list-fiscal-sequences/list-fiscal-sequences.use-case';
import { FiscalSequencePresenter } from '../shared/fiscal-sequence.presenter';
import { ListFiscalSequencesQueryDto } from './list-fiscal-sequences.dto';

@ApiTags('fiscal-sequences')
@Controller('v1/companies/:companyId/sequences')
export class ListFiscalSequencesRoute {
  constructor(private readonly listSequences: ListFiscalSequencesUseCase) {}

  @Get()
  @RequirePermission('fiscal.documents.view')
  @ApiOperation({
    summary:
      'Listar séries do Emitente (filtro de ambiente) — spec erp/011, US1',
  })
  async handle(
    @Param('companyId') companyId: string,
    @Query() query: ListFiscalSequencesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const sequences = await this.listSequences.execute({
      companyId,
      environment: query.environment,
      user,
    });
    return FiscalSequencePresenter.toListHttp(sequences);
  }
}
